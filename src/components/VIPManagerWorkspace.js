
"use client";

import { useEffect, useMemo, useState } from "react";
import TaskManagement from "@/components/TaskManagement";

// =============================================
// 1. НАСТРОЙКИ И НАЗВАНИЯ СТАТУСОВ
// =============================================

const riskLabels = {
  none: "No Risk Detected",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const riskColors = {
  none: "text-green-400",
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

const riskPriority = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  none: 1,
};

const resolutionLabels = {
  resolved: "Resolved",
  unresolved: "Unresolved",
  unknown: "Unknown",
  no_request: "No Request",
};

const sentimentLabels = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
  mixed: "Mixed",
};

// =============================================
// 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =============================================

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
}

// =============================================
// 3. ОСНОВНОЙ КОМПОНЕНТ
// =============================================

export default function VIPManagerWorkspace({
  conversations,
}) {
  // Список VIP-менеджеров
  const managers = useMemo(() => {
    return [
      ...new Set(
        conversations.map((item) => item.manager)
      ),
    ].sort();
  }, [conversations]);

  // Выбранный менеджер
  const [manager, setManager] = useState(
    managers[0] ?? ""
  );

  // Фильтры
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [analysisFilter, setAnalysisFilter] =
    useState("all");

  // Выбранный диалог
  const [selectedId, setSelectedId] = useState(null);

  // AI-анализ
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =============================================
  // 4. ДИАЛОГИ МЕНЕДЖЕРА
  // =============================================

  const myDialogs = useMemo(() => {
    return conversations.filter(
      (item) => item.manager === manager
    );
  }, [conversations, manager]);

  // KPI менеджера
  const analyzedCount = myDialogs.filter(
    (item) => item.analyzed
  ).length;

  const criticalCount = myDialogs.filter(
    (item) =>
      item.analyzed &&
      item.riskLevel === "critical"
  ).length;

  const unresolvedCount = myDialogs.filter(
    (item) =>
      item.analyzed &&
      item.resolutionStatus === "unresolved"
  ).length;

  // =============================================
  // 5. ФИЛЬТРЫ И СОРТИРОВКА
  // =============================================

  const filteredDialogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return myDialogs
      .filter((item) => {
        const matchesSearch =
          item.dialogId
            .toLowerCase()
            .includes(query) ||
          item.playerId
            .toLowerCase()
            .includes(query);

        const matchesRisk =
          riskFilter === "all" ||
          item.riskLevel === riskFilter;

        const matchesAnalysis =
          analysisFilter === "all" ||
          (
            analysisFilter === "analyzed" &&
            item.analyzed
          ) ||
          (
            analysisFilter === "pending" &&
            !item.analyzed
          );

        return (
          matchesSearch &&
          matchesRisk &&
          matchesAnalysis
        );
      })
      .sort((a, b) => {
        const aPriority = a.analyzed
          ? riskPriority[a.riskLevel] ?? 0
          : 0;

        const bPriority = b.analyzed
          ? riskPriority[b.riskLevel] ?? 0
          : 0;

        return bPriority - aPriority;
      });
  }, [
    myDialogs,
    search,
    riskFilter,
    analysisFilter,
  ]);

  // =============================================
  // 6. ВЫБРАННЫЙ ДИАЛОГ
  // =============================================

  const activeDialog =
    myDialogs.find(
      (item) => item.dialogId === selectedId
    ) ?? null;

  // =============================================
  // 7. ЗАГРУЗКА СОХРАНЁННОГО AI-АНАЛИЗА
  // =============================================

  useEffect(() => {
    if (!selectedId || !activeDialog) {
      return;
    }

    const controller = new AbortController();

    async function loadSavedAnalysis() {
      setLoading(true);
      setAnalysis(null);
      setError("");

      try {
        const response = await fetch(
          `/api/analyze?dialogId=${encodeURIComponent(
            selectedId
          )}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
            "Не удалось загрузить AI-анализ."
          );
        }

        if (!controller.signal.aborted) {
          setAnalysis(result.analysis ?? null);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err.message ||
            "Неизвестная ошибка загрузки."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSavedAnalysis();

    return () => controller.abort();
  }, [selectedId, activeDialog?.dialogId]);

  // =============================================
  // 8. УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ
  // =============================================

  function changeManager(value) {
    setManager(value);
    setSelectedId(null);
    setSearch("");
    setRiskFilter("all");
    setAnalysisFilter("all");
    setAnalysis(null);
    setError("");
    setLoading(false);
  }

  function selectDialog(dialogId) {
    if (dialogId === selectedId) return;

    setSelectedId(dialogId);
    setAnalysis(null);
    setError("");
  }

  const inputClass =
    "w-full rounded-lg border border-slate-700 " +
    "bg-slate-950 p-3 text-white outline-none " +
    "focus:border-blue-500";

  // =============================================
  // 9. ИНТЕРФЕЙС
  // =============================================

  return (
    <div className="mt-10 space-y-8">

      {/* =======================================
          ВЫБОР VIP-МЕНЕДЖЕРА
      ======================================== */}

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <label
          htmlFor="manager-select"
          className="mb-2 block text-sm text-slate-400"
        >
          VIP Manager — Demo Profile
        </label>

        <select
          id="manager-select"
          value={manager}
          onChange={(event) =>
            changeManager(event.target.value)
          }
          className={inputClass}
        >
          {managers.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <p className="mt-3 text-xs text-slate-500">
          Demo mode: manager selection does not
          enforce access permissions.
        </p>
      </section>

      {/* =======================================
          KPI МЕНЕДЖЕРА
      ======================================== */}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["My Conversations", myDialogs.length],
          ["AI Analyzed", analyzedCount],
          ["Unresolved Issues", unresolvedCount],
          ["Critical Risks", criticalCount],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-800 bg-slate-900 p-5"
          >
            <p className="text-sm text-slate-400">
              {label}
            </p>

            <p className="mt-3 text-3xl font-bold">
              {value}
            </p>
          </div>
        ))}
      </section>

      {/* =======================================
          PLAYER QUEUE
      ======================================== */}

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">
              Player Queue
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Assigned conversations sorted by AI risk
            </p>
          </div>

          <span className="text-sm text-slate-400">
            Showing {filteredDialogs.length} of{" "}
            {myDialogs.length}
          </span>
        </div>

        {/* ФИЛЬТРЫ */}

        <div className="mt-6 grid gap-4 md:grid-cols-3">

          <div>
            <label
              htmlFor="player-search"
              className="mb-2 block text-sm text-slate-400"
            >
              Search
            </label>

            <input
              id="player-search"
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Player ID or Dialog ID"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="risk-filter"
              className="mb-2 block text-sm text-slate-400"
            >
              Risk Level
            </label>

            <select
              id="risk-filter"
              value={riskFilter}
              onChange={(event) =>
                setRiskFilter(event.target.value)
              }
              className={inputClass}
            >
              <option value="all">All Risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="none">No Risk Detected</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="analysis-filter"
              className="mb-2 block text-sm text-slate-400"
            >
              AI Analysis
            </label>

            <select
              id="analysis-filter"
              value={analysisFilter}
              onChange={(event) =>
                setAnalysisFilter(event.target.value)
              }
              className={inputClass}
            >
              <option value="all">
                All Conversations
              </option>

              <option value="analyzed">
                Analyzed
              </option>

              <option value="pending">
                Not Analyzed
              </option>
            </select>
          </div>
        </div>

        {/* СБРОС ФИЛЬТРОВ */}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setRiskFilter("all");
              setAnalysisFilter("all");
            }}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Reset Filters
          </button>
        </div>

        {/* СПИСОК ДИАЛОГОВ */}

        <div className="mt-5 space-y-3">
          {filteredDialogs.map((dialog) => {
            const isActive =
              selectedId === dialog.dialogId;

            return (
              <button
                key={dialog.dialogId}
                type="button"
                onClick={() =>
                  selectDialog(dialog.dialogId)
                }
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  isActive
                    ? "border-blue-500 bg-blue-950/30"
                    : "border-slate-700 bg-slate-950 hover:border-slate-500"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {dialog.playerId}
                      {" · "}
                      {dialog.dialogId}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Channel: {dialog.channel}
                    </p>
                  </div>

                  <span
                    className={
                      dialog.analyzed
                        ? riskColors[dialog.riskLevel] ??
                          "text-slate-400"
                        : "text-slate-500"
                    }
                  >
                    {dialog.analyzed
                      ? riskLabels[dialog.riskLevel]
                      : "Not Analyzed"}
                  </span>
                </div>

                {dialog.topic && (
                  <p className="mt-3 text-sm text-slate-300">
                    {dialog.topic}
                  </p>
                )}

                {dialog.resolutionStatus && (
                  <p className="mt-2 text-xs text-slate-400">
                    Resolution:{" "}
                    {resolutionLabels[
                      dialog.resolutionStatus
                    ] ?? "Unknown"}
                  </p>
                )}
              </button>
            );
          })}

          {filteredDialogs.length === 0 && (
            <div className="rounded-lg bg-slate-950 p-5">
              <p className="text-slate-400">
                No conversations found.
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Try changing the filters.
              </p>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Unanalyzed conversations have an unknown
          risk, not a confirmed low risk.
        </p>
      </section>

      {/* =======================================
          СОСТОЯНИЕ БЕЗ ВЫБОРА
      ======================================== */}

      {!activeDialog && (
        <section className="rounded-xl border border-slate-800 p-8 text-center text-slate-400">
          Select a player from the queue to view
          conversation history and AI recommendations.
        </section>
      )}

      {/* =======================================
          ВЫБРАННЫЙ ДИАЛОГ
      ======================================== */}

      {activeDialog && (
        <>
          {/* ЗАГОЛОВОК ДИАЛОГА */}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">
                Conversation {activeDialog.dialogId}
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Player: {activeDialog.playerId}
                {" · "}
                Channel: {activeDialog.channel}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Close Conversation
            </button>
          </div>

          {/* ИСТОРИЯ И ПРОФИЛЬ */}

          <div className="grid gap-6 lg:grid-cols-3">

            {/* ИСТОРИЯ ПЕРЕПИСКИ */}

            <section className="lg:col-span-2">
              <h3 className="mb-5 text-xl font-semibold">
                Conversation History
              </h3>

              <div className="space-y-4">
                {activeDialog.messages.map(
                  (message, index) => {
                    const isManager =
                      message.from === "manager";

                    return (
                      <div
                        key={index}
                        className={`flex ${
                          isManager
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[90%] rounded-xl border p-4 ${
                            isManager
                              ? "border-blue-900 bg-blue-950/40"
                              : "border-slate-700 bg-slate-900"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="font-semibold">
                              {isManager
                                ? activeDialog.manager
                                : "Player"}
                            </p>

                            <p className="text-xs text-slate-400">
                              {formatDate(
                                message.sent_at
                              )}
                            </p>
                          </div>

                          <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm">
                            {message.text}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            {/* ПРОФИЛЬ ИГРОКА */}

            <aside className="h-fit rounded-xl bg-slate-900 p-6">
              <h3 className="text-xl font-semibold">
                Player Profile
              </h3>

              <div className="mt-5 space-y-3">
                {[
                  [
                    "Player ID",
                    activeDialog.playerId,
                  ],
                  [
                    "Brand",
                    activeDialog.player?.brand,
                  ],
                  [
                    "GEO",
                    activeDialog.player?.geo,
                  ],
                  [
                    "Language",
                    activeDialog.player?.language,
                  ],
                  [
                    "VIP Status",
                    activeDialog.player?.status,
                  ],
                  [
                    "Account Status",
                    activeDialog.player?.account_status,
                  ],
                  [
                    "Deposits (30d USD)",
                    activeDialog.player?.deposits_30d_usd,
                  ],
                  [
                    "Failed Deposits (7d)",
                    activeDialog.player?.failed_deposits_7d,
                  ],
                  [
                    "Pending Withdrawal (USD)",
                    activeDialog.player?.pending_withdrawal_usd,
                  ],
                  [
                    "Last Login",
                    activeDialog.player?.last_login_at,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="border-b border-slate-700 pb-3"
                  >
                    <p className="text-xs text-slate-400">
                      {label}
                    </p>

                    <p className="mt-1 text-sm">
                      {formatValue(value)}
                    </p>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          {/* ===================================
              AI ASSISTANT
          ==================================== */}

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-2xl font-bold">
              AI Assistant
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Conversation insights and recommended actions
            </p>

            {loading && (
              <p className="mt-5 text-blue-300">
                Loading saved AI analysis...
              </p>
            )}

            {error && (
              <div className="mt-5 rounded-lg border border-red-900 bg-red-950/20 p-4 text-red-300">
                {error}
              </div>
            )}

            {!loading && !error && !analysis && (
              <div className="mt-5 rounded-lg bg-slate-950 p-5">
                <p className="font-semibold">
                  No AI Analysis Available
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Ask the Team Lead to analyze
                  this conversation.
                </p>
              </div>
            )}

            {!loading && analysis && (
              <div className="mt-6 space-y-6">

                {/* СТАТУСЫ */}

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-slate-950 p-4">
                    <p className="text-xs text-slate-400">
                      Player Sentiment
                    </p>

                    <p className="mt-2 font-medium">
                      {sentimentLabels[
                        analysis.sentiment
                      ] ?? "Unknown"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-950 p-4">
                    <p className="text-xs text-slate-400">
                      Resolution
                    </p>

                    <p className="mt-2 font-medium">
                      {resolutionLabels[
                        analysis.resolutionStatus
                      ] ?? "Unknown"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-950 p-4">
                    <p className="text-xs text-slate-400">
                      Risk
                    </p>

                    <p
                      className={`mt-2 font-semibold ${
                        riskColors[
                          analysis.riskLevel
                        ] ?? "text-white"
                      }`}
                    >
                      {riskLabels[
                        analysis.riskLevel
                      ] ?? "Unknown"}
                    </p>
                  </div>
                </div>

                {/* КРИТИЧЕСКОЕ ПРЕДУПРЕЖДЕНИЕ */}

                {analysis.riskLevel === "critical" && (
                  <div className="rounded-lg border border-red-800 bg-red-950/30 p-5">
                    <h3 className="font-bold text-red-300">
                      Critical Risk — Immediate Attention
                    </h3>

                    <p className="mt-2 text-sm text-slate-200">
                      Обнаружен потенциально критический
                      риск. Не предлагай игроку новые
                      депозиты или бонусы.
                    </p>

                    <p className="mt-3 text-sm text-slate-200">
                      При запросе на самоисключение
                      немедленно следуй обязательной
                      процедуре блокировки и передай
                      ситуацию ответственному
                      сотруднику Responsible Gaming.
                    </p>

                    <p className="mt-3 text-xs text-red-200">
                      AI предупреждение требует
                      проверки человеком. Не откладывай
                      обработку прямого запроса на
                      самоисключение.
                    </p>
                  </div>
                )}

                {/* ТЕМА ОБРАЩЕНИЯ */}

                <div>
                  <h3 className="font-semibold">
                    Conversation Topic
                  </h3>

                  <p className="mt-2 text-slate-300">
                    {analysis.topic}
                  </p>
                </div>

                {/* КРАТКОЕ СОДЕРЖАНИЕ */}

                <div>
                  <h3 className="font-semibold">
                    AI Conversation Summary
                  </h3>

                  <p className="mt-2 text-slate-300">
                    {analysis.summary}
                  </p>
                </div>

                {/* РЕКОМЕНДАЦИИ */}

                <div>
                  <h3 className="font-semibold">
                    Recommended Next Actions
                  </h3>

                  {analysis.nextActions?.length ? (
                    <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-300">
                      {analysis.nextActions.map(
                        (action, index) => (
                          <li key={index}>
                            {action}
                          </li>
                        )
                      )}
                    </ol>
                  ) : (
                    <p className="mt-3 text-slate-400">
                      No actions suggested.
                    </p>
                  )}
                </div>

                <p className="border-t border-slate-700 pt-4 text-xs text-slate-500">
                  AI-generated recommendations require
                  human review.
                </p>
              </div>
            )}
          </section>

          {/* ===================================
              TASK MANAGEMENT v1.2
          ==================================== */}

          <TaskManagement
            key={activeDialog.dialogId}
            dialogId={activeDialog.dialogId}
          />
        </>
      )}
    </div>
  );
}
