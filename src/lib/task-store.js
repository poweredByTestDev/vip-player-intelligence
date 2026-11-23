
import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

import { getData } from "@/lib/data";

const ANALYSIS_VERSION = "1.1";

const TASKS_FOLDER = path.join(
  process.cwd(),
  "data",
  "tasks"
);

const ANALYSES_FOLDER = path.join(
  process.cwd(),
  "data",
  "analyses"
);

const VALID_STATUSES = [
  "todo",
  "in_progress",
  "done",
];

// Проверяем ID до использования в имени файла
function isValidId(value) {
  return (
    typeof value === "string" &&
    /^[a-zA-Z0-9_-]+$/.test(value)
  );
}

// Находим исходную переписку
function findDialog(dialogId) {
  if (!isValidId(dialogId)) {
    return null;
  }

  const { dialogs } = getData();

  return dialogs.find(
    (item) => item.dialog_id === dialogId
  ) ?? null;
}

// Цифровой отпечаток исходных данных
function getSourceHash(dialog) {
  const source = JSON.stringify({
    dialog_id: dialog.dialog_id,
    manager: dialog.manager,
    channel: dialog.channel,
    player: dialog.player,
    messages: dialog.messages,
  });

  return createHash("sha256")
    .update(source)
    .digest("hex");
}

// Читаем JSON-файл
async function readJson(filePath) {
  try {
    const content = await fs.readFile(
      filePath,
      "utf8"
    );

    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

// Сохраняем JSON через временный файл
async function writeJson(filePath, data) {
  await fs.mkdir(
    path.dirname(filePath),
    { recursive: true }
  );

  const temporaryPath =
    `${filePath}.${randomUUID()}.tmp`;

  try {
    await fs.writeFile(
      temporaryPath,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    await fs.unlink(temporaryPath).catch(() => {});
    throw error;
  }
}

// Получаем актуальный AI-анализ
async function getCurrentAnalysis(dialog) {
  const filePath = path.join(
    ANALYSES_FOLDER,
    `${dialog.dialog_id}.json`
  );

  const analysis = await readJson(filePath);

  if (!analysis) return null;

  // Не используем устаревший анализ
  if (
    analysis.dialogId !== dialog.dialog_id ||
    analysis.analysisVersion !== ANALYSIS_VERSION ||
    analysis.sourceHash !== getSourceHash(dialog)
  ) {
    return null;
  }

  if (!Array.isArray(analysis.nextActions)) {
    return null;
  }

  return analysis;
}

// Создаём уникальный ID задачи
function createTaskId(index, action) {
  return createHash("sha256")
    .update(`${index}:${action}`)
    .digest("hex")
    .slice(0, 20);
}

// Получаем задачи для конкретного диалога
export async function getTasks(dialogId) {
  const dialog = findDialog(dialogId);

  if (!dialog) {
    throw new Error("Диалог не найден.");
  }

  const analysis = await getCurrentAnalysis(dialog);

  if (!analysis) {
    return {
      dialogId,
      hasAnalysis: false,
      critical: false,
      tasks: [],
    };
  }

  const filePath = path.join(
    TASKS_FOLDER,
    `${dialogId}.json`
  );

  const saved = await readJson(filePath);

  const savedTasks =
    saved?.sourceHash === analysis.sourceHash &&
    Array.isArray(saved.tasks)
      ? saved.tasks
      : [];

  const critical =
    analysis.riskLevel === "critical" ||
    analysis.hasCriticalViolation === true;

  // Объединяем AI-рекомендации с сохранёнными
  // статусами и комментариями
  const tasks = analysis.nextActions
    .filter((action) => typeof action === "string")
    .map((action, index) => {
      const id = createTaskId(index, action);

      const previous = savedTasks.find(
        (item) => item.id === id
      );

      return {
        id,
        dialogId,
        action,
        status: VALID_STATUSES.includes(previous?.status)
          ? previous.status
          : "todo",
        comment:
          typeof previous?.comment === "string"
            ? previous.comment
            : "",
        updatedAt: previous?.updatedAt ?? null,
        critical,
      };
    });

  const result = {
    dialogId,
    sourceHash: analysis.sourceHash,
    analysisVersion: ANALYSIS_VERSION,
    tasks,
  };

  // Создаём файл при первом обращении.
  // При изменении рекомендаций обновляем состав.
  const changed =
    !saved ||
    JSON.stringify(saved) !== JSON.stringify(result);

  if (changed) {
    await writeJson(filePath, result);
  }

  return {
    dialogId,
    hasAnalysis: true,
    critical,
    tasks,
  };
}

// Изменяем статус и комментарий одной задачи
export async function updateTask({
  dialogId,
  taskId,
  status,
  comment,
}) {
  if (
    !isValidId(dialogId) ||
    typeof taskId !== "string" ||
    !VALID_STATUSES.includes(status) ||
    typeof comment !== "string" ||
    comment.length > 2000
  ) {
    throw new Error("Некорректные данные задачи.");
  }

  const data = await getTasks(dialogId);

  if (!data.hasAnalysis) {
    throw new Error("Актуальный анализ не найден.");
  }

  const task = data.tasks.find(
    (item) => item.id === taskId
  );

  if (!task) {
    throw new Error("Задача не найдена.");
  }

  const cleanedComment = comment.trim();

  // Для критических случаев требуется комментарий
  if (
    data.critical &&
    status === "done" &&
    cleanedComment.length < 10
  ) {
    throw new Error(
      "Для завершения критической задачи добавь комментарий минимум из 10 символов."
    );
  }

  task.status = status;
  task.comment = cleanedComment;
  task.updatedAt = new Date().toISOString();

  const dialog = findDialog(dialogId);
  const analysis = await getCurrentAnalysis(dialog);

  if (!analysis) {
    throw new Error("AI-анализ больше не актуален.");
  }

  const filePath = path.join(
    TASKS_FOLDER,
    `${dialogId}.json`
  );

  await writeJson(filePath, {
    dialogId,
    sourceHash: analysis.sourceHash,
    analysisVersion: ANALYSIS_VERSION,
    tasks: data.tasks,
  });

  return task;
}

// Общая статистика задач для руководителя
export async function getTaskOverview() {
  const { dialogs } = getData();

  const allTasks = [];

  for (const dialog of dialogs) {
    const result = await getTasks(dialog.dialog_id);

    for (const task of result.tasks) {
      allTasks.push({
        ...task,
        playerId: dialog.player_id,
        manager: dialog.manager,
      });
    }
  }

  const stats = {
    total: allTasks.length,
    todo: allTasks.filter(
      (task) => task.status === "todo"
    ).length,
    inProgress: allTasks.filter(
      (task) => task.status === "in_progress"
    ).length,
    done: allTasks.filter(
      (task) => task.status === "done"
    ).length,
    critical: allTasks.filter(
      (task) => task.critical
    ).length,
    needsVerification: allTasks.filter(
      (task) =>
        task.critical && task.status === "done"
    ).length,
  };

  return {
    stats,
    tasks: allTasks,
  };
}
