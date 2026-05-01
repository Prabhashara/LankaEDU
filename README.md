# 📚 Library Management System

> A full-stack Library Management System built as a 2nd semester group project.
> Manage books, users, borrowing, and fines — all in one place.

![Java](https://img.shields.io/badge/Java_17-ED8B00?style=flat&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React_18-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)

---

## 📋 Table of Contents

- [About the Project](#about-the-project)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Team & Modules](#team--modules)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Branch Strategy](#branch-strategy)
- [Environment Variables](#environment-variables)

---

## 📖 About the Project

The Library Management System (LMS) allows library staff and users to manage books, track borrowing activity, and handle overdue fines. Built as a full-stack application with a React frontend, Java Spring Boot REST API, and a Supabase (PostgreSQL) database.

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, React Router v6, Axios, CSS Modules |
| Backend    | Java 17, Spring Boot 3, REST API    |
| Database   | Supabase (PostgreSQL)               |
| Version Control | Git + GitHub                   |

---

## ✨ Features

- 🔐 User registration and login with session management
- 📚 Add, view, search, update, and delete books
- 🔄 Issue books to users and mark them as returned
- 👤 View and update user profiles (admin and self)
- 💰 Calculate overdue fines and record payments
- 🧭 Protected routes — pages only accessible when logged in

---

## 📁 Project Structure

```
library-management-system/
│
├── frontend/                   # React + Vite app
│   ├── index.html
│   ├── vite.config.js          # Proxy /api → localhost:8080
│   ├── package.json
│   └── src/
│       ├── main.jsx            # Entry point
│       ├── App.jsx             # Route definitions
│       ├── index.css           # Global styles + CSS variables
│       │
│       ├── pages/              # One component per screen
│       │   ├── HomePage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── BooksPage.jsx
│       │   ├── BookFormPage.jsx
│       │   ├── BorrowPage.jsx
│       │   ├── LoansPage.jsx
│       │   ├── ProfilePage.jsx
│       │   ├── AdminUsersPage.jsx
│       │   └── FinesPage.jsx
│       │
│       ├── components/         # Reusable UI components
│       │   ├── Navbar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── BookCard.jsx
│       │   ├── LoanRow.jsx
│       │   └── FineRow.jsx
│       │
│       ├── api/                # Axios call functions
│       │   ├── axiosInstance.js
│       │   ├── authApi.js
│       │   ├── booksApi.js
│       │   ├── borrowsApi.js
│       │   ├── usersApi.js
│       │   └── finesApi.js
│       │
│       ├── context/
│       │   └── AuthContext.jsx # Global user state + token
│       │
│       └── styles/             # CSS Modules
│           ├── Navbar.module.css
│           ├── Auth.module.css
│           ├── Books.module.css
│           └── Fines.module.css
│
├── backend/                    # Spring Boot REST API
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/lms/
│       │   ├── LibraryApplication.java
│       │   ├── config/
│       │   │   ├── CorsConfig.java
│       │   │   └── DatabaseConfig.java
│       │   ├── controller/
│       │   │   ├── UserController.java
│       │   │   ├── BookController.java
│       │   │   ├── BorrowController.java
│       │   │   └── FineController.java
│       │   ├── service/
│       │   │   ├── UserService.java
│       │   │   ├── BookService.java
│       │   │   ├── BorrowService.java
│       │   │   └── FineService.java
│       │   ├── repository/
│       │   │   ├── UserRepository.java
│       │   │   ├── BookRepository.java
│       │   │   ├── BorrowRepository.java
│       │   │   └── FineRepository.java
│       │   └── model/
│       │       ├── User.java
│       │       ├── Book.java
│       │       ├── Borrow.java
│       │       └── Fine.java
│       └── resources/
│           └── application.properties
│
├── db/                         # Supabase SQL migrations
│   ├── 01_create_users.sql
│   ├── 02_create_books.sql
│   ├── 03_create_borrows.sql
│   ├── 04_create_fines.sql
│   └── 05_seed_data.sql
│
├── .gitignore
├── .env.example
└── README.md
```

---

## 👥 Team & Modules

| Member   | Module                        | Backend Files                              | Frontend Files                          |
|----------|-------------------------------|--------------------------------------------|-----------------------------------------|
| Member 1 | User registration & login     | UserController, UserService, UserRepository | LoginPage.jsx, RegisterPage.jsx, authApi.js |
| Member 2 | Book management               | BookController, BookService, BookRepository | BooksPage.jsx, BookFormPage.jsx, booksApi.js |
| Member 3 | Borrow & return               | BorrowController, BorrowService, BorrowRepository | BorrowPage.jsx, LoansPage.jsx, borrowsApi.js |
| Member 4 | User profile & management     | UserController (profile routes), ProfileServlet | ProfilePage.jsx, AdminUsersPage.jsx, usersApi.js |
| Member 5 | Book deletion & fine tracking | FineController, FineService, FineRepository | FinesPage.jsx, finesApi.js              |
| Member 6 | Project setup & integration   | LibraryApplication, CorsConfig, DatabaseConfig | App.jsx, Navbar.jsx, AuthContext.jsx, index.css |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have these installed before starting:

- [Node.js 18+](https://nodejs.org/)
- [Java 17+](https://adoptium.net/)
- [Maven 3.8+](https://maven.apache.org/)
- A free [Supabase](https://supabase.com) account

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/library-management-system.git
cd library-management-system
```

---

### Step 2 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open the **SQL Editor** in your Supabase dashboard
3. Run each file inside `/db` **in order**:

```
01_create_users.sql
02_create_books.sql
03_create_borrows.sql
04_create_fines.sql
05_seed_data.sql
```

4. Go to **Project Settings → Database** and copy your connection credentials

---

### Step 3 — Configure the backend

Create or edit `backend/src/main/resources/application.properties`:

```properties
# Supabase Database Connection
spring.datasource.url=jdbc:postgresql://db.YOUR_PROJECT_REF.supabase.co:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=YOUR_SUPABASE_DB_PASSWORD
spring.datasource.driver-class-name=org.postgresql.Driver

# Server
server.port=8080
```

> ⚠️ Never commit this file with real credentials. It is listed in `.gitignore`.

---

### Step 4 — Run the backend

```bash
cd backend
mvn spring-boot:run
```

The API will be available at: `http://localhost:8080`

---

### Step 5 — Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open your browser at: `http://localhost:5173`

The Vite dev server is configured to proxy all `/api` requests to `localhost:8080` automatically.

---

## 🔌 API Endpoints

### Auth — `/api/users`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register a new user |
| POST | `/api/users/login` | Login and receive token |

### Books — `/api/books`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books` | Get all books |
| GET | `/api/books?search=title` | Search books by title or author |
| GET | `/api/books/{id}` | Get a single book |
| POST | `/api/books` | Add a new book |
| PUT | `/api/books/{id}` | Update a book |
| DELETE | `/api/books/{id}` | Delete a book |

### Borrows — `/api/borrows`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/borrows` | Issue a book to a user |
| GET | `/api/borrows/user/{userId}` | Get active loans for a user |
| PUT | `/api/borrows/{id}/return` | Mark a book as returned |

### Fines — `/api/fines`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fines/user/{userId}` | Get fines for a user |
| PUT | `/api/fines/{id}/pay` | Record a fine payment |

---

## 🗄️ Database Schema

```
users
  id          UUID PRIMARY KEY
  username    VARCHAR UNIQUE NOT NULL
  password    VARCHAR NOT NULL
  full_name   VARCHAR
  email       VARCHAR
  role        VARCHAR DEFAULT 'user'
  created_at  TIMESTAMP

books
  id          UUID PRIMARY KEY
  title       VARCHAR NOT NULL
  author      VARCHAR NOT NULL
  isbn        VARCHAR UNIQUE
  copies      INTEGER DEFAULT 1
  created_at  TIMESTAMP

borrows
  id          UUID PRIMARY KEY
  user_id     UUID REFERENCES users(id)
  book_id     UUID REFERENCES books(id)
  issue_date  DATE NOT NULL
  due_date    DATE NOT NULL
  return_date DATE
  status      VARCHAR DEFAULT 'active'

fines
  id          UUID PRIMARY KEY
  borrow_id   UUID REFERENCES borrows(id)
  amount      DECIMAL(10,2)
  paid        BOOLEAN DEFAULT false
  paid_at     TIMESTAMP
```

---

## 🌿 Branch Strategy

> Member 6 must set up and merge their branch **first** before others start.

```
main
├── feat/member1-auth
├── feat/member2-books
├── feat/member3-borrow
├── feat/member4-profile
├── feat/member5-fines
└── feat/member6-setup   ← merge this first
```

**Workflow for each member:**

```bash
# 1. Always pull latest main before starting
git checkout main
git pull origin main

# 2. Create your branch
git checkout -b feat/member1-auth

# 3. Work on your feature, then commit
git add .
git commit -m "feat: add user login endpoint"

# 4. Push and open a Pull Request to main
git push origin feat/member1-auth
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and fill in your values. Never commit `.env`.

```env
# Backend — put these in application.properties (not .env)
DB_URL=jdbc:postgresql://db.YOUR_PROJECT.supabase.co:5432/postgres
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

`.env.example` (safe to commit — no real values):

```env
DB_URL=jdbc:postgresql://db.YOUR_PROJECT_REF.supabase.co:5432/postgres
DB_USERNAME=postgres
DB_PASSWORD=your_supabase_password_here
```

---

## 📝 Notes

- The frontend runs on port **5173**, the backend on port **8080**
- Vite's proxy in `vite.config.js` forwards all `/api` calls to the backend — no CORS issues during development
- `AuthContext.jsx` stores the logged-in user and token globally so every page can access it
- `ProtectedRoute.jsx` wraps pages that require login — users are redirected to `/login` if not authenticated
- Member 6 should complete the base setup (project scaffold, DB tables, shared components) before other members start coding

---

<p align="center">Made with dedication by a team of 6 — 1st Year IT, 2nd Semester</p>
