# Frontend Tests Added — 2026-05-28 13:00 UTC

## Page object changes
- pages/login.page.ts: added locator `loadingIndicator` → `.auth-submit-btn` with `hasText: 'Processing...'` (verified via live DOM inspection — the app reuses the submit button to convey loading state; no separate spinner/aria-busy element exists)

## Added
- TC-063: successful registration persists session token and authenticates subsequent API calls → tests/ui/auth.spec.ts (line ~161)
- TC-064: authenticated client sends Authorization Bearer header on protected API requests → tests/ui/auth.spec.ts (line ~184)
- TC-065: login form inputs are disabled and loading indicator visible while request is in flight → tests/ui/auth.spec.ts (line ~209)
- TC-066: logout removes user from sessionStorage → tests/ui/auth.spec.ts (line ~233)
- TC-067: authenticated user can still access public pages (home and login) → tests/ui/auth.spec.ts (line ~249)
- TC-068: invalid token in sessionStorage redirects from protected route to login → tests/ui/auth.spec.ts (line ~262)
- TC-069: exercises persist in the order they were added when viewed on dashboard → tests/ui/log-workout.spec.ts (line ~138)
- TC-070: missing single field (sets | reps | weight) shows a validation error → tests/ui/log-workout.spec.ts (line ~159)
- TC-071: individual form inputs reset to empty/default after successful save → tests/ui/log-workout.spec.ts (line ~191)
- TC-072: session card date matches the createdAt returned by the API → tests/ui/workouts.spec.ts (line ~155)
- TC-073: user B does not see user A sessions on the dashboard → tests/ui/workouts.spec.ts (line ~173)
- TC-074: delete button opens confirmation dialog and does not delete until confirmed → tests/ui/workouts.spec.ts (line ~198)
- TC-075: every session card has a visible delete button when multiple sessions exist → tests/ui/workouts.spec.ts (line ~225)

## Skipped (reason)
- SPEC-014 (TC-076): Type is `api`, not `ui` — out of scope for the Frontend Test Generator. Handled by the Backend Test Generator (target file `tests/api/workout-sessions.spec.ts`).

## Notes
- TC-068 asserts redirect to `/login` per the spec. Live inspection showed the app currently keeps the URL at `/workouts` and renders an "Authentication required" error alert instead, so this test will surface that behavioural gap on first run (treat as a defect to investigate per the spec author's intent).
- TC-065 uses the new `LoginPage.loadingIndicator` locator backed by the button's "Processing..." text state, since the running app has no `.spinner`/`.loading-indicator`/`[aria-busy="true"]` element on the login form.
- TC-071's exerciseType assertion accepts both `''` and `'DEADLIFT'` per spec; live inspection confirmed the dropdown resets to `''` after save.
