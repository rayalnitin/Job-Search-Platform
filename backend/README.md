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
- **Audit Logging**: SHA-256 hash-chain + Blockchain with Proof-of-Work (difficulty 4)
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

# Email OTP Delivery
EMAIL_USER=your_gmail_address@example.com
EMAIL_PASS=your_gmail_app_password

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

TypeORM automatically creates all tables on first run. On first run, an RSA-2048 key pair is generated and saved to `keys/`.

```bash
echo "keys/" >> .gitignore
```

---

## VM Deployment

Deployed on a university VM at `192.168.2.236`, behind Nginx with HTTPS (self-signed certificate).

- **Process Manager**: PM2
- **Reverse Proxy**: Nginx (443 → localhost:3000)

```bash
scp -r ./backend/src iiitd@192.168.2.236:~/job-portal/backend/
ssh iiitd@192.168.2.236
cd ~/job-portal/backend
pm2 restart jobportal
pm2 logs jobportal
```

```bash
# Also copy keys to preserve PKI signatures
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
├── admin/            # Admin dashboard, audit logs, blockchain
├── companies/        # Company pages and job postings
├── applications/     # Job applications, status tracking, shortlisting
├── messages/         # Server-side 1-to-1, group, and E2EE messaging
├── connections/      # Connection requests, acceptance, graph
├── audit/            # Hash-chain + blockchain tamper-evident audit logging
├── pki/              # RSA key management, sign/verify utilities
└── common/           # Guards, decorators, utilities
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
| POST   | `/auth/request-login-otp`    | Request login OTP by email   | No   | 5/min      |
| POST   | `/auth/verify-login-otp`     | Verify login OTP by email    | No   | 10/min     |
| POST   | `/auth/forgot-password`      | Request password reset OTP   | No   | 5/min      |
| POST   | `/auth/reset-password`       | Reset password with OTP      | No   | 5/min      |
| POST   | `/auth/request-deletion-otp` | Request account deletion OTP | Yes  | 3/min      |
| DELETE | `/auth/delete-account`       | Delete account with OTP      | No   | 3/min      |

---

### Users & Profiles

| Method | Endpoint                 | Description                               | Auth |
| ------ | ------------------------ | ----------------------------------------- | ---- |
| GET    | `/users/profile`         | Own full profile                          | Yes  |
| PATCH  | `/users/profile`         | Update profile, privacy, viewer opt-out   | Yes  |
| GET    | `/users/profile/viewers` | My viewer count + recent viewers          | Yes  |
| GET    | `/users/profile/:id`     | Another user's profile (privacy-filtered) | Yes  |
| POST   | `/users/profile/avatar`  | Upload avatar (JPEG/PNG/WEBP, max 2MB)    | Yes  |
| DELETE | `/users/profile/avatar`  | Delete own avatar                         | Yes  |
| GET    | `/users/avatar/:id`      | Fetch avatar bytes (public, no auth)      | No   |

#### Profile Fields & Privacy

| Field        | Privacy Setting                     |
| ------------ | ----------------------------------- |
| `name`       | Always visible — no privacy control |
| `headline`   | `headlinePrivacy`                   |
| `location`   | `locationPrivacy`                   |
| `bio`        | `bioPrivacy`                        |
| `education`  | `educationPrivacy`                  |
| `experience` | `experiencePrivacy`                 |
| `skills`     | `skillsPrivacy`                     |

Privacy values: `"public"` (default) · `"connections"` · `"private"`

```json
PATCH /users/profile
{
  "locationPrivacy": "connections",
  "bioPrivacy": "private",
  "optOutOfViewers": true
}
```

Hidden fields return `null` when viewed by unauthorized viewers. The `privacy` block is always included in responses so the frontend knows why.

**Own profile response:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "phone": "...",
  "role": "user",
  "name": "John Doe",
  "headline": "...",
  "location": "...",
  "bio": "...",
  "education": "...",
  "experience": "...",
  "skills": "...",
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

#### Avatar

Upload via `multipart/form-data` with field name `avatar`. Display with:

```html
<img src="https://your-api/users/avatar/{userId}" />
```

No auth needed. 1-hour browser cache header set automatically.

#### Profile Viewer Tracking

- View logged on every `GET /users/profile/:id` (not own)
- Same viewer + same target within 1 hour = deduplicated
- `optOutOfViewers: true` = never recorded anywhere

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

| Method | Endpoint                  | Description               | Auth |
| ------ | ------------------------- | ------------------------- | ---- |
| POST   | `/connections/request`    | Send connection request   | Yes  |
| GET    | `/connections`            | My accepted connections   | Yes  |
| GET    | `/connections/pending`    | Incoming pending requests | Yes  |
| GET    | `/connections/graph`      | Limited connection graph  | Yes  |
| PATCH  | `/connections/:id/accept` | Accept request            | Yes  |
| PATCH  | `/connections/:id/reject` | Reject request            | Yes  |
| DELETE | `/connections/:id`        | Remove connection         | Yes  |

```json
POST /connections/request
{ "receiverId": "uuid" }
```

Rules: no self-connect · no duplicates · rejected → re-request allowed · only receiver accepts/rejects · either party removes.

**Graph** returns your connections + their mutual connections with you. Strangers never exposed.

```json
GET /connections/graph
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

