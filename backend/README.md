# Job Portal Backend

A secure job search and professional networking platform backend built with Nest.js, PostgreSQL, and TypeScript.

## Technology Stack

- **Runtime**: Node.js v20.x
- **Framework**: Nest.js (TypeScript)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + Argon2
- **Encryption**: AES-256-CBC (server-side messages + resumes) + Client-side RSA (E2EE messages)
- **PKI**: RSA-2048 / SHA-256 (resume integrity + message signing + E2EE key infrastructure)
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

# Encryption (resumes + server-side messages)
RESUME_ENCRYPTION_KEY=your_32_byte_key_here

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://192.168.2.236
```

> **Note**: Never commit your `.env` file to GitHub.

### Step 5 — Run locally

```bash
npm run start:dev
```

TypeORM will automatically create/migrate all database tables on first run.

On first run, the server generates an RSA-2048 key pair and saves it to `keys/server.private.pem` and `keys/server.public.pem`.

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

```bash
scp -r ./backend/keys iiitd@192.168.2.236:~/job-portal/backend/
```

---

## Project Structure

```
src/
├── auth/             # Registration, login, JWT, password reset, account deletion
├── users/            # Profiles, field-level privacy, viewer tracking, avatar
├── otp/              # OTP generation and verification
├── resume/           # Resume upload, AES encryption, PKI signing, OTP download
├── admin/            # Admin dashboard, audit log viewer
├── companies/        # Company pages and job postings
├── applications/     # Job applications, status tracking, shortlisting
├── messages/         # Server-side encrypted 1-to-1, group, and E2EE messaging
├── connections/      # Connection requests, acceptance, graph
├── audit/            # Hash-chained tamper-evident audit logging
├── pki/              # RSA key management, sign/verify utilities
└── common/           # Shared guards, decorators, utilities
keys/
├── server.private.pem
└── server.public.pem
```

---

## API Endpoints

### Auth

| Method | Endpoint                     | Description                  | Auth | Rate Limit |
| ------ | ---------------------------- | ---------------------------- | ---- | ---------- |
| POST   | `/auth/register`             | Register new user            | No   | 5/min      |
| POST   | `/auth/verify-otp`           | Verify email OTP             | No   | 10/min     |
| POST   | `/auth/login`                | Login, get JWT               | No   | 10/min     |
| POST   | `/auth/forgot-password`      | Request password reset OTP   | No   | 5/min      |
| POST   | `/auth/reset-password`       | Reset password with OTP      | No   | 5/min      |
| POST   | `/auth/request-deletion-otp` | Request account deletion OTP | Yes  | 3/min      |
| DELETE | `/auth/delete-account`       | Delete account with OTP      | No   | 3/min      |

---

### Users & Profiles

| Method | Endpoint                 | Description                                             | Auth |
| ------ | ------------------------ | ------------------------------------------------------- | ---- |
| GET    | `/users/profile`         | Own full profile (includes privacy + avatar flag)       | Yes  |
| PATCH  | `/users/profile`         | Update profile fields, privacy settings, viewer opt-out | Yes  |
| GET    | `/users/profile/viewers` | My viewer count + recent viewers list                   | Yes  |
| GET    | `/users/profile/:id`     | Another user's profile (privacy-filtered)               | Yes  |
| POST   | `/users/profile/avatar`  | Upload profile picture (JPEG/PNG/WEBP, max 2MB)         | Yes  |
| DELETE | `/users/profile/avatar`  | Delete own avatar                                       | Yes  |
| GET    | `/users/avatar/:id`      | Fetch avatar image bytes (public, no auth needed)       | No   |

#### Profile Fields

| Field        | Privacy Controlled  | Privacy Setting Key |
| ------------ | ------------------- | ------------------- |
| `name`       | No — always visible | —                   |
| `headline`   | Yes                 | `headlinePrivacy`   |
| `location`   | Yes                 | `locationPrivacy`   |
| `bio`        | Yes                 | `bioPrivacy`        |
| `education`  | Yes                 | `educationPrivacy`  |
| `experience` | Yes                 | `experiencePrivacy` |
| `skills`     | Yes                 | `skillsPrivacy`     |

#### Privacy Values

| Value           | Visible to                         |
| --------------- | ---------------------------------- |
| `"public"`      | Everyone (default)                 |
| `"connections"` | Accepted connections + admins only |
| `"private"`     | Owner + admins only                |

**Update privacy example:**

```json
PATCH /users/profile
{
  "locationPrivacy": "connections",
  "bioPrivacy": "private",
  "optOutOfViewers": true
}
```

**Own profile response:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "phone": "+91xxxxxxxxxx",
  "role": "user",
  "name": "John Doe",
  "headline": "Software Engineer",
  "location": "New Delhi",
  "bio": "...",
  "education": "...",
  "experience": "...",
  "skills": "TypeScript, NestJS",
  "hasAvatar": true,
  "privacy": {
    "headlinePrivacy": "public",
    "locationPrivacy": "connections",
    "bioPrivacy": "private",
    "educationPrivacy": "public",
    "experiencePrivacy": "public",
    "skillsPrivacy": "public",
    "optOutOfViewers": false
  }
}
```

