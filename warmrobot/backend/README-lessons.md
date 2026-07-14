# Lessons schedule (NestJS + Next.js)

## Backend setup

```bash
cd warmrobot/backend
cp .env.example .env   # set DATABASE_URL, JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

Default API: `http://localhost:3001`

## Seed users

| Email | Role | Notes |
|-------|------|-------|
| admin@example.com | admin | password123 |
| teacher-a@example.com | teacher | base teacher Mon–Sun |
| teacher-b@example.com | teacher | substitute on Wednesday (dayIndex=2) |

## Frontend

Set in `web/.env.local`:

```
NEXT_PUBLIC_LESSONS_API_URL=http://localhost:3001
```

Routes:

- `/lessons/login` — login
- `/lessons/day/2` — Wednesday schedule (substitution demo)

## Permission rules (summary)

1. **Admin / moderator** — full CRUD on all days.
2. **Base teacher** — CRUD on assigned days per `user_day_permissions` (defaults: all true).
3. **Substitute teacher** — when `substituteTeacherId` is set for that day: full CRUD; new lessons get `teacherId` = substitute.
4. **Others** — read-only (no create/edit/delete flags).

## Key API

- `GET /lessons/schedule-context?dayIndex=0`
- `GET /lessons?dayIndex=0` — includes `canEdit`, `canDelete`, `isOwn`, `isSubstitutionDay`
- `PATCH /lessons/day-substitution/:dayIndex` — admin only
- `PATCH /lessons/permissions/:userId` — admin/moderator