| Method | Endpoint                           | Description                                  | Auth |
| ------ | ---------------------------------- | -------------------------------------------- | ---- |
| POST   | `/resume/upload`                   | Upload PDF/DOCX (AES encrypted + PKI signed) | Yes  |
| GET    | `/resume`                          | List your resumes                            | Yes  |
| POST   | `/resume/request-download-otp/:id` | Request download OTP                         | Yes  |
| POST   | `/resume/download/:id`             | Download (OTP in body)                       | Yes  |
| DELETE | `/resume/:id`                      | Delete resume                                | Yes  |
| PATCH  | `/resume/set-active/:id`           | Set active resume                            | Yes  |

Download flow:

```
1. POST /resume/request-download-otp/:id  → OTP sent by email
2. POST /resume/download/:id  { "otpCode": "123456" }
   Headers: X-Integrity-Verified, X-Integrity-Note, X-File-Hash
```

---

### PKI

| Method | Endpoint          | Description                 | Auth |
| ------ | ----------------- | --------------------------- | ---- |
| GET    | `/pki/public-key` | Server RSA public key (PEM) | No   |

---

### Companies

| Method | Endpoint         | Description    | Auth              |
| ------ | ---------------- | -------------- | ----------------- |
| POST   | `/companies`     | Create company | Yes (Recruiter)   |
| GET    | `/companies`     | List all       | No                |
| GET    | `/companies/:id` | Details + jobs | No                |
| PATCH  | `/companies/:id` | Update         | Yes (Owner/Admin) |

---

### Jobs

| Method | Endpoint                     | Description | Auth              |
| ------ | ---------------------------- | ----------- | ----------------- |
| POST   | `/companies/:companyId/jobs` | Post job    | Yes (Recruiter)   |
| GET    | `/jobs`                      | Search/list | No                |
| GET    | `/jobs/:id`                  | Job details | No                |
| PATCH  | `/jobs/:id`                  | Update      | Yes (Owner/Admin) |
| DELETE | `/jobs/:id`                  | Delete      | Yes (Owner/Admin) |

Search params: `keyword` · `location` · `type` · `locationType` · `skill`

---

### Applications

| Method | Endpoint                                    | Description        | Auth                  |
| ------ | ------------------------------------------- | ------------------ | --------------------- |
| POST   | `/applications`                             | Apply to job       | Yes (User)            |
| GET    | `/applications/mine`                        | My applications    | Yes (User)            |
| GET    | `/applications/job/:jobId`                  | All applicants     | Yes (Recruiter/Admin) |
| GET    | `/applications/job/:jobId?shortlisted=true` | Shortlisted only   | Yes (Recruiter/Admin) |
| GET    | `/applications/:id`                         | Single application | Yes                   |
| PATCH  | `/applications/:id/status`                  | Update status      | Yes (Recruiter/Admin) |
| PATCH  | `/applications/:id/shortlist`               | Shortlist toggle   | Yes (Recruiter/Admin) |

