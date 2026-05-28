import { test, expect } from '../../fixtures';
import { uniqueUsername, TEST_PASSWORD } from '../../utils/test-data';

test.describe('Auth API', () => {
  test.describe('POST /api/auth/register', () => {
    test('registers a new user and returns id + username', async ({ api }) => {
      const username = uniqueUsername();
      const res = await api.register(username, TEST_PASSWORD);

      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body).toMatchObject({ id: expect.any(String), username });
      expect(body.token).toBeUndefined();
    });

    test('returns 400 when username is already taken', async ({ api }) => {
      const username = uniqueUsername();
      await api.register(username, TEST_PASSWORD);

      const res = await api.register(username, TEST_PASSWORD);
      expect(res.status()).toBe(400);
    });

    test('returns 400 when username is empty', async ({ api }) => {
      const res = await api.register('', TEST_PASSWORD);
      expect(res.status()).toBe(400);
    });

    test('returns 400 when password is empty', async ({ api }) => {
      const res = await api.register(uniqueUsername(), '');
      expect(res.status()).toBe(400);
    });
  });

  test.describe('POST /api/auth/login', () => {
    test('returns a UUID token on successful login', async ({ api }) => {
      const username = uniqueUsername();
      await api.register(username, TEST_PASSWORD);

      const res = await api.login(username, TEST_PASSWORD);

      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({ id: expect.any(String), username, token: expect.any(String) });
      expect(body.token).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    test('returns 401 for wrong password', async ({ api }) => {
      const username = uniqueUsername();
      await api.register(username, TEST_PASSWORD);

      const res = await api.login(username, 'WrongPassword!');
      expect(res.status()).toBe(401);
    });

    test('returns 401 for unknown username', async ({ api }) => {
      const res = await api.login('nonexistent_user_xyz', TEST_PASSWORD);
      expect(res.status()).toBe(401);
    });
  });

  test.describe('POST /api/auth/logout', () => {
    test('returns 200 when authenticated', async ({ authenticatedApi }) => {
      const res = await authenticatedApi.logout();
      expect(res.status()).toBe(200);
    });
  });
});
