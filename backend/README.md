# Job Portal Backend

A secure job search and professional networking platform backend built with Nest.js, PostgreSQL, and TypeScript.

## Technology Stack

- **Runtime**: Node.js v20.x
- **Framework**: Nest.js (TypeScript)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + Argon2
- **Encryption**: AES-256-CBC (resumes + messages)
- **PKI**: RSA-2048 / SHA-256 (resume integrity + message signing)
- **Rate Limiting**: @nestjs/throttler
- **Security Headers**: Helmet

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
npm install helmet @nestjs/throttler
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

# CORS — comma-separated list of allowed origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://192.168.2.236
```

> **Note**: Never commit your `.env` file to GitHub.

### Step 5 — Run locally

```bash
npm run start:dev
```

TypeORM will automatically create/migrate all database tables on first run.

On first run, the server generates an RSA-2048 key pair and saves it to `keys/server.private.pem` and `keys/server.public.pem`. Add `keys/` to `.gitignore`.

```bash
echo "keys/" >> .gitignore
```

---

## VM Deployment

The backend is deployed on a university-provided VM at `192.168.2.236`, running behind Nginx with HTTPS (self-signed certificate).

### Stack on VM

- **Process Manager**: PM2
- **Reverse Proxy**: Nginx (port 443 → localhost:3000)
- **SSL**: Self-signed certificate

### Deploy / Update backend on VM

```bash
scp -r ./backend/src iiitd@192.168.2.236:~/job-portal/backend/
ssh iiitd@192.168.2.236
cd ~/job-portal/backend
pm2 restart jobportal
pm2 logs jobportal
```

> **Important**: Also copy the `keys/` folder to the VM if you want existing resume/message signatures to remain verifiable. If keys are regenerated on the VM, old signatures will fail verification.

```bash
scp -r ./backend/keys iiitd@192.168.2.236:~/job-portal/backend/
```

---

## Project Structure

```
src/
├── auth/           # Registration, login, JWT strategy, password reset, account deletion
├── users/          # User profiles
├── otp/            # OTP generation and verification
├── resume/         # Resume upload, encryption, PKI signing, OTP-gated download
├── admin/          # Admin dashboard
├── companies/      # Company pages and job postings
├── applications/   # Job applications and status tracking
├── messages/       # Encrypted + PKI-signed one-to-one messaging
├── audit/          # Hash-chained tamper-evident audit logging
├── pki/            # RSA key management, sign/verify utilities
└── common/         # Shared guards, decorators, utilities
keys/
├── server.private.pem   # RSA-2048 private key (auto-generated, never commit)
└── server.public.pem    # RSA-2048 public key
```

---

## API Endpoints

### Auth

| Method | Endpoint                     | Description                          | Auth Required | Rate Limit |
| ------ | ---------------------------- | ------------------------------------ | ------------- | ---------- |
| POST   | `/auth/register`             | Register new user                    | No            | 5/min      |
| POST   | `/auth/verify-otp`           | Verify email with OTP                | No            | 10/min     |
| POST   | `/auth/login`                | Login and get JWT token              | No            | 10/min     |
| POST   | `/auth/forgot-password`      | Request password reset OTP           | No            | 5/min      |
| POST   | `/auth/reset-password`       | Reset password with OTP              | No            | 5/min      |
| POST   | `/auth/request-deletion-otp` | Request account deletion OTP         | Yes           | 3/min      |
| DELETE | `/auth/delete-account`       | Delete account with OTP confirmation | No            | 3/min      |

### Users

| Method | Endpoint         | Description        | Auth Required |
| ------ | ---------------- | ------------------ | ------------- |
| GET    | `/users/profile` | Get own profile    | Yes           |
| PATCH  | `/users/profile` | Update own profile | Yes           |

### Resume

| Method | Endpoint                           | Description                            | Auth Required |
| ------ | ---------------------------------- | -------------------------------------- | ------------- |
| POST   | `/resume/upload`                   | Upload PDF or DOCX resume (PKI signed) | Yes           |
| GET    | `/resume`                          | List all your resumes                  | Yes           |
| POST   | `/resume/request-download-otp/:id` | Request OTP before downloading         | Yes           |
| POST   | `/resume/download/:id`             | Download resume (OTP required in body) | Yes           |
| DELETE | `/resume/:id`                      | Delete a resume                        | Yes           |
| PATCH  | `/resume/set-active/:id`           | Set a resume as active                 | Yes           |

**Resume download flow:**

```
1. POST /resume/request-download-otp/:id   → OTP printed in terminal
2. POST /resume/download/:id               → Body: { "otpCode": "123456" }
   Response headers include:
     X-Integrity-Verified: true/false
     X-Integrity-Note: RSA-SHA256 signature verified...
     X-File-Hash: <sha256hex>
