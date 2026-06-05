# COO PA Manager

Smart executive PA workflow system — replaces Excel meeting sheets with one followup chain per meeting/task.

## Stack

- **Frontend:** React (Vite), Tailwind CSS, MUI icons, Redux Toolkit, Axios, React Router, Framer Motion, FullCalendar, date-fns
- **Backend:** Node.js, Express, MongoDB/Mongoose, JWT, node-cron, Helmet, CORS, rate limiting

## Quick start

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

## Core workflow

1. PA creates a **Meeting/Task** (task date, meeting date, type, title, responsible person, discussion topic).
2. After the meeting, add **Remark 1** with next meeting date / followup notes if not resolved.
3. Repeat remarks until **final outcome** → status **Completed**.
4. Expand any row in **Meetings & Tasks** to see the timeline (created → remarks → completed).

## Main screens

| Screen | Purpose |
|--------|---------|
| Dashboard | Pending, today, overdue, recent remarks |
| Meetings | Excel-style table, inline status, quick remark row |
| Dept. Tasks | Multi-department task list, weekly meeting remarks, done/pending |
| Calendar | **Meeting calendar** and **Dept. task calendar** — separate views & data |
| Followups | Excel table of remark chains |
| Reports | Charts + Excel/PDF export |
| Settings | Dark/light mode, quick notes |

## API (protected with JWT)

- `POST /api/auth/login` · `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/meetings` · `GET /api/meetings/:id/timeline`
- `POST /api/remarks` · `GET /api/remarks/meeting/:meetingId`
- `GET/POST/PUT/DELETE /api/tasks` · `GET /api/tasks/calendar-events` · `GET /api/tasks/:id/timeline` · `POST /api/tasks/remarks`
- `GET /api/notifications` · `PATCH /api/notifications/:id/read`
- `GET /api/dashboard`

## Collections

`Users`, `Meetings`, `Remarks`, `Tasks`, `TaskRemarks`, `Notifications` — scoped by `coo_id` for multiple COOs.

## Reminders

Cron runs every 10 minutes; creates upcoming/overdue notifications. Frontend polls every 60s and can show browser alerts.
