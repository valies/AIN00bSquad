import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { ExerciseType } from '../utils/api-client';

export class LogWorkoutPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/log-workout');
  }

  get exerciseTypeSelect(): Locator {
    return this.page.locator('#exerciseType');
  }

  get setsInput(): Locator {
    return this.page.locator('#sets');
  }

  get repsInput(): Locator {
    return this.page.locator('#reps');
  }

  get weightInput(): Locator {
    return this.page.locator('#weight');
  }

  get addExerciseButton(): Locator {
    return this.page.locator('.add-exercise-button');
  }

  get saveSessionButton(): Locator {
    return this.page.locator('.submit-button');
  }

  get successMessage(): Locator {
    return this.page.locator('text=Session saved successfully!');
  }

  get fieldErrors(): Locator {
    return this.page.locator('.field-error');
  }

  get exerciseRows(): Locator {
    return this.page.locator('.exercise-row');
  }

  async fillExercise(type: ExerciseType, sets: number, reps: number, weight: number) {
    await this.exerciseTypeSelect.selectOption(type);
    await this.setsInput.fill(String(sets));
    await this.repsInput.fill(String(reps));
    await this.weightInput.fill(String(weight));
  }

  async addExercise(type: ExerciseType, sets: number, reps: number, weight: number) {
    await this.fillExercise(type, sets, reps, weight);
    await this.addExerciseButton.click();
  }

  async saveSession() {
    await this.saveSessionButton.click();
  }
}
