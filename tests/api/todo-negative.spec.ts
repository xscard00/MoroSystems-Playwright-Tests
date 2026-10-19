
import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

import { TodoApiClient } from '../../api/TodoApiClient';

/**
 * Negative tests for MoroSystems Todo API.
 *
 * Verifies server-side validation and expected
 * error responses based on OpenAPI specification 1.1.0.
 *
 * These tests do not modify existing tasks.
 */
test.describe('MoroSystems Todo API - Negative Tests', () => {

  const baseUrl = process.env.TODO_API_URL ??
    'http://localhost:8080';

  test('TC-API-003: Reject task without required text', async ({
    request,
  }) => {

    await test.step('POST task without text', async () => {

      const response = await request.post(
        `${baseUrl}/tasks`,
        {
          data: {},
        }
      );

      expect(response.status()).toBe(422);

      console.log(
        `[API] Missing text rejected: HTTP ${response.status()}`
      );
    });
  });

  test('TC-API-004: Reject invalid task update', async ({
    request,
  }) => {

    const api = new TodoApiClient(request);

    // Use an unknown ID to avoid modifying real tasks.
    const taskId = `nonexistent-${randomUUID()}`;

    await test.step('POST invalid update payload', async () => {

      const response = await request.post(
        `${baseUrl}/tasks/${encodeURIComponent(taskId)}`,
        {
          data: {},
        }
      );

      expect(response.status()).toBe(422);

      console.log(
        `[API] Invalid update rejected: HTTP ${response.status()}`
      );
    });

  });

  test('TC-API-005: Delete nonexistent task  @known-issue', async ({
    request,
  }) => {

      test.fail(
    true,
    'Known API contract mismatch: ' +
    'OpenAPI expects HTTP 400, backend returns HTTP 404.'
  );

    const api = new TodoApiClient(request);

    const taskId = `nonexistent-${randomUUID()}`;

    await test.step('DELETE unknown task ID', async () => {

      const response = await api.deleteTask(taskId);

      
    const responseBody = await response.text();

    console.log(
        `[API] Status: ${response.status()}`
    );

    console.log(
        `[API] Response body: ${responseBody}`
    );

    console.warn(
        '[KNOWN API CONTRACT ISSUE] ' +
        'TC-API-005 | DELETE /tasks/{id} | ' +
        `Expected: HTTP 400 | Actual: HTTP ${response.status()} | ` +
        `Response: ${responseBody}`
    );

    // Expected status according to OpenAPI v1.1.0.
    expect(
        response.status(),
        `API contract mismatch. Response body: ${responseBody}`
    ).toBe(400);


      console.log(
        `[API] Unknown task deletion rejected: HTTP ${response.status()}`
      );
    });
  });

  test('TC-API-006: Complete nonexistent task  @known-issue', async ({
    request,
  }) => {

    test.fail(
  true,
  'Known API contract mismatch: ' +
  'OpenAPI expects HTTP 400, backend returns HTTP 404.'
);

    const api = new TodoApiClient(request);

    const taskId = `nonexistent-${randomUUID()}`;

    await test.step('Complete unknown task ID', async () => {

      const response = await api.completeTask(taskId);

      
      const responseBody = await response.text();

        console.log(
            `[API] Status: ${response.status()}`
        );

    console.log(
        `[API] Response body: ${responseBody}`
    );

    console.warn(
        '[KNOWN API CONTRACT ISSUE] ' +
        'TC-API-006 | POST /tasks/{id}/complete | ' +
        `Expected: HTTP 400 | Actual: HTTP ${response.status()} | ` +
        `Response: ${responseBody}`
    );

    // Expected status according to OpenAPI v1.1.0.
    expect(
    response.status(),
        `API contract mismatch. Response body: ${responseBody}`
    ).toBe(400);


      console.log(
        `[API] Unknown task completion rejected: HTTP ${response.status()}`
      );
    });
  });

});
