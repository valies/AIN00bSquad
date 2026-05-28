```markdown
## FT-1: User registration

**As a** new visitor to FitTrack
**I want** to create an account with a username and password
**so that** I can log and track my own workouts.

**Acceptance criteria:**
- A "Create Account" view is reachable from the login page.
- The user provides a username and a password and submits the form.
- If the username is already taken, the user sees a clear error and the account is not created.
- On successful registration, the user lands in the app ready to use it.
- The username must be unique across all accounts.

**Notes from refinement:**
- Password reset and "forgot password" are out of scope for this sprint.
- Email collection is out of scope — only username and password for now.
- The team agreed not to add a separate "registration successful, please log in" screen — the experience should feel continuous.

### Test Coverage
- TC-029 `[UI · auth.spec] toggle switches to registration form`
- TC-031 `[UI · auth.spec] successful registration lands on home and shows authenticated nav`
- TC-036 `[UI · auth.spec] duplicate username on registration shows error alert`
- TC-002 `[API · auth.spec] registers a new user and returns id + username`
- TC-003 `[API · auth.spec] returns 400 when username is already taken`
- TC-004 `[API · auth.spec] returns 400 when username is empty`
- TC-005 `[API · auth.spec] returns 400 when password is empty`
```
```markdown
## FT-2: Log in and receive a session token

**As a** returning user
**I want** to log in with my username and password
**so that** I can access my dashboard and log new workouts.

**Acceptance criteria:**
- The login page accepts a username and password.
- Submitting valid credentials returns a token the client uses for subsequent requests.
- Invalid credentials show the user a clear error message; the form remains usable.
- The token is sent on every authenticated API request as an `Authorization: Bearer ` header.
- While the request is in flight, the form is disabled and a loading indicator is shown.

**Notes from refinement:**
- The login and registration screens share a layout; the user toggles between them via a footer link.
- Account lockout and rate limiting will be revisited under the broader security follow-up — not this sprint.
- Two-factor authentication / SSO is out of scope.

### Test Coverage
- TC-028 `[UI · auth.spec] login page shows Sign In form by default`
- TC-030 `[UI · auth.spec] successful login lands on home and shows authenticated nav`
- TC-032 `[UI · auth.spec] wrong password shows error alert`
- TC-033 `[UI · auth.spec] form remains usable after failed login`
- TC-037 `[UI · auth.spec] login form is disabled while request is in flight`
- TC-006 `[API · auth.spec] returns a UUID token on successful login`
- TC-007 `[API · auth.spec] returns 401 for wrong password`
- TC-008 `[API · auth.spec] returns 401 for unknown username`
```
```markdown
## FT-3: Logout and protected pages

**As a** logged-in user
**I want** the dashboard and workout logging pages to be available only to me when I'm signed in, and to log out cleanly when I'm done
**so that** my workout data is not visible to anyone using a shared device.

**Acceptance criteria:**
- A "Logout" action is available in the navigation bar when the user is signed in.
- Logging out returns the user to a public page and clears their session client-side.
- The dashboard (`/workouts`) and workout-logging page (`/log-workout`) are not accessible to unauthenticated users — they are redirected to the login page.
- Public pages (home, login) remain accessible whether signed in or not.
- The navigation bar reflects auth state: signed-out users see "Sign In" / "Get Started"; signed-in users see "Dashboard", "Log Workout", and "Logout".

**Notes from refinement:**
- We'll add a session-expiry banner ("your session has ended, please log in again") in a follow-up — not part of this ticket.

### Test Coverage
- TC-034 `[UI · auth.spec] logout clears session and shows unauthenticated nav`
- TC-035 `[UI · auth.spec] protected route redirects unauthenticated users to login`
- TC-038 `[UI · auth.spec] /log-workout redirects unauthenticated users to /login`
- TC-039 `[UI · auth.spec] unauthenticated nav shows Sign In and Get Started`
- TC-040 `[UI · auth.spec] authenticated nav shows Dashboard, Log Workout, and Logout`
- TC-009 `[API · auth.spec] returns 200 when authenticated`
```
```markdown
## FT-4: Log a workout session

**As a** logged-in user
**I want** to record a workout consisting of one or more exercises with sets, reps, and weight
**so that** I can keep a history of what I lifted and when.

**Acceptance criteria:**
- The user can build a session by adding exercises one at a time, then saving the session as a unit.
- Supported exercises in this sprint: **Deadlift**, **Back Squat**, **Bench Press**.
- For each exercise, the user enters sets, reps, and weight. All three are required and must be positive numbers.
- The user can remove an exercise from the staged list before saving.
- The user cannot save an empty session.
- After a successful save, the user sees confirmation and the form resets so they can log another session.
- Exercises within a saved session are stored in the order they were added.

**Notes from refinement:**
- We discussed editing a saved session — deferred. For now a user who made a mistake will need to delete the session and re-log it (see FT-6).
- A kg/lbs toggle was raised but pushed to a future sprint; we're sticking with the gym's house unit for now.
- Adding more exercise types (overhead press, rows, etc.) is a separate backlog item.

### Test Coverage
- TC-041 `[UI · log-workout.spec] shows the exercise form`
- TC-051 `[UI · log-workout.spec] exercise type dropdown offers all three supported exercises`
- TC-043 `[UI · log-workout.spec] adds an exercise to the list`
- TC-044 `[UI · log-workout.spec] adds multiple exercises to the list`
- TC-042 `[UI · log-workout.spec] shows validation errors when submitting empty exercise`
- TC-050 `[UI · log-workout.spec] negative/zero values are rejected`
- TC-048 `[UI · log-workout.spec] removes exercise from staged list`
- TC-047 `[UI · log-workout.spec] save button is disabled when no exercises have been added`
- TC-045 `[UI · log-workout.spec] saves a session and shows success message`
- TC-049 `[UI · log-workout.spec] form resets after successful save`
- TC-046 `[UI · log-workout.spec] saved session appears on the workouts dashboard`
- TC-014 `[API · workout-sessions.spec] creates a session with one exercise`
- TC-015 `[API · workout-sessions.spec] creates a session with multiple exercises`
- TC-016 `[API · workout-sessions.spec] returns 400 for an invalid exercise type`
- TC-017 `[API · workout-sessions.spec] returns 400 when exercises array is empty`
- TC-019 `[API · workout-sessions.spec] returns 400 when more than 20 exercises are submitted`
- TC-018 `[API · workout-sessions.spec] returns 401 without a token (POST)`
```
```markdown
## FT-5: Workout history dashboard

**As a** logged-in user
**I want** to see a list of my previous workout sessions
**so that** I can review my training history at a glance.

**Acceptance criteria:**
- The dashboard lists the user's sessions, most recent first.
- Each session card shows the date it was logged and, for every exercise in that session, the sets × reps and the weight used.
- The number of exercises in a session is visible on the card.
- If the user has no workouts yet, they see an empty state encouraging them to log their first one.
- While the data is loading, the user sees a loading indicator. If loading fails, the user sees an error message.
- A user only sees their own sessions.

**Notes from refinement:**
- Filtering, search, and per-exercise progress charts are out of scope — that's the next epic.
- Pagination will be added if dashboards start getting slow, but not now.

### Test Coverage
- TC-053 `[UI · workouts.spec] shows session cards after creating sessions via API`
- TC-056 `[UI · workouts.spec] sessions listed most recent first`
- TC-057 `[UI · workouts.spec] session card shows a date`
- TC-058 `[UI · workouts.spec] session card shows sets, reps, and weight`
- TC-054 `[UI · workouts.spec] session card shows exercise names`
- TC-059 `[UI · workouts.spec] session card shows exercise count`
- TC-052 `[UI · workouts.spec] shows empty state when user has no sessions`
- TC-060 `[UI · workouts.spec] loading indicator shown while sessions fetch`
- TC-061 `[UI · workouts.spec] error message shown if sessions fetch fails`
- TC-026 `[API · workout-sessions.spec] GET /api/workout-sessions returns only sessions for the authenticated user`
- TC-011 `[API · workout-sessions.spec] returns empty array for a new user`
- TC-013 `[API · workout-sessions.spec] returns sessions after creating one`
- TC-012 `[API · workout-sessions.spec] returns 401 without a token (GET)`
```
```markdown
## FT-6: Delete a workout from the dashboard

**As a** logged-in user
**I want** to remove a workout session I no longer want in my history
**so that** I can clean up mis-logged or duplicate entries.

**Acceptance criteria:**
- Each session card on the dashboard offers a delete affordance (e.g. a bin icon).
- Triggering delete asks the user to confirm before the workout is removed — we don't want accidental deletions.
- On confirmation, the session is removed from the database and disappears from the dashboard.
- A user can only delete their own sessions; attempting to delete someone else's must not succeed.
- Cancelling the confirmation leaves the workout untouched.

**Notes from refinement:**
- Undo / soft-delete is out of scope — deletions are permanent.
- We're not supporting deleting individual exercises within a session; the unit of deletion is the whole session.
- Bulk delete (select multiple) is not in this sprint.

### Test Coverage
- TC-055 `[UI · workouts.spec] deletes a session when delete button is clicked`
- TC-062 `[UI · workouts.spec] cancelling delete confirmation leaves session untouched`
- TC-023 `[API · workout-sessions.spec] deletes a session and returns 204`
- TC-027 `[API · workout-sessions.spec] user cannot delete another user session`
- TC-024 `[API · workout-sessions.spec] returns 404 for an unknown id (DELETE)`
- TC-025 `[API · workout-sessions.spec] returns 401 without a token (DELETE)`
```
---
 