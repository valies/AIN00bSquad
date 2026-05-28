import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class WorkoutsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/workouts');
  }

  get container(): Locator {
    return this.page.locator('.workouts-container');
  }

  get emptyState(): Locator {
    return this.page.locator('.empty-state');
  }

  get sessionCards(): Locator {
    return this.page.locator('.workout-card.session-card');
  }

  get errorAlert(): Locator {
    return this.page.locator('.error-alert');
  }

  sessionCard(index: number): Locator {
    return this.sessionCards.nth(index);
  }

  deleteButton(index: number): Locator {
    return this.sessionCard(index).locator('.delete-btn');
  }

  exerciseNames(index: number): Locator {
    return this.sessionCard(index).locator('.workout-type');
  }

  exerciseCount(index: number): Locator {
    return this.sessionCard(index).locator('.session-exercise-count');
  }

  get confirmDeleteButton(): Locator {
    return this.page.locator('button', { hasText: 'Delete' }).last();
  }

  get cancelDeleteButton(): Locator {
    return this.page.locator('button', { hasText: 'Cancel' });
  }

  sessionDate(index: number): Locator {
    return this.sessionCard(index).locator('.workout-date');
  }

  exerciseStats(cardIndex: number): Locator {
    return this.sessionCard(cardIndex).locator('.session-exercise-stats');
  }

  get loadingSpinner(): Locator {
    return this.page.locator('.spinner');
  }

  async deleteSession(index: number) {
    await this.deleteButton(index).click();
    // Confirm in the "Delete this workout?" dialog
    await Promise.all([
      this.page.waitForResponse(
        (res) => res.url().includes('/api/workout-sessions/') && res.request().method() === 'DELETE',
      ),
      this.confirmDeleteButton.click(),
    ]);
  }

  async waitForSessions() {
    await this.page.waitForLoadState('networkidle');
  }
}
