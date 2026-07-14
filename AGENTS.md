# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Baby Outfit (宝宝穿衣助手) is a Next.js 15 web app that recommends daily baby clothing outfits based on weather. It uses Supabase for auth and data storage, and Open-Meteo for free weather APIs.

**Monorepo structure** (npm workspaces):
- `warmrobot/packages/core/` — shared TypeScript recommendation algorithm
- `warmrobot/web/` — Next.js 15 frontend (App Router, Tailwind CSS v4)
- `warmrobot/supabase/` — database migrations

### Running services

**Local Supabase** (requires Docker):
```bash
cd /workspace/warmrobot
sudo dockerd &>/tmp/dockerd.log &   # if Docker daemon not running
sudo chmod 666 /var/run/docker.sock  # if permission denied
supabase start                       # starts PostgreSQL, Auth, REST, Storage
supabase db reset                    # applies migrations + seed data
```

**Next.js dev server:**
```bash
cd /workspace/warmrobot
npm run dev   # http://localhost:3000
```

**Environment variables** — create `warmrobot/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from `supabase status -o env` ANON_KEY field>

# SiliconFlow cloud (vision + beautify + optional embeddings)
VISION_PROVIDER=openai_compat
VISION_API_KEY=sk-...
VISION_BASE_URL=https://api.siliconflow.cn/v1
VISION_MODEL=Qwen/Qwen3-VL-8B-Instruct
BEAUTIFY_ENABLED=auto
```

No local Ollama, SAM, or rembg services are required. Wardrobe scan uses cloud vision; photo uploads are cut out and beautified via SiliconFlow `Qwen/Qwen-Image-Edit-2509` into white-background product hero shots (when `BEAUTIFY_ENABLED=auto` and API key is set).

To remove leftover local ML caches from a previous setup:
```bash
cd warmrobot/warmrobot && ./scripts/cleanup-local-ml.sh
```

### Key commands

| Task | Command |
|------|---------|
| Install deps | `cd warmrobot && npm install` |
| Dev server | `cd warmrobot && npm run dev` |
| Dev (clear stale cache) | `cd warmrobot && npm run dev:clean` — stops old `next dev`, clears `.next`, restarts |
| **Verify runnable** | `cd warmrobot && npm run verify` |
| Lint | `cd warmrobot && npm run lint` |
| Build | `cd warmrobot && npm run build` |
| Typecheck core | `cd warmrobot && npx -w packages/core tsc --noEmit` |
| Test cloud vision | `cd warmrobot/web && npm run test:wardrobe-vision -- path/to/photo.jpg` |
| Test garment card | `cd warmrobot/web && npm run test:garment-image -- path/to/photo.jpg` |
| Supabase status | `cd warmrobot && supabase status` |
| Supabase reset DB | `cd warmrobot && supabase db reset` |

### Non-obvious gotchas

- **404 or missing CSS after edits**: Next.js `.next` cache can go stale. Run `npm run dev:clean` (it stops any running dev server before deleting `.next`). Avoid running multiple `next dev` instances or deleting `.next` while dev is still running. Agents must run `npm run verify` after code changes (see `.cursor/rules/runnable-after-changes.mdc`).
- Migration files must use timestamp-prefixed names (e.g. `20240101000001_name.sql`) for `supabase db reset` to work. The original files were named `001_name.sql` and need renaming.
- The `supabase init` command must be run once to create `supabase/config.toml` before `supabase start` works (already committed in this repo).
- Demo accounts: `demo_user_1@warmrobot.dev` through `demo_user_50@warmrobot.dev`, password: `password123`.
- The web app uses Supabase Auth with email/password; local Supabase auto-confirms emails.
- Open-Meteo APIs require internet access but no API keys.
- The `@warmrobot/core` package is consumed directly as TypeScript source via `transpilePackages` in `next.config.ts` — no separate build step needed.
- SiliconFlow model IDs change over time; if vision fails with "Model does not exist", check available models at `GET https://api.siliconflow.cn/v1/models`.
