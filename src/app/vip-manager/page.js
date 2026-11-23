
import Link from "next/link";

import { getData } from "@/lib/data";
import { getDashboardAnalytics } from "@/lib/analytics";
import VIPManagerWorkspace from "@/components/VIPManagerWorkspace";

export const dynamic = "force-dynamic";

export default function VIPManagerPage() {
  // Получаем исходные переписки
  const { dialogs } = getData();

  // Получаем статистику сохранённых AI-анализов
  const { records } = getDashboardAnalytics();

  // Создаём быстрый поиск анализа по ID диалога
  const analysisMap = new Map(
    records.map((record) => [
      record.dialogId,
      record,
    ])
  );

  // Объединяем переписки и AI-метаданные
  const conversations = dialogs.map((dialog) => {
    const metadata = analysisMap.get(dialog.dialog_id);

    return {
      dialogId: dialog.dialog_id,
      playerId: dialog.player_id,
      manager: dialog.manager,
      channel: dialog.channel,

      player: dialog.player ?? null,
      messages: dialog.messages ?? [],

      analyzed: metadata?.analyzed ?? false,
      riskLevel: metadata?.riskLevel ?? null,
      resolutionStatus:
        metadata?.resolutionStatus ?? null,
      topic: metadata?.topic ?? null,
    };
  });

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">

        <Link
          href="/"
          className="text-sm text-blue-400 hover:underline"
        >
          ← Back to Home
        </Link>

        <div className="mt-8">
          <h1 className="text-4xl font-bold">
            VIP Manager Workspace
          </h1>

          <p className="mt-3 text-slate-400">
            Player Queue, Conversation History & AI Assistant
          </p>
        </div>

        <VIPManagerWorkspace
          conversations={conversations}
        />

      </div>
    </main>
  );
}
