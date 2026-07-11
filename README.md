# Note-Taking-WebApp-10pshine — Local Setup Guide

Full-stack note-taking app built for the 10Pearls internship program.

- **Frontend:** React 19 (Create React App), Bootstrap, Quill rich-text editor
- **Backend:** Node.js / Express 5, PostgreSQL (`pg`), JWT auth, Nodemailer (Gmail) for email verification
- **Tests:** Jest + Supertest + Sinon (backend), React Testing Library (frontend)

> The repo ships with a `postgres-db.sql` that only defines part of the `users`
> table and is missing the `notes` table and the email-verification columns
> the backend code actually requires. Use the corrected `postgres-db.sql`
> (and `.env.example`) provided alongside this README instead.

---

## 1. Prerequisites

| Tool | Notes |
|---|---|
| Node.js 18+ | Express 5 / React 19 need a reasonably recent Node |
| npm or yarn | Repo has both `package-lock.json` and `yarn.lock` — pick one per folder |
| PostgreSQL 13+ | Local install or a hosted instance (Supabase, Neon, RDS, etc.) |
| Gmail account | For sending signup verification emails (App Password required) |
| git | To clone the repo |

---

## 2. Clone the repo

```bash
git clone https://github.com/ramailkk/Note-Taking-WebApp-10pshine.git
cd Note-Taking-WebApp-10pshine
```

---

## 3. Set up the database

1. Create a database:
   ```bash
   createdb notetaker
   # or, inside psql:
   # CREATE DATABASE notetaker;
   ```
2. Run the corrected schema against it:
   ```bash
   psql -d notetaker -f postgres-db.sql
   ```
   This creates the `users` and `notes` tables, foreign keys, and search
   indexes that the backend queries expect (see `backend/models/*.js`).

---

## 4. Configure environment variables

The backend reads its config from `backend/.env` (via `dotenv`), but no
`.env.example` ships in the repo — the variables below were found by reading
`db2.js`, `utils/jwt.js`, `mail.js`, and `index.js` directly.

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/notetaker
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=1d
EMAIL_USER=youraddress@gmail.com
EMAIL_PASS=your_gmail_app_password
PORT=5000
```

Notes:
- `EMAIL_PASS` must be a [Gmail App Password](https://myaccount.google.com/apppasswords), not your normal login password (2FA must be enabled on the Google account).
- Without valid Gmail credentials, **signup will fail**, because `authController.js` calls `transporter.sendMail(...)` synchronously as part of the signup flow and does not catch/skip that error.
- The frontend does **not** need a `.env` — the API base URL is hardcoded to `http://localhost:5000` in `frontend/src/App/config.js` and `frontend/src/utils/api.js`.

---

## 5. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## 6. Run the app

**Backend** (from `backend/`):
```bash
node index.js
```
Runs at `http://localhost:5000`. There's no `dev`/`start` script defined in `backend/package.json` — either run `node index.js` directly, or install `nodemon` yourself for auto-reload (`npx nodemon index.js`).

**Frontend** (from `frontend/`, in a separate terminal):
```bash
npm start
```
Runs at `http://localhost:3000`. The backend's CORS config (`index.js`) only allows this exact origin, so keep the frontend on port 3000.

---

## 7. Verify it's working

1. Open `http://localhost:3000`.
2. Sign up with a username/email/password.
3. Check the inbox of the email you signed up with — you should receive a
   "Verify your email" message. Click the link (points to
   `http://localhost:5000/auth/verify/:token`).
4. Log in. Login is blocked until `is_verified = true` for that account.
5. Create, edit, rename, search, and delete notes from the dashboard.

---

## 8. Running tests

Backend tests are fully mocked (Sinon stubs the DB and mailer), so **no live database is required**:

```bash
cd backend
npm test
```

Frontend tests:
```bash
cd frontend
npm test
```

---

## Project structure

```
.
├── postgres-db.sql          # DB schema (corrected — see note above)
├── backend/
│   ├── index.js              # Express app entry point
│   ├── db2.js                 # pg Pool, reads DATABASE_URL
│   ├── mail.js                 # nodemailer transporter (Gmail)
│   ├── controllers/            # auth, notes, profile logic
│   ├── models/                 # raw SQL queries (users, notes)
│   ├── routes/                 # /auth, /note, /user
│   ├── middlewares/verifyToken.js
│   └── tests/                   # Jest + Supertest + Sinon
└── frontend/
    └── src/                     # React app (Quill editor, dashboard, auth pages)
```

## API overview

| Method | Route | Auth required | Purpose |
|---|---|---|---|
| POST | `/auth/signup` | No | Create account, sends verification email |
| GET | `/auth/verify/:token` | No | Verifies email from the link |
| POST | `/auth/login` | No | Returns JWT |
| GET | `/user/info` | Yes | Current user's profile |
| GET | `/note/all` | Yes | List all notes (id/name/dates only) |
| GET | `/note/dashboard` | Yes | Paginated/sortable/searchable note list |
| GET | `/note/load/:noteId` | Yes | Load a note's HTML content |
| PUT | `/note/save/:noteId` | Yes | Save HTML content |
| PUT | `/note/name/:noteId` | Yes | Rename a note |
| POST | `/note/create` | Yes | Create a blank note |
| DELETE | `/note/remove/:noteId` | Yes | Delete a note |

Authenticated routes expect `Authorization: Bearer <JWT>`.
