# planner-web

The browser version of **Planner**. A local-first React app: it reads and writes a SQLite database in the browser (PowerSync), which syncs with the iPhone app through the same Supabase project, PowerSync instance and backend.

## Running locally

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm typecheck && pnpm lint && pnpm build
```

Defaults in `src/lib/config.ts` point at the dev Supabase project, PowerSync instance and Cloud Run backend. Override with `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `VITE_POWERSYNC_URL`, `VITE_API_URL` (e.g. in `.env.local`).

## How it fits together

- **Sign in:** Sign in with Apple through Supabase (`src/auth/`), the same account as the iPhone app.
- **Data:** `src/db/database.ts` opens the browser database (`@powersync/web`, `vfs: 'auto'`), connects to PowerSync for downloads and uploads changes to the backend's `POST /sync/upload` (`src/db/connector.ts`). Screens read in-memory copies of the tables (`src/db/local-table.ts`) and change data only through the actions in `src/db/tasks.ts` and `src/db/habits.ts`.
- **Look:** Tailwind with the same design tokens as the iPhone app (`design/`).

## Shared code (copied for now)

These are copies from `planner-app` and must be kept in step by hand until they move to a shared `planner-utils` package:

- `src/db/schema/` (data models), `src/db/powersync-schema.ts`
- `src/db/local-table.ts`, `src/db/tasks.ts`, `src/db/habits.ts`, `src/db/owner.ts`
- `src/lib/time.ts`, `src/lib/habit-days.ts`
- `design/tokens.cjs`, `design/tailwind-preset.cjs`

## Blocked on Samuel

- Sign in with Apple for the web: an Apple **Services ID** and a **Sign in with Apple key**, added to Supabase's Apple provider, with the site's URL as a return URL. Until then, signing in on the web fails.
- The backend must allow the site's origin (`CORS_ORIGINS` on Cloud Run; `http://localhost:5173` is allowed by default).
- Hosting (e.g. Firebase Hosting in the `planner-514904` GCP project).

## Working agreement

- No comments in any file unless Samuel asks for one.
- Don't commit or push: Samuel reviews, commits and pushes. Never use the `gh` CLI (it's logged into his work account).
- Layout is a placeholder (sidebar + view) until Samuel picks a desktop design.
