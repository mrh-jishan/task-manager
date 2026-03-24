import { Form } from "react-router";

import { TASK_PRIORITIES, TASK_STATUSES, type TaskMutationInput } from "../../lib/tasks";

import type { TaskActionData } from "./types";

type TaskSidebarProps = {
  actionData?: TaskActionData;
  emptyTaskForm: TaskMutationInput;
  isSubmitting: boolean;
};

export function TaskSidebar({ actionData, emptyTaskForm, isSubmitting }: TaskSidebarProps) {
  return (
    <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
      <section className="rounded-[1.8rem] border border-white/70 bg-white/82 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.07)] backdrop-blur">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-950">Create Task</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Add a task, note, or ticket directly into the backend.
          </p>
        </div>

        {actionData?.intent === "create" && actionData.errors.length > 0 ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {actionData.errors.join(" ")}
          </div>
        ) : null}

        <Form method="post" className="grid gap-4">
          <input type="hidden" name="intent" value="create" />

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Title</span>
            <input
              name="title"
              defaultValue={actionData?.intent === "create" ? actionData.values.title : ""}
              placeholder="Prepare incident review"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Description</span>
            <textarea
              name="description"
              rows={3}
              defaultValue={actionData?.intent === "create" ? actionData.values.description : ""}
              placeholder="Capture context, next steps, and ownership."
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                name="status"
                defaultValue={actionData?.intent === "create" ? actionData.values.status : emptyTaskForm.status}
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
                defaultValue={actionData?.intent === "create" ? actionData.values.priority : emptyTaskForm.priority}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Due At</span>
            <input
              type="datetime-local"
              name="due_at"
              defaultValue={actionData?.intent === "create" ? actionData.values.due_at : ""}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <button
            type="submit"
            className="mt-2 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-cyan-900 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Create Task"}
          </button>
        </Form>
      </section>

      <section className="rounded-[1.8rem] border border-white/70 bg-white/82 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.07)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
          Workflow
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">How this board behaves</h2>
        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <p>Search stays visible at the top so filtering never hides your next action.</p>
          <p>The creation form stays pinned on large screens while you scan and edit results.</p>
          <p>Results stay in the wider column so task details and inline updates have room to breathe.</p>
        </div>
      </section>
    </div>
  );
}
