
import type {
  APIRequestContext,
  APIResponse,
} from '@playwright/test';

import type {
  CreateTaskRequest,
  UpdateTaskRequest,
} from './TodoTypes';

/**
 * HTTP client for MoroSystems Todo API.
 *
 * Encapsulates API endpoints and request payloads.
 * Response validation is handled by the test layer.
 *
 * Based on OpenAPI specification version 1.1.0.
 */
export class TodoApiClient {

  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string = 'http://localhost:8080'
  ) {}

  /**
   * Builds an absolute API URL.
   */
  private endpoint(path: string): string {
    return `${this.baseUrl.replace(/\/$/, '')}${path}`;
  }

  /**
   * GET /tasks
   *
   * Retrieves all tasks.
   */
  async getTasks(): Promise<APIResponse> {

    return this.request.get(
      this.endpoint('/tasks')
    );
  }

  /**
   * POST /tasks
   *
   * Creates a task with the specified text.
   */
  async createTask(
    payload: CreateTaskRequest
  ): Promise<APIResponse> {

    return this.request.post(
      this.endpoint('/tasks'),
      { data: payload }
    );
  }

  /**
   * POST /tasks/{id}
   *
   * Updates the text of an existing task.
   *
   * NOTE:
   * The backend specification defines POST,
   * even though the original assignment mentions PUT.
   */
  async updateTask(
    id: string,
    payload: UpdateTaskRequest
  ): Promise<APIResponse> {

    return this.request.post(
      this.endpoint(`/tasks/${encodeURIComponent(id)}`),
      { data: payload }
    );
  }

  /**
   * DELETE /tasks/{id}
   *
   * Deletes a task by its ID.
   */
  async deleteTask(id: string): Promise<APIResponse> {

    return this.request.delete(
      this.endpoint(`/tasks/${encodeURIComponent(id)}`)
    );
  }

  /**
   * GET /tasks/completed
   *
   * Retrieves all completed tasks.
   */
  async getCompletedTasks(): Promise<APIResponse> {

    return this.request.get(
      this.endpoint('/tasks/completed')
    );
  }

  /**
   * POST /tasks/{id}/complete
   *
   * Marks a task as completed.
   */
  async completeTask(id: string): Promise<APIResponse> {

    return this.request.post(
      this.endpoint(
        `/tasks/${encodeURIComponent(id)}/complete`
      )
    );
  }

  /**
   * POST /tasks/{id}/incomplete
   *
   * Marks a task as incomplete.
   */
  async markTaskIncomplete(id: string): Promise<APIResponse> {

    return this.request.post(
      this.endpoint(
        `/tasks/${encodeURIComponent(id)}/incomplete`
      )
    );
  }
}
