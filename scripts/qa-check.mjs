
import fs from "node:fs";
import path from "node:path";

// ==========================================
// VIP PLAYER INTELLIGENCE — QA CHECK v1.0
// ==========================================

const ROOT = process.cwd();

const DIALOGS_PATH = path.join(
  ROOT,
  "data",
  "dialogs.json"
);

const ANALYSES_PATH = path.join(
  ROOT,
  "data",
  "analyses"
);

const TASKS_PATH = path.join(
  ROOT,
  "data",
  "tasks"
);

const limits = {
  resolution: 30,
  communication: 20,
  responseTime: 15,
  personalization: 10,
  promises: 10,
  safety: 15,
};

const validRisks = [
  "none",
  "low",
  "medium",
  "high",
  "critical",
];

const validStatuses = [
  "resolved",
  "unresolved",
  "unknown",
  "no_request",
];

const validTaskStatuses = [
  "todo",
  "in_progress",
  "done",
];

let passed = 0;
let failed = 0;
let warnings = 0;

function pass(message) {
  passed++;
  console.log(`PASS: ${message}`);
}

function fail(message) {
  failed++;
  console.error(`FAIL: ${message}`);
}

function warn(message) {
  warnings++;
  console.warn(`WARN: ${message}`);
}

function readJson(filePath) {
  return JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );
}

function getJsonFiles(folder) {
  if (!fs.existsSync(folder)) {
    return [];
  }

  return fs.readdirSync(folder)
    .filter((name) => name.endsWith(".json"));
}

function closeEnough(a, b) {
  return Math.abs(a - b) <= 1;
}

// ==========================================
// 1. ЗАГРУЗКА ИСХОДНЫХ ДАННЫХ
// ==========================================

console.log("\n=== VIP INTELLIGENCE QA ===\n");

let dialogs = [];

try {
  const data = readJson(DIALOGS_PATH);

  dialogs = Array.isArray(data)
    ? data
    : data.dialogs;

  if (!Array.isArray(dialogs)) {
    throw new Error(
      "Не найден массив переписок."
    );
  }

  pass(`Загружено диалогов: ${dialogs.length}`);
} catch (error) {
  fail(`Не удалось прочитать dialogs.json: ${error.message}`);
  process.exit(1);
}

const dialogMap = new Map(
  dialogs.map((dialog) => [
    dialog.dialog_id,
    dialog,
  ])
);

// ==========================================
// 2. ПРОВЕРКА AI-АНАЛИЗОВ
// ==========================================

const analysisFiles = getJsonFiles(
  ANALYSES_PATH
);

console.log(
  `\nПроверяем AI-анализы: ${analysisFiles.length}\n`
);