**Viewing another user's profile:** Hidden fields return `null`. The `privacy` block is always included so the frontend can display "This field is private" instead of just a blank.

#### Avatar Upload

Send as `multipart/form-data` with field name `avatar`.

```html
<!-- Display in frontend -->
<img src="https://your-api/users/avatar/{userId}" />
```

The avatar endpoint has no auth guard and sets a 1-hour browser cache header. Check `hasAvatar: true` in profile before making the request.

#### Profile Viewer Tracking

- View logged on every `GET /users/profile/:id` call (not own profile)
- Same viewer + same target within 1 hour = deduplicated, counted once
- `optOutOfViewers: true` = your views are never recorded anywhere

```json
GET /users/profile/viewers
{
  "totalUniqueViewers": 12,
  "recentViewers": [
    { "viewerId": "uuid", "viewerEmail": "someone@example.com", "viewedAt": "..." }
  ]
}
```

---

### Connections

| Method | Endpoint                  | Description                    | Auth |
| ------ | ------------------------- | ------------------------------ | ---- |
| POST   | `/connections/request`    | Send connection request        | Yes  |
| GET    | `/connections`            | List accepted connections      | Yes  |
| GET    | `/connections/pending`    | List incoming pending requests | Yes  |
| GET    | `/connections/graph`      | Limited connection graph       | Yes  |
| PATCH  | `/connections/:id/accept` | Accept a request               | Yes  |
| PATCH  | `/connections/:id/reject` | Reject a request               | Yes  |
| DELETE | `/connections/:id`        | Remove connection              | Yes  |

**Send request:**

```json
POST /connections/request
{ "receiverId": "uuid" }
```

**Rules:**

- Cannot connect with yourself
- No duplicate requests (pending or accepted)
- Previously rejected → new request allowed
- Only receiver can accept/reject
- Either party can remove

**Connection graph** (`GET /connections/graph`) returns your connections and which of their connections are mutual with you. Strangers never exposed.

```json
{
  "totalConnections": 3,
  "graph": [
    {
      "user": { "id": "uuid", "email": "alice@example.com" },
      "mutualConnections": [{ "id": "uuid", "email": "bob@example.com" }]
    }
  ]
}
```

---

### Resume

| Method | Endpoint                           | Description                              | Auth |
| ------ | ---------------------------------- | ---------------------------------------- | ---- |
| POST   | `/resume/upload`                   | Upload PDF/DOCX (encrypted + PKI signed) | Yes  |
| GET    | `/resume`                          | List your resumes                        | Yes  |
| POST   | `/resume/request-download-otp/:id` | Request download OTP                     | Yes  |
| POST   | `/resume/download/:id`             | Download (OTP in body)                   | Yes  |
| DELETE | `/resume/:id`                      | Delete a resume                          | Yes  |
| PATCH  | `/resume/set-active/:id`           | Set active resume                        | Yes  |

