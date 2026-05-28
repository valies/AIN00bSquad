# AIN00bSquad — Claude Code Guidelines

This is the Playwright E2E test suite for FitTrack.

## Project Context

- **Frontend:** React + Vite, runs on port 5173
- **Backend:** Spring Boot, runs on port 8080
- **Database:** PostgreSQL, port 5432
- All three services run via Docker — start with `docker compose up` before running tests.

## Auth

- Auth token is stored in `sessionStorage` under the key `"user"` (not localStorage).
- Token format: UUID Bearer token. Header: `Authorization: Bearer <token>`.
- Shape: `{ id, username, createdAt, token }`.
- After login, the app navigates to `/` (home), not `/workouts`.

## Routes

| Path | Access |
|---|---|
| `/` | Public (Home) |
| `/login` | Public |
| `/workouts` | Protected (dashboard) |
| `/log-workout` | Protected (form) |

## API Reference

Swagger UI: http://localhost:8080/swagger-ui/index.html
OpenAPI spec: http://localhost:8080/v3/api-docs

All authenticated endpoints require header: `Authorization: Bearer <token>`.

### Authentication

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{ username, password }` | 201 (no token), 400 |
| POST | `/api/auth/login` | `{ username, password }` | 200 (includes token), 401 |
| POST | `/api/auth/logout` | — | 200 |

### Workout Sessions (primary)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/workout-sessions` | — | 200, 401 |
| POST | `/api/workout-sessions` | `WorkoutSessionRequest` | 201, 400, 401 |
| GET | `/api/workout-sessions/{id}` | — | 200, 401, 404 |
| DELETE | `/api/workout-sessions/{id}` | — | 204, 401, 404 |

### Workouts (legacy — single-entry sessions)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/workouts` | — | 200, 401 |
| POST | `/api/workouts` | `WorkoutRequest` | 201, 400, 401 |
| GET | `/api/workouts/{id}` | — | 200, 401, 404 |

### Health

| Method | Path | Response |
|---|---|---|
| GET | `/health` | 200 `{ key: string }` |

### Request Schemas

```
WorkoutSessionRequest:
  exercises: WorkoutEntryRequest[]  // 1–20 items, required

WorkoutEntryRequest / WorkoutRequest:
  exerciseType: string   // required — DEADLIFT | BACK_SQUAT | BENCH_PRESS (uppercase, others → 400)
  sets:         integer  // required
  reps:         integer  // required
  weight:       integer  // required

RegisterRequest / LoginRequest:
  username: string  // required, min 1
  password: string  // required, min 1
```

### Key Behaviors

- `POST /api/auth/register` returns 201 with no token — login separately to get a token.
- Workout session delete has a two-step confirmation dialog in the UI — tests must handle both steps.

## Test Constraints

- Do not skip or comment out failing tests. Fix the root cause.
- Do not mock auth or API responses unless the test is explicitly a unit test.
- Always set up and tear down test data cleanly — do not rely on leftover state.
- Use page object models from `pages/` — do not repeat selectors inline.
- Fixtures live in `fixtures/` — reuse them rather than duplicating setup logic.

## File Scope

- Test files belong in `tests/`.
- Page objects belong in `pages/`.
- Shared utilities belong in `utils/`.
- Do not modify `playwright.config.ts` without explicit instruction.

## Behavior Constraints

- Never commit changes unless explicitly instructed to do so.
- Never push to any remote unless explicitly asked. Always confirm the target branch before pushing.
- Never use `--force` or `--force-with-lease` on shared branches (main, master, develop) without explicit instruction.
- Never amend published commits. Create a new commit instead.
- Never skip pre-commit hooks (`--no-verify`) unless the user explicitly asks.
- Never delete files, branches, or database records without explicit confirmation.
- Never modify `.env` files, secrets, or credential files. Never commit them.
- Never install or remove packages without asking first.

## Scope Rules

- Prefer editing existing files over creating new ones.
- Do not create documentation files (README, CHANGELOG, etc.) unless explicitly asked.
- Do not refactor, clean up, or rename things beyond what the task requires.
- Do not add features, error handling, or abstractions that were not requested.
- Do not leave placeholder comments like `// TODO: implement this`.

## Code Style

- Default to writing no comments. Only add one when the **why** is non-obvious (hidden constraint, workaround, subtle invariant).
- Never write multi-line comment blocks or docstrings explaining what the code does.
- Do not add trailing summaries like "I've made the following changes..." — the diff speaks for itself.
- Keep responses concise. No unnecessary preamble.

## Git Workflow

- Always run `git status` and `git diff` before proposing a commit.
- Stage specific files by name — never use `git add -A` or `git add .` blindly.
- Commit messages should explain the **why**, not the what.
- Prefer one focused commit per logical change.
- Never cherry-pick, rebase interactively, or reset hard without explicit instruction.

## Security

- Never generate or log secrets, tokens, or credentials.
- Never introduce SQL injection, XSS, command injection, or other OWASP Top 10 vulnerabilities.
- Never use `eval`, `exec`, or dynamic code execution without explicit justification.
- Validate input at system boundaries (user input, external APIs). Trust internal code.

## When in Doubt

- Ask before taking irreversible or high-blast-radius actions.
- Prefer the reversible option when two approaches achieve the same goal.
- If you hit an unexpected state (unfamiliar files, locks, branches), investigate before overwriting.
