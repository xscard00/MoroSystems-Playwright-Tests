import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

import { TodoApiClient } from '../../api/TodoApiClient';
import type { TodoTask } from '../../api/TodoTypes';

/**
 * Validates the required properties of a task returned by the API.
 *
 * TypeScript interfaces do not validate JSON at runtime, so these assertions
 * check that the server actually returns the documented data types.
 *
 * @param task Task received from the Todo API.
 */
function verifyTaskStructure(task: TodoTask): void {
  expect(task, 'Task response must be an object').toBeTruthy();
  expect(task.id).toEqual(expect.any(String));
  expect(task.id.length).toBeGreaterThan(0);
  expect(task.text).toEqual(expect.any(String));
  expect(task.completed).toEqual(expect.any(Boolean));
  expect(task.createdDate).toEqual(expect.any(Number));
  expect(Number.isFinite(task.createdDate)).toBe(true);

  if (task.completedDate !== undefined) {
    expect(task.completedDate).toEqual(expect.any(Number));
    expect(Number.isFinite(task.completedDate)).toBe(true);
  }
}

/**
 * Removes a task created by a test and verifies that cleanup succeeded.
 *
 * @param api Todo API client configured for the current test environment.
 * @param taskId Identifier of the test-owned task.
 */
async function cleanupTask(api: TodoApiClient, taskId: string): Promise<void> {
  const response = await api.deleteTask(taskId);
  expect(response.status(), `Cleanup failed for task ${taskId}`).toBe(200);
  console.log(`[API] Test task ${taskId} removed.`);
}

/**
 * Integration tests for the MoroSystems Todo API (OpenAPI v1.1.0).
 *
 * Each scenario creates unique task data. All API requests use Playwright's
 * baseURL, and every created task is removed after the scenario finishes.
 */
test.describe('MoroSystems Todo API', () => {
  test('TC-API-001: Task CRUD lifecycle', async ({ request }) => {
    const api = new TodoApiClient(request);
    const originalText = `Playwright CRUD ${randomUUID()}`;
    const updatedText = `Updated ${originalText}`;

    let taskId: string | undefined;
    let taskDeleted = false;

    try {
      await test.step('01 - GET task list', async () => {
        const response = await api.getTasks();
        expect(response.status()).toBe(200);

        const tasks: TodoTask[] = await response.json();
        expect(Array.isArray(tasks)).toBe(true);
        tasks.forEach(verifyTaskStructure);

        console.log(`[API] Initial tasks: ${tasks.length}`);
      });

      const created = await test.step('02 - POST create task', async () => {
        const response = await api.createTask({ text: originalText });
        expect(response.status()).toBe(200);

        const task: TodoTask = await response.json();
        // Remember the ID before the assertions so finally can clean up.
        if (typeof task?.id === 'string' && task.id.length > 0) {
          taskId = task.id;
        }

        verifyTaskStructure(task);
        expect(task.text).toBe(originalText);
        expect(task.completed).toBe(false);

        console.log(`[API] Created task: ${task.id}`);
        return task;
      });

      await test.step('03 - GET verify created task', async () => {
        const response = await api.getTasks();
        expect(response.status()).toBe(200);

        const tasks: TodoTask[] = await response.json();
        expect(Array.isArray(tasks)).toBe(true);

        const found = tasks.find(task => task.id === created.id);
        expect(found, 'Created task must appear in the task list').toBeDefined();
        expect(found?.text).toBe(originalText);

        console.log('[API] Created task verified.');
      });

      await test.step('04 - POST update task', async () => {
        // This backend implements updates with POST, not the PUT from the task.
        const response = await api.updateTask(created.id, {
          text: updatedText,
        });
        expect(response.status()).toBe(200);

        const updated: TodoTask = await response.json();
        verifyTaskStructure(updated);
        expect(updated.id).toBe(created.id);
        expect(updated.text).toBe(updatedText);
        expect(updated.completed).toBe(false);

        console.log('[API] Task updated.');
      });

      await test.step('05 - GET verify updated task', async () => {
        const response = await api.getTasks();
        expect(response.status()).toBe(200);

        const tasks: TodoTask[] = await response.json();
        expect(Array.isArray(tasks)).toBe(true);

        const found = tasks.find(task => task.id === created.id);
        expect(found, 'Updated task must remain in the task list').toBeDefined();
        expect(found?.text).toBe(updatedText);

        console.log('[API] Updated task verified.');
      });

      await test.step('06 - DELETE task', async () => {
        const response = await api.deleteTask(created.id);
        expect(response.status()).toBe(200);
        taskDeleted = true;

        console.log('[API] Task deleted.');
      });

      await test.step('07 - GET verify deletion', async () => {
        const response = await api.getTasks();
        expect(response.status()).toBe(200);

        const tasks: TodoTask[] = await response.json();
        expect(Array.isArray(tasks)).toBe(true);
        expect(tasks.some(task => task.id === created.id)).toBe(false);

        console.log('[API] Task deletion verified.');
      });
    } finally {
      // Prevent test data from remaining after a failed assertion.
      if (taskId && !taskDeleted) {
        await cleanupTask(api, taskId);
      }
    }
  });

  test('TC-API-002: Complete and reopen task', async ({ request }) => {
    const api = new TodoApiClient(request);
    const taskText = `Playwright status ${randomUUID()}`;
    let taskId: string | undefined;

    try {
      const created = await test.step('01 - Create test task', async () => {
        const response = await api.createTask({ text: taskText });
        expect(response.status()).toBe(200);

        const task: TodoTask = await response.json();
        // Save the ID before validation to enable cleanup on assertion failure.
        if (typeof task?.id === 'string' && task.id.length > 0) {
          taskId = task.id;
        }

        verifyTaskStructure(task);
        expect(task.text).toBe(taskText);
        expect(task.completed).toBe(false);
        return task;
      });

      await test.step('02 - Mark task completed', async () => {
        const response = await api.completeTask(created.id);
        expect(response.status()).toBe(200);

        const task: TodoTask = await response.json();
        verifyTaskStructure(task);
        expect(task.id).toBe(created.id);
        expect(task.completed).toBe(true);
      });

      await test.step('03 - Verify completed task list', async () => {
        const response = await api.getCompletedTasks();
        expect(response.status()).toBe(200);

        const tasks: TodoTask[] = await response.json();
        expect(Array.isArray(tasks)).toBe(true);

        const found = tasks.find(task => task.id === created.id);
        expect(found, 'Completed task must appear in the completed list').toBeDefined();
        expect(found?.completed).toBe(true);
      });

      await test.step('04 - Mark task incomplete', async () => {
        const response = await api.markTaskIncomplete(created.id);
        expect(response.status()).toBe(200);

        const task: TodoTask = await response.json();
        verifyTaskStructure(task);
        expect(task.id).toBe(created.id);
        expect(task.completed).toBe(false);
      });

      await test.step('05 - Verify task is no longer completed', async () => {
        const response = await api.getCompletedTasks();
        expect(response.status()).toBe(200);

        const tasks: TodoTask[] = await response.json();
        expect(Array.isArray(tasks)).toBe(true);
        expect(tasks.some(task => task.id === created.id)).toBe(false);
      });
    } finally {
      if (taskId) {
        await cleanupTask(api, taskId);
      }
    }
  });
});
