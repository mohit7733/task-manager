# ExecuFlow

**Executive Meeting & Task Intelligence** — a professional PA workflow platform that replaces Excel meeting sheets with structured follow-up chains, department tasks, calendars, and email notifications.

## Brand & Design

- **Primary:** Indigo `#4F46E5` · **Accent:** Blue `#2563EB`
- **Neutrals:** Slate palette · **Semantic:** Emerald (done), Amber (pending), Red (overdue)
- Unified UI via `frontend/src/utils/theme.js`

## Stack

- **Frontend:** React (Vite), Tailwind CSS, Lucide icons, Redux Toolkit, Axios, React Router, Framer Motion, FullCalendar
- **Backend:** Node.js, Express, MongoDB/Mongoose, JWT, nodemailer, node-cron

## Quick start (local)

### 1. MongoDB

Run MongoDB locally (`mongodb://127.0.0.1:27017`).

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

API: `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

### Demo login

| Email | Password | Role |
|-------|----------|------|
| pa@coo.com | pa123456 | PA Assistant |
| admin@coo.com | pa123456 | Admin |
| super@coo.com | pa123456 | Super Admin |

## Production build

```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run build
# Serve frontend/dist/ via nginx, IIS, or static host
# Set VITE_API_URL to your live API URL before building
```

## Core workflow

1. Create a **Meeting** or **Department Task** with assignee email.
2. After each session, add a **Remark** with optional MOM document upload.
3. Track timeline, calendar, and follow-ups until completed.
4. Receive in-app and email reminders for upcoming/overdue items.

## Main screens

| Screen | Purpose |
|--------|---------|
| Dashboard | Meetings & tasks overview, recent remarks |
| Meetings | Excel-style table, remarks, MOM upload |
| Dept. Tasks | Multi-department tasks, weekly remarks |
| Calendar | Meeting + task calendars |
| Followups | Remark chain table |
| Reports | Charts + Excel/PDF export |
| Settings | Theme, email prefs, quick notes |

## Email notifications

Configure SMTP in `backend/.env`. Emails sent for assignments, MOM updates, and reminders. Toggle in **Settings**.

## API

- `POST /api/auth/login` · `GET /api/auth/me` · `PUT /api/auth/settings`
- `GET/POST/PUT/DELETE /api/meetings` · `GET /api/meetings/:id/timeline`
- `POST /api/remarks` (multipart — MOM upload)
- `GET/POST/PUT/DELETE /api/tasks` · `POST /api/tasks/remarks` (multipart)
- `GET /api/notifications` · `GET /api/dashboard`
