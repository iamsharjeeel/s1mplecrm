# CRM SaaS Build Plan

Multi-tenant CRM SaaS. Simple v1, full-stack from day 1, billing hooks only (no charging yet). Built via Cursor Composer 2.5 as executor with Fable 5 / Opus 4.8 as advisor for architecture decisions.

## Stack (locked)

- Next.js 15 App Router, TypeScript, Tailwind v4
- Supabase: Auth, Postgres with RLS, Storage, Edge Functions for webhooks
- Vercel deployment, main branch auto-deploy
- Resend for outbound email (v1), Gmail API OAuth sync deferred to v2
- Stripe: webhook endpoint + subscriptions table stubbed, no checkout in v1
- shadcn/ui + Framer Motion for UI

## Multi-tenancy model (day 1, non-negotiable)

- organizations table is the tenant root. Every business table carries org_id.
- organization_members: user_id, org_id, role (owner, admin, member). One user can belong to many orgs.
- RLS on every table: user must be a member of the row's org. Role checks via a security-definer function is_org_member(org_id, min_role).
- Active org stored in a cookie, resolved in a server-side helper getActiveOrg(). All queries go through it. No client-side org switching logic touching data directly.
- Org slug in URL later if needed; cookie-based is fine for v1.

## Database schema (v1)

- organizations: id, name, slug, logo_url, created_at
- organization_members: org_id, user_id, role, invited_by, joined_at
- invites: id, org_id, email, role, token, expires_at, accepted_at
- contacts: id, org_id, first_name, last_name, email, phone, company, tags text[], custom jsonb, owner_id, created_at
- pipelines: id, org_id, name, position
- stages: id, pipeline_id, org_id, name, position, color
- deals: id, org_id, pipeline_id, stage_id, contact_id, title, value, currency, status (open, won, lost), owner_id, closed_at
- tasks: id, org_id, title, due_at, assignee_id, related_contact_id, related_deal_id, completed_at
- activities: id, org_id, actor_id, verb, entity_type, entity_id, meta jsonb, created_at (append-only, written by triggers + server actions)
- emails: id, org_id, contact_id, direction, subject, body_html, status, provider_id, sent_by, created_at
- subscriptions: id, org_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end (stub, nullable everything)
- webhook_events: id, source, payload jsonb, processed_at (idempotency for Stripe/Resend)

## Billing hooks (build now, charge later)

- Plan gate helper: getOrgPlan(orgId) returns free until subscriptions row exists. All feature gates call this one function so flipping billing on later is a config change, not a refactor.
- /api/webhooks/stripe route with signature verification, writes to webhook_events, no-op handler bodies with TODO markers.
- Limits table in code (constants): free = 1 pipeline, 500 contacts, 3 members. Enforced in server actions from day 1 so upgrade pressure exists when billing flips on.

## Phases

Each phase follows the standard flow: manual SQL/env action first, then the Cursor prompt, then hold for testing before the next phase. Every Cursor prompt ends with: update README, update CRM_HANDOVER.md, push to main and confirm Vercel deploy.

### Phase 0 — Foundation
Manual: create Supabase project, create GitHub repo, link Vercel, set env vars (SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, RESEND_API_KEY, STRIPE_WEBHOOK_SECRET placeholder).
Cursor: scaffold Next.js 15 + TS + Tailwind v4 + shadcn, Supabase client helpers (server, browser, admin), auth pages (sign up, sign in, magic link), protected layout, empty dashboard shell.
Test: sign up, sign in, deploy loads.

### Phase 1 — Tenancy core
Manual: run schema SQL for organizations, organization_members, invites + RLS policies + is_org_member function.
Cursor: onboarding flow (create org on first login), org switcher in sidebar, getActiveOrg() helper, middleware guard, settings page (org name, logo upload to Storage).
Test: two accounts, two orgs, confirm cross-org data isolation by direct API attempts.

### Phase 2 — Contacts + pipeline
Manual: run schema SQL for contacts, pipelines, stages, deals + RLS + seed default pipeline trigger on org create.
Cursor: contacts table with search/filter/tags, contact detail drawer, CSV import, kanban board (dnd-kit) with stage drag, deal create/edit modal, won/lost flow.
Test: import 50 contacts, drag deals across stages, verify RLS again.

### Phase 3 — Tasks + activity log
Manual: run schema SQL for tasks, activities + activity triggers on contacts/deals insert-update.
Cursor: tasks list with due dates and assignee, my-tasks view, task checkbox on contact/deal detail, activity timeline component on contact and deal pages, global activity feed page.
Test: complete tasks, confirm timeline entries appear for all mutations.

### Phase 4 — Team roles + invites
Manual: confirm invites table + RLS, set Resend domain and sender.
Cursor: members page, invite by email (Resend branded email with token link), accept-invite page, role management (owner/admin/member permission matrix in one permissions.ts file), member limit enforcement from plan constants.
Test: invite second account as member, verify member cannot delete contacts or manage members.

### Phase 5 — Email sending
Manual: verify Resend domain DNS.
Cursor: compose email from contact page, templates table optional-skip, send via Resend, log to emails table, delivery status webhook /api/webhooks/resend writing back status, email thread view on contact.
Test: send to real inbox, confirm status updates.

### Phase 6 — Billing hooks + hardening
Manual: create Stripe account entries later; for now just set placeholder webhook secret.
Cursor: subscriptions table wiring, getOrgPlan gate applied to pipeline/contact/member limits, /api/webhooks/stripe stub with signature check and webhook_events idempotency, upgrade page showing plans with disabled buttons (coming soon), audit pass on all server actions for org_id scoping, rate limiting on auth and invite endpoints.
Test: hit limits on free plan, confirm blocks with clean upgrade messaging.

## v2 backlog (do not build now)

- Stripe Checkout + customer portal, plan upgrades live
- Gmail/Outlook OAuth sync (two-way email)
- Automations (stage change triggers task/email)
- API keys + public API per org
- White-label theming per org
- Reporting dashboard (win rate, pipeline velocity)

## Advisor checkpoints

Consult Fable 5 (fallback Opus 4.8) at exactly these points:
- Before Phase 1: review final schema + RLS policies as a whole
- Before Phase 4: review the permissions matrix
- After Phase 6: full security review of server actions and webhooks
Keep advisor guidance under 80 words per consult; Composer executes.
