# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Baby Outfit (宝宝穿衣助手) is a Next.js 15 web app that recommends daily baby clothing outfits based on weather. It uses Supabase for auth and data storage, and Open-Meteo for free weather APIs.

**Monorepo structure** (npm workspaces):
- `baby-outfit/packages/core/` — shared TypeScript recommendation algorithm
- `baby-outfit/web/` — Next.js 15 frontend (App Router, Tailwind CSS v4)
- `baby-outfit/supabase/` — database migrations

### Running services

**Local Supabase** (requires Docker):
```bash
cd /workspace/baby-outfit
sudo dockerd &>/tmp/dockerd.log &   # if Docker daemon not running
sudo chmod 666 /var/run/docker.sock  # if permission denied
supabase start                       # starts PostgreSQL, Auth, REST, Storage
supabase db reset                    # applies migrations + seed data
```

**Next.js dev server:**
```bash
cd /workspace/baby-outfit
npm run dev   # http://localhost:3000
```

**Environment variables** — create `baby-outfit/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from `supabase status -o env` ANON_KEY field>
```

### Key commands

| Task | Command |
|------|---------|
| Install deps | `cd baby-outfit && npm install` |
| Dev server | `cd baby-outfit && npm run dev` |
| Lint | `cd baby-outfit && npm run lint` |
| Build | `cd baby-outfit && npm run build` |
| Typecheck core | `cd baby-outfit && npx -w packages/core tsc --noEmit` |
| Supabase status | `cd baby-outfit && supabase status` |
| Supabase reset DB | `cd baby-outfit && supabase db reset` |

### Non-obvious gotchas

- Migration files must use timestamp-prefixed names (e.g. `20240101000001_name.sql`) for `supabase db reset` to work. The original files were named `001_name.sql` and need renaming.
- The `supabase init` command must be run once to create `supabase/config.toml` before `supabase start` works (already committed in this repo).
- Demo accounts: `demo_user_1@baby-outfit.dev` through `demo_user_50@baby-outfit.dev`, password: `password123`.
- The web app uses Supabase Auth with email/password; local Supabase auto-confirms emails.
- Open-Meteo APIs require internet access but no API keys.
- The `@baby-outfit/core` package is consumed directly as TypeScript source via `transpilePackages` in `next.config.ts` — no separate build step needed.
