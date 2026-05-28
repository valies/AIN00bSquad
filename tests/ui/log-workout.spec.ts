import { test, expect } from '../../fixtures';
import { LogWorkoutPage } from '../../pages/log-workout.page';
import { WorkoutsPage } from '../../pages/workouts.page';

test.describe('Log Workout', () => {
  // TC-041
  test('shows the exercise form', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await expect(logPage.exerciseTypeSelect).toBeVisible();
    await expect(logPage.setsInput).toBeVisible();
    await expect(logPage.repsInput).toBeVisible();
    await expect(logPage.weightInput).toBeVisible();
    await expect(logPage.addExerciseButton).toBeVisible();
  });

  // TC-042
  test('shows validation errors when submitting empty exercise', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await logPage.addExerciseButton.click();

    await expect(logPage.fieldErrors.first()).toBeVisible();
  });

  // TC-043
  test('adds an exercise to the list', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await logPage.addExercise('BENCH_PRESS', 3, 10, 80);

    await expect(logPage.exerciseRows).toHaveCount(1);
    await expect(logPage.exerciseRows.first()).toContainText('Bench Press');
  });

  // TC-044
  test('adds multiple exercises to the list', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await logPage.addExercise('BENCH_PRESS', 3, 10, 80);
    await logPage.addExercise('DEADLIFT', 5, 3, 120);
    await logPage.addExercise('BACK_SQUAT', 4, 8, 100);

    await expect(logPage.exerciseRows).toHaveCount(3);
  });

  // TC-045
  test('saves a session and shows success message', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await logPage.addExercise('BENCH_PRESS', 3, 10, 80);
    await logPage.saveSession();

    await expect(logPage.successMessage).toBeVisible();
  });

  // TC-046
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

  // TC-047
  test('save button is disabled when no exercises have been added', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await expect(logPage.saveSessionButton).toBeDisabled();
  });

  // TC-048
  test('removes exercise from staged list', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await logPage.addExercise('BENCH_PRESS', 3, 10, 80);
    await expect(logPage.exerciseRows).toHaveCount(1);

    await logPage.removeExerciseButton(0).click();

    await expect(logPage.exerciseRows).toHaveCount(0);
    await expect(logPage.saveSessionButton).toBeDisabled();
  });

  // TC-049
  test('form resets after successful save', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await logPage.addExercise('BENCH_PRESS', 3, 10, 80);
    await logPage.saveSession();

    await expect(logPage.successMessage).toBeVisible();
    await expect(logPage.exerciseRows).toHaveCount(0);
    await expect(logPage.saveSessionButton).toBeDisabled();
  });

  // TC-050
  test('negative/zero values are rejected', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await logPage.fillExercise('BENCH_PRESS', 0, -1, 0);
    await logPage.addExerciseButton.click();

    await expect(logPage.fieldErrors.first()).toBeVisible();
  });

  // TC-051
  test('exercise type dropdown offers all three supported exercises', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    const options = await logPage.exerciseTypeSelect.locator('option').allTextContents();
    expect(options).toContain('Deadlift');
    expect(options).toContain('Back Squat');
    expect(options).toContain('Bench Press');
  });

  // TC-069
  test('exercises persist in the order they were added when viewed on dashboard', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await logPage.addExercise('BACK_SQUAT', 4, 8, 100);
    await logPage.addExercise('DEADLIFT', 5, 3, 140);
    await logPage.addExercise('BENCH_PRESS', 3, 10, 80);
    await logPage.saveSession();
    await expect(logPage.successMessage).toBeVisible();

    await authenticatedPage.goto('/workouts');
    const workoutsPage = new WorkoutsPage(authenticatedPage);
    await workoutsPage.waitForSessions();

    await expect(workoutsPage.sessionCards).toHaveCount(1);

    const names = await workoutsPage.exerciseNames(0).allTextContents();
    expect(names.map((n) => n.trim())).toEqual(['Back Squat', 'Deadlift', 'Bench Press']);
  });

  // TC-070
  test('missing single field (sets | reps | weight) shows a validation error', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await logPage.exerciseTypeSelect.selectOption('BENCH_PRESS');
    await logPage.setsInput.fill('3');
    await logPage.repsInput.fill('10');
    await logPage.weightInput.fill('');
    await logPage.addExerciseButton.click();
    await expect(logPage.fieldErrors.first()).toBeVisible();
    await expect(logPage.exerciseRows).toHaveCount(0);

    await logPage.goto();
    await logPage.exerciseTypeSelect.selectOption('BENCH_PRESS');
    await logPage.setsInput.fill('3');
    await logPage.repsInput.fill('');
    await logPage.weightInput.fill('80');
    await logPage.addExerciseButton.click();
    await expect(logPage.fieldErrors.first()).toBeVisible();
    await expect(logPage.exerciseRows).toHaveCount(0);

    await logPage.goto();
    await logPage.exerciseTypeSelect.selectOption('BENCH_PRESS');
    await logPage.setsInput.fill('');
    await logPage.repsInput.fill('10');
    await logPage.weightInput.fill('80');
    await logPage.addExerciseButton.click();
    await expect(logPage.fieldErrors.first()).toBeVisible();
    await expect(logPage.exerciseRows).toHaveCount(0);
  });

  // TC-071
  test('individual form inputs reset to empty/default after successful save', async ({ authenticatedPage }) => {
    const logPage = new LogWorkoutPage(authenticatedPage);
    await logPage.goto();

    await logPage.addExercise('DEADLIFT', 5, 3, 140);
    await logPage.saveSession();
    await expect(logPage.successMessage).toBeVisible();

    await expect(logPage.setsInput).toHaveValue('');
    await expect(logPage.repsInput).toHaveValue('');
    await expect(logPage.weightInput).toHaveValue('');

    const selected = await logPage.exerciseTypeSelect.inputValue();
    expect(['', 'DEADLIFT']).toContain(selected);

    await expect(logPage.exerciseRows).toHaveCount(0);
  });
});
