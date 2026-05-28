import { test, expect } from '../../fixtures';
import { exercise, session } from '../../utils/test-data';

test.describe('Workout Sessions API', () => {
  test.describe('GET /api/workout-sessions', () => {
    test('returns empty array for a new user', async ({ authenticatedApi }) => {
      const res = await authenticatedApi.getSessions();

      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual([]);
    });

    test('returns 401 without a token', async ({ api }) => {
      const res = await api.getSessions();
      expect(res.status()).toBe(401);
    });

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

    test('returns 400 for an invalid exercise type', async ({ authenticatedApi }) => {
      const res = await authenticatedApi.createSession([
        { exerciseType: 'INVALID_EXERCISE' as never, sets: 3, reps: 10, weight: 80 },
      ]);
      expect(res.status()).toBe(400);
    });

    test('returns 400 when exercises array is empty', async ({ authenticatedApi }) => {
      const res = await authenticatedApi.createSession([]);
      expect(res.status()).toBe(400);
    });

    test('returns 401 without a token', async ({ api }) => {
      const res = await api.createSession([exercise()]);
      expect(res.status()).toBe(401);
    });
  });

  test.describe('GET /api/workout-sessions/:id', () => {
    test('returns a specific session by id', async ({ authenticatedApi }) => {
      const created = await (await authenticatedApi.createSession([exercise()])).json();

      const res = await authenticatedApi.getSession(created.id);

      expect(res.status()).toBe(200);
      expect((await res.json()).id).toBe(created.id);
    });

    test('returns 404 for an unknown id', async ({ authenticatedApi }) => {
      const res = await authenticatedApi.getSession('00000000-0000-0000-0000-000000000000');
      expect(res.status()).toBe(404);
    });

    test('returns 401 without a token', async ({ api }) => {
      const res = await api.getSession('00000000-0000-0000-0000-000000000000');
      expect(res.status()).toBe(401);
    });
  });

  test.describe('DELETE /api/workout-sessions/:id', () => {
    test('deletes a session and returns 204', async ({ authenticatedApi }) => {
      const created = await (await authenticatedApi.createSession([exercise()])).json();

      const deleteRes = await authenticatedApi.deleteSession(created.id);
      expect(deleteRes.status()).toBe(204);

      const getRes = await authenticatedApi.getSession(created.id);
      expect(getRes.status()).toBe(404);
    });

    test('returns 404 for an unknown id', async ({ authenticatedApi }) => {
      const res = await authenticatedApi.deleteSession('00000000-0000-0000-0000-000000000000');
      expect(res.status()).toBe(404);
    });

    test('returns 401 without a token', async ({ api }) => {
      const res = await api.deleteSession('00000000-0000-0000-0000-000000000000');
      expect(res.status()).toBe(401);
    });
  });
});
