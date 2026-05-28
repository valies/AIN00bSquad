import { test, expect } from '../../fixtures';
import { LoginPage } from '../../pages/login.page';
import { uniqueUsername, TEST_PASSWORD } from '../../utils/test-data';

test.describe('Auth UI', () => {
  test('login page shows Sign In form by default', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.heading).toHaveText('Welcome Back');
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toHaveText('Sign In');
  });

  test('toggle switches to registration form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.switchToRegister();

    await expect(loginPage.heading).toHaveText('Create Account');
    await expect(loginPage.submitButton).toHaveText('Sign Up');
  });

  test('successful login lands on home and shows authenticated nav', async ({ page, api }) => {
    const username = uniqueUsername();
    await api.register(username, TEST_PASSWORD);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(username, TEST_PASSWORD);

    // App navigates to home (/) after login
    await page.waitForURL('/');
    await expect(loginPage.navLogout).toBeVisible();
    await expect(loginPage.navDashboard).toBeVisible();
  });

  test('successful registration lands on home and shows authenticated nav', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.register(uniqueUsername(), TEST_PASSWORD);

    await page.waitForURL('/');
    await expect(loginPage.navLogout).toBeVisible();
  });

  test('wrong password shows error alert', async ({ page, api }) => {
    const username = uniqueUsername();
    await api.register(username, TEST_PASSWORD);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(username, 'WrongPassword!');

    await expect(loginPage.errorAlert).toBeVisible();
  });

  test('logout clears session and shows unauthenticated nav', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/workouts');
    const loginPage = new LoginPage(authenticatedPage);

    await loginPage.logout();

    await expect(authenticatedPage).toHaveURL('/');
    await expect(loginPage.navSignIn).toBeVisible();
  });

  test('protected route redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/workouts');
    await expect(page).toHaveURL('/login');
  });
});
