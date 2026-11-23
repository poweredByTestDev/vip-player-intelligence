
import Link from "next/link";
import { getTaskOverview } from "@/lib/task-store";

const statusLabels = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done (Manager Reported)",
};

const statusColors = {
  todo: "text-slate-400",
  in_progress: "text-yellow-400",
  done: "text-green-400",
};

export default async function TaskOverview() {
  const { stats, tasks } = await getTaskOverview();

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.critical !== b.critical) {
      return a.critical ? -1 : 1;
    }

    const order = {
      todo: 0,
      in_progress: 1,
      done: 2,
    };

    return (
      (order[a.status] ?? 3) -
      (order[b.status] ?? 3)
    );
  });

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold">
        Task Monitoring
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        AI-generated tasks and manager-reported progress
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total Tasks", stats.total],
          ["To Do", stats.todo],
          ["In Progress", stats.inProgress],
          ["Done", stats.done],
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
      </div>

      {stats.needsVerification > 0 && (
        <div className="mt-5 rounded-lg border border-red-800 bg-red-950/20 p-4 text-sm text-red-300">
          {stats.needsVerification} critical task(s)
          marked Done by a manager require independent
          verification.
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-300">
            <tr>
              <th className="p-4">Dialog</th>
              <th className="p-4">Manager</th>
              <th className="p-4">Player</th>
              <th className="p-4">Task</th>
              <th className="p-4">Status</th>
              <th className="p-4">Comment</th>
            </tr>
          </thead>

          <tbody>
            {sortedTasks.map((task) => (
              <tr
                key={`${task.dialogId}-${task.id}`}
                className="border-t border-slate-800 align-top"
              >
                <td className="p-4">
                  <Link
                    href={`/team-lead/${task.dialogId}`}
                    className="text-blue-400 hover:underline"
                  >
                    {task.dialogId}
                  </Link>
                </td>

                <td className="p-4">{task.manager}</td>
                <td className="p-4">{task.playerId}</td>

                <td className="min-w-64 p-4">
                  <p>{task.action}</p>

                  {task.critical && (
                    <p className="mt-2 text-xs text-red-400">
                      Critical — requires verification
                    </p>
                  )}
                </td>

                <td className="p-4">
                  <span
                    className={
                      statusColors[task.status] ??
                      "text-slate-400"
                    }
                  >
                    {statusLabels[task.status]}
                  </span>
                </td>

                <td className="min-w-48 p-4 text-slate-400">
                  {task.comment || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedTasks.length === 0 && (
          <p className="p-6 text-slate-400">
            No tasks available.
          </p>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Done means the manager reported completion,
        not independently verified execution.
      </p>
    </section>
  );
}
