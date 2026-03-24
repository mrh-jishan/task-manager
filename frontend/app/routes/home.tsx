import { redirect, useActionData, useLoaderData, useNavigation } from "react-router";

import { TaskHero } from "../components/task-manager/TaskHero";
import { TaskResultsPanel } from "../components/task-manager/TaskResultsPanel";
import { TaskSearchPanel } from "../components/task-manager/TaskSearchPanel";
import { TaskSidebar } from "../components/task-manager/TaskSidebar";
import type { TaskActionData } from "../components/task-manager/types";
import { TASK_PRIORITIES, TASK_STATUSES, type TaskMutationInput } from "../lib/tasks";
import type { Route } from "./+types/home";

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
        <TaskHero
          openCount={openCount}
          inProgressCount={inProgressCount}
          completedCount={completedCount}
          totalCount={pagination.total_count}
          page={pagination.page}
          perPage={pagination.per_page}
          query={filters.q}
          status={filters.status}
        />

        <TaskSearchPanel
          q={filters.q}
          status={filters.status}
          hasActiveFilters={hasActiveFilters}
        />

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <TaskSidebar
            actionData={actionData}
            emptyTaskForm={EMPTY_TASK_FORM}
            isSubmitting={isSubmitting}
          />

          <TaskResultsPanel
            tasks={tasks}
            pagination={pagination}
            filters={filters}
            actionData={actionData}
          />
        </div>
      </div>
    </main>
  );
}
