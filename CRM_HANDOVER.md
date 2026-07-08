# CRM Handover

## Current phase and status

Phase 0 — Foundation: **implemented locally**. Auth pages, middleware, empty dashboard shell. Awaiting Supabase project keys + GitHub remote + Vercel env before full E2E auth/deploy confirmation.

## Architecture decisions

- 2026-07-09: Cookie-based session via `@supabase/ssr`; middleware refreshes with `getClaims()`.
- 2026-07-09: App Router groups `(auth)` / `(dashboard)`; root `app/` (no `src/`).
- 2026-07-09: Service role client in `lib/supabase/admin.ts` only — not imported by user-facing Phase 0 routes.
- 2026-07-09: Auth mutations in `actions/auth.ts` with zod; return `{ data, error }`.
- 2026-07-09: Env uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy anon) for broad compatibility.

## Schema state

No business tables yet. Last migration: none.

## Env vars required

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY` (optional empty until Phase 5)
- `STRIPE_WEBHOOK_SECRET` (`whsec_placeholder`)

## Open TODOs

- Create dedicated Supabase project for S1mpleCRM (free-tier limit blocked create; Cadence org already has `cadence` project).
- Set Auth Site URL + redirect URLs (`http://localhost:3000`, `https://s1mplecrm.vercel.app`, `/auth/callback`).
- Add env vars to Vercel project `s1mplecrm` and local `.env.local`.
- Link GitHub remote and push `main` for auto-deploy (or deploy via Vercel CLI).

## Known issues

- Cannot create a second free Supabase project under Cadence org until an existing free project is paused/deleted or the plan is upgraded.
- Vercel project `s1mplecrm` exists but framework was null on last inspect; next deploy should detect Next.js.

## Next step

Phase 1 — Tenancy core (after Phase 0 test gate: sign up / sign in / magic link / production load).
