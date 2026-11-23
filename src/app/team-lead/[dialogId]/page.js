
import Link from "next/link";
import { notFound } from "next/navigation";
import { getData } from "@/lib/data";
import AIAnalysis from "@/components/AIAnalysis";

export const dynamic = "force-dynamic";

export default async function DialogPage({ params }) {
  const { dialogId } = await params;
  const { dialogs } = getData();

  const dialog = dialogs.find(
    (item) => item.dialog_id === dialogId
  );

  if (!dialog) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 p-10 text-white">
      <Link
        href="/team-lead"
        className="text-blue-400 hover:underline"
      >
        ← Back to Dashboard
      </Link>

      <h1 className="mt-8 text-3xl font-bold">
        Conversation {dialog.dialog_id}
      </h1>

      <p className="mt-3 text-slate-400">
        Player: {dialog.player_id} · Manager: {dialog.manager}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <h2 className="text-xl font-semibold">
            Conversation History
          </h2>

          {dialog.messages.map((message, index) => (
            <div
              key={index}
              className={`rounded-xl border p-4 ${
                message.from === "manager"
                  ? "border-blue-800 bg-blue-950/40"
                  : "border-slate-800 bg-slate-900"
              }`}
            >
              <div className="mb-2 flex justify-between gap-4">
                <span className="font-semibold">
                  {message.from === "manager"
                    ? dialog.manager
                    : "Player"}
                </span>

                <span className="text-xs text-slate-400">
                  {message.sent_at}
                </span>
              </div>

              <p className="whitespace-pre-wrap">
                {message.text}
              </p>
            </div>
          ))}
        </section>

        <aside className="h-fit rounded-xl bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">
            Player Profile
          </h2>

          {dialog.player ? (
            <div className="mt-5 space-y-3 text-sm">
              {Object.entries(dialog.player).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="border-b border-slate-800 pb-2"
                  >
                    <p className="text-slate-400">{key}</p>
                    <p className="mt-1 wrap-break-word">
  {value || "—"}
</p>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="mt-4 text-slate-400">
              Player profile not found.
            </p>
          )}
        </aside>
      </div>
      <AIAnalysis dialogId={dialog.dialog_id} />
    </main>
  );
}
