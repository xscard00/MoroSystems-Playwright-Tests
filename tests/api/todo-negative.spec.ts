import { randomUUID } from 'node:crypto';
import { expect, test, type APIResponse } from '@playwright/test';

import { TodoApiClient } from '../../api/TodoApiClient';
import type { TodoTask } from '../../api/TodoTypes';

/**
 * Checks the HTTP 400 response documented for operations on unknown task IDs.
 *
 * OpenAPI v1.1.0 specifies 400, but the current backend returns 404 with a
 * particular error message. Only that confirmed mismatch is marked as an
 * expected failure. Other unexpected responses must still fail the test.
 *
 * If the backend is fixed and returns 400, the test will pass normally.
 *
 * @param response HTTP response from the Todo API.
 * @param endpoint Operation being verified (used in test diagnostics).
 * @param knownErrorMessage Current backend message for the known 404 response.
 */
async function verifyDocumentedNotFoundResponse(
  response: APIResponse,
  endpoint: string,
  knownErrorMessage: string
): Promise<void> {
  const status = response.status();
  const body = (await response.text()).trim();

  console.log(`[API] ${endpoint}: HTTP ${status} | ${body}`);

  if (status === 404 && body === knownErrorMessage) {
    console.warn(
      `[KNOWN API CONTRACT ISSUE] ${endpoint}: ` +
      `OpenAPI expects HTTP 400, backend returns HTTP ${status}.`
    );

    test.fail(
      true,
      `${endpoint}: documented HTTP 400 differs from the known HTTP 404 response.`
    );
  }

  expect(
    status,
    `${endpoint} should return HTTP 400 for an unknown task. Response: ${body}`
  ).toBe(400);
}

/**
 * Negative scenarios for the MoroSystems Todo API (OpenAPI v1.1.0).
 *
 * All requests use the baseURL defined in the Playwright API project.
 * Tests never change pre-existing tasks; the update validation test creates
 * its own task and removes it in a finally block.
 */
test.describe('MoroSystems Todo API - Negative Tests', () => {
  test('TC-API-003: Reject task without required text', async ({ request }) => {
    await test.step('POST task without text', async () => {
      // Bypass the typed client intentionally to submit an invalid payload.
      const response = await request.post('/tasks', { data: {} });

      expect(response.status()).toBe(422);
      console.log(`[API] Missing task text rejected: HTTP ${response.status()}`);
    });
  });

  test('TC-API-004: Reject invalid task update', async ({ request }) => {
    const api = new TodoApiClient(request);
    let taskId: string | undefined;

    try {
      await test.step('01 - Create a task for update validation', async () => {
        const response = await api.createTask({
          text: `Invalid update test ${randomUUID()}`,
        });

        expect(response.status()).toBe(200);

        const task: TodoTask = await response.json();
        expect(task.id).toEqual(expect.any(String));
        expect(task.id.length).toBeGreaterThan(0);

        taskId = task.id;
      });

      await test.step('02 - POST update without required text', async () => {
        // A real task ID isolates payload validation from unknown-ID errors.
        // The typed client cannot accept {}, so send the invalid body directly.
        if (!taskId) {
          throw new Error('Cannot validate update: test task ID is missing.');
        }

        const response = await request.post(
          `/tasks/${encodeURIComponent(taskId)}`,
          { data: {} }
        );

        expect(response.status()).toBe(422);
        console.log(`[API] Invalid update rejected: HTTP ${response.status()}`);
      });
    } finally {
      if (taskId) {
        const cleanup = await api.deleteTask(taskId);
        expect(cleanup.status(), 'Test task cleanup must succeed').toBe(200);
        console.log(`[API] Test task ${taskId} removed.`);
      }
    }
  });

  test('TC-API-005: Delete nonexistent task @known-issue', async ({ request }) => {
    const api = new TodoApiClient(request);
    const unknownId = `nonexistent-${randomUUID()}`;

    await test.step('DELETE unknown task ID', async () => {
      const response = await api.deleteTask(unknownId);

      await verifyDocumentedNotFoundResponse(
        response,
        'DELETE /tasks/{id}',
        'id not found, nothing to delete'
      );
    });
  });

  test('TC-API-006: Complete nonexistent task @known-issue', async ({ request }) => {
    const api = new TodoApiClient(request);
    const unknownId = `nonexistent-${randomUUID()}`;

    await test.step('POST complete unknown task ID', async () => {
      const response = await api.completeTask(unknownId);

      await verifyDocumentedNotFoundResponse(
        response,
        'POST /tasks/{id}/complete',
        'id not found, nothing to complete'
      );
    });
  });
});
