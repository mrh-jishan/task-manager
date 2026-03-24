export const TASK_STATUSES = ["open", "in_progress", "completed", "archived"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const TASKS_PER_PAGE = 6;
export const TASK_TITLE_MAX_LENGTH = 255;
export const TASK_DESCRIPTION_MAX_LENGTH = 10_000;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  data: Task[];
  pagination: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
}

export interface TaskMutationInput {
  title: string;
  description: string;
  status: string;
  priority: string;
  due_at: string;
}

export function validateTaskInput(values: TaskMutationInput) {
  const errors: string[] = [];
  const normalizedTitle = values.title.trim();
  const normalizedDescription = values.description.trim();

  if (!normalizedTitle) {
    errors.push("Title is required.");
  }

  if (normalizedTitle.length > TASK_TITLE_MAX_LENGTH) {
    errors.push(`Title must be ${TASK_TITLE_MAX_LENGTH} characters or fewer.`);
  }

  if (normalizedDescription.length > TASK_DESCRIPTION_MAX_LENGTH) {
    errors.push(`Description must be ${TASK_DESCRIPTION_MAX_LENGTH} characters or fewer.`);
  }

  if (!TASK_STATUSES.includes(values.status as TaskStatus)) {
    errors.push("Status is invalid.");
  }

  if (!TASK_PRIORITIES.includes(values.priority as TaskPriority)) {
    errors.push("Priority is invalid.");
  }

  return errors;
}