```json
POST /applications
{ "jobId": "uuid", "resumeId": "uuid", "coverNote": "..." }

PATCH /applications/:id/status
{ "status": "reviewed", "recruiterNotes": "Strong candidate" }

PATCH /applications/:id/shortlist
{ "isShortlisted": true }
```

Status flow: `applied` → `reviewed` → `interviewed` → `rejected` / `offer`

`recruiterNotes` never visible to applicant. `statusHistory` records every change with timestamp and actor.

---

### Messages — One-to-One (Server-Side Encrypted)

| Method | Endpoint            | Description                              | Auth |
| ------ | ------------------- | ---------------------------------------- | ---- |
| POST   | `/messages`         | Send encrypted message                   | Yes  |
| GET    | `/messages`         | Inbox preview                            | Yes  |
| GET    | `/messages/:userId` | Full conversation (decrypted + verified) | Yes  |

AES-256-CBC at rest. RSA-SHA256 signed on send, verified on fetch.

```json
POST /messages
{ "receiverId": "uuid", "content": "Hello!" }
```

Response per message:

```json
{
  "id": "uuid",
  "from": "me",
  "content": "Hello!",
  "isRead": true,
  "sentAt": "...",
  "integrity": { "verified": true, "note": "RSA-SHA256 signature verified..." }
}
```

---

### Messages — Group (Server-Side Encrypted)

| Method | Endpoint                                    | Description                              | Auth          |
| ------ | ------------------------------------------- | ---------------------------------------- | ------------- |
| POST   | `/messages/groups`                          | Create group                             | Yes           |
| GET    | `/messages/groups`                          | My groups                                | Yes           |
| POST   | `/messages/groups/:id/participants`         | Add participant (creator)                | Yes           |
| DELETE | `/messages/groups/:id/participants/:userId` | Remove participant (creator)             | Yes           |
| POST   | `/messages/groups/:id/send`                 | Send to group                            | Yes (members) |
| GET    | `/messages/groups/:id`                      | Full conversation (decrypted + verified) | Yes (members) |

```json
POST /messages/groups
{ "name": "Interview Panel", "participantIds": ["uuid-1", "uuid-2"] }
```

Rules: creator auto-added · min 2 participants always · only creator manages members · only members read/send · same AES + PKI as 1-to-1.

---

### Messages — E2EE (End-to-End Encrypted)

Server **never sees plaintext**. Client encrypts with recipient's public key before sending.

| Method | Endpoint                      | Description                         | Auth |
| ------ | ----------------------------- | ----------------------------------- | ---- |
| POST   | `/messages/e2ee/keys`         | Register client public key          | Yes  |
| GET    | `/messages/e2ee/keys/:userId` | Get user's public key               | Yes  |
| GET    | `/messages/e2ee`              | E2EE inbox preview                  | Yes  |
| POST   | `/messages/e2ee`              | Send E2EE message                   | Yes  |
| GET    | `/messages/e2ee/:userId`      | Fetch conversation (raw ciphertext) | Yes  |

#### E2EE Flow

```
1. Key setup (once per session):
   Client generates RSA key pair in browser (WebCrypto API)
   POST /messages/e2ee/keys  { "publicKey": "<PEM>" }
   Private key stays in browser — NEVER sent to server

2. Send a message:
   GET /messages/e2ee/keys/:receiverId   → recipient's public key
   Encrypt content client-side with recipient's public key
   POST /messages/e2ee  { "receiverId": "uuid", "ciphertext": "<encrypted>" }

3. Read messages:
   GET /messages/e2ee/:userId   → raw ciphertext returned
   Decrypt client-side with your private key
```

```json
POST /messages/e2ee/keys
{ "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----" }

POST /messages/e2ee
{ "receiverId": "uuid", "ciphertext": "<base64-encrypted-blob>" }
```

Conversation response:

```json
[
  {
    "id": "uuid",
    "from": "me",
    "senderId": "uuid",
    "ciphertext": "<base64>",
    "isRead": true,
    "sentAt": "...",
    "integrity": {
      "verified": true,
      "note": "RSA-SHA256 signature verified. Ciphertext integrity confirmed. Decrypt using your private key."
    }
  }
]
```

