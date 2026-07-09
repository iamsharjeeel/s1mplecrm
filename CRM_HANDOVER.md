# CRM Handover

## Current phase and status

Phase 0 — Foundation: **done** (+ Google OAuth UI). Live: https://s1mplecrm.vercel.app  
Awaiting design variation approval (see `DESIGN_PROMPTS.md`) before Phase 1 UI polish. Phase 1 tenancy can start after user confirms Google + auth SMTP preference.

## Architecture decisions

- 2026-07-09: Cookie-based session via `@supabase/ssr`; middleware refreshes with `getClaims()`.
- 2026-07-09: App Router groups `(auth)` / `(dashboard)`; root `app/` (no `src/`).
- 2026-07-09: Service role client in `lib/supabase/admin.ts` only — not imported by user-facing Phase 0 routes.
- 2026-07-09: Auth mutations in `actions/auth.ts` with zod; return `{ data, error }`.
- 2026-07-09: Env uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy anon) for broad compatibility.
- 2026-07-09: Middleware imports `./lib/supabase/middleware` (relative) — Vercel Edge rejects `@/` alias.
- 2026-07-09: Google OAuth via `signInWithOAuth` → `/auth/callback` (same as magic link).
- 2026-07-09: `RESEND_API_KEY` does not send Auth emails; Supabase Auth SMTP must be configured for branded auth mail.

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

- User: approve Stitch variation A–E from `DESIGN_PROMPTS.md`.
- Optional: Supabase Auth Custom SMTP → Resend for magic-link/confirm emails.
- Confirm Google Cloud redirect URI + Supabase provider credentials for prod + local.
- Optional: dedicated Supabase project when free-tier slot frees (Vercel uses `vyxbggvprphchnecfftq`).

## Known issues

- Free Supabase project create blocked under Cadence org (2-project limit) for a brand-new S1mpleCRM project.
- Vercel Framework Preset must stay **Next.js** (was `Other`; caused Edge `__dirname` 500s).

## Files touched (latest)

- `actions/auth.ts` — `signInWithGoogle`
- `components/auth/google-sign-in-button.tsx`, sign-in/sign-up forms
- `DESIGN_PROMPTS.md`, `README.md`, `CRM_HANDOVER.md`, `CHANGELOG.md`

## Next step

User tests Google sign-in. Approve a design variation. Then Phase 1 — Tenancy core.
