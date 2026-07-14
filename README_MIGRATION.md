# cloudproj → Vercel + Supabase migration (Hobby-plan compatible: 8 functions)

Same conversion as before (Express + Azure SQL → Vercel serverless + Supabase
Postgres), but consolidated from 28 one-file-per-endpoint functions down to
**8**, to fit under the Hobby plan's 12-function-per-deployment cap. Each
domain is now one (or two) catch-all function(s) that does its own internal
routing on path + method, the same way the original Express router
dispatched — nothing about behavior changed, only how many separate Vercel
functions it compiles into.

## Function map (8 total, `_lib/*` doesn't count — Vercel excludes
underscore-prefixed folders from function detection)

| File | Handles |
|---|---|
| `api/auth/[...slug].js` | `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/verify/:token` |
| `api/note/[...slug].js` | all 11: `save/:id`, `load/:id`, `create`, `remove/:id`, `all`, `dashboard`, `name/:id`, `graph`, `protect/:id`, `notebook/:id`, `divide` |
| `api/user/[...slug].js` | `info`, `profile`, `password`, `picture` (all under `/api/user/...`) |
| `api/tasks/index.js` | `GET /api/tasks`, `POST /api/tasks` (bare path, no extra segment) |
| `api/tasks/[...slug].js` | `DELETE /api/tasks/all`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id` |
| `api/notebooks/index.js` | `GET /api/notebooks`, `POST /api/notebooks` (bare path) |
| `api/notebooks/[...slug].js` | `PUT /api/notebooks/:id`, `DELETE /api/notebooks/:id`, `GET /api/notebooks/:id/notes` |
| `api/note-actions/[...slug].js` | `highlight/:id`, `divide/:id`, `extract-tasks`, `create-tasks` |

**Why `index.js` + `[...slug].js` split for tasks/notebooks instead of one
optional catch-all:** those two are the only domains where a bare path with
zero extra segments (`/api/tasks`, `/api/notebooks`) is itself a real route.
Rather than rely on Vercel's optional catch-all (`[[...slug]].js`) correctly
matching a zero-segment request — which is a Next.js convention Vercel
inherited but wasn't worth staking a production deploy on without testing —
this uses the same literal-file-plus-catch-all pattern that already worked
in the non-consolidated version: Vercel always resolves an exact filename
match (`index.js`) before falling through to a dynamic one in the same
folder, so there's no routing ambiguity for either case.

## Everything else is unchanged from before

Same env vars (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `EMAIL_USER`,
`EMAIL_PASS`, `APP_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`,
`ENCRYPTION_SECRET`), same `postgres-db.sql` schema, same `vercel.json`
negative-lookahead rewrite, same `bcryptjs` swap, same frontend `/api`
relative base path. Apply steps are identical to before: copy into the
branch, delete `backend/` and `staticwebapp.config.json`, run the SQL
schema, set env vars, deploy.

## Verifying no 404s from the routing change

Because so much now hinges on correct path parsing inside each function,
test at least one route per HTTP-method branch in each file, not just one
request per domain:

```bash
# auth — expect 400/409/401, not 404 (means it reached the right branch)
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://<domain>/api/auth/login -d '{}' -H "Content-Type: application/json"

# note — expect 401 (no token), not 404
curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/api/note/all

# tasks bare path — expect 401, not 404 or 405
curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/api/tasks

# tasks with id — expect 401, not 404
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE https://<domain>/api/tasks/5

# tasks/all — expect 401, not 404 (confirms literal "all" doesn't get
# swallowed by the [id]-style branch inside the catch-all)
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE https://<domain>/api/tasks/all

# notebooks bare path — expect 401
curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/api/notebooks

# notebooks/:id/notes — expect 401, not 404
curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/api/notebooks/1/notes
```

A `404 Not Found` on any of these (instead of `401`/`400`/`405`) means the
request either isn't reaching the function at all (check `vercel.json` and
the Functions tab first) or is reaching it but falling through every branch
inside the catch-all (check the `slug` array shape for that specific route —
add a temporary `console.log(req.query.slug, req.method)` at the top of the
handler and check Vercel's Function Logs on a real request if a specific
route keeps 404ing).

Then run the same full manual pass as before: signup → verify → login →
notes/notebooks/tasks CRUD → graph → highlight → divide → extract-tasks.
