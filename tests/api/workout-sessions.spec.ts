import { test, expect } from '../../fixtures';
import { WorkoutSession, User, WorkoutEntryRequest } from '../../utils/api-client';
import { exercise, session, uniqueUsername, TEST_PASSWORD } from '../../utils/test-data';

test.describe('Workout Sessions API', () => {
  test.describe('GET /api/workout-sessions', () => {
    // TC-011
    test('returns empty array for a new user', async ({ authenticatedApi }) => {
      const res = await authenticatedApi.getSessions();

      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual([]);
    });

    // TC-012
    test('returns 401 without a token', async ({ api }) => {
      const res = await api.getSessions();
      expect(res.status()).toBe(401);
    });

    // TC-013
    test('returns sessions after creating one', async ({ authenticatedApi }) => {
      await authenticatedApi.createSession([exercise('BENCH_PRESS')]);
      const res = await authenticatedApi.getSessions();

      expect(res.status()).toBe(200);
      const sessions = await res.json();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].exercises[0].exerciseType).toBe('BENCH_PRESS');
    });
  });

  test.describe('POST /api/workout-sessions', () => {
    // TC-014
    test('creates a session with one exercise', async ({ authenticatedApi }) => {
      const res = await authenticatedApi.createSession([exercise('DEADLIFT', { sets: 5, reps: 3, weight: 120 })]);

      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body).toMatchObject({
        id: expect.any(String),
        createdAt: expect.any(String),
        exercises: [
          {
            exerciseType: 'DEADLIFT',
            sets: 5,
            reps: 3,
            weight: 120,
            position: 1,
          },
        ],
      });
    });

    // TC-015
    test('creates a session with multiple exercises', async ({ authenticatedApi }) => {
      const exercises = [
        exercise('BENCH_PRESS'),
        exercise('BACK_SQUAT', { sets: 4, reps: 8, weight: 100 }),
        exercise('DEADLIFT', { sets: 3, reps: 5, weight: 140 }),
      ];
      const res = await authenticatedApi.createSession(exercises);

      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.exercises).toHaveLength(3);
      expect(body.exercises.map((e: { exerciseType: string }) => e.exerciseType)).toEqual([
        'BENCH_PRESS',
        'BACK_SQUAT',
        'DEADLIFT',
      ]);
    });

    // TC-016
    test('returns 400 for an invalid exercise type', async ({ authenticatedApi }) => {
      const res = await authenticatedApi.createSession([
        { exerciseType: 'INVALID_EXERCISE' as never, sets: 3, reps: 10, weight: 80 },
      ]);
      expect(res.status()).toBe(400);
    });

    // TC-017
    test('returns 400 when exercises array is empty', async ({ authenticatedApi }) => {
      const res = await authenticatedApi.createSession([]);
      expect(res.status()).toBe(400);
    });

    // TC-018
    test('returns 401 without a token', async ({ api }) => {
      const res = await api.createSession([exercise()]);
      expect(res.status()).toBe(401);
    });

    // TC-019
    test('returns 400 when more than 20 exercises are submitted', async ({ authenticatedApi }) => {
      const exercises = Array.from({ length: 21 }, () => exercise());
      const res = await authenticatedApi.createSession(exercises);
      expect(res.status()).toBe(400);
    });

    // TC-076
    for (const field of ['exerciseType', 'sets', 'reps', 'weight'] as Array<keyof WorkoutEntryRequest>) {
      test(`returns 400 when ${field} is missing`, async ({ authenticatedApi }) => {
        const full: WorkoutEntryRequest = { exerciseType: 'BENCH_PRESS', sets: 3, reps: 10, weight: 80 };
        const { [field]: _omitted, ...partial } = full;
        const res = await authenticatedApi.createSession([partial as never]);
        expect(res.status()).toBe(400);
      });
    }
  });

  test.describe('GET /api/workout-sessions/:id', () => {
    // TC-020
    test('returns a specific session by id', async ({ authenticatedApi }) => {
      const created = await (await authenticatedApi.createSession([exercise()])).json();

      const res = await authenticatedApi.getSession(created.id);

      expect(res.status()).toBe(200);
      expect((await res.json()).id).toBe(created.id);
    });

    // TC-021
    test('returns 404 for an unknown id', async ({ authenticatedApi }) => {
      const res = await authenticatedApi.getSession('00000000-0000-0000-0000-000000000000');
      expect(res.status()).toBe(404);
    });

    // TC-022
    test('returns 401 without a token', async ({ api }) => {
      const res = await api.getSession('00000000-0000-0000-0000-000000000000');
      expect(res.status()).toBe(401);
    });
  });

  test.describe('DELETE /api/workout-sessions/:id', () => {
    // TC-023
    test('deletes a session and returns 204', async ({ authenticatedApi }) => {
      const created = await (await authenticatedApi.createSession([exercise()])).json();

      const deleteRes = await authenticatedApi.deleteSession(created.id);
      expect(deleteRes.status()).toBe(204);

      const getRes = await authenticatedApi.getSession(created.id);
      expect(getRes.status()).toBe(404);
    });

    // TC-024
    test('returns 404 for an unknown id', async ({ authenticatedApi }) => {
      const res = await authenticatedApi.deleteSession('00000000-0000-0000-0000-000000000000');
      expect(res.status()).toBe(404);
    });

    // TC-025
    test('returns 401 without a token', async ({ api }) => {
      const res = await api.deleteSession('00000000-0000-0000-0000-000000000000');
      expect(res.status()).toBe(401);
    });
  });

  test.describe('user isolation', () => {
    // TC-026
    test('GET /api/workout-sessions returns only sessions for the authenticated user', async ({ authenticatedApi, api }) => {
      await authenticatedApi.createSession([exercise()]);

      const usernameB = uniqueUsername();
      await api.register(usernameB, TEST_PASSWORD);
      const loginRes = await api.login(usernameB, TEST_PASSWORD);
      const userB: User = await loginRes.json();
      const userBClient = api.withToken(userB.token!);

      const res = await userBClient.getSessions();
      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual([]);
    });

    // TC-027
    test('user cannot delete another user session', async ({ authenticatedApi, api }) => {
      const created: WorkoutSession = await (await authenticatedApi.createSession([exercise()])).json();

      const usernameB = uniqueUsername();
      await api.register(usernameB, TEST_PASSWORD);
      const loginRes = await api.login(usernameB, TEST_PASSWORD);
      const userB: User = await loginRes.json();
      const userBClient = api.withToken(userB.token!);

      const deleteRes = await userBClient.deleteSession(created.id);
      expect([403, 404]).toContain(deleteRes.status());
    });
  });
});
