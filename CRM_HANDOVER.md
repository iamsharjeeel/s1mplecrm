# CRM Handover

## Current phase and status

Phases 0–6 **shipped**. Live: https://s1mplecrm.vercel.app  
Schema applied on `vyxbggvprphchnecfftq`. Org-create RLS fix on main (`648b55b`).  
Session continuity: see `CHAT_HANDOVER.md`.

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
- 2026-07-09: OAuth redirect uses request host (`getRequestOrigin`), not only `NEXT_PUBLIC_SITE_URL`.
- 2026-07-09: Org create inserts client UUID then membership — never `insert().select()` before member row (RLS).

## Schema state

Migration: `supabase/migrations/20260709000000_v1_schema.sql` (idempotent; tables before `is_org_member`).  
Tables: organizations, organization_members, invites, contacts, pipelines, stages, deals, tasks, activities, emails, subscriptions, webhook_events + `org-logos` bucket.  
**Applied** on CRM Supabase project.

## Env vars required

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY` + `RESEND_FROM`
- `STRIPE_WEBHOOK_SECRET` (`whsec_placeholder` ok for stub)

## Open TODOs

- User smoke-test: onboarding → contacts → pipeline → tasks → team
- Replace temp `RESEND_FROM` (`onboarding@resend.dev`) with verified domain
- Optional: Auth SMTP via Resend; Stripe live webhook; MCP/CLI access to CRM project

## Known issues

- Supabase MCP on agent machine only sees Cadence project, not `vyxbggvprphchnecfftq`.
- Vercel Framework Preset must stay **Next.js** (Other caused Edge `__dirname` 500s).

## Routes

Auth: `/sign-in`, `/sign-up`, `/auth/callback`, `/invite/[token]`  
App: `/`, `/onboarding`, `/contacts`, `/contacts/[id]`, `/pipeline`, `/tasks`, `/activity`, `/team`, `/settings`, `/upgrade`  
API: `/api/webhooks/stripe`, `/api/webhooks/resend`

## Next step

Finish smoke-test; fix any remaining UX bugs; harden Resend sender.
