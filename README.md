# 🎓 LankaEdu - Online Examination System

A comprehensive full-stack online examination and results management system for educational institutions. LankaEdu streamlines exam creation, student assessment, and results management with role-based access control and real-time analytics.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Project Structure](#-project-structure)
- [Makefile Commands](#-makefile-commands)
- [Installation & Setup](#-installation--setup)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [Test Credentials](#-test-credentials)
- [API Endpoints](#-api-endpoints)
- [Environment Variables](#-environment-variables)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Student Features
- ✅ User registration and authentication with JWT tokens
- ✅ Dashboard with personal exam statistics
- ✅ View available exams with scheduling information
- ✅ Timed exam taking with countdown timer
- ✅ Auto-save exam answers during attempt
- ✅ Submission confirmation before finalizing
- ✅ View detailed exam results and scores
- ✅ Download result PDF reports
- ✅ Student report card with performance metrics
- ✅ Track exam attempts and history

### Lecturer Features
- ✅ Comprehensive exam management (create, edit, schedule, archive)
- ✅ Draft mode for exam preparation
- ✅ Question management with reusable question bank
- ✅ Multiple question types support
- ✅ Scheduled exam publishing and activation
- ✅ Real-time exam analytics and statistics
- ✅ View student results and detailed answers
- ✅ Result publishing controls
- ✅ Export exam data for reporting

### Admin Features
- ✅ Staff account creation and management
- ✅ User activation and deactivation
- ✅ Role-based access control (RBAC)
- ✅ Safe user deletion with validation
- ✅ Comprehensive audit logging
- ✅ View system activity and user actions
- ✅ Security monitoring

### General Features
- ✅ Light and dark theme support
- ✅ Fully responsive design with mobile support
- ✅ CSS-only styling (no frameworks)
- ✅ Role-based redirects
- ✅ Global error handling and toast notifications
- ✅ RESTful API architecture
- ✅ Backend validation and security

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, React Router, Axios, Chart.js |
| **Styling** | Plain CSS with dark mode support |
| **Backend** | Java 17, Spring Boot 3.3, Maven |
| **Authentication** | JWT tokens with bcrypt hashing |
| **Database** | PostgreSQL with JSON storage (`app_json_store`) |
| **Deployment** | Supabase (optional) |
| **Reporting** | Apache PDFBox |

## 📋 Prerequisites

- **Java 17** or newer
- **Maven 3.9** or newer
- **Node.js 18** or newer
- **npm 9** or newer
- **PostgreSQL 12+** (optional, for production)
- **Git**

## 📁 Project Structure

```
LankaEdu/
├── backend/
│   ├── pom.xml
│   ├── .env.example
│   └── src/main/
│       ├── java/com/onlineexam/
│       │   ├── audit/          # Audit logging
│       │   ├── auth/           # Authentication & JWT
│       │   ├── attempts/       # Exam attempts
│       │   ├── common/         # Shared utilities & handlers
│       │   ├── config/         # Spring configuration
│       │   ├── exams/          # Exam management
│       │   ├── questions/      # Question bank
│       │   ├── reports/        # PDF reporting
│       │   ├── results/        # Result management
│       │   ├── users/          # User management
│       │   └── OnlineExamApplication.java
│       └── resources/
│           └── application.properties
├── frontend/
│   ├── package.json
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── components/         # Reusable UI components
│       ├── pages/              # Page components
│       ├── services/           # API services
│       └── utils/              # Utility functions
└── README.md
```

## �️ Makefile Commands

LankaEdu includes a comprehensive **Makefile** for easy project automation. Instead of manually running commands, use `make` to simplify your workflow:

### Quick Setup
```bash
make setup          # Complete setup (install + build + db-init)
make dev            # Start entire application (backend + frontend)
make build-prod     # Production build
```

### Development
```bash
make install        # Install all dependencies
make build          # Build entire project
make dev            # Run in development mode
make dev-backend    # Backend only
make dev-frontend   # Frontend only
make test           # Run all tests
make clean          # Clean build artifacts
```

### Database
```bash
make db-init        # Initialize database
make db-seed        # Load mock data
make db-reset       # Reset database
make db-backup      # Backup database
```

### Docker
```bash
make docker-build   # Build Docker images
make docker-up      # Start containers
make docker-down    # Stop containers
make docker-logs    # View logs
```

### Full List of Commands
```bash
make help           # Show all available commands
```

**Example Workflow:**
```bash
make setup          # One-time setup
make dev            # Start development
make test           # Run tests
make clean          # Cleanup
```

## �🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd LankaEdu
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Copy environment variables
cp .env.example .env

# Install dependencies (Maven downloads automatically)
# Build the project
mvn clean install
```

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Copy environment variables
cp .env.example .env

# Install npm dependencies
npm install
```

## 🗄️ Database Setup

### Option 1: Local PostgreSQL (Recommended for Development)

1. **Install PostgreSQL** if not already installed
2. **Create a new database:**
   ```bash
   createdb lankaedu
   ```
3. **Set DATABASE_URL in backend/.env:**
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/lankaedu
   ```

### Option 2: Supabase (Cloud-based)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy the database URL from project settings
3. Update `DATABASE_URL` in backend/.env

### Step 3: Load Mock Data

Connect to your database and run the SQL script:

```sql
-- See mock-data.sql for complete sample data
-- Includes: 8 users, 6 exams, 19 questions, and exam attempts
```

## ▶️ Running the Application

### Terminal 1: Start Backend

```bash
cd backend
mvn spring-boot:run
```

Backend will be available at: `http://localhost:5001`

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### Build for Production

**Backend:**
```bash
cd backend
mvn clean package
java -jar target/onlineexam-*.jar
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 🔐 Test Credentials

### Admin User
```
Email:    admin@example.com
Password: admin123
Role:     Admin
```

### Lecturer Users
```
Email:    lecturer@example.com
Password: lecturer123
Role:     Lecturer

Email:    emily.wilson@example.com
Password: lecturer123

Email:    michael.chen@example.com
Password: lecturer123

Email:    sarah.johnson@example.com
Password: lecturer123
```

### Student Users
```
Email:    student@example.com
Password: student123
Role:     Student

Email:    amal.kumar@example.com
Password: student123
Student ID: STU001

Email:    priya.sharma@example.com
Password: student123
Student ID: STU002

Email:    roshan.desilva@example.com
Password: student123
Student ID: STU003

Email:    navya.patel@example.com
Password: student123
Student ID: STU004

Email:    keshan.bandara@example.com
Password: student123
Student ID: STU005

Email:    disha.gupta@example.com
Password: student123
Student ID: STU006

Email:    lahiru.fernando@example.com
Password: student123
Student ID: STU007
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - New user registration
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/me` - Get current user profile
- `GET /api/users` - List all users (Admin only)
- `POST /api/users` - Create new user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Exams
- `GET /api/exams` - List exams (filters by user role)
- `POST /api/exams` - Create new exam (Lecturer)
- `PUT /api/exams/:id` - Update exam (Lecturer)
- `DELETE /api/exams/:id` - Delete exam (Lecturer)
- `GET /api/exams/:id/available` - Check if exam is available
- `GET /api/exams/:id/analytics` - Get exam analytics (Lecturer)

### Questions
- `GET /api/questions` - List questions (filtered by exam)
- `POST /api/questions` - Create question (Lecturer)
- `PUT /api/questions/:id` - Update question (Lecturer)
- `DELETE /api/questions/:id` - Delete question (Lecturer)

### Attempts
- `POST /api/attempts` - Start new exam attempt
- `GET /api/attempts/:id` - Get attempt details
- `PUT /api/attempts/:id` - Save answers (auto-save)
- `POST /api/attempts/:id/submit` - Submit exam attempt

### Results
- `GET /api/results` - List results
- `GET /api/results/:id` - Get result details
- `POST /api/results/:id/publish` - Publish result (Lecturer)
- `GET /api/results/:id/pdf` - Download result as PDF

### Audit
- `GET /api/audit` - Get audit logs (Admin only)

## ⚙️ Environment Variables

### Backend (.env)

```properties
# Server Configuration
PORT=5001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lankaedu

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGIN=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173

# Storage Type
APP_STORAGE=database
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:5001
VITE_JWT_STORAGE_KEY=lankaedu_token
```

## 🐛 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Change port in backend/.env
PORT=5002
```

**Database connection error:**
```bash
# Verify DATABASE_URL format
postgresql://user:password@host:5432/dbname

# Check PostgreSQL is running
pg_isready -h localhost
```

**Maven build fails:**
```bash
# Clear cache and rebuild
mvn clean install -U
```

### Frontend Issues

**Port 5173 already in use:**
```bash
# Run on different port
npm run dev -- --port 5174
```

**Module not found errors:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**API connection errors:**
```bash
# Check VITE_API_URL matches backend port
# Default: http://localhost:5001
```

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Token expired, login again or clear localStorage |
| 403 Forbidden | Insufficient permissions for this action |
| CORS errors | Update ALLOWED_ORIGIN in backend .env |
| Exam not visible | Check exam status (Draft/Active/Inactive) |
| Cannot submit answer | Exam time window may have passed |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review API documentation

## 🔄 Version History

- **v1.0.0** - Initial release
  - Core exam management system
  - Student exam taking
  - Result management
  - Admin panel

---

**Last Updated:** May 19, 2026
**Maintained by:** LankaEdu Development Team
```

The frontend uses `/api` through the Vite proxy. `frontend/.env.example` points the proxy to `http://localhost:5001`.

## Environment Variables

### Backend `.env`

```env
PORT=5001
ALLOWED_ORIGIN=http://localhost:5173,http://localhost:5174
JWT_SECRET=replace_this_with_a_long_random_secret_at_least_32_chars
JWT_EXPIRES_IN=7d

# Use Supabase/Postgres JSON storage.
APP_STORAGE=database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require
```

### Frontend `.env`

```env
VITE_API_URL=/api
VITE_PROXY_TARGET=http://localhost:5001
```

## Demo Accounts

All included demo accounts use this password:

```text
password123
```

| Role | Email | Main Area |
|---|---|---|
| Admin | `admin@example.com` | User management and audit log |
| Lecturer | `lecturer@example.com` | Exams, question bank, analytics, results |
| Student | `student@example.com` | Available exams, attempts, results, report card |

Seed data includes an active Java mock exam, an archived Database Systems exam with result data, and a draft Algorithms quiz for lecturer editing and publishing.

## Main Workflows

### Student

1. Sign up or log in as a student.
2. Open the student dashboard.
3. View active exams.
4. Start one attempt per exam.
5. Save answers during the attempt.
6. Submit the exam.
7. View the result detail and report card.
8. Download the result as a PDF.

### Lecturer

1. Create a draft exam.
2. Edit draft settings: title, subject, duration, pass mark, and description.
3. Add questions directly or reuse questions from the question bank.
4. Reorder, edit, or delete draft questions.
5. Publish the draft by setting a future start and end time.
6. View analytics and results after submissions are available.
7. Archive ended active exams.
8. Delete draft exams that have no student activity.

### Admin

1. Create lecturer or admin staff accounts.
2. Activate or deactivate users.
3. Delete eligible users.
4. Review audit events.

## Lecturer Exam Rules

- Only the lecturer who created an exam can manage it.
- Only draft exams can be edited.
- Only draft exams can have questions added, edited, deleted, or reordered.
- A draft exam must contain at least one question before publishing.
- Publishing requires a future start time and an end time after the start time.
- Active exams are locked for settings and question edits.
- Active exams can be archived only after the exam end time.
- Only draft exams can be deleted.
- Draft exam deletion also removes that exam's draft questions.
- Exams with student attempts or results cannot be deleted.

## Question Bank Rules

- Lecturers can open the bank directly at `/lecturer/question-bank`.
- The bank shows reusable questions from the lecturer's own exams.
- New bank questions are created inside the selected draft exam.
- Existing bank questions can be added to a selected draft exam.
- Questions from active or archived source exams are visible but locked for editing.
- Draft-source questions can be edited from the question bank and return back to the bank after saving.
- Duplicate bank questions cannot be linked to the same target exam.

## Role Permissions

| Role | Can Do | Cannot Do |
|---|---|---|
| Student | Register, log in, take active exams, submit answers, view own results, download own reports | Manage users, create exams, edit questions, view other students' results |
| Lecturer | Manage own exams, manage own draft questions, use question bank, publish/archive exams, view own analytics and results | Manage users, access audit log, edit exams owned by other lecturers |
| Admin | Create staff accounts, manage users, view audit log | Take exams as a student, create lecturer exam content |

## API Summary

### Public and Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Service health metadata |
| GET | `/api/public/home-summary` | Public | Home page statistics |
| POST | `/api/auth/register` | Public | Register a student account |
| POST | `/api/auth/login` | Public | Log in and receive a JWT |
| PATCH | `/api/auth/profile` | Auth | Update current profile |
| PATCH | `/api/auth/profile/password` | Auth | Change current password |

### Users and Audit

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/users` | Admin | List users |
| POST | `/api/users` | Admin | Create lecturer or admin account |
| PATCH | `/api/users/:id/status` | Admin | Activate or deactivate user |
| DELETE | `/api/users/:id` | Admin | Delete an eligible user |
| GET | `/api/audit?limit=100` | Admin | View recent audit events |

### Exams

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/exams` | Auth | Lecturer sees own exams; student sees active exams |
| POST | `/api/exams` | Lecturer | Create a draft exam |
| GET | `/api/exams/:id` | Owner lecturer or eligible student | Get exam detail |
| PATCH | `/api/exams/:id` | Lecturer owner | Edit draft settings, publish, or archive |
| DELETE | `/api/exams/:id` | Lecturer owner | Delete eligible draft exam |
| GET | `/api/exams/:id/results` | Lecturer owner | Result table and summary |
| POST | `/api/exams/:id/questions/:questionId` | Lecturer owner | Add a bank question to a draft exam |

### Questions

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/questions?examId=:id` | Lecturer owner | List exam questions |
| GET | `/api/questions/bank` | Lecturer | List reusable question bank |
| GET | `/api/questions/:id` | Lecturer owner | Get one question |
| POST | `/api/questions` | Lecturer owner | Create a question on a draft exam |
| PATCH | `/api/questions/:id` | Lecturer owner | Update a draft question |
| DELETE | `/api/questions/:id` | Lecturer owner | Delete a draft question |
| PATCH | `/api/questions/reorder` | Lecturer owner | Reorder draft questions |

### Attempts, Results, Reports

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/attempts` | Student | Start an exam attempt |
| GET | `/api/attempts/:id` | Student owner | Get attempt with questions |
| PATCH | `/api/attempts/:id` | Student owner | Save answers |
| POST | `/api/attempts/:id/submit` | Student owner | Submit and auto-grade |
| GET | `/api/results/:id` | Student owner or lecturer owner | Result detail |
| GET | `/api/results/attempt/:attemptId` | Student owner or lecturer owner | Result by attempt |
| GET | `/api/reports/exam/:id` | Lecturer owner | Exam analytics |
| GET | `/api/reports/student/:id` | Student owner | Student report card |
| GET | `/api/reports/pdf/:attemptId` | Student owner or lecturer owner | Download PDF result report |

## Validation and Security

- JWT-protected API routes with role checks.
- Server-side ownership checks for lecturer exam and question access.
- Login throttling after repeated failures.
- Automatic frontend session cleanup on expired JWT responses.
- Server-side prevention of duplicate student attempts.
- Server-side exam-window enforcement for starts, saves, and submissions.
- Audit events for major auth, admin, exam, question, attempt, and result actions.
- Security headers added to API responses.

## Build and Verification

Run frontend production build:

```bash
cd frontend
npm run build
```

Run backend compile/tests:

```bash
cd backend
mvn test
```

Current verification status in this workspace:

- `npm run build` passes.
- `mvn test` passes. There are currently no backend test source files, so this mainly verifies Java compilation.
- Backend smoke test passed for lecturer exam publishing validation and draft exam deletion.

## Supabase Storage Notes

- Set `APP_STORAGE=database` and `DATABASE_URL` to use Supabase only.
- The backend currently stores application collections in the `app_json_store` table.
- Required Supabase table:

```sql
create table if not exists public.app_json_store (
  store_key text primary key,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone not null default now()
);
```

- Expected `app_json_store.store_key` values are `users.json`, `exams.json`, `questions.json`, `attempts.json`, `results.json`, and `audit.json`.
- If a key is missing, the backend creates it with an empty JSON array.
- If the users store is empty, the backend creates the demo admin, lecturer, and student accounts automatically.
- The normalized Supabase tables such as `users`, `exams`, and `questions` are not used by the current backend unless repository code is rewritten for them.
- Deleting a draft exam removes the related draft questions from the database-backed `questions.json` collection.
- Avoid committing real secrets in `backend/.env` or `frontend/.env`.

## Development Notes

- Keep frontend API calls in `frontend/src/services`.
- Keep route-level access control in `frontend/src/App.jsx` and backend role validation in controllers.
- Keep reusable UI in `frontend/src/components`.
- Keep styling in CSS files; this project does not use Tailwind or TypeScript.
- Prefer changing backend lifecycle rules in services/controllers instead of only hiding frontend buttons.

## License

Educational coursework project. Free to use and modify for learning purposes.
