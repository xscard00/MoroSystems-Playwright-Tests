/**
 * A task returned by the MoroSystems Todo API.
 *
 * Matches the Task schema in OpenAPI v1.1.0. Dates are numeric timestamps;
 * completedDate is optional because the API does not require it.
 */
export interface TodoTask {
  id: string;
  text: string;
  completed: boolean;
  createdDate: number;
  completedDate?: number;
}

/**
 * Request body for POST /tasks.
 * The OpenAPI schema marks the text property as required.
 */
export interface CreateTaskRequest {
  text: string;
}

/**
 * Request body for POST /tasks/{id}.
 * The backend uses POST to update tasks, even though the assignment says PUT.
 */
export interface UpdateTaskRequest {
  text: string;
}
