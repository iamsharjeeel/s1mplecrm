# CRM Handover

## Current phase and status

Phase 0 — Foundation: **done**. Auth + empty dashboard live at https://s1mplecrm.vercel.app. Stop for user testing before Phase 1.

## Architecture decisions

- 2026-07-09: Cookie-based session via `@supabase/ssr`; middleware refreshes with `getClaims()`.
- 2026-07-09: App Router groups `(auth)` / `(dashboard)`; root `app/` (no `src/`).
- 2026-07-09: Service role client in `lib/supabase/admin.ts` only — not imported by user-facing Phase 0 routes.
- 2026-07-09: Auth mutations in `actions/auth.ts` with zod; return `{ data, error }`.
- 2026-07-09: Env uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy anon) for broad compatibility.
- 2026-07-09: Middleware imports `./lib/supabase/middleware` (relative) — Vercel Edge rejects `@/` alias.

## Schema state

No business tables yet. Last migration: none.

## Env vars required

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (prod: `https://s1mplecrm.vercel.app`)
- `RESEND_API_KEY` (optional empty until Phase 5)
- `STRIPE_WEBHOOK_SECRET` (`whsec_placeholder`)

## Open TODOs

- Confirm Supabase Auth Site URL + redirect allowlist includes `http://localhost:3000/**` and `https://s1mplecrm.vercel.app/**` (callback `/auth/callback`).
- Optional: dedicated Supabase project when free-tier slot frees (Vercel currently uses project `vyxbggvprphchnecfftq`).

## Known issues

- Free Supabase project create blocked under Cadence org (2-project limit) for a brand-new S1mpleCRM project.
- Vercel Framework Preset must stay **Next.js** (was `Other`; caused Edge `__dirname` 500s).

## Files touched (Phase 0)

- `app/(auth)/*`, `app/(dashboard)/*`, `app/auth/callback/route.ts`, `middleware.ts`
- `lib/supabase/{client,server,admin,middleware}.ts`, `actions/auth.ts`
- `components/auth/*`, `components/dashboard/*`, `components/ui/*`
- `vercel.json`, `README.md`, `CRM_HANDOVER.md`, `CHANGELOG.md`, `CLAUDE.md`, `.cursorrules`, `CRM_BUILD_PLAN.md`, `.env.example`

## Next step

User tests sign up / sign in / magic link locally and on production. Then Phase 1 — Tenancy core.