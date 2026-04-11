# Job Portal Frontend

A React frontend for a secure job search and professional networking platform. It supports three roles:

- User
- Recruiter
- Admin

The frontend is connected to a NestJS backend and covers job search, applications, messaging, recruiter workflows, and admin management.

## Tech Stack

- React
- Vite
- React Router DOM
- Axios
- Tailwind CSS

## Features

### User
- Login, register, OTP verification
- Browse and search jobs from backend API
- Apply to jobs with resume upload
- Track application status history
- View and manage resumes
- Update profile from backend API
- Browse companies
- One-to-one messaging with recruiters

### Recruiter
- Recruiter dashboard
- Create and update company profile
- Post, edit, close, reopen, and delete jobs
- View applicants for each job
- Update applicant status
- Message applicants directly
- Update recruiter profile

### Admin
- View platform users
- View single user detail
- Suspend and unsuspend users
- Delete users
- View audit logs
- Admin overview dashboard

## Project Structure

```bash
src/
├── api/                # Axios instance and API helpers
├── components/         # Shared UI components
├── components/admin/   # Admin UI components
├── components/company/ # Company-related components
├── components/recruiter/
├── pages/
│   ├── auth/
│   ├── user/
│   ├── recruiter/
│   └── admin/
├── config.js           # API base URL
├── App.jsx             # Routes
└── main.jsx

```md
# Job Portal Frontend

A React frontend for a secure job search and professional networking platform. It supports three roles:

- User
- Recruiter
- Admin

The frontend is connected to a NestJS backend and covers job search, applications, messaging, recruiter workflows, and admin management.

## Tech Stack

- React
- Vite
- React Router DOM
- Axios
- Tailwind CSS

## Features

### User
- Login, register, OTP verification
- Browse and search jobs from backend API
- Apply to jobs with resume upload
- Track application status history
- View and manage resumes
- Update profile from backend API
- Browse companies
- One-to-one messaging with recruiters

### Recruiter
- Recruiter dashboard
- Create and update company profile
- Post, edit, close, reopen, and delete jobs
- View applicants for each job
- Update applicant status
- Message applicants directly
- Update recruiter profile

### Admin
- View platform users
- View single user detail
- Suspend and unsuspend users
- Delete users
- View audit logs
- Admin overview dashboard

## Project Structure

```bash
src/
├── api/                # Axios instance and API helpers
├── components/         # Shared UI components
├── components/admin/   # Admin UI components
├── components/company/ # Company-related components
├── components/recruiter/
├── pages/
│   ├── auth/
│   ├── user/
│   ├── recruiter/
│   └── admin/
├── config.js           # API base URL
├── App.jsx             # Routes
└── main.jsx
```

## API Integration

This frontend is built to work with the backend API documented in the backend README.

Connected backend modules:
- Auth
- Users/Profile
- Resume
- Companies
- Jobs
- Applications
- Messages
- Admin

## Important Routes

### Public
- `/` - Login
- `/register` - Register
- `/verify` - OTP verification

### User
- `/dashboard`
- `/apply`
- `/applications`
- `/messages`
- `/profile`
- `/resume`
- `/company`
- `/company/:id`
- `/network`

### Recruiter
- `/recruiter/dashboard`
- `/recruiter/company`
- `/recruiter/post-job`
- `/recruiter/jobs`
- `/recruiter/applicants/:jobId`
- `/recruiter/messages`
- `/recruiter/profile`

### Admin
- `/admin`

## Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure API base URL

Update `src/config.js`:

```js
const API_BASE_URL = "http://localhost:3000";
export default API_BASE_URL;
```

If you are using the deployed backend, replace it with the production URL.

Example:
```js
const API_BASE_URL = "https://192.168.2.236";
export default API_BASE_URL;
```

### 3. Start development server
```bash
npm run dev
```

Frontend runs by default on:
```bash
http://localhost:5173
```

### 4. Build for production
```bash
npm run build
```

### 5. Preview production build
```bash
npm run preview
```

## Backend Requirements

Make sure the backend is running and available at the API base URL.

Example local backend:
```bash
http://localhost:3000
```

Protected API calls require a valid JWT token. The frontend stores:
- `token`
- `role`
- `user`

in `localStorage` after login.

## Role-Based Navigation

After login, users are redirected based on role:

- `admin` → `/admin`
- `recruiter` → `/recruiter/dashboard`
- `user` → `/dashboard`

## Full Flow

### User Flow
1. Register and verify OTP
2. Login
3. Search jobs on dashboard
4. Open a job and apply
5. Resume uploads first, then application is submitted
6. View applications and status timeline
7. Message recruiter from applications/messages page
8. Manage profile and resumes

### Recruiter Flow
1. Login as recruiter
2. Create company profile
3. Post a job
4. Manage posted jobs
5. Open applicants for a job
6. Update application status
7. Message applicants
8. Update recruiter profile

### Admin Flow
1. Login as admin
2. Open admin dashboard
3. Review users
4. Suspend, unsuspend, or delete users
5. Review audit logs

## Notes

- Messaging is shared between users and recruiters through the same backend messages API.
- The apply flow uses the backend resume upload endpoint first, then submits the application using the returned `resumeId`.
- Application timeline is based on real backend `statusHistory`.
- Some pages without backend support remain static but styled to match the product UI.

## Example Test Data

### Test Roles
You can create users normally, then update roles in PostgreSQL:

```sql
UPDATE users SET role = 'recruiter' WHERE email = 'recruiter@example.com';
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

### Example Accounts
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

## Screens Included in Frontend

- Auth pages
- User dashboard
- Apply job page
- Applications page
- Messaging page
- Resume vault
- Profile page
- Company browser
- Recruiter dashboard
- Recruiter company profile
- Recruiter post/manage jobs
- Recruiter applicants
- Admin dashboard

## Deployment Note

Before deploying, update `src/config.js` to point to the correct backend API URL.