Inbox returns `"encrypted": true` — no content preview since server cannot decrypt.

Errors: `400` if recipient has no public key registered.

---

### Admin — Audit Logs & Blockchain

| Method | Endpoint                     | Description                          | Auth        |
| ------ | ---------------------------- | ------------------------------------ | ----------- |
| GET    | `/admin/logs`                | All audit log entries                | Yes (Admin) |
| GET    | `/admin/logs/verify`         | Verify hash-chain integrity          | Yes (Admin) |
| POST   | `/admin/blockchain/mine`     | Mine new block from unsealed entries | Yes (Admin) |
| GET    | `/admin/blockchain`          | View full blockchain                 | Yes (Admin) |
| GET    | `/admin/blockchain/verify`   | Full blockchain integrity check      | Yes (Admin) |
| GET    | `/admin/users`               | List all users                       | Yes (Admin) |
| GET    | `/admin/users/:id`           | User with profile                    | Yes (Admin) |
| PATCH  | `/admin/users/:id/suspend`   | Suspend user                         | Yes (Admin) |
| PATCH  | `/admin/users/:id/unsuspend` | Unsuspend user                       | Yes (Admin) |
| DELETE | `/admin/users/:id`           | Delete user                          | Yes (Admin) |

#### Hash-Chain Audit Log

Every critical action is logged with SHA-256 hash chaining. Each entry's hash includes the previous entry's hash, creating an append-only chain.

`GET /admin/logs/verify` response:

```json
{
  "valid": true,
  "totalEntries": 42,
  "firstTamperedId": null,
  "message": "All 42 audit log entries verified. Chain is intact."
}
```

#### Blockchain (Bonus)

The blockchain layer seals batches of audit entries into immutable blocks with **Proof-of-Work** (difficulty 4 — blockHash must start with `0000`).

**How it works:**

1. Audit entries accumulate as normal in `audit_logs`
2. Admin calls `POST /admin/blockchain/mine` to seal all unsealed entries into a new block
3. Server computes a **Merkle root** from all entry hashes in the batch
4. Server runs **proof-of-work**: increments nonce until `SHA-256(index|previousHash|merkleRoot|timestamp|nonce)` starts with `0000`
5. Block is saved with its hash, nonce, Merkle root, and list of sealed entry IDs
6. `GET /admin/blockchain/verify` checks chain linkage, block hash, PoW validity, and Merkle root against actual entries

**Mine a block:**

```
POST /admin/blockchain/mine
Response:
{
  "message": "Block #3 mined successfully with 12 audit entries.",
  "block": {
    "index": 3,
    "blockHash": "00003f9a...",
    "merkleRoot": "a3f9...",
    "nonce": 18432,
    "difficulty": 4,
    "entryCount": 12,
    "timestamp": "2026-04-13T10:00:00.000Z"
  }
}
```

**View blockchain:**

```json
GET /admin/blockchain
{
  "totalBlocks": 4,
  "unsealedEntries": 7,
  "blocks": [
    {
      "index": 0,
      "blockHash": "00001a2b...",
      "previousHash": "GENESIS",
      "merkleRoot": "f3a9...",
      "nonce": 9823,
      "difficulty": 4,
      "entryCount": 5,
      "auditEntryIds": ["uuid-1", "uuid-2", "..."],
      "timestamp": "..."
    }
  ]
}
```

**Verify blockchain:**

```json
GET /admin/blockchain/verify
{
  "valid": true,
  "totalBlocks": 4,
  "firstInvalidBlockIndex": null,
  "message": "All 4 blocks verified. Blockchain is intact.",
  "details": [
    { "blockIndex": 0, "valid": true },
    { "blockIndex": 1, "valid": true },
    { "blockIndex": 2, "valid": true },
    { "blockIndex": 3, "valid": true }
  ]
}
```

Verify checks (per block):

1. `previousHash` links correctly to prior block
2. `blockHash` recomputes correctly from block content
3. `blockHash` starts with `0000` (PoW valid)
4. Merkle root matches the actual audit entries sealed in the block

