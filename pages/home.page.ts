import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/');
  }

  get getStartedButton(): Locator {
    return this.page.locator('.nav-button', { hasText: 'Get Started' });
  }
}