---

### PKI

| Method | Endpoint          | Description                     | Auth |
| ------ | ----------------- | ------------------------------- | ---- |
| GET    | `/pki/public-key` | Get server RSA public key (PEM) | No   |

---

### Companies

| Method | Endpoint         | Description            | Auth              |
| ------ | ---------------- | ---------------------- | ----------------- |
| POST   | `/companies`     | Create company page    | Yes (Recruiter)   |
| GET    | `/companies`     | List all companies     | No                |
| GET    | `/companies/:id` | Company details + jobs | No                |
| PATCH  | `/companies/:id` | Update company         | Yes (Owner/Admin) |

---

### Jobs

| Method | Endpoint                     | Description      | Auth              |
| ------ | ---------------------------- | ---------------- | ----------------- |
| POST   | `/companies/:companyId/jobs` | Post a job       | Yes (Recruiter)   |
| GET    | `/jobs`                      | Search/list jobs | No                |
| GET    | `/jobs/:id`                  | Job details      | No                |
| PATCH  | `/jobs/:id`                  | Update job       | Yes (Owner/Admin) |
| DELETE | `/jobs/:id`                  | Delete job       | Yes (Owner/Admin) |

**Search params (`GET /jobs`):** `keyword`, `location`, `type`, `locationType`, `skill`

---

### Applications

| Method | Endpoint                                    | Description            | Auth                  |
| ------ | ------------------------------------------- | ---------------------- | --------------------- |
| POST   | `/applications`                             | Apply to a job         | Yes (User)            |
| GET    | `/applications/mine`                        | My applications        | Yes (User)            |
| GET    | `/applications/job/:jobId`                  | All applicants for job | Yes (Recruiter/Admin) |
| GET    | `/applications/job/:jobId?shortlisted=true` | Shortlisted only       | Yes (Recruiter/Admin) |
| GET    | `/applications/:id`                         | Single application     | Yes                   |
| PATCH  | `/applications/:id/status`                  | Update status          | Yes (Recruiter/Admin) |
| PATCH  | `/applications/:id/shortlist`               | Shortlist/un-shortlist | Yes (Recruiter/Admin) |

**Apply:**

```json
POST /applications
{ "jobId": "uuid", "resumeId": "uuid", "coverNote": "..." }
```

**Update status:**

```json
PATCH /applications/:id/status
{ "status": "reviewed", "recruiterNotes": "Strong candidate" }
```

**Shortlist:**

```json
PATCH /applications/:id/shortlist
{ "isShortlisted": true }
```

Status flow: `applied` → `reviewed` → `interviewed` → `rejected` / `offer`

---

### Messages — One-to-One (Server-Side Encrypted)

| Method | Endpoint            | Description                   | Auth |
| ------ | ------------------- | ----------------------------- | ---- |
| POST   | `/messages`         | Send encrypted message        | Yes  |
| GET    | `/messages`         | Inbox preview                 | Yes  |
| GET    | `/messages/:userId` | Full conversation (decrypted) | Yes  |

Messages are encrypted with AES-256-CBC. SHA-256 hash of plaintext is RSA-signed on send and re-verified on fetch.

```json
POST /messages
{ "receiverId": "uuid", "content": "Hello!" }
```

---

### Messages — Group (Server-Side Encrypted)

| Method | Endpoint                                    | Description                       | Auth          |
| ------ | ------------------------------------------- | --------------------------------- | ------------- |
| POST   | `/messages/groups`                          | Create group                      | Yes           |
| GET    | `/messages/groups`                          | My groups                         | Yes           |
| POST   | `/messages/groups/:id/participants`         | Add participant (creator only)    | Yes           |
| DELETE | `/messages/groups/:id/participants/:userId` | Remove participant (creator only) | Yes           |
| POST   | `/messages/groups/:id/send`                 | Send to group                     | Yes (members) |
| GET    | `/messages/groups/:id`                      | Full conversation (decrypted)     | Yes (members) |

