# Sunday

A collaborative Kanban for people who want a quiet place to work. Create a personal board on sign-up, invite teammates to team boards, move tasks across columns, and get due-date reminders in an in-app inbox.

## Features

- JWT auth, profile, and password change
- Personal board on register; team boards with a board manager, admins, and members
- Invites by email, accept / decline from Inbox
- Tasks: CRUD, Kanban move, assignees, comments, Cloudinary photos
- Comments and photos notify assignees and the board manager
- All-tasks table with search and filters
- `node-cron` due-soon / overdue notifications
- Socket.IO live card moves and inbox bell

## Architecture

```
client/   React + Vite + Tailwind CSS 4
server/   Express 5 (ESM) → Zod → controllers → services → Prisma
db        MySQL 8.4 (Docker locally)
```

The API is layered on purpose: routes never talk to Prisma. `requireAuth` puts `userId` on the request from the JWT. Membership checks live in `server/src/lib/access.js`. Activity events are written next to task mutations.

## Demo

Local seed (after the database is up):

```bash
cd server
npm run seed
```

## Local setup

### Prerequisites

- Node.js 20+
- Docker Desktop

### 1. Environment

```bash
cp .env.example .env
cp server/.env.example server/.env
```

Set MySQL passwords in the root `.env`, then match `DATABASE_URL` and a long `JWT_SECRET` in `server/.env`. Cloudinary keys are optional; without them, attachments return 503.

### 2. Database

```bash
docker compose up -d
cd server
npx prisma generate
npx prisma migrate deploy
npm run seed
```

MySQL is published on `localhost:3307` so it does not collide with a local MySQL on 3306. On Windows, use `127.0.0.1` in `DATABASE_URL` — `localhost` can resolve to IPv6 and the Prisma MariaDB pool never connects.

### 3. API

```bash
cd server
npm install
npm run dev
```

Health check: http://localhost:4000/api/health

### 4. Client

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` and `/socket.io` to the server.

## API map

| Area    | Endpoints                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------ |
| Auth    | `POST /api/auth/register` `POST /api/auth/login` `GET/PATCH /api/auth/me` `POST /api/auth/me/password` |
| Boards  | `GET/POST /api/boards` `GET /api/boards/:id` `POST /api/boards/:id/invites`                            |
| Tasks   | `GET/POST /api/boards/:id/tasks` `PATCH /api/tasks/:id` `PATCH /api/tasks/:id/move`                    |
| Extra   | comments, assignees, attachments, `GET /api/tasks`                                                     |
| Inbox   | `GET /api/notifications` `POST /api/notifications/:id/read` `POST /api/notifications/read-all`         |
| Invites | `POST /api/invites/:id/accept` `POST /api/invites/:id/decline`                                         |

Socket rooms: `board:<id>` for card events, `user:<id>` for `notification:new`. The handshake sends `{ auth: { token } }`.

