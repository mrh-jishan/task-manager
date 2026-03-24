import type { Task } from "../../lib/tasks";

import type { TaskActionData, TaskField } from "./types";

export function formatDate(value: string | null) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function buildPageHref(q: string, status: string, page: number) {
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

export function badgeClass(value: string) {
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

export function taskFormValue(actionData: TaskActionData | undefined, task: Task, field: TaskField) {
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
