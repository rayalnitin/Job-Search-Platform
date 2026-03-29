# Job Portal Backend

A secure job search and professional networking platform backend built with Nest.js, PostgreSQL, and TypeScript.

## Technology Stack

- **Runtime**: Node.js v20.x
- **Framework**: Nest.js (TypeScript)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + Argon2
- **Encryption**: AES-256-CBC (for resumes and messages)

## Prerequisites

- Node.js v18 or v20
- PostgreSQL
- npm

---

## Local Development

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

```bash
psql postgres
```

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
JWT_EXPIRATION=1h

# Encryption (resumes + messages)
RESUME_ENCRYPTION_KEY=your_32_byte_key_here
```

> **Note**: Never commit your `.env` file to GitHub.

### Step 5 — Run locally

```bash
npm run start:dev
```

TypeORM will automatically create all database tables on first run.

---

## VM Deployment

The backend is deployed on a university-provided VM at `192.168.2.236`, running behind Nginx with HTTPS (self-signed certificate).

### Stack on VM

- **Process Manager**: PM2
- **Reverse Proxy**: Nginx (port 443 → localhost:3000)
- **SSL**: Self-signed certificate

### Deploy / Update backend on VM

From your local machine, copy the `src` folder to the VM:

```bash
scp -r ./backend/src iiitd@192.168.2.236:~/job-portal/backend/
```

Then SSH in and restart:

```bash
ssh iiitd@192.168.2.236
cd ~/job-portal/backend
pm2 restart jobportal
pm2 logs jobportal   # check for errors
```

### Useful PM2 commands

```bash
pm2 status            # check if app is running
pm2 logs jobportal    # live logs
pm2 restart jobportal # restart after code changes
pm2 stop jobportal    # stop the app
```

### Nginx config location

```bash
sudo nano /etc/nginx/sites-available/default
sudo nginx -t && sudo systemctl restart nginx
```

---

## Frontend Integration

When building the frontend, use a single config file for the API base URL:

```javascript
// src/config.js
const API_BASE_URL = 'https://192.168.2.236'; // VM (production)
// const API_BASE_URL = 'http://localhost:3000'; // local development

export default API_BASE_URL;
```

> **Self-signed cert warning**: Visit `https://192.168.2.236` directly in your browser once and accept the risk. After that, frontend fetch calls will work fine in the same browser session.

---

## Project Structure

```
src/
├── auth/           # Registration, login, JWT strategy
├── users/          # User profiles
├── otp/            # OTP generation and verification
├── resume/         # Resume upload, encryption, download
├── admin/          # Admin dashboard + audit logs
├── companies/      # Company pages and job postings
├── applications/   # Job applications and status tracking
├── messages/       # Encrypted one-to-one messaging
├── audit/          # Audit logging service and entity
└── common/         # Shared guards, decorators, utilities
```

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

### Companies

| Method | Endpoint         | Description                        | Auth Required     |
| ------ | ---------------- | ---------------------------------- | ----------------- |
| POST   | `/companies`     | Create a company page              | Yes (Recruiter)   |
| GET    | `/companies`     | List all companies                 | No                |
| GET    | `/companies/:id` | Get company details + job listings | No                |
| PATCH  | `/companies/:id` | Update company info                | Yes (Owner/Admin) |

### Jobs

| Method | Endpoint                     | Description                 | Auth Required     |
| ------ | ---------------------------- | --------------------------- | ----------------- |
| POST   | `/companies/:companyId/jobs` | Post a job under a company  | Yes (Recruiter)   |
| GET    | `/jobs`                      | Search/list all active jobs | No                |
| GET    | `/jobs/:id`                  | Get job details             | No                |
| PATCH  | `/jobs/:id`                  | Update a job posting        | Yes (Owner/Admin) |
| DELETE | `/jobs/:id`                  | Delete a job posting        | Yes (Owner/Admin) |

**Job search query params** (`GET /jobs`):

| Param          | Example                | Description                             |
| -------------- | ---------------------- | --------------------------------------- |
| `keyword`      | `?keyword=react`       | Search title/description                |
| `location`     | `?location=delhi`      | Filter by location                      |
| `type`         | `?type=internship`     | full-time/part-time/internship/contract |
| `locationType` | `?locationType=remote` | remote/onsite/hybrid                    |
| `skill`        | `?skill=python`        | Filter by skill tag                     |

### Applications

| Method | Endpoint                   | Description                              | Auth Required         |
| ------ | -------------------------- | ---------------------------------------- | --------------------- |
| POST   | `/applications`            | Apply to a job                           | Yes (User)            |
| GET    | `/applications/mine`       | List my applications with status history | Yes (User)            |
| GET    | `/applications/job/:jobId` | List all applicants for a job            | Yes (Recruiter/Admin) |
| GET    | `/applications/:id`        | Get single application detail            | Yes                   |
| PATCH  | `/applications/:id/status` | Update application status                | Yes (Recruiter/Admin) |

**Application status values**: `applied` → `reviewed` → `interviewed` → `rejected` / `offer`

### Messages

| Method | Endpoint            | Description                                 | Auth Required |
| ------ | ------------------- | ------------------------------------------- | ------------- |
| POST   | `/messages`         | Send an encrypted message                   | Yes           |
| GET    | `/messages`         | Get inbox (all conversations, last message) | Yes           |
| GET    | `/messages/:userId` | Get full decrypted conversation with a user | Yes           |

### Admin

| Method | Endpoint                     | Description               | Auth Required |
| ------ | ---------------------------- | ------------------------- | ------------- |
| GET    | `/admin/users`               | List all users            | Yes (Admin)   |
| GET    | `/admin/users/:id`           | Get user with profile     | Yes (Admin)   |
| PATCH  | `/admin/users/:id/suspend`   | Suspend a user            | Yes (Admin)   |
| PATCH  | `/admin/users/:id/unsuspend` | Unsuspend a user          | Yes (Admin)   |
| DELETE | `/admin/users/:id`           | Delete a user             | Yes (Admin)   |
| GET    | `/admin/logs`                | View full audit log trail | Yes (Admin)   |

---

## Using the API

### Authentication

All protected endpoints require a Bearer token:

```
Authorization: Bearer <your_jwt_token>
```

### Setting User Roles

After registering, manually update role in the database:

```bash
psql -h localhost -U devuser -d jobportal -W
```

```sql
-- Make a user an admin
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';

-- Make a user a recruiter
UPDATE users SET role = 'recruiter' WHERE email = 'recruiter@example.com';
```

### OTP Simulation

OTPs are printed in the terminal (not sent via email/SMS). Check terminal output after registering.

---

## Security Features

- Passwords hashed with Argon2
- JWT-based authentication with role-based access control (user / recruiter / admin)
- Resumes encrypted at rest with AES-256-CBC
- Messages encrypted at rest with AES-256-CBC (server-side)
- OTP-based email verification
- Suspended account check on login
- Tamper-evident audit logging for all critical actions
- CORS enabled for frontend integration

---

## Audit Logging

All critical actions are automatically logged to the `audit_logs` table:

- User registration and login
- Company created / updated
- Job posted / updated / deleted
- Application submitted
- Application status updated
- Message sent
- User suspended / unsuspended / deleted

View logs via `GET /admin/logs` (admin token required).

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

**PM2 app not starting on VM**

```bash
pm2 logs jobportal   # check error output
pm2 delete jobportal
pm2 start npm --name "jobportal" -- run start:dev
pm2 save
```
