
import "server-only";

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import { getData } from "@/lib/data";

const ANALYSIS_VERSION = "1.1";

// Путь к сохранённым AI-анализам
const ANALYSES_FOLDER = path.join(
  process.cwd(),
  "data",
  "analyses"
);

// Создаём цифровой отпечаток данных.
// Используем ту же логику, что и в route.js.
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

// Читаем актуальный сохранённый анализ
function getSavedAnalysis(dialog) {
  const filePath = path.join(
    ANALYSES_FOLDER,
    `${dialog.dialog_id}.json`
  );

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const analysis = JSON.parse(content);

    // Проверка принадлежности к диалогу
    if (analysis.dialogId !== dialog.dialog_id) {
      return null;
    }

    // Проверка версии алгоритма
    if (analysis.analysisVersion !== ANALYSIS_VERSION) {
      return null;
    }

    // Проверка актуальности исходных данных
    if (analysis.sourceHash !== getSourceHash(dialog)) {
      return null;
    }

    // Проверка необходимых полей
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

    if (
      !validRisks.includes(analysis.riskLevel) ||
      !validStatuses.includes(analysis.resolutionStatus)
    ) {
      return null;
    }

    const score = analysis.qualityScore;

    if (
      score !== null &&
      (
        typeof score !== "number" ||
        !Number.isFinite(score) ||
        score < 0 ||
        score > 100
      )
    ) {
      return null;
    }

    if (
      !Array.isArray(analysis.findings) ||
      !Array.isArray(analysis.nextActions)
    ) {
      return null;
    }

    return analysis;
  } catch (error) {
    console.error(
      `Error reading ${dialog.dialog_id}:`,
      error.message
    );

    return null;
  }
}

// Рассчитываем среднее значение
function calculateAverage(values) {
  if (values.length === 0) {
    return null;
  }

  const sum = values.reduce(
    (total, value) => total + value,
    0
  );

  return Math.round(sum / values.length);
}

// Главная функция аналитики
export function getDashboardAnalytics() {
  const { dialogs, players } = getData();

  // Добавляем к каждому диалогу его анализ,
  // если он существует и актуален.
  const records = dialogs.map((dialog) => {
    const analysis = getSavedAnalysis(dialog);

    return {
      dialogId: dialog.dialog_id,
      playerId: dialog.player_id,
      manager: dialog.manager,
      channel: dialog.channel,
      geo: dialog.player?.geo ?? "Unknown",
      messagesCount: dialog.messages.length,

      analyzed: analysis !== null,

      qualityScore: analysis?.qualityScore ?? null,
      riskLevel: analysis?.riskLevel ?? null,
      resolutionStatus:
        analysis?.resolutionStatus ?? null,

      topic: analysis?.topic ?? null,
      findingsCount: analysis?.findings.length ?? 0,

      savedAt: analysis?.savedAt ?? null,
    };
  });

  // Только диалоги, прошедшие AI-анализ
  const analyzed = records.filter(
    (record) => record.analyzed
  );

  // Баллы, которые можно использовать в среднем
  const scores = analyzed
    .map((record) => record.qualityScore)
    .filter((score) => score !== null);

  // Общие показатели
  const stats = {
    totalDialogs: records.length,
    totalPlayers: players.length,

    totalManagers: new Set(
      records.map((record) => record.manager)
    ).size,

    analyzedCount: analyzed.length,
    pendingCount: records.length - analyzed.length,

    averageScore: calculateAverage(scores),

    criticalRisks: analyzed.filter(
      (record) => record.riskLevel === "critical"
    ).length,

    highRisks: analyzed.filter(
      (record) => record.riskLevel === "high"
    ).length,

    unresolvedIssues: analyzed.filter(
      (record) =>
        record.resolutionStatus === "unresolved"
    ).length,

    totalFindings: analyzed.reduce(
      (total, record) => total + record.findingsCount,
      0
    ),
  };

  // Статистика по каждому менеджеру
  const managerNames = [
    ...new Set(records.map((record) => record.manager)),
  ].sort();

  const managerPerformance = managerNames.map(
    (manager) => {
      const managerDialogs = records.filter(
        (record) => record.manager === manager
      );

      const managerAnalyzed = managerDialogs.filter(
        (record) => record.analyzed
      );

      const managerScores = managerAnalyzed
        .map((record) => record.qualityScore)
        .filter((score) => score !== null);

      return {
        manager,
        totalDialogs: managerDialogs.length,
        analyzedCount: managerAnalyzed.length,

        averageScore: calculateAverage(managerScores),

        criticalRisks: managerAnalyzed.filter(
          (record) => record.riskLevel === "critical"
        ).length,

        unresolvedIssues: managerAnalyzed.filter(
          (record) =>
            record.resolutionStatus === "unresolved"
        ).length,
      };
    }
  );

  // Диалоги, которые требуют внимания
  const riskPriority = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    none: 0,
  };

  const riskMonitoring = analyzed
    .filter(
      (record) =>
        record.riskLevel === "critical" ||
        record.riskLevel === "high" ||
        record.riskLevel === "medium"
    )
    .sort((a, b) => {
      return (
        riskPriority[b.riskLevel] -
        riskPriority[a.riskLevel]
      );
    });

  return {
    stats,
    records,
    managerPerformance,
    riskMonitoring,
  };
}