---

## Security Features

| Feature                        | Implementation                                                     |
| ------------------------------ | ------------------------------------------------------------------ |
| Password hashing               | Argon2                                                             |
| Authentication                 | JWT + RBAC (user / recruiter / admin)                              |
| Resume encryption              | AES-256-CBC at rest                                                |
| Resume integrity               | RSA-2048/SHA-256 verified on every download                        |
| Server-side message encryption | AES-256-CBC (1-to-1 + group)                                       |
| Server-side message integrity  | RSA-2048/SHA-256 verified on every fetch                           |
| E2EE messaging                 | Client-side RSA — server stores ciphertext only, never decrypts    |
| E2EE ciphertext integrity      | Server PKI-signs ciphertext hash — proves DB not tampered          |
| OTP verification               | Registration, password reset, resume download, account deletion    |
| Hash-chain audit log           | SHA-256 chained entries — insertion/deletion/reorder detected      |
| Blockchain audit log           | PoW difficulty-4, Merkle root, block chain linkage — bonus feature |
| Rate limiting                  | Per-endpoint throttling                                            |
| Security headers               | Helmet (XSS, clickjacking, MIME sniffing)                          |
| CORS                           | Restricted to configured origins                                   |
| Input validation               | Global ValidationPipe whitelist + forbidNonWhitelisted             |
| Suspended accounts             | Blocked at login                                                   |
| Field-level profile privacy    | public / connections / private per field                           |
| Profile viewer tracking        | Opt-out + 1-hour deduplication                                     |
| Avatar upload                  | JPEG/PNG/WEBP, 2MB max, public endpoint with cache headers         |

---

## Audit Logging

Logged actions: registration · login · password reset · account deletion · resume download · company/job CRUD · application submit/update · all message types sent · group created · user suspend/delete/unsuspend · profile viewed.

Each entry: `action` · `performedBy` · `targetId` · `targetType` · `metadata` · `previousHash` · `entryHash` · `createdAt`

---

## Database Tables

| Table                 | Description                                                       |
| --------------------- | ----------------------------------------------------------------- |
| `users`               | Accounts, roles, verification status, E2EE public key             |
| `profiles`            | Profile fields, privacy settings, avatar bytes, viewer opt-out    |
| `profile_views`       | Profile view log (deduplicated)                                   |
| `connections`         | Connection requests and accepted connections                      |
| `otps`                | OTP codes with purpose, expiry, used flag                         |
| `resumes`             | AES-encrypted resume files with PKI signatures                    |
| `companies`           | Company pages                                                     |
| `jobs`                | Job postings                                                      |
| `applications`        | Applications with status history, recruiter notes, shortlist flag |
| `messages`            | AES-encrypted + PKI-signed 1-to-1 messages                        |
| `group_conversations` | Group chat rooms with creator and participants                    |
| `group_participants`  | Group membership join table                                       |
| `group_messages`      | AES-encrypted + PKI-signed group messages                         |
| `e2ee_messages`       | E2EE messages (ciphertext only — server never decrypts)           |
| `audit_logs`          | SHA-256 hash-chained audit trail                                  |
| `blockchain_blocks`   | PoW blockchain blocks sealing audit entries                       |

---

## Setting User Roles

```bash
psql -h localhost -U devuser -d jobportal -W
```

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
UPDATE users SET role = 'recruiter' WHERE email = 'recruiter@example.com';
```

---

## OTP Simulation

OTPs are delivered by email through Nodemailer using the configured `EMAIL_USER` and `EMAIL_PASS` values. Check the recipient inbox after any OTP-triggering action.

---

## Troubleshooting

**Permission denied for schema public**

```sql
GRANT ALL ON SCHEMA public TO devuser;
ALTER DATABASE jobportal OWNER TO devuser;
```

**Port 3000 in use**

```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

**Tables not created** — ensure `synchronize: true` in `app.module.ts`.

**TypeORM `DataTypeNotSupportedError`** — ensure all nullable columns have explicit `type:` in `@Column` decorator.

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
