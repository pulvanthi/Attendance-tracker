# TrackPulse · Enterprise Attendance Tracker Pro

A full-stack, enterprise-grade Attendance Tracker application built with **React** (adhering strictly to **Atomic Design** principles), **FastAPI (Python)**, **PostgreSQL** (with automated fallback), and **JWT Authentication**.

---

## 🌟 Key Features

- **Atomic Design Architecture**: Built modularly from the ground up:
  - **Atoms**: `Button`, `Input`, `Badge`, `Select`, `Avatar`, `Spinner`
  - **Molecules**: `LiveClock`, `StatCard`, `DateNavigator`, `LocationToggle`, `SearchFilterBar`
  - **Organisms**: `Navbar`, `AttendanceTable`, `AttendanceRow`, `SummaryCards`, `AddEmployeeModal`, `AuthModal`, `AttendanceCharts`
  - **Templates**: `DashboardTemplate`
  - **Pages**: `AttendancePage`, `EmployeesPage`, `AnalyticsPage`
- **FastAPI Backend**:
  - Full REST API with OpenAPI/Swagger interactive documentation (`/docs`)
  - Endpoints for auth, employee directory management, attendance punches, and historical analytics
- **JWT Authentication**:
  - Secure password hashing with `bcrypt`
  - Stateless Bearer tokens with configurable expiration
  - Quick demo sign-in for testing
- **PostgreSQL Database**:
  - SQLAlchemy 2.0 ORM with PostgreSQL driver (`psycopg3`/`psycopg2`)
  - Schema managed by Alembic migrations (real DATE/TIME columns)
  - Optional SQLite fallback for demos (`ALLOW_SQLITE_FALLBACK=true`)
  - Seeded automatically on startup with admin user and sample team roster
- **Real-Time Attendance Ledger**:
  - Biometric-style clock in / clock out with live running duration counters
  - Automatic **Late arrival** detection based on standard shift start (09:30)
  - Work location categorization (**In-Office**, **Remote**, **Field Duty**)
  - Daily date navigation and CSV export
- **Analytics & Reporting**:
  - 7-day attendance trend rates
  - Department-level distribution
  - On-time arrival rate and total productive hours worked
- **Modern UI & Aesthetic**:
  - Dark mode & Light mode with smooth CSS variables and glassmorphism
  - Modern typography using *Plus Jakarta Sans* and *JetBrains Mono*
  - Responsive layouts and micro-interactions

---

## 📁 Project Structure

```
attendance-app/
├── backend/
│   ├── app/
│   │   ├── auth/              # JWT token generator, password hashing, dependencies
│   │   ├── models/            # SQLAlchemy models (User, Employee, AttendanceRecord)
│   │   ├── routers/           # API endpoints (auth, employees, attendance, analytics)
│   │   ├── schemas/           # Pydantic validation schemas
│   │   ├── config.py          # Environment settings
│   │   ├── database.py        # PostgreSQL engine & connection manager
│   │   └── main.py            # FastAPI entry point & CORS
│   ├── seed.py                # Database seeder (admin & sample staff)
│   ├── test_backend.py        # Pytest test suite
│   ├── requirements.txt       # Python dependencies
│   ├── alembic/               # Database migrations
│   └── .env                   # Database URL, JWT secret, admin password (git-ignored)
│
└── attendance-app/            # Frontend (React + Vite)
    ├── src/
    │   ├── components/
    │   │   ├── atoms/         # Button, Input, Badge, Select, Avatar, Spinner
    │   │   ├── molecules/     # LiveClock, StatCard, DateNavigator, LocationToggle, SearchFilterBar
    │   │   ├── organisms/     # Navbar, AttendanceTable, SummaryCards, AddEmployeeModal, LoginForm, Charts
    │   │   └── templates/     # DashboardTemplate
    │   ├── context/           # AuthContext, ThemeContext
    │   ├── hooks/             # useAuth, useTheme, useNow
    │   ├── pages/             # AttendancePage, EmployeesPage, AnalyticsPage
    │   ├── services/          # api.js, authService, attendanceService, employeeService
    │   ├── styles/            # tokens.css, animations.css, index.css
    │   ├── utils/             # attendanceUtils, date helpers
    │   ├── App.jsx            # Top-level application coordinator
    │   └── main.jsx           # React DOM root
    ├── vite.config.js         # Vite configuration with proxy to FastAPI backend
    └── package.json
```

---

## 🚀 Getting Started

### 1. Backend Setup (FastAPI & PostgreSQL)

1. Open PowerShell and navigate to the backend directory:
   ```powershell
   cd backend
   ```
2. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
3. Copy `.env.example` to `.env` and fill it in:
   ```env
   DATABASE_URL=postgresql://<username>:<password>@localhost:5432/<database_name>
   SECRET_KEY=<run: python -c "import secrets; print(secrets.token_hex(32))">
   ADMIN_EMAIL=admin@attendance.pro
   ADMIN_PASSWORD=<choose a strong password>
   ```
   *Note: if PostgreSQL is unreachable the backend stops with a clear error instead of silently using another database. For a quick local demo only, set `ALLOW_SQLITE_FALLBACK=true`.*
   *URL-encode special characters in the password (`@` becomes `%40`).*

4. Create/upgrade the database schema and seed the admin + sample staff (migrations also run automatically on every server start):
   ```powershell
   python seed.py
   ```
   Schema changes live in `backend/alembic/versions/`. To add one: `alembic revision -m "describe change"`, then `alembic upgrade head`.

5. Start the FastAPI server:
   ```powershell
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - API Root: `http://127.0.0.1:8000/`
   - Swagger Interactive Docs: `http://127.0.0.1:8000/docs`

6. Run backend test suite:
   ```powershell
   pytest test_backend.py
   ```

---

### 2. Frontend Setup (React Vite)

1. In a new terminal, navigate to the frontend directory:
   ```powershell
   cd attendance-app
   ```
2. Install dependencies (if not already installed):
   ```powershell
   npm install
   ```
3. Start the dev server:
   ```powershell
   npm run dev
   ```
4. Open the application in your browser:
   `http://localhost:5173/`

---

## 🔑 Default Credentials

- **Admin Account**:
  - **Email**: `admin@attendance.pro`
  - **Password**: whatever you set as `ADMIN_PASSWORD` in `backend/.env` (if left empty, a random one is generated and printed once in the server log on first start).
  - Roles: `admin` (everything), `manager` (edit any attendance record, punch anyone), `staff` (view; punch only their own employee profile). New sign-ups are `staff`; an admin links an account to an employee with `PATCH /api/auth/users/{id}` (`{"employee_id": "s1"}`).

---

## 🧪 Verified API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate with email/password and obtain JWT |
| `POST` | `/api/auth/register` | Register new user account |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `GET` | `/api/employees/` | List all staff members (with search & department filters) |
| `POST` | `/api/employees/` | Add a new employee to the roster |
| `GET` | `/api/attendance/by-date/{date}` | Retrieve attendance ledger for a specific date |
| `POST` | `/api/attendance/punch` | Clock In / Clock Out punch action |
| `POST` | `/api/attendance/patch-by-date` | Update attendance status, location, or punch times |
| `GET` | `/api/attendance/summary` | Get KPI counts (Total, In-Office, Remote, Absent, Late) |
| `GET` | `/api/analytics/trends` | 7-day attendance trends |
| `GET` | `/api/analytics/department-breakdown` | Department-level attendance distribution |
| `GET` | `/api/analytics/export-csv` | Download attendance report as UTF-8 CSV |
