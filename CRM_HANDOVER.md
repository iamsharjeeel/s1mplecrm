# CRM Handover

## Current phase and status

Phase 0 — Foundation: **done** + design system locked. Live: https://s1mplecrm.vercel.app  
Design: Stitch shell + Ledger Light forest green `#1F4D3A` — see `design-spec.md`.

## Architecture decisions

- 2026-07-09: Cookie-based session via `@supabase/ssr`; middleware refreshes with `getClaims()`.
- 2026-07-09: App Router groups `(auth)` / `(dashboard)`; root `app/` (no `src/`).
- 2026-07-09: Service role client in `lib/supabase/admin.ts` only — not imported by user-facing Phase 0 routes.
- 2026-07-09: Auth mutations in `actions/auth.ts` with zod; return `{ data, error }`.
- 2026-07-09: Env uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy anon) for broad compatibility.
- 2026-07-09: Middleware imports `./lib/supabase/middleware` (relative) — Vercel Edge rejects `@/` alias.
- 2026-07-09: Google OAuth via `signInWithOAuth` → `/auth/callback`.
- 2026-07-09: `RESEND_API_KEY` does not send Auth emails; Supabase Auth SMTP must be configured for branded auth mail.
- 2026-07-09: **Design locked** — Stitch HTML + forest green accent; top nav shell; Libre Caslon + Inter; tokens in `app/globals.css`; agent rule `.cursor/rules/design-system.mdc`.

## Schema state

No business tables yet. Last migration: none.

## Env vars required

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (prod: `https://s1mplecrm.vercel.app`)
- `RESEND_API_KEY` (app email Phase 5; optional Auth SMTP now)
- `STRIPE_WEBHOOK_SECRET` (`whsec_placeholder`)

## Open TODOs

- Optional: Supabase Auth Custom SMTP → Resend for magic-link/confirm emails.
- Confirm Google Cloud redirect URI for prod + local.
- Phase 1 — Tenancy core (orgs, RLS, getActiveOrg).

## Known issues

- Free Supabase project create blocked under Cadence org (2-project limit).
- Vercel Framework Preset must stay **Next.js**.

## Files touched (design lock)

- `design-spec.md`, `.cursor/rules/design-system.mdc`
- `app/globals.css`, `app/layout.tsx`
- `components/auth/*`, `components/dashboard/top-nav.tsx`
- `app/(auth)/*`, `app/(dashboard)/*`

## Next step

Phase 1 — Tenancy core (after user confirms UI looks right on prod).
