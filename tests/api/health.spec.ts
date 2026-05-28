import { test, expect } from '../../fixtures';

test.describe('Health', () => {
  test('GET /health returns status ok', async ({ api }) => {
    const res = await api.health();

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ status: expect.any(String) });
  });
});
