# Online Examination and Results Management System

> A full-stack coursework application for managing online exams, users, scheduling, and publishing.

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Java%20Spring%20Boot-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Table of Contents

- [Project Overview](#project-overview)
- [Current Features](#current-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Demo Accounts](#demo-accounts)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Data Storage](#data-storage)
- [User Roles](#user-roles)
- [Development Notes](#development-notes)
- [Planned Modules](#planned-modules)
- [License](#license)

## Project Overview

The Online Examination and Results Management System allows students, lecturers, and admins to use one role-based web application. The frontend is built with React and Vite. The backend is now fully Java-based using Spring Boot and Maven.

The current backend stores data in JSON files so the project can run locally without setting up MySQL, PostgreSQL, or Supabase. The data layer can be replaced later with a database while keeping the same API routes.

## Current Features

**Authentication**
- Student signup
- Login with JWT
- Role-based redirects
- Protected API routes
- Password hashing with bcrypt

**Admin**
- View all users
- Search users in the admin UI
- Activate or deactivate accounts
- Delete users, except the currently logged-in admin

**Lecturer**
- Create a draft exam
- View lecturer exam list
- View all exam settings
- Edit draft exam settings inline
- Schedule an exam with start and end datetime
- Publish a draft exam as Active
- Archive an Active exam after it has ended
- Add MCQ, True/False, and Short Answer questions to an exam
- View an exam's question list
- Edit, delete, and reorder questions before publishing
- View total marks for an exam's questions

**Student**
- View Active exams in the student dashboard

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router, Axios, Vite |
| Backend | Java 17, Spring Boot 3.3, Maven |
| Storage | JSON files in `backend/src/data` |
| Authentication | JWT, bcrypt |
| Styling | Plain CSS |

## Project Structure

```text
online-exam-system/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── data/
│       │   ├── exams.json
│       │   ├── questions.json
│       │   └── users.json
│       └── main/
│           ├── java/com/onlineexam/
│           │   ├── auth/
│           │   │   ├── AuthController.java
│           │   │   ├── AuthFilter.java
│           │   │   ├── AuthSupport.java
│           │   │   ├── JwtService.java
│           │   │   └── UserPrincipal.java
│           │   ├── common/
│           │   │   ├── ApiException.java
│           │   │   ├── ApiExceptionHandler.java
│           │   │   ├── HealthController.java
│           │   │   └── JsonFileStore.java
│           │   ├── config/
│           │   │   ├── CorsConfig.java
│           │   │   └── CorsFilterConfig.java
│           │   ├── exams/
│           │   │   ├── Exam.java
│           │   │   ├── ExamController.java
│           │   │   ├── ExamService.java
│           │   │   └── PublicExam.java
│           │   ├── questions/
│           │   │   ├── Question.java
│           │   │   ├── QuestionController.java
│           │   │   ├── QuestionOption.java
│           │   │   └── QuestionService.java
│           │   ├── users/
│           │   │   ├── PublicUser.java
│           │   │   ├── User.java
│           │   │   ├── UserController.java
│           │   │   └── UserService.java
│           │   └── OnlineExamApplication.java
│           └── resources/
│               └── application.properties
├── frontend/
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── pages/
│       │   ├── DashboardPage.jsx
│       │   ├── admin/UserManagementPage.jsx
│       │   ├── auth/LoginPage.jsx
│       │   ├── auth/SignupPage.jsx
│       │   └── exams/
│       │       ├── ExamCreatePage.jsx
│       │       └── ExamDetailPage.jsx
│       │   └── questions/
│       │       └── QuestionFormPage.jsx
│       ├── services/
│       │   ├── api.js
│       │   ├── authService.js
│       │   ├── authStorage.js
│       │   ├── examService.js
│       │   └── userService.js
│       └── utils/
│           └── roleRedirect.js
└── README.md
```

## Getting Started

### Prerequisites

- Java 17 or higher
- Maven 3.9 or higher
- Node.js 18 or higher
- npm 9 or higher

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
mvn spring-boot:run
```

The backend starts on:

```text
http://localhost:5000
```

If port `5000` is already in use, run with a different port:

```bash
PORT=52743 mvn spring-boot:run
```

### 2. Frontend Setup

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend starts on:

```text
http://localhost:5173
```

If the backend is running on a custom port, update `frontend/.env`:

```env
VITE_API_URL=http://localhost:52743/api
```

### 3. Build Checks

Backend:

```bash
cd backend
mvn test
```

Frontend:

```bash
cd frontend
npm run build
```

## Demo Accounts

All demo accounts use this password:

```text
password123
```

| Role | Email |
|------|-------|
| Admin | `admin@example.com` |
| Lecturer | `lecturer@example.com` |
| Student | `student@example.com` |

## Environment Variables

### Backend `.env`

```env
PORT=5000
ALLOWED_ORIGIN=http://localhost:5173,http://localhost:5174
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api
```

Do not commit real `.env` files. Commit only `.env.example` files.

## API Endpoints

### Health

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/health` | Check API status | Public |

### Auth

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register a new student account | Public |
| POST | `/api/auth/login` | Login and receive JWT | Public |

### Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users` | List all users | Admin |
| PATCH | `/api/users/:id/status` | Activate or deactivate user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |

### Exams

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/exams` | Lecturers see their exams; students see Active exams | Auth |
| POST | `/api/exams` | Create a new Draft exam | Lecturer |
| GET | `/api/exams/:id` | Get exam detail | Lecturer owner or student for Active exams |
| PATCH | `/api/exams/:id` | Edit Draft settings, publish Draft exams, or archive ended Active exams | Lecturer owner |

### Questions

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/questions?examId=:id` | List questions for an exam | Lecturer owner |
| POST | `/api/questions` | Add MCQ, True/False, or Short Answer question to an exam | Lecturer owner |
| GET | `/api/questions/:id` | Get question detail for editing | Lecturer owner |
| PATCH | `/api/questions/:id` | Update a question before publishing | Lecturer owner |
| DELETE | `/api/questions/:id` | Delete a question before publishing | Lecturer owner |
| PATCH | `/api/questions/reorder` | Update question order for an exam | Lecturer owner |

`PATCH /api/exams/:id` supports three actions:

Edit Draft settings:

```json
{
  "title": "Midterm Exam",
  "subject": "Java",
  "durationMinutes": 60,
  "passMark": 50,
  "description": "Optional description"
}
```

Publish a Draft exam:

```json
{
  "status": "Active",
  "start_at": "2026-05-03T09:00:00.000Z",
  "end_at": "2026-05-03T10:00:00.000Z"
}
```

Archive an Active exam after it ends:

```json
{
  "status": "Archived"
}
```

## Data Storage

The current backend uses JSON file storage:

```text
backend/src/data/users.json
backend/src/data/exams.json
backend/src/data/questions.json
```

### `users.json`

| Field | Notes |
|-------|-------|
| `id` | User UUID |
| `name` | Full name |
| `email` | Login email |
| `role` | `student`, `lecturer`, or `admin` |
| `student_id` | Student identifier, only for students |
| `is_active` | Whether the user can log in |
| `password_hash` | bcrypt password hash |
| `created_at` | ISO datetime |

### `exams.json`

| Field | Notes |
|-------|-------|
| `id` | Exam UUID |
| `created_by` | Lecturer user ID |
| `title` | Exam title |
| `subject` | Subject name |
| `duration_mins` | Duration in minutes |
| `pass_mark` | Pass mark percentage |
| `description` | Optional description |
| `status` | `Draft`, `Active`, or `Archived` |
| `start_at` | Scheduled start datetime |
| `end_at` | Scheduled end datetime |
| `created_at` | ISO datetime |
| `updated_at` | ISO datetime |

### `questions.json`

| Field | Notes |
|-------|-------|
| `id` | Question UUID |
| `exam_id` | Linked exam UUID |
| `question_text` | Question prompt |
| `type` | `MCQ`, `TRUE_FALSE`, or `SHORT_ANSWER` |
| `marks` | Positive mark value |
| `order_no` | Display order inside the exam |
| `options` | Answer options for MCQ and True/False |
| `created_by` | Lecturer user ID |
| `created_at` | ISO datetime |

## User Roles

| Role | Can Do |
|------|--------|
| Student | Register, log in, view Active exams |
| Lecturer | Create, edit, schedule, publish, archive own exams, and add questions |
| Admin | Manage user accounts |

Role information is stored in the JWT payload. Protected Java routes read the authenticated user from `AuthFilter` and enforce roles in controllers.

## Development Notes

- The frontend should call API functions from `frontend/src/services`, not direct `fetch()` calls inside page components.
- Backend API errors return JSON with a `message` field and, for validation errors, an `errors` object.
- Exam settings can be edited only while the exam is `Draft`.
- An exam can be published only when the start datetime is in the future and the end datetime is after the start.
- An Active exam can be archived only after its end datetime has passed.
- MCQ questions must have exactly four options and exactly one correct answer.
- True/False questions use fixed True and False options with exactly one correct answer.
- Questions can be edited, deleted, or reordered only before the exam is published.

## Planned Modules

These modules are described in the original coursework scope but are not fully implemented yet:

- More question bank actions, such as editing and deleting questions
- Exam attempts with timer
- Auto-grading
- Results pages
- Reports and analytics
- PDF report export

## License

This project is created for educational purposes as part of a university coursework assignment.

MIT License - free to use and modify with attribution.
