# MANUAL STEPS — S1mpleCRM Phases 1–6

Do these before (or right after) deploy. App code assumes they are done.

## 1. Run database migration (REQUIRED)

Supabase MCP on this machine only sees the Cadence project, not `vyxbggvprphchnecfftq`. Apply SQL manually:

1. Open Supabase Dashboard → project `vyxbggvprphchnecfftq` → SQL Editor
2. Paste and run the **full** contents of:
   `supabase/migrations/20260709000000_v1_schema.sql`
3. Confirm success (tables + RLS + storage bucket `org-logos`)

**If a previous run failed** with `organization_members does not exist`: that was a create-order bug (fixed). Re-run the updated file — it is idempotent (`if not exists` / `drop policy if exists`).

**To let the agent apply migrations later:** in Cursor, re-auth the Supabase MCP / add project `vyxbggvprphchnecfftq` to the linked org, or run `npx supabase login` then `npx supabase link --project-ref vyxbggvprphchnecfftq`.

## 2. Auth redirect URLs (REQUIRED for Google / magic link)

Supabase → Authentication → URL Configuration:

- Site URL: `https://s1mplecrm.vercel.app`
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://s1mplecrm.vercel.app/auth/callback`

Google Cloud OAuth client authorized redirect:
`https://vyxbggvprphchnecfftq.supabase.co/auth/v1/callback`

## 3. Resend for invites + contact email (REQUIRED for Phase 4/5 send)

1. Verify a domain in Resend (DNS)
2. Vercel env:
   - `RESEND_API_KEY` (already set)
   - `RESEND_FROM` = `S1mpleCRM <noreply@your-verified-domain>`
3. Optional — Auth emails via Resend: Supabase → Auth → SMTP → `smtp.resend.com`

Without `RESEND_FROM`, invites still create in DB but email is skipped (link shown in UI / logs).

## 4. Stripe (optional until you charge)

- Keep `STRIPE_WEBHOOK_SECRET=whsec_placeholder`
- Point Stripe webhook to `https://s1mplecrm.vercel.app/api/webhooks/stripe` when ready
- Checkout is intentionally disabled in v1

## 5. After migration

Sign in → create org (onboarding) → use Contacts / Pipeline / Team.
