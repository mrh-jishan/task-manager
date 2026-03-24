import type { Task, TaskListResponse, TaskMutationInput } from "./tasks";
import { TASKS_PER_PAGE } from "./tasks";

interface TaskErrorPayload {
  errors?: string[];
}

export class TasksApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly errors: string[],
  ) {
    super(errors.join(", "));
  }
}

function runtimeApiBaseUrl() {
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }

  if (process.env.VITE_API_BASE_URL) {
    return process.env.VITE_API_BASE_URL;
  }

  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  return undefined;
}

export function resolveApiBaseUrl(request?: Request) {
  const configuredUrl = runtimeApiBaseUrl();
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  if (request) {
    return new URL("/api", request.url).toString().replace(/\/+$/, "");
  }

  return "http://localhost:3000/api";
}

function buildApiUrl(pathname: string, request?: Request, searchParams?: URLSearchParams) {
  const baseUrl = resolveApiBaseUrl(request);
  const url = new URL(pathname.replace(/^\//, ""), `${baseUrl}/`);

  if (searchParams) {
    url.search = searchParams.toString();
  }

  return url;
}

async function parseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : null;
}

async function apiRequest<T>(
  pathname: string,
  request?: Request,
  init: RequestInit = {},
  searchParams?: URLSearchParams,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildApiUrl(pathname, request, searchParams), {
    ...init,
    headers,
  });

  const payload = await parseJson<T & TaskErrorPayload>(response);

  if (!response.ok) {
    throw new TasksApiError(response.status, payload?.errors ?? [response.statusText || "Request failed"]);
  }

  return payload as T;
}

export async function fetchTasks(request: Request, filters: { q?: string; status?: string; page?: number }) {
  const searchParams = new URLSearchParams();

  if (filters.q) {
    searchParams.set("q", filters.q);
  }

  if (filters.status) {
    searchParams.set("status", filters.status);
  }

  searchParams.set("page", String(filters.page ?? 1));
  searchParams.set("per_page", String(TASKS_PER_PAGE));

  return apiRequest<TaskListResponse>("/tasks", request, {}, searchParams);
}

export async function createTask(request: Request, task: TaskMutationInput) {
  return apiRequest<Task>("/tasks", request, {
    method: "POST",
    body: JSON.stringify({ task }),
  });
}

export async function updateTask(request: Request, id: string, task: TaskMutationInput) {
  return apiRequest<Task>(`/tasks/${id}`, request, {
    method: "PATCH",
    body: JSON.stringify({ task }),
  });
}

export async function deleteTask(request: Request, id: string) {
  await apiRequest<null>(`/tasks/${id}`, request, {
    method: "DELETE",
  });
}
