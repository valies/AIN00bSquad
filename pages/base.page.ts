import { Page, Locator } from '@playwright/test';

export class BasePage {
  constructor(readonly page: Page) {}

  get navBrand(): Locator {
    return this.page.locator('.nav-brand');
  }

  get navDashboard(): Locator {
    return this.page.locator('.nav-links a[href="/workouts"]');
  }

  get navLogWorkout(): Locator {
    return this.page.locator('.nav-links a[href="/log-workout"]');
  }

  get navLogout(): Locator {
    return this.page.locator('.nav-logout');
  }

  get navSignIn(): Locator {
    return this.page.locator('.nav-links a[href="/login"]').first();
  }

  async isAuthenticated(): Promise<boolean> {
    return this.navLogout.isVisible();
  }

  async logout() {
    await this.navLogout.click();
    await this.page.waitForURL('/');
  }
}
