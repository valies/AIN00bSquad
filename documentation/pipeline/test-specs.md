# Test Specifications — 2026-05-28 12:35 UTC
Generated from: gap-analysis.md

Total gaps in input: 14 (UI-only: 9, API-only: 2, both: 4 — but in this gap-analysis all "both" gaps were resolved into a single type, so we emit one spec per gap). Highest existing TC across all spec files at time of generation: TC-062. TC numbers assigned: TC-063 through TC-076.

---

## SPEC-001 (from GAP-001)
- Type: ui
- File: tests/ui/auth.spec.ts
- Describe block: "Auth UI"
- Test name: "successful registration persists session token and authenticates subsequent API calls"
- TC number: TC-063
- Fixture: page
- Setup: none (registration is the action under test)
- Steps:
  1. Instantiate `LoginPage`.
  2. `await loginPage.goto()`.
  3. Generate `const username = uniqueUsername()`.
  4. `await loginPage.register(username, TEST_PASSWORD)`.
  5. `await page.waitForURL('/')`.
  6. Read sessionStorage: `const stored = await page.evaluate(() => sessionStorage.getItem('user'));`.
  7. Parse: `const user = JSON.parse(stored!); expect(user.token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);`.
  8. Use the same browser context to call the authenticated endpoint: `const res = await page.request.get('http://localhost:8080/api/workout-sessions', { headers: { Authorization: `Bearer ${user.token}` } });`.
- Assertions:
  - `expect(stored).not.toBeNull()` — sessionStorage key `"user"` is present.
  - `expect(user.username).toBe(username)`.
  - `expect(user.token).toMatch(/^[0-9a-f-]{36}$/i)` — UUID-shape token persisted.
  - `expect(res.status()).toBe(200)` — authenticated request succeeds without an explicit login step.
  - `expect(await res.json()).toEqual([])` — fresh user has empty sessions list.

## SPEC-002 (from GAP-002)
- Type: ui
- File: tests/ui/auth.spec.ts
- Describe block: "Auth UI"
- Test name: "authenticated client sends Authorization Bearer header on protected API requests"
- TC number: TC-064
- Fixture: page, api
- Setup:
  1. `const username = uniqueUsername();`
  2. `await api.register(username, TEST_PASSWORD);`
- Steps:
  1. Attach a request listener BEFORE login: `const capturedHeaders: Record<string, string>[] = []; page.on('request', (req) => { if (req.url().includes('/api/workout-sessions') && req.method() === 'GET') { capturedHeaders.push(req.headers()); } });`.
  2. `const loginPage = new LoginPage(page); await loginPage.goto();`.
  3. `await loginPage.login(username, TEST_PASSWORD);`.
  4. `await page.waitForURL('/');`.
  5. `await page.goto('/workouts');`.
  6. `await page.waitForLoadState('networkidle');`.
- Assertions:
  - `expect(capturedHeaders.length).toBeGreaterThan(0)` — the dashboard fetched sessions.
  - `expect(capturedHeaders[0]['authorization']).toMatch(/^Bearer [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)` — header carries `Bearer <uuid>`.

## SPEC-003 (from GAP-003)
- Type: ui
- File: tests/ui/auth.spec.ts
- Describe block: "Auth UI"
- Test name: "login form inputs are disabled and loading indicator visible while request is in flight"
- TC number: TC-065
- Fixture: page, api
- Setup:
  1. `const username = uniqueUsername(); await api.register(username, TEST_PASSWORD);`
- Steps:
  1. Add a delayed route handler so the login round-trip stays open long enough to inspect intermediate state:
     `await page.route('**/api/auth/login', async (route) => { await new Promise((r) => setTimeout(r, 400)); await route.continue(); });`.
  2. `const loginPage = new LoginPage(page); await loginPage.goto();`.
  3. `await loginPage.usernameInput.fill(username);`
  4. `await loginPage.passwordInput.fill(TEST_PASSWORD);`
  5. `await loginPage.submitButton.click();` (do NOT await the navigation yet).
  6. While the request is in flight, assert disabled inputs and a visible loading indicator.
  7. After assertions: `await page.waitForURL('/');`.
- Assertions:
  - `await expect(loginPage.usernameInput).toBeDisabled();`
  - `await expect(loginPage.passwordInput).toBeDisabled();`
  - `await expect(loginPage.submitButton).toBeDisabled();`
  - `await expect(page.locator('.spinner, .loading-indicator, [aria-busy="true"]').first()).toBeVisible();` — note: if no existing locator matches, the test writer should inspect the running app at `/login` while the request is pending to identify the indicator selector; otherwise add a `loadingIndicator` getter to `LoginPage`.

