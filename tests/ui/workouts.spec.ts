import { test, expect } from '../../fixtures';
import { WorkoutsPage } from '../../pages/workouts.page';
import { exercise } from '../../utils/test-data';

test.describe('Workouts Dashboard', () => {
  test('shows empty state when user has no sessions', async ({ authenticatedPage }) => {
    const workoutsPage = new WorkoutsPage(authenticatedPage);
    await workoutsPage.goto();
    await workoutsPage.waitForSessions();

    await expect(workoutsPage.emptyState).toBeVisible();
    await expect(workoutsPage.emptyState).toContainText('No workouts found');
  });

  test('shows session cards after creating sessions via API', async ({ pageWithApi }) => {
    const { page, api } = pageWithApi;

    await api.createSession([exercise('BENCH_PRESS'), exercise('DEADLIFT')]);
    await api.createSession([exercise('BACK_SQUAT')]);

    const workoutsPage = new WorkoutsPage(page);
    await workoutsPage.goto();
    await workoutsPage.waitForSessions();

    await expect(workoutsPage.sessionCards).toHaveCount(2);
  });

  test('session card shows exercise names', async ({ pageWithApi }) => {
    const { page, api } = pageWithApi;
    await api.createSession([exercise('BENCH_PRESS')]);

    const workoutsPage = new WorkoutsPage(page);
    await workoutsPage.goto();
    await workoutsPage.waitForSessions();

    await expect(workoutsPage.exerciseNames(0)).toContainText('Bench Press');
  });

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
});
