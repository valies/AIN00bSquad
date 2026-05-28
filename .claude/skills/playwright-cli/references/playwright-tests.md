# Running Playwright Tests

To run Playwright tests, use the `npx playwright test` command, or a package manager script. To avoid opening the interactive html report, use `PLAYWRIGHT_HTML_OPEN=never` environment variable.

## This project

```bash
# Run all tests (API + UI)
PLAYWRIGHT_HTML_OPEN=never npm run test

# Run only UI tests (project: ui, baseURL: http://localhost:5173)
PLAYWRIGHT_HTML_OPEN=never npm run test:ui

# Run only API tests (project: api, baseURL: http://localhost:8080)
PLAYWRIGHT_HTML_OPEN=never npm run test:api

# Run headed (browser visible)
PLAYWRIGHT_HTML_OPEN=never npm run test:headed

# Filter by project inline
PLAYWRIGHT_HTML_OPEN=never npx playwright test --project=ui
PLAYWRIGHT_HTML_OPEN=never npx playwright test --project=api
```

Environment variables (defaults already set in `playwright.config.ts`):
- `FRONTEND_URL` — default `http://localhost:5173`
- `BACKEND_URL` — default `http://localhost:8080`

## General

```bash
# Run all tests
PLAYWRIGHT_HTML_OPEN=never npx playwright test

# Run all tests through a custom npm script
PLAYWRIGHT_HTML_OPEN=never npm run special-test-command
```

# Debugging Playwright Tests

To debug a failing Playwright test, run it with `--debug=cli` option. This command will pause the test at the start and print the debugging instructions.

**IMPORTANT**: run the command in the background and check the output until "Debugging Instructions" is printed. Make sure to stop the command after you have finished.

Once instructions containing a session name are printed, use `playwright-cli` to attach the session and explore the page.

```bash
# Run the test
PLAYWRIGHT_HTML_OPEN=never npx playwright test --debug=cli
# ...
# ... debugging instructions for "tw-abcdef" session ...
# ...

# Attach to the test
playwright-cli attach tw-abcdef
```

Keep the test running in the background while you explore and look for a fix.
The test is paused at the start, so you should step over or pause at a particular location
where the problem is most likely to be.

Every action you perform with `playwright-cli` generates corresponding Playwright TypeScript code.
This code appears in the output and can be copied directly into the test. Most of the time, a specific locator or an expectation should be updated, but it could also be a bug in the app. Use your judgement.

After fixing the test, stop the background test run. Rerun to check that test passes.
