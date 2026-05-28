# Gap Analysis — 2026-05-28 12:27 UTC

## Summary

Acceptance criteria reviewed across FT-1 through FT-6 (six user stories, ~35 individual criteria).

- **Fully covered:** 21
- **Partially covered:** 8
- **Missing:** 6

Total gaps identified: **14** (8 partial + 6 missing). Additional cross-cutting concern: 1 API-spec field-validation gap (`POST /api/workout-sessions` does not test individually missing `sets`/`reps`/`weight` fields, all marked required by Swagger).

Gap count by user story: FT-1: 1, FT-2: 2, FT-3: 3, FT-4: 3, FT-5: 2, FT-6: 2, Cross-cutting (Swagger): 1.
Gap count by type: UI-only: 9, API-only: 2, both: 4.

---

## Gaps

### GAP-001
- User story: FT-1
- Acceptance criterion: "On successful registration, the user lands in the app ready to use it." (combined with refinement note: "no separate 'registration successful, please log in' screen — the experience should feel continuous")
- Coverage status: partial
- Existing tests: TC-031 (verifies landing on `/` and that authenticated nav is visible)
- Required test: Verify that, immediately after UI registration, a session token has been persisted to `sessionStorage` under the key `"user"` (per CLAUDE.md auth contract) and that an authenticated API call (e.g. `GET /api/workout-sessions`) succeeds from the same browser context without a separate login step. This proves the "continuous experience" — registration auto-logs the user in. Currently TC-031 only checks the nav state, which is a weak proxy.
- Type: ui

### GAP-002
- User story: FT-2
- Acceptance criterion: "The token is sent on every authenticated API request as an `Authorization: Bearer` header."
- Coverage status: missing
- Existing tests: none
- Required test: Add a UI test that logs in, then intercepts subsequent requests to an authenticated endpoint (e.g. `GET /api/workout-sessions` when navigating to `/workouts`) and asserts the outgoing request carries `Authorization: Bearer <uuid-token>`. This is the contract the spec calls out explicitly and no test currently verifies header propagation from the client.
- Type: ui

### GAP-003
- User story: FT-2
- Acceptance criterion: "While the request is in flight, the form is disabled and a loading indicator is shown."
- Coverage status: partial
- Existing tests: TC-037 (asserts submit button is disabled only)
- Required test: Extend or add a sibling test to TC-037 that also asserts the username and password inputs are disabled while the login request is in flight, AND that a loading indicator element (e.g. a spinner) is visible during the delay. The criterion has three parts (form disabled + inputs disabled + loading indicator visible) and TC-037 only covers one.
- Type: ui

### GAP-004
- User story: FT-3
- Acceptance criterion: "Logging out returns the user to a public page and clears their session client-side."
- Coverage status: partial
- Existing tests: TC-034 (verifies URL is `/` and unauthenticated nav is visible)
- Required test: After logout, assert that `sessionStorage.getItem('user')` is `null` (or the relevant key is removed) in the same browser context. The UI may visually update without actually clearing storage, which would be a real bug TC-034 cannot catch.
- Type: ui

### GAP-005
- User story: FT-3
- Acceptance criterion: "Public pages (home, login) remain accessible whether signed in or not."
- Coverage status: missing
- Existing tests: none
- Required test: While authenticated, navigate to `/` and `/login` and assert that the pages render correctly (no redirect away, no error). TC-035 and TC-038 cover the unauthenticated → redirect path for protected routes; the inverse case (authenticated user accessing public pages) is untested.
- Type: ui

### GAP-006
- User story: FT-3
- Acceptance criterion: "The dashboard (`/workouts`) and workout-logging page (`/log-workout`) are not accessible to unauthenticated users — they are redirected to the login page."
- Coverage status: partial
- Existing tests: TC-035 (`/workouts` redirect), TC-038 (`/log-workout` redirect)
- Required test: Add a test for the case where the user has an expired/invalid token in `sessionStorage` (not just no token at all) — i.e. seed sessionStorage with a malformed or expired-looking UUID and visit `/workouts`. The user should still be redirected to `/login`. TC-035/038 only cover the no-token case.
- Type: ui

