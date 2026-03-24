import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router";

import type { Route } from "./+types/home";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskMutationInput,
} from "../lib/tasks";

type TaskField = keyof TaskMutationInput;

type TaskActionData = {
  intent: "create" | "update" | "delete";
  taskId?: string;
  errors: string[];
  values: TaskMutationInput;
};

const EMPTY_TASK_FORM: TaskMutationInput = {
  title: "",
  description: "",
  status: "open",
  priority: "medium",
  due_at: "",
};

function normalizeTaskFormData(formData: FormData): TaskMutationInput {
  return {
    title: formData.get("title")?.toString().trim() ?? "",
    description: formData.get("description")?.toString().trim() ?? "",
    status: formData.get("status")?.toString() ?? EMPTY_TASK_FORM.status,
    priority: formData.get("priority")?.toString() ?? EMPTY_TASK_FORM.priority,
    due_at: formData.get("due_at")?.toString() ?? "",
  };
}

function validateTask(values: TaskMutationInput) {
  const errors: string[] = [];

  if (!values.title) {
    errors.push("Title is required.");
  }

  if (!TASK_STATUSES.includes(values.status as (typeof TASK_STATUSES)[number])) {
    errors.push("Status is invalid.");
  }

  if (!TASK_PRIORITIES.includes(values.priority as (typeof TASK_PRIORITIES)[number])) {
    errors.push("Priority is invalid.");
  }

  return errors;
}

function buildTaskPayload(values: TaskMutationInput) {
  return {
    ...values,
    due_at: values.due_at || "",
  };
}

function redirectToCurrentPage(request: Request) {
  const url = new URL(request.url);
  return redirect(`${url.pathname}${url.search}`);
}

function extractApiErrors(error: unknown) {
  if (typeof error === "object" && error && "errors" in error && Array.isArray(error.errors)) {
    return error.errors as string[];
  }

  return ["Something went wrong while saving your task."];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { fetchTasks } = await import("../lib/tasks-api.server");
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const page = Math.max(Number(url.searchParams.get("page") ?? "1") || 1, 1);
  const result = await fetchTasks(request, { q, status, page });

  return {
    tasks: result.data,
    pagination: result.pagination,
    filters: {
      q,
      status,
      page,
    },
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { createTask, deleteTask, updateTask } = await import("../lib/tasks-api.server");
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();
  const values = normalizeTaskFormData(formData);

  if (intent === "delete") {
    const id = formData.get("id")?.toString();

    if (!id) {
      return {
        intent: "delete",
        errors: ["Task id is required for deletion."],
        values,
      } satisfies TaskActionData;
    }

    await deleteTask(request, id);
    return redirectToCurrentPage(request);
  }

  if (intent === "create" || intent === "update") {
    const errors = validateTask(values);
    if (errors.length > 0) {
      return {
        intent,
        taskId: formData.get("id")?.toString(),
        errors,
        values,
      } satisfies TaskActionData;
    }

    try {
      const payload = buildTaskPayload(values);

      if (intent === "create") {
        await createTask(request, payload);
      } else {
        const id = formData.get("id")?.toString();
        if (!id) {
          return {
            intent,
            errors: ["Task id is required for updates."],
            values,
          } satisfies TaskActionData;
        }

        await updateTask(request, id, payload);
      }
    } catch (error) {
      return {
        intent,
        taskId: formData.get("id")?.toString(),
        errors: extractApiErrors(error),
        values,
      } satisfies TaskActionData;
    }

    return redirectToCurrentPage(request);
  }

  return {
    intent: "create",
    errors: ["Unknown task action."],
    values,
  } satisfies TaskActionData;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Task Manager" },
    {
      name: "description",
      content: "Create, search, update, and complete tasks from a lightweight full-stack task manager.",
    },
  ];
}

function formatDate(value: string | null) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildPageHref(q: string, status: string, page: number) {
  const searchParams = new URLSearchParams();

  if (q) {
    searchParams.set("q", q);
  }

  if (status) {
    searchParams.set("status", status);
  }

  searchParams.set("page", String(page));

  return `/?${searchParams.toString()}`;
}

