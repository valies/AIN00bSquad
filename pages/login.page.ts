import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/login');
  }

  get usernameInput(): Locator {
    return this.page.locator('#username');
  }

  get passwordInput(): Locator {
    return this.page.locator('#password');
  }

  get submitButton(): Locator {
    return this.page.locator('.auth-submit-btn');
  }

  get errorAlert(): Locator {
    return this.page.locator('.error-alert');
  }

  get toggleButton(): Locator {
    return this.page.locator('.toggle-button');
  }

  get heading(): Locator {
    return this.page.locator('.auth-header h1');
  }

  get loadingIndicator(): Locator {
    return this.page.locator('.auth-submit-btn', { hasText: 'Processing...' });
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async switchToRegister() {
    await this.toggleButton.click();
  }

  async register(username: string, password: string) {
    await this.switchToRegister();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
