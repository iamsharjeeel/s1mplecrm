# S1mpleCRM

Multi-tenant CRM SaaS. Next.js 15 App Router, TypeScript, Tailwind v4, Supabase, Resend, Vercel.

## Stack

- Next.js 15 + TypeScript + Tailwind v4
- Supabase (Auth, Postgres + RLS, Storage)
- shadcn/ui + Framer Motion
- Vercel deploy (main branch)

## Setup

1. Copy env: `cp .env.example .env.local` and fill values from your Supabase project.
2. Install: `npm install`
3. Dev: `npm run dev` → http://localhost:3000
4. Build: `npm run build`
5. Lint: `npm run lint`

## Env vars

| Variable | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Publishable / anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Never expose to client; webhooks/admin only |
| `NEXT_PUBLIC_SITE_URL` | client + server | Auth redirect origin (`http://localhost:3000` locally; prod URL in Vercel) |
| `RESEND_API_KEY` | server | Used for **app** email in Phase 5 — does **not** send Supabase Auth mail unless you wire Custom SMTP |
| `STRIPE_WEBHOOK_SECRET` | server | `whsec_placeholder` until Phase 6 |

## Auth

- `/sign-up` — Google OAuth, or email + password
- `/sign-in` — Google OAuth, password, or magic link
- `/auth/callback` — session exchange for OAuth + magic links
- Dashboard at `/` requires a session (middleware)

### Google OAuth (Supabase)

1. Enable Google provider in Supabase Auth.
2. Add authorized redirect URI in Google Cloud: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Supabase redirect allowlist must include `http://localhost:3000/auth/callback` and `https://s1mplecrm.vercel.app/auth/callback`

### Why magic-link / signup mail still comes from Supabase

`RESEND_API_KEY` in Vercel is for **S1mpleCRM outbound email** (Phase 5: compose to contacts). Auth emails (confirm, magic link, reset) are sent by **Supabase Auth**. To brand those through Resend, set **Supabase → Project Settings → Authentication → SMTP** to Resend’s SMTP (`smtp.resend.com`, user `resend`, password = API key, sender = your verified domain).

## Docs

- [CRM_BUILD_PLAN.md](CRM_BUILD_PLAN.md) — phases and scope
- [CRM_HANDOVER.md](CRM_HANDOVER.md) — current state for agents
- [DESIGN_PROMPTS.md](DESIGN_PROMPTS.md) — Stitch.withgoogle design variations
- [CLAUDE.md](CLAUDE.md) / [.cursorrules](.cursorrules) — project rules

## Current phase

Phase 0 — Foundation (auth + empty dashboard shell). Tenancy starts in Phase 1 after design approval.
