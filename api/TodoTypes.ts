
/**
 * Represents a task returned by MoroSystems Todo API.
 *
 * Based on OpenAPI specification version 1.1.0.
 */
export interface TodoTask {
  id: string;
  text: string;
  completed: boolean;
  createdDate: number;
  completedDate?: number;
}

/**
 * JSON body required to create a task.
 */
export interface CreateTaskRequest {
  text: string;
}

/**
 * JSON body required to update a task.
 *
 * The backend uses POST /tasks/{id}, not PUT.
 */
export interface UpdateTaskRequest {
  text: string;
}
