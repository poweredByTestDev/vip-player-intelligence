
"use client";

import { useEffect, useState } from "react";

const criteriaLabels = {
  resolution: "Решение проблемы",
  communication: "Качество коммуникации",
  responseTime: "Скорость ответа",
  personalization: "Персонализация",
  promises: "Выполнение обещаний",
  safety: "Безопасность",
};

const criteriaMax = {
  resolution: 30,
  communication: 20,
  responseTime: 15,
  personalization: 10,
  promises: 10,
  safety: 15,
};

const riskLabels = {
  none: "Риски не обнаружены",
  low: "Низкий риск",
  medium: "Средний риск",
  high: "Высокий риск",
  critical: "Критический риск",
};

const riskColors = {
  none: "text-green-400",
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

const statusLabels = {
  resolved: "Решена",
  unresolved: "Не решена",
  unknown: "Неизвестно",
  no_request: "Обращения не было",
};

const sentimentLabels = {
  positive: "Позитивное",
  neutral: "Нейтральное",
  negative: "Негативное",
  mixed: "Смешанное",
};

const criterionStatusLabels = {
  not_applicable: "Не применимо",
  insufficient_data: "Недостаточно данных",
};

// =================================================
// ОСНОВНОЙ КОМПОНЕНТ
// =================================================

export default function AIAnalysis({ dialogId }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  // ===============================================
  // 1. АВТОМАТИЧЕСКАЯ ЗАГРУЗКА КЭША
  // ===============================================

  useEffect(() => {
    const controller = new AbortController();

    async function loadSaved() {
      setChecking(true);
      setAnalysis(null);
      setError("");

      try {
        const response = await fetch(
          `/api/analyze?dialogId=${encodeURIComponent(dialogId)}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Не удалось загрузить анализ."
          );
        }

        if (!controller.signal.aborted) {
          setAnalysis(result.analysis);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setChecking(false);
        }
      }
    }

    loadSaved();

    return () => controller.abort();
  }, [dialogId]);

  // ===============================================
  // 2. ЗАПУСК AI-АНАЛИЗА
  // ===============================================

  async function analyzeDialog(force = false) {
    // Повторный анализ оплачивается отдельно
    if (force) {
      const confirmed = window.confirm(
        "Повторно проанализировать диалог? " +
        "Это создаст новый платный запрос к OpenAI."
      );

      if (!confirmed) return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dialogId,
          force,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Не удалось выполнить анализ."
        );
      }

      setAnalysis(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ===============================================
  // 3. ИНТЕРФЕЙС
  // ===============================================

  return (
    <section className="mt-10 rounded-xl border border-slate-800 bg-slate-900 p-6">

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            AI Conversation Analysis
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Quality Score, Risk Detection & Recommendations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {analysis && (
            <span className="rounded-lg bg-green-950 px-3 py-2 text-sm text-green-400">
              Saved Analysis
            </span>
          )}

          <button
            type="button"
            disabled={loading || checking}
            onClick={() => analyzeDialog(Boolean(analysis))}
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Analyzing..."
              : checking
                ? "Checking saved analysis..."
                : analysis
                  ? "Re-analyze with AI"
                  : "Analyze with AI"}
          </button>
        </div>
      </div>

      {/* Статус загрузки */}
      {checking && (
        <p className="mt-5 text-slate-400">
          Проверяем сохранённые результаты...
        </p>
      )}

      {loading && (
        <p className="mt-5 text-blue-300">
          AI анализирует переписку...
        </p>
      )}

      {/* Ошибки */}
      {error && (
        <div className="mt-5 rounded-lg border border-red-800 bg-red-950/40 p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Пока анализа нет */}
      {!analysis && !checking && !loading && !error && (
        <p className="mt-5 text-sm text-slate-400">
          Для этого диалога ещё нет сохранённого анализа.
          Нажми Analyze with AI, чтобы создать его.
        </p>
      )}

      {/* ===========================================
          РЕЗУЛЬТАТЫ AI
      ============================================ */}

      {analysis && (
        <div className="mt-8 space-y-6">

          {/* Информация о сохранении */}
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <span>
              Analysis Version: {analysis.analysisVersion}
            </span>

            {analysis.savedAt && (
              <span>
                Saved: {new Date(
                  analysis.savedAt
                ).toLocaleString("ru-RU")}
              </span>
            )}

            <span>
              Source: {analysis.cacheStatus === "saved"
                ? "Saved result"
                : "Fresh AI analysis"}
            </span>
          </div>

          {/* Основные показатели */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-slate-950 p-5">
              <p className="text-sm text-slate-400">
                Quality Score
              </p>

              <p className="mt-2 text-3xl font-bold">
                {analysis.qualityScore === null
                  ? "N/A"
                  : `${analysis.qualityScore}/100`}
              </p>
            </div>

            <div className="rounded-lg bg-slate-950 p-5">
              <p className="text-sm text-slate-400">
                Risk Level
              </p>

              <p
                className={`mt-2 font-bold ${
                  riskColors[analysis.riskLevel] ?? "text-white"
                }`}
              >
                {riskLabels[analysis.riskLevel]}
              </p>
            </div>

            <div className="rounded-lg bg-slate-950 p-5">
              <p className="text-sm text-slate-400">
                Resolution Status
              </p>

              <p className="mt-2 font-bold">
                {statusLabels[analysis.resolutionStatus]}
              </p>
            </div>
          </div>

          {/* Объяснение критического ограничения */}
          {analysis.scoreCapApplied && (
            <div className="rounded-lg border border-red-800 bg-red-950/30 p-4">
              <p className="font-semibold text-red-300">
                Critical Risk — Score Cap Applied
              </p>

              <p className="mt-2 text-sm text-slate-300">
                Исходная оценка: {analysis.rawQualityScore}/100.
                Итоговая оценка ограничена до
                {" "}{analysis.qualityScore}/100 из-за
                обнаруженного критического нарушения.
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Нарушение требует проверки тимлидом.
              </p>
            </div>
          )}

          {/* Тема и настроение */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-slate-950 p-5">
              <p className="text-sm text-slate-400">
                Topic
              </p>

              <p className="mt-2 font-medium">
                {analysis.topic}
              </p>
            </div>

            <div className="rounded-lg bg-slate-950 p-5">
              <p className="text-sm text-slate-400">
                Player Sentiment
              </p>

              <p className="mt-2 font-medium">
                {sentimentLabels[analysis.sentiment]}
              </p>
            </div>
          </div>

          {/* Краткий анализ */}
          <div>
            <h3 className="mb-2 text-lg font-semibold">
              AI Summary
            </h3>

            <p className="text-slate-300">
              {analysis.summary}
            </p>
          </div>

          {/* Детальная оценка */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">
              Quality Breakdown
            </h3>

            <div className="space-y-3">
              {Object.entries(analysis.criteria).map(
                ([key, item]) => (
                  <div
                    key={key}
                    className="rounded-lg bg-slate-950 p-4"
                  >
                    <p className="font-semibold">
                      {criteriaLabels[key]}:{" "}
                      {item.status === "scored"
                        ? `${item.score}/${criteriaMax[key]}`
                        : criterionStatusLabels[item.status] ?? "N/A"}
                    </p>

                    <p className="mt-2 text-sm text-slate-400">
                      {item.reason}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Обнаруженные проблемы */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">
              AI Findings
            </h3>

            {analysis.findings.length === 0 ? (
              <p className="text-slate-400">
                Проблемы не обнаружены.
              </p>
            ) : (
              <div className="space-y-3">
                {analysis.findings.map((finding, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-amber-900 bg-amber-950/10 p-4"
                  >
                    <p className="font-medium">
                      {finding.issue}
                    </p>

                    <p className="mt-2 text-sm text-slate-400">
                      Тип нарушения: {finding.type}
                    </p>

                    <p className="mt-2 text-sm italic text-slate-400">
                      Доказательство: «{finding.evidence}»
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Message Index: {finding.messageIndex}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Рекомендации */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">
              Next Best Actions
            </h3>

            <ol className="list-decimal space-y-2 pl-5 text-slate-300">
              {analysis.nextActions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ol>
          </div>

          {/* Информация о модели */}
          <p className="border-t border-slate-800 pt-4 text-xs text-slate-500">
            Generated by {analysis.model}.
            AI recommendations require human review.
          </p>
        </div>
      )}
    </section>
  );
}
