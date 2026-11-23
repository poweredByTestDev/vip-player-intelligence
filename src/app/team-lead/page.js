
import Link from "next/link";

import { getDashboardAnalytics } from "@/lib/analytics";
import DialogsTable from "@/components/DialogsTable";
import TaskOverview from "@/components/TaskOverview";

export const dynamic = "force-dynamic";

// Цвет оценки качества
function scoreColor(score) {
  if (score === null) {
    return "text-slate-400";
  }

  if (score >= 80) {
    return "text-green-400";
  }

  if (score >= 50) {
    return "text-yellow-400";
  }

  return "text-red-400";
}

const riskLabels = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
};

const riskColors = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-green-400",
  none: "text-slate-400",
};

// Универсальная карточка KPI
function KPICard({ label, value, description }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

// Главная страница руководителя
export default function TeamLeadPage() {
  const {
    stats,
    records,
    managerPerformance,
    riskMonitoring,
  } = getDashboardAnalytics();

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">

        {/* Навигация */}
        <Link
          href="/"
          className="text-sm text-blue-400 hover:underline"
        >
          ← Back to Home
        </Link>

        {/* Заголовок */}
        <div className="mt-8">
          <h1 className="text-4xl font-bold">
            Team Lead Dashboard
          </h1>

          <p className="mt-3 text-slate-400">
            VIP Team Performance & AI Risk Monitoring
          </p>
        </div>

        {/* Общая статистика */}
        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">
              Overview
            </h2>

            <span className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300">
              AI Analyzed: {stats.analyzedCount} / {stats.totalDialogs}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              label="Total Conversations"
              value={stats.totalDialogs}
              description="All imported conversations"
            />

            <KPICard
              label="AI Analyzed"
              value={stats.analyzedCount}
              description={`${stats.pendingCount} awaiting analysis`}
            />

            <KPICard
              label="Average Quality Score"
              value={
                stats.averageScore === null
                  ? "N/A"
                  : `${stats.averageScore}/100`
              }
              description="Based on scored conversations only"
            />

            <KPICard
              label="Critical Risks"
              value={stats.criticalRisks}
              description="Among analyzed conversations"
            />

            <KPICard
              label="VIP Players"
              value={stats.totalPlayers}
              description="Imported player profiles"
            />

            <KPICard
              label="VIP Managers"
              value={stats.totalManagers}
              description="Managers with conversations"
            />

            <KPICard
              label="Unresolved Issues"
              value={stats.unresolvedIssues}
              description="Among analyzed conversations"
            />

            <KPICard
              label="AI Findings"
              value={stats.totalFindings}
              description="Total detected findings"
            />
          </div>

          {/* Предупреждение о полноте данных */}
          {stats.pendingCount > 0 && (
            <div className="mt-5 rounded-lg border border-blue-900 bg-blue-950/20 p-4 text-sm text-blue-200">
              AI coverage: {stats.analyzedCount} of{" "}
              {stats.totalDialogs} conversations.
              Performance and risk statistics are
              calculated only from completed AI analyses.
            </div>
          )}
        </section>

        {/* Статистика менеджеров */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">
            Manager Performance
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Quality and risk statistics for each VIP manager
          </p>

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="p-4">Manager</th>
                  <th className="p-4">Dialogs</th>
                  <th className="p-4">Analyzed</th>
                  <th className="p-4">Avg. Score</th>
                  <th className="p-4">Critical</th>
                  <th className="p-4">Unresolved</th>
                </tr>
              </thead>

              <tbody>
                {managerPerformance.map((manager) => (
                  <tr
                    key={manager.manager}
                    className="border-t border-slate-800 hover:bg-slate-900/60"
                  >
                    <td className="p-4 font-medium">
                      {manager.manager}
                    </td>

                    <td className="p-4">
                      {manager.totalDialogs}
                    </td>

                    <td className="p-4">
                      {manager.analyzedCount}
                    </td>

                    <td
                      className={`p-4 font-semibold ${scoreColor(
                        manager.averageScore
                      )}`}
                    >
                      {manager.averageScore === null
                        ? "N/A"
                        : `${manager.averageScore}/100`}
                    </td>

                    <td className="p-4">
                      {manager.criticalRisks}
                    </td>

                    <td className="p-4">
                      {manager.unresolvedIssues}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Мониторинг рисков */}
        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">
              Risk Monitoring
            </h2>

            <span className="text-sm text-slate-400">
              {riskMonitoring.length} conversations require attention
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-400">
            Medium, high and critical risks detected by AI
          </p>

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-800">
            {riskMonitoring.length === 0 ? (
              <p className="p-6 text-sm text-slate-400">
                No medium, high or critical risks have
                been identified in analyzed conversations.
                Unanalyzed conversations are not evaluated.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="p-4">Dialog</th>
                    <th className="p-4">Manager</th>
                    <th className="p-4">Topic</th>
                    <th className="p-4">Risk</th>
                    <th className="p-4">Score</th>
                  </tr>
                </thead>

                <tbody>
                  {riskMonitoring.map((record) => (
                    <tr
                      key={record.dialogId}
                      className="border-t border-slate-800 hover:bg-slate-900/60"
                    >
                      <td className="p-4">
                        <Link
                          href={`/team-lead/${record.dialogId}`}
                          className="text-blue-400 hover:underline"
                        >
                          {record.dialogId}
                        </Link>
                      </td>

                      <td className="p-4">
                        {record.manager}
                      </td>

                      <td className="p-4">
                        {record.topic ?? "—"}
                      </td>

                      <td
                        className={`p-4 font-semibold ${
                          riskColors[record.riskLevel]
                        }`}
                      >
                        {riskLabels[record.riskLevel]}
                      </td>

                      <td className="p-4">
                        {record.qualityScore === null
                          ? "N/A"
                          : `${record.qualityScore}/100`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Интерактивная таблица */}
        <DialogsTable dialogs={records} />
        {/* Контроль задач VIP-менеджеров */}
        <TaskOverview />

        {/* Информация */}
        <footer className="mt-12 border-t border-slate-800 pt-6 text-xs text-slate-500">
          VIP Player Intelligence — AI Analysis Engine v1.1.
          AI-generated assessments require human review.
        </footer>
      </div>
    </main>
  );
}
