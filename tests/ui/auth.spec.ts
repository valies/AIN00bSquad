import { test, expect } from '../../fixtures';
import { LoginPage } from '../../pages/login.page';
import { HomePage } from '../../pages/home.page';
import { BasePage } from '../../pages/base.page';
import { uniqueUsername, TEST_PASSWORD } from '../../utils/test-data';

test.describe('Auth UI', () => {
  // TC-028
  test('login page shows Sign In form by default', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.heading).toHaveText('Welcome Back');
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toHaveText('Sign In');
  });

  // TC-029
  test('toggle switches to registration form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.switchToRegister();

    await expect(loginPage.heading).toHaveText('Create Account');
    await expect(loginPage.submitButton).toHaveText('Sign Up');
  });

  // TC-030
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

  // TC-031
  test('successful registration lands on home and shows authenticated nav', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.register(uniqueUsername(), TEST_PASSWORD);

    await page.waitForURL('/');
    await expect(loginPage.navLogout).toBeVisible();
  });

  // TC-032
  test('wrong password shows error alert', async ({ page, api }) => {
    const username = uniqueUsername();
    await api.register(username, TEST_PASSWORD);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(username, 'WrongPassword!');

    await expect(loginPage.errorAlert).toBeVisible();
  });

  // TC-033
  test('form remains usable after failed login', async ({ page, api }) => {
    const username = uniqueUsername();
    await api.register(username, TEST_PASSWORD);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(username, 'WrongPassword!');

    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.usernameInput).toBeEnabled();
    await expect(loginPage.passwordInput).toBeEnabled();
    await expect(loginPage.submitButton).toBeEnabled();
  });

  // TC-034
  test('logout clears session and shows unauthenticated nav', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/workouts');
    const loginPage = new LoginPage(authenticatedPage);

    await loginPage.logout();

    await expect(authenticatedPage).toHaveURL('/');
    await expect(loginPage.navSignIn).toBeVisible();
  });

  // TC-035
  test('protected route redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/workouts');
    await expect(page).toHaveURL('/login');
  });

  // TC-036
  test('duplicate username on registration shows error alert', async ({ page, api }) => {
    const username = uniqueUsername();
    await api.register(username, TEST_PASSWORD);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.register(username, TEST_PASSWORD);

    await expect(loginPage.errorAlert).toBeVisible();
  });

  // TC-037
  test('login form is disabled while request is in flight', async ({ page, api }) => {
    const username = uniqueUsername();
    await api.register(username, TEST_PASSWORD);

    await page.route('**/api/auth/login', async (route) => {
      await new Promise((r) => setTimeout(r, 200));
      await route.continue();
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(username, TEST_PASSWORD);

    await expect(loginPage.submitButton).toBeDisabled();

    await page.waitForURL('/');
  });

  // TC-038
  test('/log-workout redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/log-workout');
    await expect(page).toHaveURL('/login');
  });

  // TC-039
  test('unauthenticated nav shows Sign In and Get Started', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.getStartedButton).toBeVisible();
    await expect(new BasePage(page).navSignIn).toBeVisible();
  });

  // TC-040
  test('authenticated nav shows Dashboard, Log Workout, and Logout', async ({ page, api }) => {
    const username = uniqueUsername();
    await api.register(username, TEST_PASSWORD);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(username, TEST_PASSWORD);
    await page.waitForURL('/');

    await expect(loginPage.navDashboard).toBeVisible();
    await expect(loginPage.navLogWorkout).toBeVisible();
    await expect(loginPage.navLogout).toBeVisible();
  });

  // TC-063
  test('successful registration persists session token and authenticates subsequent API calls', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const username = uniqueUsername();
    await loginPage.register(username, TEST_PASSWORD);
    await page.waitForURL('/');

    const stored = await page.evaluate(() => sessionStorage.getItem('user'));
    expect(stored).not.toBeNull();

    const user = JSON.parse(stored!);
    expect(user.username).toBe(username);
    expect(user.token).toMatch(/^[0-9a-f-]{36}$/i);

    const res = await page.request.get('http://localhost:8080/api/workout-sessions', {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  // TC-064
  test('authenticated client sends Authorization Bearer header on protected API requests', async ({ page, api }) => {
    const username = uniqueUsername();
    await api.register(username, TEST_PASSWORD);

    const capturedHeaders: Record<string, string>[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/workout-sessions') && req.method() === 'GET') {
        capturedHeaders.push(req.headers());
      }
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(username, TEST_PASSWORD);
    await page.waitForURL('/');
    await page.goto('/workouts');
    await page.waitForLoadState('networkidle');

    expect(capturedHeaders.length).toBeGreaterThan(0);
    expect(capturedHeaders[0]['authorization']).toMatch(
      /^Bearer [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  // TC-065
  test('login form inputs are disabled and loading indicator visible while request is in flight', async ({ page, api }) => {
    const username = uniqueUsername();
    await api.register(username, TEST_PASSWORD);

    await page.route('**/api/auth/login', async (route) => {
      await new Promise((r) => setTimeout(r, 400));
      await route.continue();
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.usernameInput.fill(username);
    await loginPage.passwordInput.fill(TEST_PASSWORD);
    await loginPage.submitButton.click();

    await expect(loginPage.usernameInput).toBeDisabled();
    await expect(loginPage.passwordInput).toBeDisabled();
    await expect(loginPage.submitButton).toBeDisabled();
    await expect(loginPage.loadingIndicator).toBeVisible();

    await page.waitForURL('/');
  });

  // TC-066
  test('logout removes user from sessionStorage', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/workouts');
    await authenticatedPage.waitForLoadState('networkidle');

    const before = await authenticatedPage.evaluate(() => sessionStorage.getItem('user'));
    expect(before).not.toBeNull();

    const base = new BasePage(authenticatedPage);
    await base.logout();

    await expect
      .poll(() => authenticatedPage.evaluate(() => sessionStorage.getItem('user')))
      .toBeNull();
    await expect(authenticatedPage).toHaveURL('/');
  });

  // TC-067
  test('authenticated user can still access public pages (home and login)', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await expect(authenticatedPage).toHaveURL('/');
    await expect(new BasePage(authenticatedPage).navBrand).toBeVisible();

    await authenticatedPage.goto('/login');
    await expect(authenticatedPage).toHaveURL('/login');

    const loginPage = new LoginPage(authenticatedPage);
    await expect(loginPage.heading).toBeVisible();
  });

  // TC-068
  test('invalid token in sessionStorage redirects from protected route to login', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'user',
        JSON.stringify({
          id: '00000000-0000-0000-0000-000000000000',
          username: 'ghost',
          createdAt: '2020-01-01T00:00:00Z',
          token: '11111111-1111-1111-1111-111111111111',
        }),
      );
    });

    await page.goto('/workouts');
    await expect(page).toHaveURL('/login');
  });
});
