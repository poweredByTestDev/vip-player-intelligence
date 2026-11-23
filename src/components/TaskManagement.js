
"use client";

import { useEffect, useState } from "react";

const statusLabels = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const statusColors = {
  todo: "text-slate-300",
  in_progress: "text-yellow-400",
  done: "text-green-400",
};

function TaskCard({
  initialTask,
  onSaved,
}) {
  const [status, setStatus] = useState(
    initialTask.status
  );

  const [comment, setComment] = useState(
    initialTask.comment
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Проверяем, есть ли несохранённые изменения
  const changed =
    status !== initialTask.status ||
    comment !== initialTask.comment;

  async function saveTask() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dialogId: initialTask.dialogId,
          taskId: initialTask.id,
          status,
          comment,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Ошибка сохранения."
        );
      }

      setMessage("Изменения сохранены.");
      onSaved(result.task);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">

      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="font-medium text-white">
          {initialTask.action}
        </p>

        <span
          className={`text-sm font-semibold ${
            statusColors[initialTask.status]
          }`}
        >
          {statusLabels[initialTask.status]}
        </span>
      </div>

      {initialTask.critical && (
        <div className="mt-4 rounded-lg border border-red-900 bg-red-950/20 p-3 text-sm text-red-300">
          Critical: действия требуют проверки.
          Статус Done не подтверждает фактическое
          выполнение самоисключения или другой
          обязательной операции.
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor={`status-${initialTask.id}`}
            className="mb-2 block text-sm text-slate-400"
          >
            Task Status
          </label>

          <select
            id={`status-${initialTask.id}`}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setMessage("");
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">
              In Progress
            </option>
            <option value="done">
              Done — Reported by Manager
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor={`comment-${initialTask.id}`}
            className="mb-2 block text-sm text-slate-400"
          >
            Manager Comment
          </label>

          <textarea
            id={`comment-${initialTask.id}`}
            value={comment}
            onChange={(event) => {
              setComment(event.target.value);
              setMessage("");
            }}
            rows={3}
            maxLength={2000}
            placeholder="Что сделано? Какой результат?"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          {initialTask.updatedAt && (
            <p className="text-xs text-slate-500">
              Last updated:{" "}
              {new Date(
                initialTask.updatedAt
              ).toLocaleString("ru-RU")}
            </p>
          )}

          {error && (
            <p className="mt-2 text-sm text-red-400">
              {error}
            </p>
          )}

          {message && (
            <p className="mt-2 text-sm text-green-400">
              {message}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={saveTask}
          disabled={!changed || saving}
          className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save Task"}
        </button>
      </div>
    </div>
  );
}

export default function TaskManagement({
  dialogId,
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadTasks() {
      setLoading(true);
      setError("");
      setTasks([]);

      try {
        const response = await fetch(
          `/api/tasks?dialogId=${encodeURIComponent(
            dialogId
          )}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Ошибка загрузки задач."
          );
        }

        if (!controller.signal.aborted) {
          setTasks(result.tasks ?? []);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadTasks();

    return () => controller.abort();
  }, [dialogId]);

  function updateLocalTask(updated) {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === updated.id
          ? updated
          : task
      )
    );
  }

  const todoCount = tasks.filter(
    (task) => task.status === "todo"
  ).length;

  const inProgressCount = tasks.filter(
    (task) => task.status === "in_progress"
  ).length;

  const doneCount = tasks.filter(
    (task) => task.status === "done"
  ).length;

  return (
    <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-bold">
        AI Task Management
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        Manage recommended actions for {dialogId}
      </p>

      {loading && (
        <p className="mt-5 text-blue-300">
          Loading tasks...
        </p>
      )}

      {error && (
        <p className="mt-5 rounded-lg border border-red-900 p-4 text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && tasks.length === 0 && (
        <p className="mt-5 text-slate-400">
          No AI tasks available.
        </p>
      )}

      {!loading && !error && tasks.length > 0 && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["To Do", todoCount],
              ["In Progress", inProgressCount],
              ["Done", doneCount],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg bg-slate-950 p-4"
              >
                <p className="text-xs text-slate-400">
                  {label}
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                initialTask={task}
                onSaved={updateLocalTask}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