**Create group:**

```json
POST /messages/groups
{ "name": "Interview Panel", "participantIds": ["uuid-1", "uuid-2"] }
```

**Rules:** Creator auto-added. Min 2 participants always. Only creator adds/removes. Only members read/send.

**Group conversation response:**

```json
{
  "group": {
    "id": "uuid", "name": "Interview Panel",
    "createdBy": { "id": "uuid", "email": "recruiter@example.com" },
    "participants": [...]
  },
  "messages": [
    {
      "id": "uuid", "from": "me", "senderId": "uuid",
      "content": "Meeting at 3pm?", "sentAt": "...",
      "integrity": { "verified": true, "note": "RSA-SHA256 signature verified..." }
    }
  ]
}
```

---

### Messages — E2EE (End-to-End Encrypted)

True E2EE — the **server never sees plaintext**. The client generates a key pair, encrypts messages using the recipient's public key before sending. Server stores only ciphertext.

| Method | Endpoint                      | Description                              | Auth |
| ------ | ----------------------------- | ---------------------------------------- | ---- |
| POST   | `/messages/e2ee/keys`         | Register client public key               | Yes  |
| GET    | `/messages/e2ee/keys/:userId` | Get a user's public key                  | Yes  |
| GET    | `/messages/e2ee`              | E2EE inbox preview                       | Yes  |
| POST   | `/messages/e2ee`              | Send E2EE message (ciphertext only)      | Yes  |
| GET    | `/messages/e2ee/:userId`      | Fetch E2EE conversation (raw ciphertext) | Yes  |

#### E2EE Flow (Frontend Must Implement)

```
Step 1 — Key setup (once per session):
  Client generates RSA key pair in browser (e.g. WebCrypto API)
  POST /messages/e2ee/keys  { "publicKey": "<PEM or base64>" }
  Private key stays in browser — never sent to server

Step 2 — Send a message:
  GET /messages/e2ee/keys/:receiverId   → get recipient's public key
  Encrypt content client-side using recipient's public key
  POST /messages/e2ee  { "receiverId": "uuid", "ciphertext": "<encrypted>" }
  Server stores ciphertext as-is, signs its hash for tamper-evidence

Step 3 — Read messages:
  GET /messages/e2ee/:userId   → raw ciphertext returned
  Decrypt each message client-side using your private key
```

**Register public key:**

```json
POST /messages/e2ee/keys
{ "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----" }
```

**Send E2EE message:**

```json
POST /messages/e2ee
{
  "receiverId": "uuid",
  "ciphertext": "<base64-encrypted-content>"
}
```

**E2EE conversation response:**

```json
[
  {
    "id": "uuid",
    "from": "me",
    "senderId": "uuid",
    "ciphertext": "<base64-encrypted-content>",
    "isRead": true,
    "sentAt": "2026-04-13T08:00:00.000Z",
    "integrity": {
      "verified": true,
      "note": "RSA-SHA256 signature verified. Ciphertext integrity confirmed. Decrypt using your private key."
    }
  }
]
```

**E2EE inbox preview:**

```json
[
  {
    "partnerId": "uuid",
    "partnerEmail": "alice@example.com",
    "lastMessageAt": "2026-04-13T08:00:00.000Z",
    "unreadCount": 2,
    "encrypted": true
  }
]
```

> Note: Inbox preview intentionally omits message content — server cannot decrypt E2EE messages.

**Errors:**

- `400` if recipient has not registered a public key → ask them to enable E2EE first
- `400` if sender tries to message themselves

**Server-side PKI role in E2EE:**
The server signs a SHA-256 hash of the **ciphertext** (not plaintext) on receipt. On fetch, this signature is verified. This proves the ciphertext was not altered in the database after the sender submitted it — integrity without decryption.

---

### Admin