## SPEC-004 (from GAP-004)
- Type: ui
- File: tests/ui/auth.spec.ts
- Describe block: "Auth UI"
- Test name: "logout removes user from sessionStorage"
- TC number: TC-066
- Fixture: authenticatedPage
- Setup: none (fixture seeds sessionStorage with a valid user)
- Steps:
  1. `await authenticatedPage.goto('/workouts');`
  2. `await authenticatedPage.waitForLoadState('networkidle');`
  3. Sanity: `const before = await authenticatedPage.evaluate(() => sessionStorage.getItem('user')); expect(before).not.toBeNull();`
  4. `const base = new BasePage(authenticatedPage); await base.logout();`
  5. `const after = await authenticatedPage.evaluate(() => sessionStorage.getItem('user'));`
- Assertions:
  - `expect(after).toBeNull();` — session token cleared client-side.
  - `await expect(authenticatedPage).toHaveURL('/');` — landed on a public page.

## SPEC-005 (from GAP-005)
- Type: ui
- File: tests/ui/auth.spec.ts
- Describe block: "Auth UI"
- Test name: "authenticated user can still access public pages (home and login)"
- TC number: TC-067
- Fixture: authenticatedPage
- Setup: none
- Steps:
  1. `await authenticatedPage.goto('/');`
  2. `await expect(authenticatedPage).toHaveURL('/');`
  3. Assert home renders (nav brand present, no error alert): `await expect(new BasePage(authenticatedPage).navBrand).toBeVisible();`
  4. `await authenticatedPage.goto('/login');`
  5. `await expect(authenticatedPage).toHaveURL('/login');`
  6. Assert login page renders: `const loginPage = new LoginPage(authenticatedPage); await expect(loginPage.heading).toBeVisible();`
- Assertions:
  - URL remains `/` after navigating there (no redirect away).
  - URL remains `/login` after navigating there (no redirect away).
  - Home and login page headings/landmarks are visible.

## SPEC-006 (from GAP-006)
- Type: ui
- File: tests/ui/auth.spec.ts
- Describe block: "Auth UI"
- Test name: "invalid token in sessionStorage redirects from protected route to login"
- TC number: TC-068
- Fixture: page
- Setup: none
- Steps:
  1. Inject a malformed session blob BEFORE any app script runs:
     `await page.addInitScript(() => { sessionStorage.setItem('user', JSON.stringify({ id: '00000000-0000-0000-0000-000000000000', username: 'ghost', createdAt: '2020-01-01T00:00:00Z', token: '11111111-1111-1111-1111-111111111111' })); });`
  2. `await page.goto('/workouts');`
- Assertions:
  - `await expect(page).toHaveURL('/login');` — server rejects the bogus token and the client redirects to login.

## SPEC-007 (from GAP-007)
- Type: ui
- File: tests/ui/log-workout.spec.ts
- Describe block: "Log Workout"
- Test name: "exercises persist in the order they were added when viewed on dashboard"
- TC number: TC-069
- Fixture: authenticatedPage
- Setup: none
- Steps:
  1. `const logPage = new LogWorkoutPage(authenticatedPage); await logPage.goto();`
  2. `await logPage.addExercise('BACK_SQUAT', 4, 8, 100);`
  3. `await logPage.addExercise('DEADLIFT', 5, 3, 140);`
  4. `await logPage.addExercise('BENCH_PRESS', 3, 10, 80);`
  5. `await logPage.saveSession();`
  6. `await expect(logPage.successMessage).toBeVisible();`
  7. `await authenticatedPage.goto('/workouts');`
  8. `const workoutsPage = new WorkoutsPage(authenticatedPage); await workoutsPage.waitForSessions();`
  9. `await expect(workoutsPage.sessionCards).toHaveCount(1);`
- Assertions:
  - `const names = await workoutsPage.exerciseNames(0).allTextContents();`
  - `expect(names.map((n) => n.trim())).toEqual(['Back Squat', 'Deadlift', 'Bench Press']);` — UI preserves add-order in the rendered card.

