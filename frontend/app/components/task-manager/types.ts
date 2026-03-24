import type { TaskMutationInput } from "../../lib/tasks";

export type TaskField = keyof TaskMutationInput;

export type TaskActionData = {
  intent: "create" | "update" | "delete";
  taskId?: string;
  errors: string[];
  values: TaskMutationInput;
};

export type TaskFilters = {
  q: string;
  status: string;
  page: number;
};
