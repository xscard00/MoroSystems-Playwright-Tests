
import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

import { TodoApiClient } from '../../api/TodoApiClient';
import type { TodoTask } from '../../api/TodoTypes';

/**
 * Validates required fields of a Todo API response.
 *
 * TypeScript interfaces are checked only at compile time.
 * Runtime assertions verify actual server response data.
 */
function verifyTaskStructure(task: TodoTask): void {

  expect(task.id).toEqual(expect.any(String));
  expect(task.id.length).toBeGreaterThan(0);

  expect(task.text).toEqual(expect.any(String));
  expect(task.completed).toEqual(expect.any(Boolean));

  expect(task.createdDate).toEqual(expect.any(Number));
  expect(Number.isFinite(task.createdDate)).toBe(true);

  if (task.completedDate !== undefined) {
    expect(task.completedDate).toEqual(expect.any(Number));
  }
}

/**
 * MoroSystems Todo API integration tests.
 *
 * Each test creates and manages its own task.
 * Created tasks are deleted during cleanup.
 */
test.describe('MoroSystems Todo API', () => {

  test('TC-API-001: Task CRUD lifecycle', async ({ request }) => {

    const api = new TodoApiClient(
      request,
      process.env.TODO_API_URL ?? 'http://localhost:8080'
    );

    const originalText = `Playwright CRUD ${randomUUID()}`;
    const updatedText = `Updated ${originalText}`;

    let taskId: string | undefined;
    let taskDeleted = false;

    try {

      // STEP 1: Retrieve the initial task list.
      await test.step('01 - GET task list', async () => {

        const response = await api.getTasks();

        expect(response.status()).toBe(200);

        const tasks: TodoTask[] = await response.json();

        expect(Array.isArray(tasks)).toBe(true);

        for (const task of tasks) {
          verifyTaskStructure(task);
        }

        console.log(`[API] Initial tasks: ${tasks.length}`);
      });

      // STEP 2: Create a new task.
      await test.step('02 - POST create task', async () => {

        const response = await api.createTask({
          text: originalText,
        });

        expect(response.status()).toBe(200);

        const created: TodoTask = await response.json();

        verifyTaskStructure(created);

        taskId = created.id;

        expect(created.text).toBe(originalText);
        expect(created.completed).toBe(false);

        console.log(`[API] Created task: ${created.id}`);
      });

      // STEP 3: Verify that the task exists in the list.
      await test.step('03 - GET verify created task', async () => {

        expect(taskId).toBeDefined();

        const response = await api.getTasks();

        expect(response.status()).toBe(200);

        const tasks: TodoTask[] = await response.json();

        const created = tasks.find(task => task.id === taskId);

        expect(created).toBeDefined();
        expect(created?.text).toBe(originalText);

        console.log('[API] Created task verified.');
      });

      // STEP 4: Update the existing task.
      await test.step('04 - POST update task', async () => {

        expect(taskId).toBeDefined();

        const response = await api.updateTask(taskId!, {
          text: updatedText,
        });

        expect(response.status()).toBe(200);

        const updated: TodoTask = await response.json();

        verifyTaskStructure(updated);

        expect(updated.id).toBe(taskId);
        expect(updated.text).toBe(updatedText);
        expect(updated.completed).toBe(false);

        console.log('[API] Task updated.');
      });

      // STEP 5: Verify persisted changes.
      await test.step('05 - GET verify updated task', async () => {

        const response = await api.getTasks();

        expect(response.status()).toBe(200);

        const tasks: TodoTask[] = await response.json();

        const updated = tasks.find(task => task.id === taskId);

        expect(updated).toBeDefined();
        expect(updated?.text).toBe(updatedText);

        console.log('[API] Updated task verified.');
      });

      // STEP 6: Delete the task.
      await test.step('06 - DELETE task', async () => {

        const response = await api.deleteTask(taskId!);

        expect(response.status()).toBe(200);

        taskDeleted = true;

        console.log('[API] Task deleted.');
      });

      // STEP 7: Verify that the task no longer exists.
      await test.step('07 - GET verify deletion', async () => {

        const response = await api.getTasks();

        expect(response.status()).toBe(200);

        const tasks: TodoTask[] = await response.json();

        expect(
          tasks.some(task => task.id === taskId)
        ).toBe(false);

        console.log('[API] Task deletion verified.');
      });

    } finally {

      // Cleanup protects against abandoned test data
      // if a validation fails after task creation.
      if (taskId && !taskDeleted) {

        console.log(`[API] Cleanup task: ${taskId}`);

        const cleanupResponse = await api.deleteTask(taskId);

        console.log(
          `[API] Cleanup HTTP status: ${cleanupResponse.status()}`
        );
      }
    }
  });

  test('TC-API-002: Complete and reopen task', async ({ request }) => {

    const api = new TodoApiClient(
      request,
      process.env.TODO_API_URL ?? 'http://localhost:8080'
    );

    const taskText = `Playwright status ${randomUUID()}`;

    let taskId: string | undefined;

    try {

      await test.step('01 - Create test task', async () => {

        const response = await api.createTask({
          text: taskText,
        });

        expect(response.status()).toBe(200);

        const task: TodoTask = await response.json();

        taskId = task.id;

        verifyTaskStructure(task);
        expect(task.completed).toBe(false);
      });

      await test.step('02 - Mark task completed', async () => {

        const response = await api.completeTask(taskId!);

        expect(response.status()).toBe(200);

        const task: TodoTask = await response.json();

        verifyTaskStructure(task);

        expect(task.id).toBe(taskId);
        expect(task.completed).toBe(true);
      });

      await test.step('03 - Verify completed task list', async () => {

        const response = await api.getCompletedTasks();

        expect(response.status()).toBe(200);

        const tasks: TodoTask[] = await response.json();

        expect(Array.isArray(tasks)).toBe(true);

        const completedTask = tasks.find(
          task => task.id === taskId
        );

        expect(completedTask).toBeDefined();
        expect(completedTask?.completed).toBe(true);
      });

      await test.step('04 - Mark task incomplete', async () => {

        const response = await api.markTaskIncomplete(taskId!);

        expect(response.status()).toBe(200);

        const task: TodoTask = await response.json();

        verifyTaskStructure(task);

        expect(task.id).toBe(taskId);
        expect(task.completed).toBe(false);
      });

      await test.step('05 - Verify task is no longer completed', async () => {

        const response = await api.getCompletedTasks();

        expect(response.status()).toBe(200);

        const tasks: TodoTask[] = await response.json();

        expect(
          tasks.some(task => task.id === taskId)
        ).toBe(false);
      });

    } finally {

      if (taskId) {

        const response = await api.deleteTask(taskId);

        expect(
          response.status(),
          'Test task cleanup must succeed.'
        ).toBe(200);

        console.log(`[API] Test task ${taskId} removed.`);
      }
    }
  });
});
