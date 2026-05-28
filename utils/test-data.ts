import { ExerciseType, WorkoutEntryRequest } from './api-client';

let counter = 0;

export function uniqueUsername(prefix = 'test'): string {
  return `${prefix}_${Date.now()}_${++counter}`;
}

export const TEST_PASSWORD = 'TestPass123!';

export const EXERCISE_TYPES: ExerciseType[] = ['DEADLIFT', 'BACK_SQUAT', 'BENCH_PRESS'];

export const EXERCISE_LABELS: Record<ExerciseType, string> = {
  DEADLIFT: 'Deadlift',
  BACK_SQUAT: 'Back Squat',
  BENCH_PRESS: 'Bench Press',
};

export function exercise(
  exerciseType: ExerciseType = 'BENCH_PRESS',
  overrides: Partial<WorkoutEntryRequest> = {},
): WorkoutEntryRequest {
  return { exerciseType, sets: 3, reps: 10, weight: 80, ...overrides };
}

export function session(exercises: WorkoutEntryRequest[] = [exercise()]) {
  return { exercises };
}
