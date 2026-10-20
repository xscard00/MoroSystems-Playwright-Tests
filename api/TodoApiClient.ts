import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { CreateTaskRequest, UpdateTaskRequest } from './TodoTypes';

/**
 * Provides HTTP operations for the MoroSystems Todo API (OpenAPI v1.1.0).
 *
 * The client only builds and sends requests. Tests remain responsible for
 * checking HTTP statuses, response bodies and business rules.
 *
 * When baseUrl is omitted, Playwright resolves relative paths using the
 * baseURL configured for the API project in playwright.config.ts.
 */
export class TodoApiClient {
  /**
   * @param request Playwright API request context.
   * @param baseUrl Optional API origin; retained for existing test callers.
   */
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl?: string
  ) {}

  /**
   * Resolves an API path against an optional explicit base URL.
   * Otherwise returns the relative path for Playwright to resolve.
   *
   * @param path API path beginning with a slash.
   */
  private endpoint(path: string): string {
    return this.baseUrl ? new URL(path, this.baseUrl).toString() : path;
  }

  /**
   * Builds an endpoint for a specific task, encoding its ID safely.
   *
   * @param id Task identifier returned by the API.
   */
  private taskPath(id: string): string {
    return `/tasks/${encodeURIComponent(id)}`;
  }

  /** Retrieves all tasks (GET /tasks). */
  async getTasks(): Promise<APIResponse> {
    return this.request.get(this.endpoint('/tasks'));
  }

  /**
   * Creates a new task (POST /tasks).
   *
   * @param payload Task text submitted to the API.
   */
  async createTask(payload: CreateTaskRequest): Promise<APIResponse> {
    return this.request.post(this.endpoint('/tasks'), { data: payload });
  }

  /**
   * Updates an existing task (POST /tasks/{id}).
   * The actual backend uses POST although the assignment requests PUT.
   *
   * @param id Identifier of the task to update.
   * @param payload New task text.
   */
  async updateTask(
    id: string,
    payload: UpdateTaskRequest
  ): Promise<APIResponse> {
    return this.request.post(this.endpoint(this.taskPath(id)), {
      data: payload,
    });
  }

  /**
   * Deletes a task (DELETE /tasks/{id}).
   *
   * @param id Identifier of the task to delete.
   */
  async deleteTask(id: string): Promise<APIResponse> {
    return this.request.delete(this.endpoint(this.taskPath(id)));
  }

  /** Retrieves completed tasks (GET /tasks/completed). */
  async getCompletedTasks(): Promise<APIResponse> {
    return this.request.get(this.endpoint('/tasks/completed'));
  }

  /**
   * Marks a task as completed (POST /tasks/{id}/complete).
   *
   * @param id Identifier of the task to complete.
   */
  async completeTask(id: string): Promise<APIResponse> {
    return this.request.post(this.endpoint(`${this.taskPath(id)}/complete`));
  }

  /**
   * Marks a task as incomplete (POST /tasks/{id}/incomplete).
   *
   * @param id Identifier of the task to reopen.
   */
  async markTaskIncomplete(id: string): Promise<APIResponse> {
    return this.request.post(this.endpoint(`${this.taskPath(id)}/incomplete`));
  }
}