## SPEC-008 (from GAP-008)
- Type: ui
- File: tests/ui/log-workout.spec.ts
- Describe block: "Log Workout"
- Test name: "missing single field (sets | reps | weight) shows a validation error"
- TC number: TC-070
- Fixture: authenticatedPage
- Setup: none
- Steps (run all three cases inline; do NOT use `test.each` so failures stay readable):
  1. `const logPage = new LogWorkoutPage(authenticatedPage); await logPage.goto();`
  2. Case A — missing weight:
     - `await logPage.exerciseTypeSelect.selectOption('BENCH_PRESS');`
     - `await logPage.setsInput.fill('3');`
     - `await logPage.repsInput.fill('10');`
     - `await logPage.weightInput.fill('');`
     - `await logPage.addExerciseButton.click();`
     - `await expect(logPage.fieldErrors).toHaveCount(1);` (or `await expect(logPage.fieldErrors.first()).toBeVisible();`)
     - `await expect(logPage.exerciseRows).toHaveCount(0);` — exercise not added.
  3. Case B — missing reps:
     - Refresh: `await logPage.goto();`
     - `await logPage.exerciseTypeSelect.selectOption('BENCH_PRESS');`
     - `await logPage.setsInput.fill('3');`
     - `await logPage.repsInput.fill('');`
     - `await logPage.weightInput.fill('80');`
     - `await logPage.addExerciseButton.click();`
     - `await expect(logPage.fieldErrors.first()).toBeVisible();`
     - `await expect(logPage.exerciseRows).toHaveCount(0);`
  4. Case C — missing sets:
     - Refresh: `await logPage.goto();`
     - `await logPage.exerciseTypeSelect.selectOption('BENCH_PRESS');`
     - `await logPage.setsInput.fill('');`
     - `await logPage.repsInput.fill('10');`
     - `await logPage.weightInput.fill('80');`
     - `await logPage.addExerciseButton.click();`
     - `await expect(logPage.fieldErrors.first()).toBeVisible();`
     - `await expect(logPage.exerciseRows).toHaveCount(0);`
- Assertions: as inlined above. For each case the field-error locator is visible AND the exercise is NOT appended to the staged list.

## SPEC-009 (from GAP-009)
- Type: ui
- File: tests/ui/log-workout.spec.ts
- Describe block: "Log Workout"
- Test name: "individual form inputs reset to empty/default after successful save"
- TC number: TC-071
- Fixture: authenticatedPage
- Setup: none
- Steps:
  1. `const logPage = new LogWorkoutPage(authenticatedPage); await logPage.goto();`
  2. `await logPage.addExercise('DEADLIFT', 5, 3, 140);`
  3. `await logPage.saveSession();`
  4. `await expect(logPage.successMessage).toBeVisible();`
- Assertions:
  - `await expect(logPage.setsInput).toHaveValue('');` — sets input cleared.
  - `await expect(logPage.repsInput).toHaveValue('');` — reps input cleared.
  - `await expect(logPage.weightInput).toHaveValue('');` — weight input cleared.
  - `const selected = await logPage.exerciseTypeSelect.inputValue(); expect(['', 'DEADLIFT']).toContain(selected);` — accept either truly empty or reset-to-first-option; flag any other lingering value. (Note: if the writer finds the dropdown resets to a specific default like `'BENCH_PRESS'` or empty, tighten the assertion accordingly after manual inspection.)
  - `await expect(logPage.exerciseRows).toHaveCount(0);` — staged list also cleared (sanity).

## SPEC-010 (from GAP-010)
- Type: ui
- File: tests/ui/workouts.spec.ts
- Describe block: "Workouts Dashboard"
- Test name: "session card date matches the createdAt returned by the API"
- TC number: TC-072
- Fixture: pageWithApi
- Setup:
  1. `const { page, api } = pageWithApi;`
  2. `const createRes = await api.createSession([exercise()]); const created = await createRes.json();`
- Steps:
  1. `const workoutsPage = new WorkoutsPage(page); await workoutsPage.goto(); await workoutsPage.waitForSessions();`
  2. `const text = (await workoutsPage.sessionDate(0).textContent())?.trim() ?? '';`
- Assertions:
  - `await expect(workoutsPage.sessionDate(0)).toBeVisible();`
  - `expect(text).not.toMatch(/undefined|null|NaN/i);` — guard against the placeholder bug.
  - `expect(text).toMatch(/\d{4}/);` — contains a 4-digit year.
  - `const createdYear = new Date(created.createdAt).getFullYear().toString(); expect(text).toContain(createdYear);` — rendered date is in the same year as the API's `createdAt`.

## SPEC-011 (from GAP-011)
- Type: ui
- File: tests/ui/workouts.spec.ts
- Describe block: "Workouts Dashboard"
- Test name: "user B does not see user A sessions on the dashboard"
- TC number: TC-073
- Fixture: page, api
- Setup:
  1. Create user A and a session for them via API:
     - `const usernameA = uniqueUsername();`
     - `await api.register(usernameA, TEST_PASSWORD);`
     - `const loginA = await api.login(usernameA, TEST_PASSWORD); const userA: User = await loginA.json();`
     - `const apiA = api.withToken(userA.token!);`
     - `await apiA.createSession([exercise('DEADLIFT')]);`
  2. Create user B (will log in via UI):
     - `const usernameB = uniqueUsername();`
     - `await api.register(usernameB, TEST_PASSWORD);`