for (const fileName of analysisFiles) {
  const filePath = path.join(
    ANALYSES_PATH,
    fileName
  );

  let analysis;

  try {
    analysis = readJson(filePath);
  } catch (error) {
    fail(`${fileName}: некорректный JSON`);
    continue;
  }

  const id = analysis.dialogId;
  const dialog = dialogMap.get(id);

  console.log(`\n--- ${id ?? fileName} ---`);

  // 2.1. ID и исходная переписка

  if (
    dialog &&
    fileName === `${id}.json`
  ) {
    pass(`${id}: исходный диалог найден`);
  } else {
    fail(`${fileName}: неверный ID или нет диалога`);
  }

  // 2.2. Quality Score

  if (
    typeof analysis.qualityScore === "number" &&
    Number.isFinite(analysis.qualityScore) &&
    analysis.qualityScore >= 0 &&
    analysis.qualityScore <= 100
  ) {
    pass(`${id}: Quality Score в диапазоне 0–100`);
  } else if (analysis.qualityScore === null) {
    warn(`${id}: Quality Score отсутствует (N/A)`);
  } else {
    fail(`${id}: некорректный Quality Score`);
  }

  // 2.3. Риск и статус решения

  if (validRisks.includes(analysis.riskLevel)) {
    pass(`${id}: Risk Level корректен`);
  } else {
    fail(`${id}: неизвестный Risk Level`);
  }

  if (
    validStatuses.includes(
      analysis.resolutionStatus
    )
  ) {
    pass(`${id}: Resolution Status корректен`);
  } else {
    fail(`${id}: неизвестный Resolution Status`);
  }

  // 2.4. Проверка критериев

  let earned = 0;
  let available = 0;
  let criteriaValid = true;

  for (const [name, maximum] of Object.entries(limits)) {
    const criterion = analysis.criteria?.[name];

    if (!criterion) {
      fail(`${id}: отсутствует критерий ${name}`);
      criteriaValid = false;
      continue;
    }

    if (
      typeof criterion.reason !== "string" ||
      !criterion.reason.trim()
    ) {
      fail(`${id}: нет объяснения ${name}`);
      criteriaValid = false;
    }

    const score = criterion.score;

    if (score === null) {
      if (
        criterion.status !== "not_applicable" &&
        criterion.status !== "insufficient_data"
      ) {
        fail(`${id}: неправильный статус ${name}`);
        criteriaValid = false;
      }

      continue;
    }

    if (
      criterion.status !== "scored" ||
      typeof score !== "number" ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > maximum
    ) {
      fail(`${id}: некорректная оценка ${name}`);
      criteriaValid = false;
      continue;
    }

    earned += score;
    available += maximum;
  }

  if (criteriaValid) {
    pass(`${id}: критерии оценки корректны`);
  }

  // 2.5. Пересчёт итоговой оценки

  if (criteriaValid) {
    const rawScore = available > 0
      ? Math.round((earned / available) * 100)
      : null;

    if (
      rawScore === null &&
      analysis.rawQualityScore === null
    ) {
      pass(`${id}: N/A рассчитано корректно`);
    } else if (
      rawScore !== null &&
      typeof analysis.rawQualityScore === "number" &&
      closeEnough(rawScore, analysis.rawQualityScore)
    ) {
      pass(`${id}: Raw Quality Score проверен`);
    } else {
      fail(`${id}: ошибка расчёта Raw Quality Score`);
    }
  }

  // 2.6. Ограничение критической оценки

  if (analysis.riskLevel === "critical") {
    if (
      typeof analysis.qualityScore === "number" &&
      analysis.qualityScore <= 20
    ) {
      pass(`${id}: критическая оценка не выше 20`);
    } else {
      fail(`${id}: нарушено ограничение Critical Score`);
    }
  }

  // 2.7. Проверка доказательств

  if (!Array.isArray(analysis.findings)) {
    fail(`${id}: findings должен быть массивом`);
  } else if (dialog) {
    const messages = dialog.messages ?? [];

    let allEvidenceValid = true;

    for (const finding of analysis.findings) {
      const evidence = finding.evidence;

      const exists =
        typeof evidence === "string" &&
        evidence.length > 0 &&
        messages.some(
          (message) =>
            typeof message.text === "string" &&
            message.text.includes(evidence)
        );

      if (!exists) {
        fail(
          `${id}: цитата не найдена в переписке`
        );
        allEvidenceValid = false;
      }

      if (
        Number.isInteger(finding.messageIndex) &&
        messages[finding.messageIndex] &&
        !messages[finding.messageIndex].text.includes(
          evidence
        )
      ) {
        warn(
          `${id}: messageIndex не совпадает с цитатой`
        );
      }
    }

    if (allEvidenceValid) {
      pass(`${id}: цитаты найдены в переписке`);
    }
  }

  // 2.8. Проверка рекомендаций

  if (
    Array.isArray(analysis.nextActions) &&
    analysis.nextActions.every(
      (action) =>
        typeof action === "string" &&
        action.trim().length > 0
    )
  ) {
    pass(`${id}: список рекомендаций корректен`);
  } else {
    fail(`${id}: ошибка в nextActions`);
  }

  // 2.9. Проверка наличия sourceHash

  if (
    typeof analysis.sourceHash === "string" &&
    /^[a-f0-9]{64}$/.test(analysis.sourceHash)
  ) {
    pass(`${id}: sourceHash имеет верный формат`);
  } else {
    fail(`${id}: некорректный sourceHash`);
  }
}

// ==========================================
// 3. ПРОВЕРКА СОХРАНЁННЫХ ЗАДАЧ
// ==========================================

const taskFiles = getJsonFiles(TASKS_PATH);

console.log(
  `\nПроверяем файлы задач: ${taskFiles.length}\n`
);

for (const fileName of taskFiles) {
  let saved;

  try {
    saved = readJson(
      path.join(TASKS_PATH, fileName)
    );
  } catch {
    fail(`${fileName}: некорректный JSON задач`);
    continue;
  }

  const id = saved.dialogId;

  if (!Array.isArray(saved.tasks)) {
    fail(`${id}: tasks должен быть массивом`);
    continue;
  }

  const invalid = saved.tasks.some(
    (task) =>
      !validTaskStatuses.includes(task.status) ||
      typeof task.comment !== "string" ||
      typeof task.action !== "string"
  );

  if (invalid) {
    fail(`${id}: некорректная задача`);
  } else {
    pass(
      `${id}: проверено задач ${saved.tasks.length}`
    );
  }

  const analysisPath = path.join(
    ANALYSES_PATH,
    `${id}.json`
  );

  if (fs.existsSync(analysisPath)) {
    const analysis = readJson(analysisPath);

    if (
      saved.sourceHash === analysis.sourceHash
    ) {
      pass(`${id}: задачи связаны с анализом`);
    } else {
      warn(
        `${id}: sourceHash задач и анализа различается`
      );
    }
  } else {
    warn(`${id}: анализ для задач не найден`);
  }
}

// ==========================================
// 4. ИТОГИ QA
// ==========================================

console.log("\n==============================");
console.log("QA SUMMARY");
console.log("==============================");

console.log(`PASSED:   ${passed}`);
console.log(`FAILED:   ${failed}`);
console.log(`WARNINGS: ${warnings}`);

console.log("==============================");

if (failed === 0) {
  console.log(
    "\nСтруктурные проверки пройдены."
  );

  if (warnings > 0) {
    console.log(
      "Есть предупреждения, требующие проверки."
    );
  }
} else {
  console.log(
    "\nОбнаружены ошибки. Требуется исправление."
  );
}

process.exitCode = failed > 0 ? 1 : 0;
