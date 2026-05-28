import { test, expect } from '../../fixtures';
import { WorkoutsPage } from '../../pages/workouts.page';
import { LoginPage } from '../../pages/login.page';
import { exercise, uniqueUsername, TEST_PASSWORD } from '../../utils/test-data';
import { User } from '../../utils/api-client';

test.describe('Workouts Dashboard', () => {
  // TC-052
  test('shows empty state when user has no sessions', async ({ authenticatedPage }) => {
    const workoutsPage = new WorkoutsPage(authenticatedPage);
    await workoutsPage.goto();
    await workoutsPage.waitForSessions();

    await expect(workoutsPage.emptyState).toBeVisible();
    await expect(workoutsPage.emptyState).toContainText('No workouts found');
  });

  // TC-053
  test('shows session cards after creating sessions via API', async ({ pageWithApi }) => {
    const { page, api } = pageWithApi;

    await api.createSession([exercise('BENCH_PRESS'), exercise('DEADLIFT')]);
    await api.createSession([exercise('BACK_SQUAT')]);

    const workoutsPage = new WorkoutsPage(page);
    await workoutsPage.goto();
    await workoutsPage.waitForSessions();

    await expect(workoutsPage.sessionCards).toHaveCount(2);
  });

  // TC-054
  test('session card shows exercise names', async ({ pageWithApi }) => {
    const { page, api } = pageWithApi;
    await api.createSession([exercise('BENCH_PRESS')]);

    const workoutsPage = new WorkoutsPage(page);
    await workoutsPage.goto();
    await workoutsPage.waitForSessions();

    await expect(workoutsPage.exerciseNames(0)).toContainText('Bench Press');
  });

  // TC-055
  test('deletes a session when delete button is clicked', async ({ pageWithApi }) => {
    const { page, api } = pageWithApi;
    await api.createSession([exercise('DEADLIFT')]);

    const workoutsPage = new WorkoutsPage(page);
    await workoutsPage.goto();
    await workoutsPage.waitForSessions();

    await expect(workoutsPage.sessionCards).toHaveCount(1);
    await workoutsPage.deleteSession(0);
    await expect(workoutsPage.sessionCards).toHaveCount(0);
    await expect(workoutsPage.emptyState).toBeVisible();
  });

  // TC-056
  test('sessions listed most recent first', async ({ pageWithApi }) => {
    const { page, api } = pageWithApi;

    await api.createSession([exercise('DEADLIFT')]);
    await api.createSession([exercise('BENCH_PRESS')]);

    const workoutsPage = new WorkoutsPage(page);
    await workoutsPage.goto();
    await workoutsPage.waitForSessions();

    await expect(workoutsPage.exerciseNames(0)).toContainText('Bench Press');
    await expect(workoutsPage.exerciseNames(1)).toContainText('Deadlift');
  });

  // TC-057
  test('session card shows a date', async ({ pageWithApi }) => {
    const { page, api } = pageWithApi;
    await api.createSession([exercise()]);

    const workoutsPage = new WorkoutsPage(page);
    await workoutsPage.goto();
    await workoutsPage.waitForSessions();

    await expect(workoutsPage.sessionDate(0)).toBeVisible();
  });

  // TC-058
  test('session card shows sets, reps, and weight', async ({ pageWithApi }) => {
    const { page, api } = pageWithApi;
    await api.createSession([exercise('DEADLIFT', { sets: 5, reps: 3, weight: 120 })]);

    const workoutsPage = new WorkoutsPage(page);
    await workoutsPage.goto();
    await workoutsPage.waitForSessions();

    await expect(workoutsPage.exerciseStats(0)).toContainText('5 × 3');
    await expect(workoutsPage.exerciseStats(0)).toContainText('120');
  });

  // TC-059
  test('session card shows exercise count', async ({ pageWithApi }) => {
    const { page, api } = pageWithApi;
    await api.createSession([exercise('BENCH_PRESS'), exercise('DEADLIFT')]);

    const workoutsPage = new WorkoutsPage(page);
    await workoutsPage.goto();
    await workoutsPage.waitForSessions();

    await expect(workoutsPage.exerciseCount(0)).toBeVisible();
  });

  // TC-060
  test('loading indicator shown while sessions fetch', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/api/workout-sessions', async (route) => {
      await new Promise((r) => setTimeout(r, 300));
      await route.continue();
    });

    const workoutsPage = new WorkoutsPage(authenticatedPage);
    await workoutsPage.goto();

    await expect(workoutsPage.loadingSpinner).toBeVisible();

    await authenticatedPage.waitForLoadState('networkidle');
    await expect(workoutsPage.loadingSpinner).toBeHidden();
  });

  // TC-061
  test('error message shown if sessions fetch fails', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/api/workout-sessions', (route) =>
      route.fulfill({ status: 500, body: '{}' }),
    );

    const workoutsPage = new WorkoutsPage(authenticatedPage);
    await workoutsPage.goto();

    await expect(workoutsPage.errorAlert).toBeVisible();
  });

  // TC-062
  test('cancelling delete confirmation leaves session untouched', async ({ pageWithApi }) => {
    const { page, api } = pageWithApi;
    await api.createSession([exercise()]);

    const workoutsPage = new WorkoutsPage(page);
    await workoutsPage.goto();
    await workoutsPage.waitForSessions();

    await workoutsPage.deleteButton(0).click();
    await workoutsPage.cancelDeleteButton.click();

    await expect(workoutsPage.sessionCards).toHaveCount(1);
  });

  // TC-072
  test('session card date matches the createdAt returned by the API', async ({ pageWithApi }) => {
    const { page, api } = pageWithApi;
    const createRes = await api.createSession([exercise()]);
    const created = await createRes.json();

    const workoutsPage = new WorkoutsPage(page);
    await workoutsPage.goto();
    await workoutsPage.waitForSessions();

    await expect(workoutsPage.sessionDate(0)).toBeVisible();
    const text = (await workoutsPage.sessionDate(0).textContent())?.trim() ?? '';
    expect(text).not.toMatch(/undefined|null|NaN/i);
    expect(text).toMatch(/\d{4}/);
    const createdYear = new Date(created.createdAt).getFullYear().toString();
    expect(text).toContain(createdYear);
  });

  // TC-073
  test('user B does not see user A sessions on the dashboard', async ({ page, api }) => {
    const usernameA = uniqueUsername();
    await api.register(usernameA, TEST_PASSWORD);
    const loginA = await api.login(usernameA, TEST_PASSWORD);
    const userA: User = await loginA.json();
    const apiA = api.withToken(userA.token!);
    await apiA.createSession([exercise('DEADLIFT')]);

    const usernameB = uniqueUsername();
    await api.register(usernameB, TEST_PASSWORD);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(usernameB, TEST_PASSWORD);
    await page.waitForURL('/');

    const workoutsPage = new WorkoutsPage(page);
    await workoutsPage.goto();
    await workoutsPage.waitForSessions();

    await expect(workoutsPage.sessionCards).toHaveCount(0);
    await expect(workoutsPage.emptyState).toBeVisible();
  });

  // TC-074
  test('delete button opens confirmation dialog and does not delete until confirmed', async ({ pageWithApi }) => {
    const { page, api } = pageWithApi;
    await api.createSession([exercise()]);

    const workoutsPage = new WorkoutsPage(page);
    await workoutsPage.goto();
    await workoutsPage.waitForSessions();
    await expect(workoutsPage.sessionCards).toHaveCount(1);

    const deleteRequests: string[] = [];
    page.on('request', (r) => {
      if (r.method() === 'DELETE' && r.url().includes('/api/workout-sessions/')) {
        deleteRequests.push(r.url());
      }
    });

    await workoutsPage.deleteButton(0).click();

    await expect(workoutsPage.confirmDeleteButton).toBeVisible();
    await expect(workoutsPage.cancelDeleteButton).toBeVisible();
    await expect(workoutsPage.sessionCards).toHaveCount(1);

    await page.waitForTimeout(300);
    expect(deleteRequests).toHaveLength(0);
  });

  // TC-075
  test('every session card has a visible delete button when multiple sessions exist', async ({ pageWithApi }) => {
    const { page, api } = pageWithApi;
    await api.createSession([exercise('BENCH_PRESS')]);
    await api.createSession([exercise('DEADLIFT')]);
    await api.createSession([exercise('BACK_SQUAT')]);

    const workoutsPage = new WorkoutsPage(page);
    await workoutsPage.goto();
    await workoutsPage.waitForSessions();
    await expect(workoutsPage.sessionCards).toHaveCount(3);

    await expect(workoutsPage.deleteButton(0)).toBeVisible();
    await expect(workoutsPage.deleteButton(1)).toBeVisible();
    await expect(workoutsPage.deleteButton(2)).toBeVisible();
    await expect(workoutsPage.sessionCards.locator('.delete-btn')).toHaveCount(3);
  });
});