- Steps:
  1. `const loginPage = new LoginPage(page); await loginPage.goto();`
  2. `await loginPage.login(usernameB, TEST_PASSWORD);`
  3. `await page.waitForURL('/');`
  4. `const workoutsPage = new WorkoutsPage(page); await workoutsPage.goto(); await workoutsPage.waitForSessions();`
- Assertions:
  - `await expect(workoutsPage.sessionCards).toHaveCount(0);` — user B sees none of user A's sessions in the rendered DOM.
  - `await expect(workoutsPage.emptyState).toBeVisible();` — empty state is shown.

## SPEC-012 (from GAP-012)
- Type: ui
- File: tests/ui/workouts.spec.ts
- Describe block: "Workouts Dashboard"
- Test name: "delete button opens confirmation dialog and does not delete until confirmed"
- TC number: TC-074
- Fixture: pageWithApi
- Setup:
  1. `const { page, api } = pageWithApi;`
  2. `await api.createSession([exercise()]);`
- Steps:
  1. `const workoutsPage = new WorkoutsPage(page); await workoutsPage.goto(); await workoutsPage.waitForSessions();`
  2. `await expect(workoutsPage.sessionCards).toHaveCount(1);`
  3. `await workoutsPage.deleteButton(0).click();` — opens the confirm dialog, do NOT click confirm.
- Assertions:
  - `await expect(workoutsPage.confirmDeleteButton).toBeVisible();` — the "Delete" confirm button is shown.
  - `await expect(workoutsPage.cancelDeleteButton).toBeVisible();` — the "Cancel" button is shown.
  - `await expect(workoutsPage.sessionCards).toHaveCount(1);` — session is still present (not deleted before confirm).
  - As an additional guard, verify no DELETE request fired in this window:
    `const deleteRequests: string[] = []; page.on('request', (r) => { if (r.method() === 'DELETE' && r.url().includes('/api/workout-sessions/')) deleteRequests.push(r.url()); }); await page.waitForTimeout(300); expect(deleteRequests).toHaveLength(0);`
    (Attach the listener before clicking the delete button.)

## SPEC-013 (from GAP-013)
- Type: ui
- File: tests/ui/workouts.spec.ts
- Describe block: "Workouts Dashboard"
- Test name: "every session card has a visible delete button when multiple sessions exist"
- TC number: TC-075
- Fixture: pageWithApi
- Setup:
  1. `const { page, api } = pageWithApi;`
  2. `await api.createSession([exercise('BENCH_PRESS')]);`
  3. `await api.createSession([exercise('DEADLIFT')]);`
  4. `await api.createSession([exercise('BACK_SQUAT')]);`
- Steps:
  1. `const workoutsPage = new WorkoutsPage(page); await workoutsPage.goto(); await workoutsPage.waitForSessions();`
  2. `await expect(workoutsPage.sessionCards).toHaveCount(3);`
- Assertions:
  - `await expect(workoutsPage.deleteButton(0)).toBeVisible();`
  - `await expect(workoutsPage.deleteButton(1)).toBeVisible();`
  - `await expect(workoutsPage.deleteButton(2)).toBeVisible();`
  - Cross-check via locator chain: `await expect(workoutsPage.sessionCards.locator('.delete-btn')).toHaveCount(3);` — there is exactly one delete button per card.

## SPEC-014 (from GAP-014)
- Type: api
- File: tests/api/workout-sessions.spec.ts
- Describe block: "POST /api/workout-sessions"
- Test name: "returns 400 when a required exercise field is missing"
- TC number: TC-076
- Fixture: authenticatedApi
- Setup: none — fixture provides a fresh authenticated client.
- Steps: parameterise across the four required fields on `WorkoutEntryRequest` (`exerciseType`, `sets`, `reps`, `weight`). Recommended structure:
  ```
  const missingFieldCases: Array<keyof WorkoutEntryRequest> = ['exerciseType', 'sets', 'reps', 'weight'];
  for (const field of missingFieldCases) {
    test(`returns 400 when ${field} is missing`, async ({ authenticatedApi }) => {
      const full = { exerciseType: 'BENCH_PRESS', sets: 3, reps: 10, weight: 80 };
      const { [field]: _omitted, ...partial } = full;
      const res = await authenticatedApi.createSession([partial as never]);
      expect(res.status()).toBe(400);
    });
  }
  ```
  Alternatively, four sibling tests with explicit names — implementation choice for the writer. Either way, all four cases must run.
- Assertions:
  - For each of the four omitted fields: `expect(res.status()).toBe(400);`
  - Optional sanity (only if the writer wants tighter coverage): assert the response body contains a validation error message referencing the missing field, but only if existing tests in the suite establish that body-shape contract — otherwise stick to the status code per the suite's existing convention (TC-016/017/019 only check status).
