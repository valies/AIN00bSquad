import { test as base, Page, expect } from '@playwright/test';
import { ApiClient, User } from '../utils/api-client';
import { uniqueUsername, TEST_PASSWORD } from '../utils/test-data';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080';

export interface PageWithApi {
  page: Page;
  api: ApiClient;
  user: User;
}

export interface Fixtures {
  api: ApiClient;
  authenticatedApi: ApiClient;
  authenticatedUser: User;
  authenticatedPage: Page;
  pageWithApi: PageWithApi;
}

export const test = base.extend<Fixtures>({
  // Unauthenticated API client — for auth and public endpoint tests
  api: async ({ request }, use) => {
    await use(new ApiClient(request, BACKEND));
  },

  // API client pre-loaded with a fresh user's token
  authenticatedApi: async ({ request }, use) => {
    const client = new ApiClient(request, BACKEND);
    const username = uniqueUsername();
    await client.register(username, TEST_PASSWORD);
    const res = await client.login(username, TEST_PASSWORD);
    const user: User = await res.json();
    await use(client.withToken(user.token!));
  },

  // The logged-in user object (id, username, token) for assertions
  authenticatedUser: async ({ request }, use) => {
    const client = new ApiClient(request, BACKEND);
    const username = uniqueUsername();
    await client.register(username, TEST_PASSWORD);
    const res = await client.login(username, TEST_PASSWORD);
    const user: User = await res.json();
    await use(user);
  },

  // Authenticated page + API client for the SAME user — use when tests need both browser and direct API calls
  pageWithApi: async ({ page }, use) => {
    const username = uniqueUsername();
    await page.request.post(`${BACKEND}/api/auth/register`, {
      data: { username, password: TEST_PASSWORD },
    });
    const loginRes = await page.request.post(`${BACKEND}/api/auth/login`, {
      data: { username, password: TEST_PASSWORD },
    });
    const user: User = await loginRes.json();

    await page.addInitScript((userData: string) => {
      sessionStorage.setItem('user', userData);
    }, JSON.stringify(user));

    const api = new ApiClient(page.request, BACKEND, user.token);
    await use({ page, api, user });

    await page.request.post(`${BACKEND}/api/auth/logout`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
  },

  // A browser page with sessionStorage pre-seeded so React sees a logged-in user
  authenticatedPage: async ({ page }, use) => {
    const username = uniqueUsername();
    const regRes = await page.request.post(`${BACKEND}/api/auth/register`, {
      data: { username, password: TEST_PASSWORD },
    });
    const registered: User = await regRes.json();
    const loginRes = await page.request.post(`${BACKEND}/api/auth/login`, {
      data: { username, password: TEST_PASSWORD },
    });
    const user: User = await loginRes.json();

    // Inject auth into sessionStorage before any page script runs
    await page.addInitScript((userData: string) => {
      sessionStorage.setItem('user', userData);
    }, JSON.stringify(user));

    await use(page);

    // Cleanup
    await page.request.post(`${BACKEND}/api/auth/logout`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
  },
});

export { expect };
