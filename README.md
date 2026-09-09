# BEYOND — Intelligent Tourism Network

A GitHub-ready tourism intelligence prototype, backed by Supabase.

## Run locally
1. Install Node.js.
2. Open this folder in VS Code.
3. Run `npm install`
4. **Set up your backend connection (required — see below), then:**
5. Run `npm run dev`
6. Open the local URL shown by Vite.

## Connecting the Supabase backend
The app reads two environment variables to connect to Supabase. Without them,
`src/supabase.js` creates a `null` client and the app **silently falls back
to demo data** — no error is shown, so it looks like the frontend is "done"
but nothing from your database ever loads.

1. Copy `.env.example` to a new file named `.env`:
   ```
   cp .env.example .env
   ```
2. Open your Supabase project dashboard → **Project Settings → API**.
3. Fill in `.env` with your real values:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key-here
   ```
4. Restart `npm run dev` (Vite only reads `.env` on startup).
5. Make sure the tables the app expects actually exist and are readable:
   `destinations`, `crowd_intelligence`, `tourism_metrics`. If Row Level
   Security is enabled on these tables, add a policy allowing `SELECT` for
   the `anon` role, or the queries will return no rows (and you'll again see
   demo data with no error).

`.env` is git-ignored on purpose — never commit real keys.

## Deploy (GitHub Pages)
Deployment is handled by `.github/workflows/main.yml`, which builds the site
and injects the Supabase credentials at build time. For this to work, add
the same two values as **repository secrets**:

1. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` with the same
   values as your local `.env`.
3. Push to `main` — the workflow builds with those secrets and deploys `dist/`
   to Pages automatically.

Only keep **one** deploy workflow in `.github/workflows/`. A second workflow
that builds without these secrets will overwrite the correct deployment with
one that only shows demo data — this was previously causing exactly that bug
here and has been removed.

## Important
Crowd figures and tourism-board analytics are DEMO DATA whenever Supabase
isn't reachable (missing/wrong env vars, or an empty/RLS-blocked table). The
architecture is intended to connect authorized real-time APIs later.
