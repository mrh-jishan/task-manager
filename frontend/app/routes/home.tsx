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
  if (value === "urgent") {
    return "bg-orange-100 text-orange-900 ring-1 ring-orange-200";
  }

  if (value === "completed") {
    return "bg-teal-100 text-teal-950 ring-1 ring-teal-200";
  }

  if (value === "high") {
    return "bg-rose-100 text-rose-900 ring-1 ring-rose-200";
  }

  if (value === "in_progress") {
    return "bg-sky-100 text-sky-900 ring-1 ring-sky-200";
  }

  if (value === "archived") {
    return "bg-slate-200 text-slate-700 ring-1 ring-slate-300";
  }

  return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200";
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
  const hasActiveFilters = Boolean(filters.q || filters.status);
  const openCount = tasks.filter((task) => task.status === "open").length;
  const inProgressCount = tasks.filter((task) => task.status === "in_progress").length;
  const completedCount = tasks.filter((task) => task.status === "completed").length;

  return (
    <main className="min-h-screen text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.09)] backdrop-blur">
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="border-b border-slate-200/70 p-5 sm:p-7 xl:border-b-0 xl:border-r">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
                    Task Manager
                  </p>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
                    Full-stack workspace
                  </span>
                </div>

                <div className="space-y-3">
                  <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                    Search, create, update, and close tasks from one compact workspace.
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                    Open-text search is always visible and goes straight to the Rails API backed by PostgreSQL full-text and trigram search.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/90 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Open</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{openCount}</p>
                    <p className="mt-1 text-sm text-slate-600">Ready for action</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/90 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">In Progress</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{inProgressCount}</p>
                    <p className="mt-1 text-sm text-slate-600">Currently moving</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/90 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Completed</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{completedCount}</p>
                    <p className="mt-1 text-sm text-slate-600">Already shipped</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[linear-gradient(135deg,_#0f172a_0%,_#155e75_100%)] p-5 text-white sm:p-7">
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
                    Snapshot
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">Current view</h2>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Visible</p>
                    <p className="mt-1 text-2xl font-semibold">{pagination.total_count}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Page</p>
                    <p className="mt-1 text-2xl font-semibold">{pagination.page}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Per Page</p>
                    <p className="mt-1 text-2xl font-semibold">{pagination.per_page}</p>
                  </div>
                </div>

                <div className="rounded-[1.4rem] border border-white/10 bg-black/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Active filter</p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {filters.q ? `"${filters.q}"` : "No search text"}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Status: {filters.status || "all"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-cyan-950/10 bg-[linear-gradient(135deg,_#082f49_0%,_#0f172a_58%,_#1f2937_100%)] p-5 text-white shadow-[0_26px_80px_rgba(8,47,73,0.32)] sm:p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-end">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Search
              </p>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">Find tasks with open-text search</h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-300">
                Search title and description with keywords, phrases, or rough spelling. This is wired directly to the backend `q` parameter.
              </p>

              <Form method="get" className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_220px_auto_auto]">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Search text
                  </span>
                  <input
                    type="search"
                    name="q"
                    defaultValue={filters.q}
                    placeholder="Search tasks, notes, tickets, customer issues, release work..."
                    className="rounded-[1.2rem] border border-cyan-400/15 bg-white/8 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-black/15"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Status
                  </span>
                  <select
                    name="status"
                    defaultValue={filters.status}
                    className="rounded-[1.2rem] border border-cyan-400/15 bg-white/8 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300 focus:bg-black/15"
                  >
                    <option value="">All statuses</option>
                    {TASK_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  className="rounded-[1.2rem] bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 lg:self-end"
                >
                  Search
                </button>

                <Link
                  to="/"
                  className={`rounded-[1.2rem] px-5 py-3 text-sm font-semibold transition lg:self-end ${
                    hasActiveFilters
                      ? "border border-white/15 bg-white/7 text-white hover:border-cyan-300/50"
                      : "pointer-events-none border border-white/8 bg-white/5 text-slate-500"
                  }`}
                >
                  Clear
                </Link>
              </Form>
            </div>

            <div className="rounded-[1.4rem] border border-white/10 bg-black/12 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Search qualities
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-300">
                <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1">Typos</span>
                <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1">Phrases</span>
                <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1">Status filter</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-200">
                <span className="rounded-full border border-white/10 bg-black/18 px-3 py-1">
                  Query: {filters.q ? `"${filters.q}"` : "none"}
                </span>
                <span className="rounded-full border border-white/10 bg-black/18 px-3 py-1">
                  Status: {filters.status || "all"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
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
                      defaultValue={actionData?.intent === "create" ? actionData.values.status : EMPTY_TASK_FORM.status}
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
                      defaultValue={actionData?.intent === "create" ? actionData.values.priority : EMPTY_TASK_FORM.priority}
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
                  <article
                    key={task.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96)_0%,_rgba(240,249,255,0.72)_100%)] p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
                  >
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
        </div>
      </div>
    </main>
  );
}
