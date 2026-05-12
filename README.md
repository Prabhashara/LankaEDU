# Online Examination and Results Management System

> Complete full-stack Online Examination System with a Java Spring Boot backend and a JavaScript/CSS frontend.

![Status](https://img.shields.io/badge/status-complete-brightgreen)
![Frontend](https://img.shields.io/badge/frontend-JavaScript%20%2B%20CSS-0ea5e9)
![Backend](https://img.shields.io/badge/backend-Java%20Spring%20Boot-16a34a)

## Overview

This project implements the full coursework scope for an Online Examination and Results Management System. It includes authentication, role-based dashboards, admin user management, exam creation, scheduling, question bank management, student exam attempts with timer, automatic grading, result views, analytics, student report cards, and PDF result export.

The frontend is written with React JavaScript (`.jsx` / `.js`) and plain CSS. The backend is fully Java-based using Spring Boot and Maven. Data is stored in JSON files under `backend/src/data` for simple local running, with optional PostgreSQL-backed JSON storage available through environment variables.

## Completed Feature Coverage

| Jira ID | Module | Status |
|---|---|---|
| OES-001 | Student self-registration | Complete |
| OES-002 | Login with role-based redirect | Complete |
| OES-003 | Admin user management | Complete |
| OES-004 | Lecturer exam creation | Complete |
| OES-005 | View and edit draft exam settings | Complete |
| OES-006 | Schedule, publish, and archive exams | Complete |
| OES-007 | Add MCQ, True/False, and Short Answer questions | Complete |
| OES-008 | View, edit, delete, and reorder questions | Complete |
| OES-009 | Question bank and add-to-exam reuse | Complete |
| OES-010 | Student available exams | Complete |
| OES-011 | Exam taking page with countdown timer | Complete |
| OES-012 | Submit exam and confirmation screen | Complete |
| OES-013 | Auto-grade MCQ and True/False answers | Complete |
| OES-014 | Student result detail page | Complete |
| OES-015 | Lecturer exam results table and summary | Complete |
| OES-016 | Lecturer analytics dashboard | Complete |
| OES-017 | Student report card | Complete |
| OES-018 | Download result as PDF | Complete |

## Professional UI Update

The frontend includes a polished responsive design with:

- Complete light and dark theme support across every page.
- A bottom-right floating theme toggle with saved preference, so it does not cover the login/header actions.
- More colorful but professional blue, violet, cyan, emerald, amber, and rose design tokens.
- Theme-matched buttons with gradients, hover states, focus states, and disabled states.
- Role-based dashboards for student, lecturer, and admin users.
- Professional cards, tables, forms, badges, charts, analytics panels, status states, and exam-taking screens.
- Plain CSS styling in `frontend/src/index.css` plus page-specific CSS for the exam-taking, results, and analytics screens.


## Industrial-Level Completion Additions

This build now includes extra production-style hardening on top of the original 18 Jira stories:

- Centralized frontend route protection for student, lecturer, and admin pages.
- Admin-only staff account creation for lecturer and admin users; public registration remains student-only.
- Safeguards preventing admins from deleting/deactivating themselves or removing the last active admin.
- 403 Unauthorized and 404 Not Found screens.
- React error boundary with safe recovery controls.
- Axios timeout handling and automatic session cleanup on expired JWTs.
- Backend security headers for API responses.
- Login throttling after repeated failed attempts.
- Server-side prevention of duplicate student exam attempts.
- Server-side submission-window enforcement for late exam submissions.
- Persistent audit trail for registration, login, admin user actions, exam lifecycle changes, question changes, question-bank reuse, attempt saves, and submissions.
- Admin Audit Log page with search and event timeline.
- Health endpoint now returns service and timestamp metadata.


## Role and Permission Matrix

| Role | Allowed actions | Not allowed |
|---|---|---|
| Student | Self-register, log in, view active/scheduled exams, start one attempt per exam, save/submit answers, view own results/report card, download own PDF result | Cannot create users, create exams, edit questions, view audit logs, or view other students' results |
| Lecturer | Create draft exams, edit own draft exams, publish/archive own exams, manage own question bank, view own exam analytics/results, download reports for own exam results | Cannot create users, manage admins, view audit logs, or access exams owned by other lecturers |
| Admin | Create lecturer/admin accounts, list all users, activate/deactivate users, delete users except self, view audit logs, protect last active admin | Cannot self-register staff through public signup; cannot delete/deactivate own account or remove the last active admin |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, JavaScript, React Router, Axios, Chart.js, Vite |
| Styling | Plain CSS only |
| Backend | Java 17+, Spring Boot 3.3, Maven |
| Storage | JSON files in `backend/src/data` |
| Optional Database | PostgreSQL JSON storage |
| Authentication | JWT and bcrypt password hashing |
| PDF Export | Apache PDFBox |

## Project Structure

```text
online-exam-system/
├── backend/
│   ├── pom.xml
│   ├── .env.example
│   └── src/
│       ├── data/
│       │   ├── users.json
│       │   ├── exams.json
│       │   ├── questions.json
│       │   ├── attempts.json
│       │   ├── results.json
│       │   └── audit.json
│       └── main/
│           ├── java/com/onlineexam/
│           │   ├── audit/
│           │   ├── auth/
│           │   ├── attempts/
│           │   ├── common/
│           │   ├── config/
│           │   ├── exams/
│           │   ├── questions/
│           │   ├── reports/
│           │   ├── results/
│           │   ├── users/
│           │   └── OnlineExamApplication.java
│           └── resources/application.properties
├── frontend/
│   ├── package.json
│   ├── .env.example
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── utils/
└── README.md
```

## Getting Started

### Prerequisites

- Java 17 or higher
- Maven 3.9 or higher
- Node.js 18 or higher
- npm 9 or higher

### 1. Run the backend

```bash
cd backend
cp .env.example .env
mvn spring-boot:run
```

Backend URL:

```text
http://localhost:5000
```

### 2. Run the frontend

Open a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

If Vite automatically starts on another port such as `5174`, login still works because the frontend now uses `/api` through the Vite proxy and the backend also allows local development origins.

### 3. Production build check

```bash
cd frontend
npm run build
```

```bash
cd backend
mvn test
```


## Verification Completed in This Environment

```bash
cd frontend
npm run build
```

The frontend production build completed successfully. Maven is not installed in this execution environment, so backend Maven tests could not be executed here; however, the Java source was syntax-reviewed and no syntax-level errors were detected beyond missing external dependencies in a direct `javac` dependency-free check.

## Demo Accounts

All demo accounts use this password:

```text
password123
```

| Role | Email | Main pages |
|---|---|---|
| Admin | `admin@example.com` | User management, audit log |
| Lecturer | `lecturer@example.com` | Exams, questions, analytics, results |
| Student | `student@example.com` | Available exams, attempts, results, report card |

The included seed data contains:

- One active Java mock exam for testing student attempts.
- One archived Database Systems exam with a demo result for analytics and PDF export.
- One draft Algorithms quiz for lecturer editing and publishing.

## Environment Variables

### Backend `.env`

```env
PORT=5000
ALLOWED_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175
JWT_SECRET=replace_this_with_a_long_random_secret_at_least_32_chars
JWT_EXPIRES_IN=7d
APP_STORAGE=file
```

Optional PostgreSQL-backed JSON storage:

```env
APP_STORAGE=database
DATABASE_URL=postgres://user:password@localhost:5432/online_exam
```

### Frontend `.env`

```env
# Development default uses the Vite proxy and avoids CORS issues.
VITE_API_URL=/api
```


## Fixes Included for Common Local Errors

### CORS login error from `localhost:5174`

The frontend now calls `/api` by default, and `vite.config.js` proxies `/api` to `http://localhost:5000`. This means development requests are same-origin from the browser and no longer fail preflight CORS checks.

The backend also includes a high-priority CORS response filter that allows local development origins such as `http://localhost:5173`, `http://localhost:5174`, `http://localhost:5175`, and matching `127.0.0.1` URLs.

### 404 resource error

`frontend/index.html` now includes an inline SVG favicon so the browser does not request a missing `/favicon.ico` file. If you refresh nested React routes, Vite serves the app correctly in development.

## API Endpoints

### Health and Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| POST | `/api/auth/register` | Public | Register a student |
| POST | `/api/auth/login` | Public | Login and receive JWT |

### Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/users` | Admin | List users |
| POST | `/api/users` | Admin | Create lecturer or admin account |
| PATCH | `/api/users/:id/status` | Admin | Activate/deactivate user |
| DELETE | `/api/users/:id` | Admin | Delete a user except self |
| GET | `/api/audit?limit=100` | Admin | View recent audit events |

### Exams

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/exams` | Auth | Lecturer sees own exams; student sees active exams |
| POST | `/api/exams` | Lecturer | Create draft exam |
| GET | `/api/exams/:id` | Lecturer owner / Student active exam | Exam detail |
| PATCH | `/api/exams/:id` | Lecturer owner | Edit draft, publish, or archive |
| GET | `/api/exams/:id/results` | Lecturer owner | Exam result table and summary |
| POST | `/api/exams/:id/questions/:questionId` | Lecturer owner | Add question bank item to exam |

### Questions

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/questions?examId=:id` | Lecturer owner | List exam questions |
| GET | `/api/questions/bank` | Lecturer | List reusable question bank |
| GET | `/api/questions/:id` | Lecturer owner | Get one question |
| POST | `/api/questions` | Lecturer owner | Create question |
| PATCH | `/api/questions/:id` | Lecturer owner | Update question |
| DELETE | `/api/questions/:id` | Lecturer owner | Delete question |
| PATCH | `/api/questions/reorder` | Lecturer owner | Reorder questions |

### Attempts, Results, Reports

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/attempts` | Student | Start an exam attempt |
| GET | `/api/attempts/:id` | Student owner | Get attempt |
| PATCH | `/api/attempts/:id` | Student owner | Save answers |
| POST | `/api/attempts/:id/submit` | Student owner | Submit and auto-grade |
| GET | `/api/results/:id` | Student owner / Lecturer owner | Result detail |
| GET | `/api/results/attempt/:attemptId` | Student owner / Lecturer owner | Result by attempt |
| GET | `/api/reports/exam/:id` | Lecturer owner | Exam analytics |
| GET | `/api/reports/student/:id` | Student owner | Student report card |
| GET | `/api/reports/pdf/:attemptId` | Student owner / Lecturer owner | Download PDF result report |

## Notes for Development

- Keep frontend API calls inside `frontend/src/services`.
- Keep visual styling in CSS files; the project does not use Tailwind or TypeScript.
- The backend controllers validate role permissions before returning protected data.
- Only draft exams can be edited or have questions modified.
- Only active exams inside the schedule window can be attempted.
- MCQ and True/False answers are auto-graded immediately on submit.
- Short Answer questions are displayed and stored as part of exams, but the current auto-grader awards marks only for MCQ and True/False.

## Build Status

- Frontend production build passed with `npm run build`.
- Backend Java source was reviewed and the duplicate unreachable return in `AttemptController` was fixed. Run `mvn test` locally where Maven is installed.

## License

Educational coursework project. Free to use and modify for learning purposes.