| Method | Endpoint                     | Description                 | Auth        |
| ------ | ---------------------------- | --------------------------- | ----------- |
| GET    | `/admin/users`               | List all users              | Yes (Admin) |
| GET    | `/admin/users/:id`           | User with profile           | Yes (Admin) |
| PATCH  | `/admin/users/:id/suspend`   | Suspend user                | Yes (Admin) |
| PATCH  | `/admin/users/:id/unsuspend` | Unsuspend user              | Yes (Admin) |
| DELETE | `/admin/users/:id`           | Delete user                 | Yes (Admin) |
| GET    | `/admin/logs`                | View audit trail            | Yes (Admin) |
| GET    | `/admin/logs/verify`         | Verify hash-chain integrity | Yes (Admin) |

---

## Security Features

| Feature                        | Implementation                                                  |
| ------------------------------ | --------------------------------------------------------------- |
| Password hashing               | Argon2                                                          |
| Authentication                 | JWT + RBAC (user / recruiter / admin)                           |
| Resume encryption              | AES-256-CBC at rest                                             |
| Resume integrity               | RSA-2048/SHA-256 verified on download                           |
| Server-side message encryption | AES-256-CBC (1-to-1 + group)                                    |
| Server-side message integrity  | RSA-2048/SHA-256 verified on fetch                              |
| E2EE messaging                 | Client-side RSA encryption — server stores ciphertext only      |
| E2EE ciphertext integrity      | Server signs ciphertext hash — proves DB not tampered           |
| OTP verification               | Registration, password reset, resume download, account deletion |
| Audit logging                  | SHA-256 hash-chained tamper-evident logs                        |
| Rate limiting                  | Per-endpoint throttling                                         |
| Security headers               | Helmet                                                          |
| CORS                           | Restricted origins                                              |
| Input validation               | Global ValidationPipe whitelist                                 |
| Suspended accounts             | Blocked at login                                                |
| Field-level privacy            | public / connections / private per profile field                |
| Profile viewer tracking        | Opt-out + 1-hour dedup                                          |
| Avatar upload                  | JPEG/PNG/WEBP, 2MB max, public endpoint                         |

---

## Audit Logging

Logged actions: registration, login, password reset, account deletion, resume download, company/job CRUD, application submit/status, messages sent (all types), group created, user suspend/delete, profile viewed.

Each entry: `action`, `performedBy`, `targetId`, `targetType`, `metadata`, `previousHash`, `entryHash`, `createdAt`.

Verify: `GET /admin/logs/verify`

---

## Database Tables

| Table                 | Description                                             |
| --------------------- | ------------------------------------------------------- |
| `users`               | Accounts, roles, verification, E2EE public key          |
| `profiles`            | Profile fields, privacy settings, avatar, opt-out       |
| `profile_views`       | Viewer tracking log                                     |
| `connections`         | Connection requests and accepted connections            |
| `otps`                | OTP codes with purpose and expiry                       |
| `resumes`             | Encrypted resumes with PKI signatures                   |
| `companies`           | Company pages                                           |
| `jobs`                | Job postings                                            |
| `applications`        | Applications with status history and shortlist          |
| `messages`            | Server-side AES encrypted 1-to-1 messages               |
| `group_conversations` | Group chat rooms                                        |
| `group_participants`  | Group membership join table                             |
| `group_messages`      | Server-side AES encrypted group messages                |
| `e2ee_messages`       | E2EE messages (ciphertext only — server never decrypts) |
| `audit_logs`          | Hash-chained audit trail                                |

---

## Troubleshooting

**Permission denied for schema public**

```sql
GRANT ALL ON SCHEMA public TO devuser;
ALTER DATABASE jobportal OWNER TO devuser;
```

**Port 3000 in use**

```bash
sudo lsof -i :3000 && sudo kill -9 <PID>
```

**Tables not created** — ensure `synchronize: true` in `app.module.ts`.

**PM2 issues**

```bash
pm2 logs jobportal
pm2 delete jobportal
pm2 start npm --name "jobportal" -- run start:dev
pm2 save
```

**RSA key missing on VM**

```bash
scp -r ./backend/keys iiitd@192.168.2.236:~/job-portal/backend/
```
