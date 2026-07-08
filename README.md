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
| `NEXT_PUBLIC_SITE_URL` | client + server | Auth redirect origin (`http://localhost:3000` locally) |
| `RESEND_API_KEY` | server | Placeholder until Phase 5 |
| `STRIPE_WEBHOOK_SECRET` | server | `whsec_placeholder` until Phase 6 |

## Auth

- `/sign-up` — email + password
- `/sign-in` — password or magic link
- `/auth/callback` — session exchange for magic links
- Dashboard at `/` requires a session (middleware)

## Docs

- [CRM_BUILD_PLAN.md](CRM_BUILD_PLAN.md) — phases and scope
- [CRM_HANDOVER.md](CRM_HANDOVER.md) — current state for agents
- [CLAUDE.md](CLAUDE.md) / [.cursorrules](.cursorrules) — project rules

## Current phase

Phase 0 — Foundation (auth + empty dashboard shell). Tenancy starts in Phase 1.
