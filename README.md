# Auth and User Management Module

> Member 1 scope for the Online Examination and Results Management coursework project.

This version contains only the authentication and user-management work:

- Student self-registration
- Login with JWT
- Role-based dashboard redirects
- Protected API routes
- Admin user management
- Activate, deactivate, search, and delete users
- Password hashing with bcrypt

Exam management, question bank, attempts, results, grading, reports, and analytics have been removed from the runnable project.

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
│           │   ├── config/
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
│       │   └── auth/
│       │       ├── LoginPage.jsx
│       │       └── SignupPage.jsx
│       ├── services/
│       │   ├── api.js
│       │   ├── authService.js
│       │   ├── authStorage.js
│       │   └── userService.js
│       └── utils/
│           └── roleRedirect.js
└── README.md
```

## Getting Started

### Backend

```bash
cd backend
mvn spring-boot:run
```

The backend starts on:

```text
http://localhost:5000
```

### Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on:

```text
http://localhost:5173
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

## Data Storage

The backend stores users in:

```text
backend/src/data/users.json
```

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

## User Roles

| Role | Can Do |
|------|--------|
| Student | Register and log in |
| Lecturer | Log in and view the role dashboard |
| Admin | Manage user accounts |

Role information is stored in the JWT payload. Protected Java routes read the authenticated user from `AuthFilter` and enforce roles in controllers.

## Build Checks

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