```

### PKI

| Method | Endpoint          | Description                     | Auth Required |
| ------ | ----------------- | ------------------------------- | ------------- |
| GET    | `/pki/public-key` | Get server RSA public key (PEM) | No            |

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

| Method | Endpoint            | Description                                          | Auth Required |
| ------ | ------------------- | ---------------------------------------------------- | ------------- |
| POST   | `/messages`         | Send an encrypted + PKI-signed message               | Yes           |
| GET    | `/messages`         | Get inbox (all conversations, last message)          | Yes           |
| GET    | `/messages/:userId` | Get full decrypted + integrity-verified conversation | Yes           |

**Message conversation response includes per-message integrity:**

```json
{
  "integrity": {
    "verified": true,
    "note": "RSA-SHA256 signature verified. Message integrity confirmed."
  }
}
```

### Admin

| Method | Endpoint                     | Description                 | Auth Required |
| ------ | ---------------------------- | --------------------------- | ------------- |
| GET    | `/admin/users`               | List all users              | Yes (Admin)   |
| GET    | `/admin/users/:id`           | Get user with profile       | Yes (Admin)   |
| PATCH  | `/admin/users/:id/suspend`   | Suspend a user              | Yes (Admin)   |
| PATCH  | `/admin/users/:id/unsuspend` | Unsuspend a user            | Yes (Admin)   |
| DELETE | `/admin/users/:id`           | Delete a user               | Yes (Admin)   |
| GET    | `/admin/logs`                | View audit log trail        | Yes (Admin)   |
| GET    | `/admin/logs/verify`         | Verify hash-chain integrity | Yes (Admin)   |

**Audit log verify response:**

```json
{
  "valid": true,
  "totalEntries": 42,
  "firstTamperedId": null,
  "message": "All 42 audit log entries verified. Chain is intact."
}
```

---

## Using the API

### Authentication

All protected endpoints require a Bearer token:

```
Authorization: Bearer <your_jwt_token>
```

### Password Reset Flow

```bash
# Step 1 — request OTP (check terminal for code)
POST /auth/forgot-password
{ "email": "user@example.com" }

# Step 2 — reset with OTP
POST /auth/reset-password
{ "email": "user@example.com", "code": "123456", "newPassword": "newpass123" }
```

### Account Deletion Flow

```bash
# Step 1 — request OTP (JWT required, check terminal for code)
POST /auth/request-deletion-otp

# Step 2 — confirm deletion with OTP
DELETE /auth/delete-account
{ "email": "user@example.com", "code": "123456" }
```

### Setting User Roles

```bash
psql -h localhost -U devuser -d jobportal -W
```

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
UPDATE users SET role = 'recruiter' WHERE email = 'recruiter@example.com';
```

### OTP Simulation

OTPs are printed in the terminal (not sent via email/SMS). Check terminal output after triggering any OTP action.

---

## Security Features

| Feature            | Implementation                                                  |
| ------------------ | --------------------------------------------------------------- |
| Password hashing   | Argon2                                                          |
| Authentication     | JWT with role-based access control (user / recruiter / admin)   |
| Resume encryption  | AES-256-CBC at rest                                             |
| Resume integrity   | RSA-2048/SHA-256 signature verified on every download           |
| Message encryption | AES-256-CBC at rest                                             |
| Message integrity  | RSA-2048/SHA-256 signature verified on every fetch              |
| OTP verification   | Registration, password reset, resume download, account deletion |
| Audit logging      | Hash-chained tamper-evident logs (SHA-256 chain)                |
| Rate limiting      | Per-endpoint throttling (login: 10/min, register: 5/min, etc.)  |
| Security headers   | Helmet (XSS, clickjacking, MIME sniffing protection)            |
| CORS               | Restricted to configured allowed origins                        |
| Input validation   | Global ValidationPipe — whitelist + forbidNonWhitelisted        |
| Suspended account  | Blocked at login                                                |

---

## Audit Logging

All critical actions are automatically logged with hash chaining:

- User registration, login, password reset, account deletion
- Resume downloaded
- Company created / updated
- Job posted / updated / deleted
- Application submitted / status updated
- Message sent
- User suspended / unsuspended / deleted

Each log entry contains: `action`, `performedBy`, `targetId`, `targetType`, `metadata`, `previousHash`, `entryHash`, `createdAt`.

Verify chain integrity: `GET /admin/logs/verify` (admin token required).

---

## PKI — Public Key Infrastructure

The server auto-generates an RSA-2048 key pair on first boot and persists it to the `keys/` directory.

- **Resume signing**: SHA-256 hash of file buffer is signed with server private key on upload. Verified on every download.
- **Message signing**: SHA-256 hash of plaintext content is signed on send. Verified on every conversation fetch.
- **Public key endpoint**: `GET /pki/public-key` — returns the server public key in PEM format so any party can independently verify signatures.

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

Make sure `synchronize: true` is set in `app.module.ts` and restart.

**PM2 app not starting on VM**

```bash
pm2 logs jobportal
pm2 delete jobportal
pm2 start npm --name "jobportal" -- run start:dev
pm2 save
```

**RSA key not found error**

The `keys/` directory is created automatically. If deploying to VM, copy keys manually:

```bash
scp -r ./backend/keys iiitd@192.168.2.236:~/job-portal/backend/
```