function badgeClass(value: string) {
  if (value === "urgent" || value === "completed") {
    return "bg-emerald-100 text-emerald-900";
  }

  if (value === "high" || value === "in_progress") {
    return "bg-amber-100 text-amber-900";
  }

  if (value === "archived") {
    return "bg-stone-200 text-stone-700";
  }

  return "bg-sky-100 text-sky-900";
}

function taskFormValue(actionData: TaskActionData | undefined, task: Task, field: TaskField) {
  if (actionData?.intent === "update" && actionData.taskId === String(task.id)) {
    return actionData.values[field];
  }

  if (field === "description") {
    return task.description ?? "";
  }

  if (field === "due_at") {
    return task.due_at ? task.due_at.slice(0, 16) : "";
  }

  return String(task[field as keyof Task] ?? "");
}

export default function Home() {
  const { tasks, pagination, filters } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>() as TaskActionData | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(180deg,_#fffdf7_0%,_#f5efe3_100%)] text-stone-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-6 rounded-[2rem] border border-stone-200/80 bg-white/90 p-6 shadow-[0_24px_80px_rgba(120,53,15,0.12)] lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-700">
              Task Manager
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
              Create, search, update, and close tasks from one React Router screen.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
              This UI is backed by the Rails API and PostgreSQL search. Search is typo-tolerant,
              results are paginated, and every change flows through React Router loaders and actions.
            </p>
          </div>

          <div className="grid gap-3 rounded-[1.5rem] bg-stone-950 p-5 text-stone-50">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-stone-400">Visible Tasks</p>
              <p className="mt-2 text-4xl font-semibold">{pagination.total_count}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-stone-900 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Page</p>
                <p className="mt-2 text-2xl font-semibold">{pagination.page}</p>
              </div>
              <div className="rounded-2xl bg-stone-900 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Per Page</p>
                <p className="mt-2 text-2xl font-semibold">{pagination.per_page}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-6 shadow-[0_18px_60px_rgba(120,53,15,0.08)]">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold text-stone-950">Create Task</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Add a task, note, or ticket. The backend validates and stores everything in PostgreSQL.
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
                <span className="text-sm font-medium text-stone-700">Title</span>
                <input
                  name="title"
                  defaultValue={actionData?.intent === "create" ? actionData.values.title : ""}
                  placeholder="Prepare incident review"
                  className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-stone-700">Description</span>
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={actionData?.intent === "create" ? actionData.values.description : ""}
                  placeholder="Capture context, next steps, and ownership."
                  className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-stone-700">Status</span>
                  <select
                    name="status"
                    defaultValue={actionData?.intent === "create" ? actionData.values.status : EMPTY_TASK_FORM.status}
                    className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                  >
                    {TASK_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-stone-700">Priority</span>
                  <select
                    name="priority"
                    defaultValue={actionData?.intent === "create" ? actionData.values.priority : EMPTY_TASK_FORM.priority}
                    className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
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
                <span className="text-sm font-medium text-stone-700">Due At</span>
                <input
                  type="datetime-local"
                  name="due_at"
                  defaultValue={actionData?.intent === "create" ? actionData.values.due_at : ""}
                  className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </label>

              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Create Task"}
              </button>
            </Form>
          </section>

          <section className="rounded-[2rem] border border-stone-200/80 bg-white/90 p-6 shadow-[0_18px_60px_rgba(120,53,15,0.08)]">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-stone-950">Search & Manage</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Search by keywords, phrases, or typos. Results come from PostgreSQL full-text and trigram search.
                </p>
              </div>

              <Form method="get" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px_auto]">
                <input
                  type="search"
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Search tasks, notes, or tickets"
                  className="rounded-full border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                />
                <select
                  name="status"
                  defaultValue={filters.status}
                  className="rounded-full border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                >
                  <option value="">All statuses</option>
                  {TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-400"
                >
                  Search
                </button>
              </Form>
            </div>

            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center">
                  <p className="text-lg font-medium text-stone-800">No tasks match the current filters.</p>
                  <p className="mt-2 text-sm text-stone-600">
                    Try a broader search, clear the status filter, or create the first task for this view.
                  </p>
                </div>
              ) : (
                tasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-[1.6rem] border border-stone-200 bg-stone-50/70 p-5 shadow-[0_10px_32px_rgba(28,25,23,0.06)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold text-stone-950">{task.title}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${badgeClass(task.status)}`}>
                            {task.status.replace("_", " ")}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${badgeClass(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>

                        <p className="max-w-2xl text-sm leading-6 text-stone-600">
                          {task.description || "No description provided."}
                        </p>

                        <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.16em] text-stone-500">
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
                      className="mt-5 rounded-[1.4rem] border border-stone-200 bg-white"
                      open={actionData?.intent === "update" && actionData.taskId === String(task.id)}
                    >
                      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-stone-900">
                        Edit task
                      </summary>

                      <div className="border-t border-stone-200 px-5 py-5">
                        {actionData?.intent === "update" && actionData.taskId === String(task.id) && actionData.errors.length > 0 ? (
                          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                            {actionData.errors.join(" ")}
                          </div>
                        ) : null}

                        <Form method="post" className="grid gap-4">
                          <input type="hidden" name="intent" value="update" />
                          <input type="hidden" name="id" value={task.id} />

                          <label className="grid gap-2">
                            <span className="text-sm font-medium text-stone-700">Title</span>
                            <input
                              name="title"
                              defaultValue={taskFormValue(actionData, task, "title")}
                              className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                            />
                          </label>

                          <label className="grid gap-2">
                            <span className="text-sm font-medium text-stone-700">Description</span>
                            <textarea
                              name="description"
                              rows={3}
                              defaultValue={taskFormValue(actionData, task, "description")}
                              className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                            />
                          </label>

                          <div className="grid gap-4 sm:grid-cols-3">
                            <label className="grid gap-2">
                              <span className="text-sm font-medium text-stone-700">Status</span>
                              <select
                                name="status"
                                defaultValue={taskFormValue(actionData, task, "status")}
                                className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                              >
                                {TASK_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {status.replace("_", " ")}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="grid gap-2">
                              <span className="text-sm font-medium text-stone-700">Priority</span>
                              <select
                                name="priority"
                                defaultValue={taskFormValue(actionData, task, "priority")}
                                className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                              >
                                {TASK_PRIORITIES.map((priority) => (
                                  <option key={priority} value={priority}>
                                    {priority}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="grid gap-2">
                              <span className="text-sm font-medium text-stone-700">Due At</span>
                              <input
                                type="datetime-local"
                                name="due_at"
                                defaultValue={taskFormValue(actionData, task, "due_at")}
                                className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                              />
                            </label>
                          </div>

                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
                          >
                            Save Changes
                          </button>
                        </Form>
                      </div>
                    </details>
                  </article>
                ))
              )}
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-stone-600">
                Showing page {pagination.page} of {Math.max(pagination.total_pages, 1)}.
              </p>

              <div className="flex items-center gap-3">
                <Link
                  prefetch="intent"
                  to={buildPageHref(filters.q, filters.status, Math.max(pagination.page - 1, 1))}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    pagination.page <= 1
                      ? "pointer-events-none bg-stone-100 text-stone-400"
                      : "bg-stone-950 text-white hover:bg-stone-800"
                  }`}
                >
                  Previous
                </Link>
                <Link
                  prefetch="intent"
                  to={buildPageHref(filters.q, filters.status, Math.min(pagination.page + 1, Math.max(pagination.total_pages, 1)))}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    pagination.page >= pagination.total_pages
                      ? "pointer-events-none bg-stone-100 text-stone-400"
                      : "bg-amber-500 text-stone-950 hover:bg-amber-400"
                  }`}
                >
                  Next
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
