import { Form, Link } from "react-router";

import type { Task } from "../../lib/tasks";
import { TASK_PRIORITIES, TASK_STATUSES } from "../../lib/tasks";

import { badgeClass, buildPageHref, formatDate, taskFormValue } from "./task-ui";
import type { TaskActionData, TaskFilters } from "./types";

type TaskResultsPanelProps = {
  tasks: Task[];
  pagination: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
  filters: TaskFilters;
  actionData?: TaskActionData;
};

export function TaskResultsPanel({ tasks, pagination, filters, actionData }: TaskResultsPanelProps) {
  return (
    <section className="rounded-[1.8rem] border border-white/70 bg-white/82 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.07)] backdrop-blur">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Results</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Compact result cards with inline editing and delete actions.
          </p>
        </div>
        <p className="text-sm font-medium text-slate-500">
          {pagination.total_count} matching {pagination.total_count === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/85 px-6 py-12 text-center">
            <p className="text-lg font-medium text-slate-800">No tasks match the current filters.</p>
            <p className="mt-2 text-sm text-slate-600">
              Try a broader search, clear the status filter, or create the first task for this view.
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskResultCard key={task.id} task={task} actionData={actionData} />
          ))
        )}
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Showing page {pagination.page} of {Math.max(pagination.total_pages, 1)}.
        </p>

        <div className="flex items-center gap-3">
          <Link
            prefetch="intent"
            to={buildPageHref(filters.q, filters.status, Math.max(pagination.page - 1, 1))}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              pagination.page <= 1
                ? "pointer-events-none bg-slate-100 text-slate-400"
                : "bg-slate-950 text-white hover:bg-cyan-900"
            }`}
          >
            Previous
          </Link>
          <Link
            prefetch="intent"
            to={buildPageHref(filters.q, filters.status, Math.min(pagination.page + 1, Math.max(pagination.total_pages, 1)))}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              pagination.page >= pagination.total_pages
                ? "pointer-events-none bg-slate-100 text-slate-400"
                : "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </section>
  );
}

function TaskResultCard({ task, actionData }: { task: Task; actionData?: TaskActionData }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96)_0%,_rgba(240,249,255,0.72)_100%)] p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-950">{task.title}</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${badgeClass(task.status)}`}>
              {task.status.replace("_", " ")}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${badgeClass(task.priority)}`}>
              {task.priority}
            </span>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            {task.description || "No description provided."}
          </p>

          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.16em] text-slate-500">
            <span>Due {formatDate(task.due_at)}</span>
            <span>Updated {formatDate(task.updated_at)}</span>
          </div>
        </div>

        <Form method="post">
          <input type="hidden" name="intent" value="delete" />
          <input type="hidden" name="id" value={task.id} />
          <button
            type="submit"
            className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
          >
            Delete
          </button>
        </Form>
      </div>

      <details
        className="mt-4 rounded-[1.4rem] border border-slate-200 bg-white/95"
        open={actionData?.intent === "update" && actionData.taskId === String(task.id)}
      >
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-slate-900">
          Edit task
        </summary>

        <div className="border-t border-slate-200 px-5 py-5">
          {actionData?.intent === "update" && actionData.taskId === String(task.id) && actionData.errors.length > 0 ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {actionData.errors.join(" ")}
            </div>
          ) : null}

          <Form method="post" className="grid gap-4">
            <input type="hidden" name="intent" value="update" />
            <input type="hidden" name="id" value={task.id} />

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Title</span>
              <input
                name="title"
                defaultValue={taskFormValue(actionData, task, "title")}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <textarea
                name="description"
                rows={3}
                defaultValue={taskFormValue(actionData, task, "description")}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <select
                  name="status"
                  defaultValue={taskFormValue(actionData, task, "status")}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Priority</span>
                <select
                  name="priority"
                  defaultValue={taskFormValue(actionData, task, "priority")}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
                >
                  {TASK_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Due At</span>
                <input
                  type="datetime-local"
                  name="due_at"
                  defaultValue={taskFormValue(actionData, task, "due_at")}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
                />
              </label>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-cyan-900"
            >
              Save Changes
            </button>
          </Form>
        </div>
      </details>
    </article>
  );
}