### GAP-007
- User story: FT-4
- Acceptance criterion: "Exercises within a saved session are stored in the order they were added."
- Coverage status: partial
- Existing tests: TC-015 (API: creates a session with three exercises and asserts the returned array preserves order)
- Required test: A UI-driven test that adds exercises in a specific order via the form (e.g. BACK_SQUAT, then DEADLIFT, then BENCH_PRESS), saves the session, navigates to `/workouts`, and asserts the session card shows the three exercises in that exact order. The API test does not prove the UI sends them in order.
- Type: ui

### GAP-008
- User story: FT-4
- Acceptance criterion: "For each exercise, the user enters sets, reps, and weight. All three are required and must be positive numbers."
- Coverage status: partial
- Existing tests: TC-042 (all fields empty → errors), TC-050 (negative/zero values rejected)
- Required test: Per-field required-field tests at the UI — fill sets and reps but leave weight empty (and the symmetric two cases) and assert a field-specific validation error appears on the missing field. TC-042 only tests the all-empty case, so a single missing field could regress unnoticed.
- Type: ui

### GAP-009
- User story: FT-4
- Acceptance criterion: "After a successful save, the user sees confirmation and the form resets so they can log another session."
- Coverage status: partial
- Existing tests: TC-045 (success message visible), TC-049 (exercise list cleared, save button disabled)
- Required test: Extend the post-save assertions to verify the individual form inputs (`exerciseTypeSelect`, `setsInput`, `repsInput`, `weightInput`) are reset to their default/empty values, not just that the staged list is empty. The criterion says "the form resets", and the current tests only check the staged-exercises list resets.
- Type: ui

### GAP-010
- User story: FT-5
- Acceptance criterion: "Each session card shows the date it was logged."
- Coverage status: partial
- Existing tests: TC-057 (asserts the date element is visible)
- Required test: Tighten the assertion: the card should display a date that matches today's date (or the `createdAt` value returned by the API, formatted). TC-057 currently only checks `toBeVisible()`, which would pass even if the element contained the literal text "undefined" or a stale hardcoded date. Match against a regex like `/\d{4}/` or the formatted createdAt from the session response.
- Type: ui

### GAP-011
- User story: FT-5
- Acceptance criterion: "A user only sees their own sessions."
- Coverage status: partial
- Existing tests: TC-026 (API-level: user B sees empty list when only user A has sessions)
- Required test: A UI-level isolation test — user A creates a session via API, user B logs in via the UI, navigates to `/workouts`, and the dashboard shows the empty state (or at minimum, none of user A's sessions). This guards against the UI accidentally rendering all sessions (e.g. forgetting to filter by user) even if the API returns the right data.
- Type: ui

### GAP-012
- User story: FT-6
- Acceptance criterion: "Triggering delete asks the user to confirm before the workout is removed — we don't want accidental deletions."
- Coverage status: partial
- Existing tests: TC-055 (deletes via `deleteSession` helper which internally clicks confirm), TC-062 (cancel path)
- Required test: An explicit test that, after clicking the delete affordance on a session card, the confirmation dialog/prompt is visible AND the session is still present in the list (i.e. it is not deleted until the user confirms). This isolates the "are you sure" step from the helper that bundles click + confirm. Per CLAUDE.md, the delete has a two-step confirmation; the first step should be independently verified.
- Type: ui

### GAP-013
- User story: FT-6
- Acceptance criterion: "Each session card on the dashboard offers a delete affordance (e.g. a bin icon)."
- Coverage status: partial
- Existing tests: TC-055, TC-062 (both interact with the delete button, implicitly proving it exists on the first card only)
- Required test: When multiple session cards are rendered, each card has its own visible delete affordance. Create N>=2 sessions via API, render the dashboard, and assert `deleteButton` is visible on every card (not just card 0). This protects against UIs that render the delete control on only the first/last card.
- Type: ui

### GAP-014
- User story: FT-4 (also a Swagger spec gap)
- Acceptance criterion: "All three are required and must be positive numbers." (mapped to `WorkoutEntryRequest` schema in Swagger where `exerciseType`, `sets`, `reps`, `weight` are all `required`)
- Coverage status: missing
- Existing tests: TC-016 (invalid exerciseType), TC-017 (empty exercises array), TC-019 (>20 exercises). No test for individually missing required fields on `WorkoutEntryRequest`.
- Required test: API-level tests that submit a `POST /api/workout-sessions` with an exercise that has one of `exerciseType`, `sets`, `reps`, or `weight` omitted, and assert the response is 400. One parameterised test per missing field, or four sibling tests. The Swagger spec marks all four as required but the backend's enforcement is untested.
- Type: api
