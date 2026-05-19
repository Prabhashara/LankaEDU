# LankaEdu Online Examination Platform


LankaEdu is a full-stack online examination system for students, lecturers, and administrators. It supports exam creation, scheduling, timed attempts, reusable question banks, result publishing, analytics, PDF reports, staff management, audit logs, and light/dark themes.

## Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Run The Project](#run-the-project)
- [Demo Accounts](#demo-accounts)
- [Role Permissions](#role-permissions)
- [Question Bank Logic](#question-bank-logic)
- [API Summary](#api-summary)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)

## Features

Student features:

- Register and sign in with JWT authentication.
- View active exams and scheduled exam windows.
- Start timed exam attempts with answer saving.
- Submit attempts and view results.
- Download PDF result reports.
- View personal report card and attempt history.

Lecturer features:

- Create, edit, publish, archive, and delete own exams.
- Build questions for draft exams.
- Browse the shared question bank.
- Reuse questions from other lecturers into own draft exams.
- Edit or delete only questions created by the signed-in lecturer.
- View exam analytics, student submissions, and result details.

Admin features:

- Create lecturer and admin accounts.
- View all users in user management.
- Activate, deactivate, and delete users with safety checks.
- Keep at least one active admin account.
- View audit logs for important system activity.

General features:

- Light and dark theme support with theme-specific LankaEdu logos.
- Public home page with live platform summary data.
- Role-based routing and protected pages.
- Global API error handling and friendly validation errors.
- Supabase/Postgres-backed storage.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, React Router, Axios, Chart.js |
| Styling | Plain CSS with custom light/dark theme variables |
| Backend | Java 17, Spring Boot 3.3.5, Maven |
| Auth | JWT, bcrypt password hashing |
| Database | Supabase/Postgres |
| Reports | Apache PDFBox |

## Project Structure

```text
LankaEdu/
|-- Makefile
|-- README.md
|-- backend/
|   |-- pom.xml
|   |-- .env.example
|   `-- src/main/
|       |-- java/com/onlineexam/
|       |   |-- attempts/
|       |   |-- audit/
|       |   |-- auth/
|       |   |-- common/
|       |   |-- config/
|       |   |-- exams/
|       |   |-- questions/
|       |   |-- reports/
|       |   |-- results/
|       |   |-- users/
|       |   `-- OnlineExamApplication.java
|       `-- resources/application.properties
`-- frontend/
    |-- package.json
    |-- .env.example
    |-- index.html
    |-- vite.config.js
    |-- public/assets/
    |   |-- lankaedu-logo-dark.png
    |   `-- lankaedu-logo-light.png
    `-- src/
        |-- components/
        |-- pages/
        |-- services/
        `-- utils/
```

## Prerequisites

- Java 17 or newer
- Maven 3.9 or newer
- Node.js 18 or newer
- npm 9 or newer
- Supabase project or another reachable PostgreSQL database

## Environment Setup

Create environment files:

```bash
make env-setup
```

Or copy them manually:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Backend environment:

```env
PORT=5001
ALLOWED_ORIGIN=http://localhost:5173,http://localhost:5174
JWT_SECRET=replace_this_with_a_long_random_secret_at_least_32_chars
JWT_EXPIRES_IN=7d
APP_STORAGE=database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require
```

Frontend environment:

```env
VITE_API_URL=/api
VITE_PROXY_TARGET=http://localhost:5001
```

Use a strong `JWT_SECRET` in real deployments. Do not commit real `.env` files.

## Database Setup

The current application uses Supabase/Postgres as the only database. It stores authentication and user management records in `public.users`. Exams, questions, attempts, results, and audit events are stored as JSON collections in `public.app_json_store`.

The backend can create the required tables automatically when it starts, but running the SQL below in Supabase SQL Editor is recommended for a clean setup:

```sql
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text not null check (role in ('student', 'lecturer', 'admin')),
  student_id text,
  is_active boolean not null default true,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists users_email_lower_unique
  on public.users (lower(email));

create table if not exists public.app_json_store (
  store_key text primary key,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
```

Expected `app_json_store.store_key` values are:

- `exams.json`
- `questions.json`
- `attempts.json`
- `results.json`
- `audit.json`

If old `users.json` data exists in `app_json_store`, the backend migrates valid legacy users into `public.users` during startup or first user access.

## Run The Project

Install dependencies:

```bash
make install
```

Start backend and frontend together:

```bash
make dev
```

Or run each side separately:

```bash
make dev-backend
make dev-frontend
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`
- Health check: `http://localhost:5001/api/health`

## Demo Accounts

When `public.users` is empty, the backend seeds these accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `admin123` |
| Lecturer | `lecturer@example.com` | `lecturer123` |
| Student | `student@example.com` | `student123` |

Change or delete demo accounts before production use.

## Role Permissions

Admin:

- Access admin dashboard, user management, and audit logs.
- Create only lecturer or admin accounts from user management.
- Cannot deactivate or delete their own account.
- Cannot remove the last active admin.

Lecturer:

- Access lecturer dashboard, own exam management, analytics, and question bank.
- Create questions in draft exams.
- Publish, edit, archive, or delete own exams according to exam state rules.
- Reuse shared bank questions into own draft exams.

Student:

- Access student dashboard, available exams, attempts, results, and report cards.
- Can register through the public signup flow.

Signed-out users:

- Can access the public home page, login page, and signup page.
- Signing out redirects to the home page.

## Question Bank Logic

The question bank is shared for discovery but owner-protected for editing:

- All lecturers can open `/lecturer/question-bank`.
- `GET /api/questions/bank` returns reusable bank questions from all lecturers.
- Any lecturer can add a bank question to their own draft exam.
- If a lecturer reuses another lecturer's question, the backend creates an owned copy for the target exam.
- Only the lecturer who created a question can edit or delete that question.
- Edit and delete actions are blocked unless the source exam belongs to the signed-in lecturer and is still editable.

This lets lecturers collaborate safely without accidentally changing another lecturer's original question.

## API Summary

Public and auth:

- `GET /api/health`
- `GET /api/public/home-summary`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `PATCH /api/auth/profile`
- `PATCH /api/auth/profile/password`

Users and audit:

- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/{id}/status`
- `DELETE /api/users/{id}`
- `GET /api/audit`

Exams:

- `GET /api/exams`
- `POST /api/exams`
- `GET /api/exams/{id}`
- `PATCH /api/exams/{id}`
- `DELETE /api/exams/{id}`
- `GET /api/exams/{id}/results`
- `POST /api/exams/{id}/questions/{questionId}`

Questions:

- `GET /api/questions?examId={examId}`
- `GET /api/questions/bank`
- `GET /api/questions/{id}`
- `POST /api/questions`
- `PATCH /api/questions/{id}`
- `DELETE /api/questions/{id}`
- `PATCH /api/questions/reorder`

Attempts, results, and reports:

- `POST /api/attempts`
- `GET /api/attempts/{id}`
- `PATCH /api/attempts/{id}`
- `POST /api/attempts/{id}/submit`
- `GET /api/results/{id}`
- `GET /api/results/attempt/{attemptId}`
- `GET /api/reports/exam/{id}`
- `GET /api/reports/student/{id}`
- `GET /api/reports/pdf/{attemptId}`

Most private endpoints require `Authorization: Bearer <token>`.

## Common Commands

```bash
make help             # Show available commands
make env-setup        # Create backend/frontend .env files if missing
make install          # Install backend and frontend dependencies
make build            # Build backend and frontend
make dev              # Run backend and frontend together
make dev-backend      # Run backend only
make dev-frontend     # Run frontend only
make clean            # Clean build artifacts
```

Manual commands:

```bash
cd backend && mvn spring-boot:run
cd frontend && npm run dev
cd backend && mvn clean package -DskipTests
cd frontend && npm run build
```

## Troubleshooting

`DATABASE_URL must be set for Supabase storage`

- Add `DATABASE_URL` to `backend/.env`.
- Restart the backend after changing `.env`.
- Keep `APP_STORAGE=database`.

`503 Service Unavailable` or database connection timeout

- Confirm the Supabase database URL is correct.
- Use the Supabase connection string that is reachable from your machine.
- Add `?sslmode=require` if it is missing.
- If direct port `5432` is blocked, use the Supabase pooler connection string.

Login works in backend logs but frontend calls fail

- Keep `frontend/.env` as `VITE_API_URL=/api` for local development.
- Confirm `VITE_PROXY_TARGET=http://localhost:5001`.
- Restart Vite after changing frontend environment variables.

Cannot create lecturer or admin

- Sign in as an active admin.
- Use a unique email address.
- Password must be at least 8 characters and include at least one letter and one number.
- Make sure `public.users` exists and the database is reachable.

Question bank edit is blocked

- This is expected when the signed-in lecturer did not create the original question.
- Add the bank question to your own draft exam first, then edit the copied question.

Stale role or redirect issues

- Sign out and sign in again.
- Clear browser local storage if an old token is still stored.

## Production Notes

- Replace demo accounts and use a strong `JWT_SECRET`.
- Keep real Supabase credentials out of Git.
- Configure allowed origins for the deployed frontend.
- Serve the frontend through a reverse proxy or set `VITE_API_URL` to the deployed backend `/api` base URL.
- Back up Supabase data before major schema changes.
