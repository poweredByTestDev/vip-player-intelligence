
"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// =============================================
// 1. НАСТРОЙКИ
// =============================================

// Максимум диалогов за один запуск
const MAX_BULK_SIZE = 3;

const riskLabels = {
  none: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const riskColors = {
  none: "text-slate-400",
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

const resolutionLabels = {
  resolved: "Resolved",
  unresolved: "Unresolved",
  unknown: "Unknown",
  no_request: "No request",
};

// =============================================
// 2. ГЛАВНЫЙ КОМПОНЕНТ
// =============================================

export default function DialogsTable({ dialogs }) {
  const router = useRouter();

  // Фильтры
  const [manager, setManager] = useState("all");
  const [channel, setChannel] = useState("all");
  const [risk, setRisk] = useState("all");
  const [analysisStatus, setAnalysisStatus] =
    useState("all");
  const [resolution, setResolution] = useState("all");
  const [search, setSearch] = useState("");

  // Выбранные диалоги
  const [selectedIds, setSelectedIds] = useState([]);

  // Состояние массового анализа
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    completed: 0,
    failed: 0,
    currentDialog: null,
  });

  const [batchResults, setBatchResults] = useState([]);
  const [batchMessage, setBatchMessage] = useState("");

  // Флаг остановки следующих запросов
  const stopRequested = useRef(false);

  // Защита от повторного запуска в этом окне
  const runningRef = useRef(false);

  // =============================================
  // 3. СПИСКИ ДЛЯ ФИЛЬТРОВ
  // =============================================

  const managers = [
    ...new Set(dialogs.map((item) => item.manager)),
  ].sort();

  const channels = [
    ...new Set(dialogs.map((item) => item.channel)),
  ].sort();

  // =============================================
  // 4. ФИЛЬТРАЦИЯ
  // =============================================

  const filteredDialogs = useMemo(() => {
    return dialogs.filter((item) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        item.dialogId.toLowerCase().includes(query) ||
        item.playerId.toLowerCase().includes(query);

      const matchesManager =
        manager === "all" || item.manager === manager;

      const matchesChannel =
        channel === "all" || item.channel === channel;

      const matchesRisk =
        risk === "all" || item.riskLevel === risk;

      const matchesAnalysis =
        analysisStatus === "all" ||
        (analysisStatus === "analyzed" && item.analyzed) ||
        (analysisStatus === "pending" && !item.analyzed);

      const matchesResolution =
        resolution === "all" ||
        item.resolutionStatus === resolution;

      return (
        matchesSearch &&
        matchesManager &&
        matchesChannel &&
        matchesRisk &&
        matchesAnalysis &&
        matchesResolution
      );
    });
  }, [
    dialogs,
    manager,
    channel,
    risk,
    analysisStatus,
    resolution,
    search,
  ]);

  // =============================================
  // 5. УПРАВЛЕНИЕ ФИЛЬТРАМИ
  // =============================================

  function resetFilters() {
    setManager("all");
    setChannel("all");
    setRisk("all");
    setAnalysisStatus("all");
    setResolution("all");
    setSearch("");
  }

  // =============================================
  // 6. ВЫБОР ДИАЛОГОВ
  // =============================================

  function toggleDialog(dialogId) {
    if (running) return;

    setSelectedIds((previous) => {
      // Если уже выбран — убираем
      if (previous.includes(dialogId)) {
        return previous.filter((id) => id !== dialogId);
      }

      // Проверяем лимит
      if (previous.length >= MAX_BULK_SIZE) {
        setBatchMessage(
          `Можно выбрать максимум ${MAX_BULK_SIZE} диалога.`
        );

        return previous;
      }

      setBatchMessage("");

      return [...previous, dialogId];
    });
  }

  // Выбираем видимые непроанализированные диалоги
  function selectVisible() {
    if (running) return;

    const available = filteredDialogs
      .filter((item) => !item.analyzed)
      .map((item) => item.dialogId);

    const selected = [
      ...new Set([...selectedIds, ...available]),
    ].slice(0, MAX_BULK_SIZE);

    setSelectedIds(selected);
    setBatchMessage("");
  }

  function clearSelection() {
    if (running) return;

    setSelectedIds([]);
    setBatchMessage("");
  }

  // =============================================
  // 7. МАССОВЫЙ AI-АНАЛИЗ
  // =============================================

  async function startBulkAnalysis() {
    // Не разрешаем запускать второй процесс
    if (runningRef.current) return;

    // Повторно проверяем выбранные ID
    const selected = selectedIds
      .filter((id) =>
        dialogs.some(
          (item) =>
            item.dialogId === id &&
            !item.analyzed
        )
      )
      .slice(0, MAX_BULK_SIZE);

    if (selected.length === 0) {
      setBatchMessage(
        "Выбери хотя бы один непроанализированный диалог."
      );
      return;
    }

    const confirmed = window.confirm(
      `Запустить AI-анализ ${selected.length} диалогов?\n\n` +
      "Новые запросы к OpenAI могут расходовать API-баланс.\n" +
      "Обработка будет последовательной."
    );

    if (!confirmed) return;

    runningRef.current = true;
    stopRequested.current = false;

    setRunning(true);
    setBatchMessage("");
    setBatchResults([]);

    let completed = 0;
    let failed = 0;

    setProgress({
      current: 0,
      total: selected.length,
      completed: 0,
      failed: 0,
      currentDialog: null,
    });

    try {
      // Обрабатываем диалоги по очереди
      for (let index = 0; index < selected.length; index++) {
        // Проверяем, не нажали ли Stop
        if (stopRequested.current) {
          break;
        }

        const dialogId = selected[index];

        setProgress({
          current: index + 1,
          total: selected.length,
          completed,
          failed,
          currentDialog: dialogId,
        });

        try {
          // Отправляем запрос к уже существующему API
          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              dialogId,
              force: false,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(
              result.error || "Ошибка анализа."
            );
          }

          completed++;

          setBatchResults((previous) => [
            ...previous,
            {
              dialogId,
              success: true,
              qualityScore: result.qualityScore,
              riskLevel: result.riskLevel,
              source: result.cacheStatus,
            },
          ]);
        } catch (error) {
          failed++;

          setBatchResults((previous) => [
            ...previous,
            {
              dialogId,
              success: false,
              error: error.message,
            },
          ]);
        }

        setProgress({
          current: index + 1,
          total: selected.length,
          completed,
          failed,
          currentDialog: null,
        });
      }

      if (stopRequested.current) {
        setBatchMessage(
          "Обработка остановлена. Новые запросы не запускаются."
        );
      } else {
        setBatchMessage(
          `Готово! Успешно: ${completed}. Ошибок: ${failed}.`
        );
      }
    } finally {
      // Сбрасываем выбор
      setSelectedIds([]);

      setRunning(false);
      runningRef.current = false;
      stopRequested.current = false;

      // Получаем обновлённую статистику с сервера
      router.refresh();
    }
  }

  // Остановка будущих запросов
  function stopBulkAnalysis() {
    stopRequested.current = true;
    setBatchMessage(
      "Остановка запрошена. Текущий запрос завершится, следующие не начнутся."
    );
  }

  // =============================================
  // 8. ОФОРМЛЕНИЕ
  // =============================================

  const selectClass =
    "w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-blue-500";

  const pendingVisible = filteredDialogs.filter(
    (item) => !item.analyzed
  );

  return (
    <section className="mt-12">

      {/* =========================================
          BULK AI ANALYSIS PANEL
      ========================================== */}

      <div className="rounded-xl border border-blue-900 bg-slate-900 p-6">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              Bulk AI Analysis
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Select conversations and analyze them with AI
            </p>
          </div>

          <span className="rounded-lg bg-slate-950 px-4 py-2 text-sm">
            Selected: {selectedIds.length} / {MAX_BULK_SIZE}
          </span>
        </div>

        <p className="mt-4 text-sm text-slate-400">
          Выбирай диалоги с помощью галочек в таблице ниже.
          За один запуск можно обработать до трёх диалогов.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">

          <button
            type="button"
            onClick={selectVisible}
            disabled={
              running ||
              pendingVisible.length === 0 ||
              selectedIds.length >= MAX_BULK_SIZE
            }
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-40"
          >
            Select Pending
          </button>

          <button
            type="button"
            onClick={clearSelection}
            disabled={running || selectedIds.length === 0}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-40"
          >
            Clear Selection
          </button>

          <button
            type="button"
            onClick={startBulkAnalysis}
            disabled={running || selectedIds.length === 0}
            className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {running
              ? "Analyzing..."
              : `Analyze Selected (${selectedIds.length})`}
          </button>

          {running && (
            <button
              type="button"
              onClick={stopBulkAnalysis}
              disabled={stopRequested.current}
              className="rounded-lg bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800 disabled:opacity-50"
            >
              Stop
            </button>
          )}
        </div>

        {/* Прогресс */}
        {running && (
          <div className="mt-6 rounded-lg bg-slate-950 p-4">
            <p className="text-sm font-medium">
              Processing: {progress.current} of {progress.total}
            </p>

            {progress.currentDialog && (
              <p className="mt-2 text-sm text-blue-400">
                Current: {progress.currentDialog}
              </p>
            )}

            <p className="mt-2 text-xs text-slate-400">
              Completed: {progress.completed} | Failed: {progress.failed}
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{
                  width: `${
                    progress.total
                      ? ((progress.completed + progress.failed) /
                          progress.total) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Сообщения */}
        {batchMessage && (
          <div className="mt-5 rounded-lg border border-slate-700 p-4 text-sm text-slate-300">
            {batchMessage}
          </div>
        )}

        {/* Результаты обработки */}
        {batchResults.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 font-semibold">
              Batch Results
            </h3>

            <div className="space-y-2">
              {batchResults.map((result) => (
                <div
                  key={result.dialogId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-950 p-3 text-sm"
                >
                  <Link
                    href={`/team-lead/${result.dialogId}`}
                    className="text-blue-400 hover:underline"
                  >
                    {result.dialogId}
                  </Link>

                  {result.success ? (
                    <span className="text-green-400">
                      Completed · Score:{" "}
                      {result.qualityScore ?? "N/A"} ·
                      Risk: {result.riskLevel}
                    </span>
                  ) : (
                    <span className="text-red-400">
                      Failed: {result.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================
          CONVERSATIONS TABLE
      ========================================== */}

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">
            Player Conversations
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Search, filter and select VIP conversations
          </p>
        </div>

        <span className="text-sm text-slate-400">
          Showing {filteredDialogs.length} of {dialogs.length}
        </span>
      </div>

      {/* Фильтры */}
      <div className="mt-6 grid gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5 md:grid-cols-2 lg:grid-cols-3">

        <div>
          <label htmlFor="dialog-search" className="mb-2 block text-sm text-slate-400">
            Search Conversations
          </label>

          <input
            id="dialog-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Enter Dialog ID or Player ID"
            className={selectClass}
          />
        </div>

        <div>
          <label htmlFor="manager-filter" className="mb-2 block text-sm text-slate-400">
            VIP Manager
          </label>

          <select
            id="manager-filter"
            value={manager}
            onChange={(event) => setManager(event.target.value)}
            className={selectClass}
          >
            <option value="all">All Managers</option>

            {managers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="channel-filter" className="mb-2 block text-sm text-slate-400">
            Channel
          </label>

          <select
            id="channel-filter"
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
            className={selectClass}
          >
            <option value="all">All Channels</option>

            {channels.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="analysis-filter" className="mb-2 block text-sm text-slate-400">
            AI Analysis Status
          </label>

          <select
            id="analysis-filter"
            value={analysisStatus}
            onChange={(event) => setAnalysisStatus(event.target.value)}
            className={selectClass}
          >
            <option value="all">All Conversations</option>
            <option value="analyzed">Analyzed</option>
            <option value="pending">Not Analyzed</option>
          </select>
        </div>

        <div>
          <label htmlFor="risk-filter" className="mb-2 block text-sm text-slate-400">
            Risk Level
          </label>

          <select
            id="risk-filter"
            value={risk}
            onChange={(event) => setRisk(event.target.value)}
            className={selectClass}
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="none">None</option>
          </select>
        </div>

        <div>
          <label htmlFor="resolution-filter" className="mb-2 block text-sm text-slate-400">
            Resolution Status
          </label>

          <select
            id="resolution-filter"
            value={resolution}
            onChange={(event) => setResolution(event.target.value)}
            className={selectClass}
          >
            <option value="all">All Statuses</option>
            <option value="resolved">Resolved</option>
            <option value="unresolved">Unresolved</option>
            <option value="unknown">Unknown</option>
            <option value="no_request">No Request</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={resetFilters}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
        >
          Reset Filters
        </button>
      </div>

      {/* Таблица */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-300">
            <tr>
              <th className="p-4">Select</th>
              <th className="p-4">Dialog</th>
              <th className="p-4">Player</th>
              <th className="p-4">Manager</th>
              <th className="p-4">Channel</th>
              <th className="p-4">AI Status</th>
              <th className="p-4">Quality</th>
              <th className="p-4">Risk</th>
              <th className="p-4">Resolution</th>
            </tr>
          </thead>

          <tbody>
            {filteredDialogs.map((item) => (
              <tr
                key={item.dialogId}
                className="border-t border-slate-800 hover:bg-slate-900/60"
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    aria-label={`Select ${item.dialogId}`}
                    checked={selectedIds.includes(item.dialogId)}
                    disabled={
                      running ||
                      item.analyzed ||
                      (!selectedIds.includes(item.dialogId) &&
                        selectedIds.length >= MAX_BULK_SIZE)
                    }
                    onChange={() => toggleDialog(item.dialogId)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </td>

                <td className="p-4">
                  <Link
                    href={`/team-lead/${item.dialogId}`}
                    className="font-medium text-blue-400 hover:underline"
                  >
                    {item.dialogId}
                  </Link>
                </td>

                <td className="p-4">
                  {item.playerId}
                </td>

                <td className="p-4">
                  {item.manager}
                </td>

                <td className="p-4">
                  {item.channel}
                </td>

                <td className="p-4">
                  <span
                    className={
                      item.analyzed
                        ? "text-green-400"
                        : "text-slate-500"
                    }
                  >
                    {item.analyzed ? "Analyzed" : "Pending"}
                  </span>
                </td>

                <td className="p-4 font-medium">
                  {item.analyzed &&
                  item.qualityScore !== null
                    ? `${item.qualityScore}/100`
                    : "—"}
                </td>

                <td className="p-4">
                  {item.analyzed ? (
                    <span className={riskColors[item.riskLevel] ?? "text-slate-400"}>
                      {riskLabels[item.riskLevel]}
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      Not analyzed
                    </span>
                  )}
                </td>

                <td className="p-4">
                  {item.analyzed
                    ? resolutionLabels[item.resolutionStatus]
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredDialogs.length === 0 && (
          <p className="p-8 text-center text-slate-400">
            No conversations match the selected filters.
          </p>
        )}
      </div>
    </section>
  );
}
