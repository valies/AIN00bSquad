# Test Run Report — 2026-05-28 13:28 UTC

## Result
78 passed, 1 failed (79 total)

## Failures

### invalid token in sessionStorage redirects from protected route to login (TC-068)
- File: tests/ui/auth.spec.ts:263
- Error: `expect(page).toHaveURL("/login")` failed — page stayed at `http://localhost:5173/workouts`.
- Root cause: app bug — the route guard for `/workouts` only checks whether `sessionStorage.user` exists, it does not validate the token against the backend. An invalid/expired token is treated as authenticated.
- Action taken: reported (test left unchanged — it asserts the AC, not buggy behavior).

### logout removes user from sessionStorage (TC-066) — fixed during this run
- File: tests/ui/auth.spec.ts:233
- Error (initial): `sessionStorage.getItem('user')` returned the user JSON instead of `null` immediately after `waitForURL('/')`.
- Root cause: timing — the logout handler clears `sessionStorage` after the `POST /api/auth/logout` response, but `BasePage.logout()` only waits for the client-side URL change. Manual verification confirmed the storage is cleared shortly after.
- Action taken: fixed.

## Fixes applied
- `tests/ui/auth.spec.ts:233` (TC-066): replaced the one-shot `expect(after).toBeNull()` with `expect.poll(...).toBeNull()` so the assertion waits for the eventually-consistent sessionStorage clear after the logout API call returns. Test now passes reliably.

## Potential app bugs (requires dev attention)
- **TC-068 `invalid token in sessionStorage redirects from protected route to login`**: the test seeds `sessionStorage.user` with a syntactically valid but unknown token (`11111111-1111-1111-1111-111111111111`) and navigates to `/workouts`. The app renders the dashboard instead of redirecting to `/login`.
  - AC reference (FT-3): "The dashboard (`/workouts`) and workout-logging page (`/log-workout`) are not accessible to unauthenticated users — they are redirected to the login page." A user holding an invalid/forged token is effectively unauthenticated, so the route guard should redirect.
  - The FT-3 refinement notes flag session-expiry UX ("your session has ended…") as a follow-up — but the underlying guard behavior (don't render protected pages with a bad token) is the security boundary covered by this AC and should be in scope.
  - Suggested fix: have the protected-route guard validate the token (e.g. call `GET /api/workout-sessions` or a dedicated `/me` endpoint) on mount; on 401, clear sessionStorage and redirect to `/login`.

## Final count
**78 passed, 1 failed** (1 remaining failure is the reported app bug TC-068).
