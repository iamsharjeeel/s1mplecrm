# CRM Handover

## Current phase and status

Phases 0–6 **implemented in code**. Live: https://s1mplecrm.vercel.app  
**Blocked until you run** `MANUAL_STEPS.md` §1 (SQL migration on Supabase project `vyxbggvprphchnecfftq`).

## Architecture decisions

- 2026-07-09: Cookie-based session via `@supabase/ssr`; middleware refreshes with `getClaims()`.
- 2026-07-09: App Router groups `(auth)` / `(dashboard)`; root `app/` (no `src/`).
- 2026-07-09: Service role only in `lib/supabase/admin.ts` + webhook routes.
- 2026-07-09: Auth mutations return `{ data, error }`; business mutations same.
- 2026-07-09: Design locked — forest green `#1F4D3A`; `design-spec.md`.
- 2026-07-09: Active org cookie `s1mple_active_org` + `getActiveOrg()` / `requireActiveOrg()`.
- 2026-07-09: Plan limits only via `getOrgPlan()` + `lib/plans.ts`.
- 2026-07-09: Permissions matrix in `lib/permissions.ts`.
- 2026-07-09: Activities via DB triggers (contacts/deals) + `writeActivity()` in actions.
- 2026-07-09: Stripe/Resend webhooks idempotent on `(source, external_id)`.

## Schema state

Migration file: `supabase/migrations/20260709000000_v1_schema.sql`  
Tables: organizations, organization_members, invites, contacts, pipelines, stages, deals, tasks, activities, emails, subscriptions, webhook_events + storage bucket `org-logos`.  
**Not applied remotely until MANUAL STEP.**

## Env vars required

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY` + `RESEND_FROM` (invites + contact email)
- `STRIPE_WEBHOOK_SECRET` (`whsec_placeholder` ok for stub)

## Open TODOs

- User: run SQL migration (MANUAL_STEPS.md)
- User: set `RESEND_FROM` on Vercel after domain verify
- User: confirm Auth redirect URLs + Google OAuth callback
- Optional: Stripe live webhook when charging

## Known issues

- Supabase MCP/CLI cannot access CRM project from agent machine — migration is manual paste.
- Free-tier project create still blocked for a dedicated S1mpleCRM project name.

## Routes

Auth: `/sign-in`, `/sign-up`, `/auth/callback`, `/invite/[token]`  
App: `/`, `/onboarding`, `/contacts`, `/contacts/[id]`, `/pipeline`, `/tasks`, `/activity`, `/team`, `/settings`, `/upgrade`  
API: `/api/webhooks/stripe`, `/api/webhooks/resend`

## Next step

User runs migration → create org → smoke-test contacts/pipeline/team/email.
