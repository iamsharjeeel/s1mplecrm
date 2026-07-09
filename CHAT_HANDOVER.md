# Chat handover — S1mpleCRM

**For the next agent:** read this first, then `CRM_HANDOVER.md` + `design-spec.md`. Do not rebuild Phases 0–6.

---

## Product

Multi-tenant CRM SaaS: contacts, pipeline, tasks, activity, team invites, email, billing hooks.

- **Live:** https://s1mplecrm.vercel.app  
- **Repo:** https://github.com/iamsharjeeel/s1mplecrm (`main`)  
- **Vercel:** project `s1mplecrm`, team `iamsharjeeel-3966s-projects`  
- **Supabase project (CRM):** `vyxbggvprphchnecfftq` — use keys in `.env.local` / Vercel.  
  MCP `list_projects` may only show Cadence (`irybkcryeywmwpcmhlaa`); do **not** apply CRM SQL there.

---

## Stack (locked)

Next.js 15 App Router · TypeScript · Tailwind v4 · shadcn/ui · Supabase (Auth + Postgres RLS + Storage) · Resend · Stripe webhooks (Checkout later) · Framer Motion · Vercel

Hard rules: org-scoped queries via `getActiveOrg()` · no service role on user paths (except webhooks/admin) · migrations in `supabase/migrations/` · server actions + zod → `{ data, error }` · activities on mutations · plans via `getOrgPlan()` + `lib/plans.ts`

---

## Design (locked)

- Spec: `design-spec.md` · Cursor rule: `.cursor/rules/design-system.mdc`
- Stitch UI + forest green `#1F4D3A` (not Cadence purple)
- Libre Caslon Text (display) + Inter (UI)
- Top nav only — no sidebar
- Auth: centered card, soft sage wash, Google + email + magic link

---

## What shipped this chat

| Area | Status |
|------|--------|
| Phase 0 auth + shell | Done |
| Google OAuth | Done |
| Design lock + dashboard shell | Done |
| Phase 1 orgs / onboarding / settings / switcher | Done |
| Phase 2 contacts + CSV + pipeline kanban | Done |
| Phase 3 tasks + activity | Done |
| Phase 4 invites | Done |
| Phase 5 Resend compose | Done |
| Phase 6 upgrade page + Stripe/Resend webhooks | Done (no Checkout UI) |
| SQL migration | User applied in CRM Supabase SQL editor |
| Deploy | Auto on `main` |

---

## Bugs fixed (do not reintroduce)

1. **Migration order** — create `organizations` / `organization_members` **before** `is_org_member()` (Postgres validates function bodies at CREATE). Migration is idempotent (`drop policy if exists`, etc.).
2. **OAuth redirect** — do not use `NEXT_PUBLIC_SITE_URL` alone (points at localhost when developing). Use `getRequestOrigin()` from the request host. Keep **both** localhost and production callbacks in Supabase Auth URL allowlist.
3. **Org create RLS** — `insert().select()` failed because the creator is not a member yet. Fix: client-generated UUID → insert org without select → insert owner membership → `set_config` + cookie. Commit `648b55b`.
4. **Vercel Edge** — Framework Preset must be **Next.js** (was `Other` → `__dirname` 500s). Prefer relative import in `middleware.ts` for `updateSession`.

---

## Critical files

```
actions/          auth, orgs, contacts, deals, tasks, activities, team, email
lib/org.ts        getActiveOrg, requireActiveOrg, getOrgPlan, setActiveOrg
lib/plans.ts      free/pro/business limits
lib/permissions.ts
lib/activity.ts
lib/supabase/     client, server, middleware, admin
app/(auth)/       login, signup, callback, invite accept
app/(dashboard)/  home, contacts, pipeline, tasks, activity, team, settings, upgrade
app/api/webhooks/ stripe, resend
supabase/migrations/20260709000000_v1_schema.sql
components/layout/  top-nav, org-switcher, user-menu
middleware.ts
```

---

## Env (Vercel + `.env.local`)

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`  
Optional until used: `RESEND_API_KEY`, `RESEND_FROM`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS`

`RESEND_FROM` is still `onboarding@resend.dev` until domain verified — see `MANUAL_STEPS.md`.

---

## Manual / pending (user)

- [ ] Retest **Create organization** after org-insert fix (should work now)
- [ ] Smoke-test: contacts → pipeline drag → task → invite → compose email
- [ ] Replace `RESEND_FROM` with verified domain sender
- [ ] Confirm Google OAuth + redirect URLs for prod + localhost
- [ ] Stripe Checkout / Customer Portal = **v2** (webhooks only for now)

---

## Next agent — do this

1. Confirm org create works for the user; if not, check Supabase logs + RLS on `organizations` INSERT.
2. Help finish smoke-test; fix only what breaks.
3. Do **not** redesign; do **not** rebuild phases; do **not** add Stripe Checkout unless asked.
4. After meaningful work: update this file, `CRM_HANDOVER.md`, `CHANGELOG.md`, `README.md` if setup/features changed.

---

## Recent commits (context)

- `648b55b` — fix org create RLS (no select-after-insert)
- `0a0a5a0` — OAuth redirect via request origin
- `b8a1e0d` — idempotent migration + table-before-function
- `9a0a0a9` — Phases 1–6 feature dump
- Earlier: Phase 0, Google OAuth, design lock, Vercel Next.js preset
