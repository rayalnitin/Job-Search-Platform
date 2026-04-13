# Job Portal Frontend

This is the React + Vite frontend for a secure job search and professional networking platform. It supports three roles:

- User
- Recruiter
- Admin

The frontend connects to the NestJS backend and covers authentication, job search, applications, messaging, company browsing, recruiter workflows, and admin governance.

## What You Need

Before running the app, make sure you have:

- Node.js installed
- The backend running at the API URL configured in `src/config.js`
- A browser that supports modern React apps
- Valid backend credentials or test accounts for each role

The frontend stores the authenticated session in `localStorage` after login:

- `token`
- `role`
- `user`
- `pendingLoginEmail` for the login-OTP flow

## Tech Stack

- React
- Vite
- React Router DOM
- Axios
- Tailwind CSS

## Current Frontend Flow

The app is built around the following flows:

- Email OTP registration verification
- Email OTP login verification
- Password reset with email OTP
- Resume download protected by OTP
- Job search and application submission
- Recruiter job and applicant management
- Admin dashboard with audit logs and blockchain actions

The login, verification, and recovery screens use a reusable virtual keypad component for safer OTP entry.

## Features

### User

- Register and verify account with email OTP
- Log in with password or login OTP
- Reset password with email OTP
- Browse and search jobs
- Apply to jobs with resume upload
- Track application status history
- View and manage resumes
- View company details
- Browse the network page and profile views
- Message recruiters and other users

### Recruiter

- Recruiter dashboard
- Create and update company profile
- Post, edit, close, reopen, and delete jobs
- Review applicants for each job
- Update application status
- Message applicants directly
- Update recruiter profile

### Admin

- View platform users
- Open a single user profile
- Suspend, unsuspend, and delete users
- Review grouped audit logs
- Use the blockchain panel to verify, mine, and repair the ledger
- View the admin overview dashboard

## Important Routes

### Public

- `/` - Login
- `/register` - Register
- `/verify` - Registration OTP verification
- `/login-otp` - Login with email OTP
- `/forgot-password` - Password reset flow

### User

- `/dashboard`
- `/apply`
- `/applications`
- `/messages`
- `/profile`
- `/profile/:id`
- `/resume`
- `/company`
- `/company/:id`
- `/network`

### Recruiter

- `/recruiter/dashboard`
- `/recruiter/company`
- `/recruiter/post-job`
- `/recruiter/jobs`
- `/recruiter/applicants`
- `/recruiter/applicants/:jobId`
- `/recruiter/messages`
- `/recruiter/network`
- `/recruiter/profile`

### Admin

- `/admin`

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the backend URL

Edit `src/config.js` so it points to your backend:

```js
const API_BASE_URL = "http://localhost:3000";

export default API_BASE_URL;
```

If you deploy the backend elsewhere, replace that value with the correct production URL.

### 3. Start the frontend

```bash
npm run dev
```

The app runs on:

```bash
http://localhost:5173
```

### 4. Build for production

```bash
npm run build
```

### 5. Preview the production build

```bash
npm run preview
```

## Backend Requirements

This frontend expects the backend to be available and working for the following modules:

- Auth
- Users and profile
- Resume
- Companies
- Jobs
- Applications
- Messages
- Admin
- Audit and blockchain endpoints

Protected API calls require a valid JWT token. If the backend is down or the API base URL is wrong, login and protected routes will fail.

## Authentication and Security Flow

### Registration

1. User registers with email and password.
2. Backend sends an OTP by email.
3. User enters the OTP with the virtual keypad.
4. Account is created after verification.

### Login

1. User logs in with email and password, or chooses login with OTP.
2. The login-OTP page requests a code from the backend.
3. User enters the 6-digit code with the virtual keypad.
4. On success, the frontend stores the session and redirects by role.

### Password Reset

1. User requests a reset code.
2. Backend sends an OTP to email.
3. User verifies the code and sets a new password.

### Resume Download

1. User requests a resume download.
2. The frontend triggers the OTP-protected download flow.
3. The resume is downloaded after verification.

## Role-Based Redirects

After login, users are redirected based on role:

- `admin` -> `/admin`
- `recruiter` -> `/recruiter/dashboard`
- `user` -> `/dashboard`

## Typical User Flow

1. Register and verify email OTP.
2. Log in.
3. Search jobs on the dashboard.
4. Open a job and apply.
5. Upload a resume, then submit the application.
6. Track application history and status updates.
7. Message recruiters from applications or messages.
8. Manage profile, company browsing, and resume access.

## Typical Recruiter Flow

1. Log in as a recruiter.
2. Create or update company profile.
3. Post jobs.
4. Manage active and closed jobs.
5. Review applicants for a job.
6. Update application status.
7. Message candidates.
8. Update recruiter profile.

## Typical Admin Flow

1. Log in as an admin.
2. Open the admin dashboard.
3. Review users and audit logs.
4. Suspend, unsuspend, or delete users.
5. Verify, mine, or repair the blockchain ledger if needed.

## Project Structure

```bash
src/
├── api/                # Axios instance and API helpers
├── assets/
├── components/         # Shared UI components
├── components/admin/   # Admin UI components
├── components/company/ # Company-related components
├── components/network/
├── components/recruiter/
├── layout/             # Shared layout wrappers
├── pages/
│   ├── auth/
│   ├── user/
│   ├── recruiter/
│   └── admin/
├── config.js           # API base URL
├── App.jsx             # Routes
├── index.css           # Global styles
└── main.jsx
```

## Notes

- Messaging is shared between users and recruiters through the same backend messages API.
- The application flow uses resume upload first, then submits the application with the returned `resumeId`.
- Application timelines are driven by backend `statusHistory`.
- The admin dashboard includes audit log pagination and blockchain actions.
- The main user pages are responsive and designed to work across desktop and mobile widths.

## Example Test Data

If you want quick test roles, you can update them in PostgreSQL after creating accounts:

```sql
UPDATE users SET role = 'recruiter' WHERE email = 'recruiter@example.com';
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

Example accounts:

- User: `user@example.com`
- Recruiter: `recruiter@example.com`
- Admin: `admin@example.com`

## Common Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Deployment Note

Before deploying, update `src/config.js` to point to the correct backend API URL and make sure the backend is reachable from the deployed frontend.
