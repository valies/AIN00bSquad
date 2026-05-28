import { test, expect } from '../../fixtures';
import { LogWorkoutPage } from '../../pages/log-workout.page';
import { WorkoutsPage } from '../../pages/workouts.page';

test.describe('Log Workout', () => {
  test('shows the exercise form', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await expect(logPage.exerciseTypeSelect).toBeVisible();
    await expect(logPage.setsInput).toBeVisible();
    await expect(logPage.repsInput).toBeVisible();
    await expect(logPage.weightInput).toBeVisible();
    await expect(logPage.addExerciseButton).toBeVisible();
  });

  test('shows validation errors when submitting empty exercise', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await logPage.addExerciseButton.click();

    await expect(logPage.fieldErrors.first()).toBeVisible();
  });

  test('adds an exercise to the list', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await logPage.addExercise('BENCH_PRESS', 3, 10, 80);

    await expect(logPage.exerciseRows).toHaveCount(1);
    await expect(logPage.exerciseRows.first()).toContainText('Bench Press');
  });

  test('adds multiple exercises to the list', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await logPage.addExercise('BENCH_PRESS', 3, 10, 80);
    await logPage.addExercise('DEADLIFT', 5, 3, 120);
    await logPage.addExercise('BACK_SQUAT', 4, 8, 100);

    await expect(logPage.exerciseRows).toHaveCount(3);
  });

  test('saves a session and shows success message', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await logPage.addExercise('BENCH_PRESS', 3, 10, 80);
    await logPage.saveSession();

    await expect(logPage.successMessage).toBeVisible();
  });

  test('saved session appears on the workouts dashboard', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await logPage.addExercise('DEADLIFT', 5, 3, 140);
    await logPage.saveSession();
    await expect(logPage.successMessage).toBeVisible();

    // Navigate to dashboard and verify the session is there
    await authenticatedPage.goto('/workouts');
    const workoutsPage = new WorkoutsPage(authenticatedPage);
    await workoutsPage.waitForSessions();

    await expect(workoutsPage.sessionCards).toHaveCount(1);
    await expect(workoutsPage.exerciseNames(0)).toContainText('Deadlift');
  });

  test('save button is disabled when no exercises have been added', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await expect(logPage.saveSessionButton).toBeDisabled();
  });
});
