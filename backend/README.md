# Job Portal Backend

A secure job search and professional networking platform backend built with Nest.js, PostgreSQL, and TypeScript.

## Technology Stack

- **Runtime**: Node.js v20.x
- **Framework**: Nest.js (TypeScript)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + Argon2
- **Encryption**: AES-256-CBC (for resumes)

## Prerequisites

Make sure you have the following installed:

- Node.js v18 or v20
- PostgreSQL
- npm

## Getting Started

### Step 1 — Clone the repository

```bash
git clone <your-repo-url>
cd jobportal/backend
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Setup PostgreSQL

Connect to PostgreSQL:

```bash
psql postgres
```

Run these commands inside psql:

```sql
CREATE DATABASE jobportal;
CREATE USER devuser WITH ENCRYPTED PASSWORD 'devpass123';
GRANT ALL PRIVILEGES ON DATABASE jobportal TO devuser;
GRANT ALL ON SCHEMA public TO devuser;
ALTER DATABASE jobportal OWNER TO devuser;
\q
```

### Step 4 — Create environment file

Create a `.env` file in the `backend` folder:

```env
# App
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=devuser
DB_PASSWORD=devpass123
DB_DATABASE=jobportal

# JWT
JWT_SECRET=your_jwt_secret_here

# Resume Encryption
RESUME_ENCRYPTION_KEY=jobportal_resume_key_32byteslong!
```

> **Note**: Never commit your `.env` file to GitHub. Each team member creates their own locally.

### Step 5 — Run the application

```bash
npm run start:dev
```

TypeORM will automatically create all database tables on first run.

---

## API Endpoints

### Auth

| Method | Endpoint           | Description             | Auth Required |
| ------ | ------------------ | ----------------------- | ------------- |
| POST   | `/auth/register`   | Register new user       | No            |
| POST   | `/auth/verify-otp` | Verify email with OTP   | No            |
| POST   | `/auth/login`      | Login and get JWT token | No            |

### Users

| Method | Endpoint         | Description        | Auth Required |
| ------ | ---------------- | ------------------ | ------------- |
| GET    | `/users/profile` | Get own profile    | Yes           |
| PATCH  | `/users/profile` | Update own profile | Yes           |

### Resume

| Method | Endpoint                 | Description               | Auth Required |
| ------ | ------------------------ | ------------------------- | ------------- |
| POST   | `/resume/upload`         | Upload PDF or DOCX resume | Yes           |
| GET    | `/resume`                | List all your resumes     | Yes           |
| GET    | `/resume/download/:id`   | Download a resume         | Yes           |
| DELETE | `/resume/:id`            | Delete a resume           | Yes           |
| PATCH  | `/resume/set-active/:id` | Set a resume as active    | Yes           |

### Admin (Admin role required)

| Method | Endpoint                     | Description           | Auth Required |
| ------ | ---------------------------- | --------------------- | ------------- |
| GET    | `/admin/users`               | List all users        | Yes (Admin)   |
| GET    | `/admin/users/:id`           | Get user with profile | Yes (Admin)   |
| PATCH  | `/admin/users/:id/suspend`   | Suspend a user        | Yes (Admin)   |
| PATCH  | `/admin/users/:id/unsuspend` | Unsuspend a user      | Yes (Admin)   |
| DELETE | `/admin/users/:id`           | Delete a user         | Yes (Admin)   |

---

## Using the API

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Making an Admin User

After registering, manually update the role in the database:

```bash
psql -h localhost -U devuser -d jobportal -W
```

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

### OTP Simulation

OTPs are currently simulated — they are printed in the terminal instead of being sent via email or SMS. Check the terminal output after registering to get your OTP.

---

## Project Structure

```
src/
├── auth/           # Registration, login, JWT strategy
├── users/          # User profiles
├── otp/            # OTP generation and verification
├── resume/         # Resume upload, encryption, download
├── admin/          # Admin dashboard
└── common/         # Shared guards, decorators, utilities
```

---

## Security Features

- Passwords hashed with Argon2
- JWT based authentication
- Role based access control (user / recruiter / admin)
- Resumes encrypted at rest with AES-256-CBC
- OTP based email verification
- Suspended account check on login

---

## Troubleshooting

**Permission denied for schema public**

```sql
GRANT ALL ON SCHEMA public TO devuser;
ALTER DATABASE jobportal OWNER TO devuser;
```

**Port 3000 already in use**

```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

**Tables not created**
Make sure `synchronize: true` is set in `app.module.ts` and restart the server.
