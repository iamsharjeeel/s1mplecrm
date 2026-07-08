# CRM Project Rules

Drop this file in the repo root as CLAUDE.md. In Cursor, also point .cursor/rules or .cursorrules at it. It governs every session on this codebase.

## Role

You are the executor on a multi-tenant CRM SaaS Named S1mpleCRM. Next.js 15 App Router, TypeScript, Tailwind v4, Supabase (Postgres + RLS + Auth + Storage), Resend, Vercel. Follow CRM\_BUILD\_PLAN.md for scope. Do not invent features outside the current phase.

## Hard rules

1. Never write a query without org scoping. Every table has org\_id and RLS. All server data access goes through getActiveOrg(). If you find a query that bypasses it, fix it before continuing anything else.
2. Never use the service role key in any code path reachable by a user request, except webhook handlers and admin scripts. Flag any exception explicitly.
3. Schema changes are SQL migration files in supabase/migrations, never dashboard-only changes. If a manual dashboard step is unavoidable, print it as a MANUAL STEP block and stop until confirmed.
4. All mutations are server actions with zod validation. No client-side inserts to Supabase for business tables.
5. Every mutation writes an activities row (actor, verb, entity, meta). If you add a mutation without one, that is a bug.
6. Plan limits are enforced only through getOrgPlan() and the constants in lib/plans.ts. Never hardcode a limit anywhere else.
7. Secrets only via env vars. Never commit keys, never print them in logs.
8. Do not add dependencies without stating why in the commit message. Prefer what is already installed.

## Workflow per task

1. Read CRM\_HANDOVER.md first to load current state. Trust it over assumptions.
2. If the task needs SQL or env changes, output the MANUAL STEP block first and wait.
3. Implement smallest complete slice. TypeScript strict, no any, no ts-ignore without a comment.
4. Self-verify before declaring done: run build, run lint, exercise the feature path you touched (list what you checked).
5. Stop for user testing at every phase boundary. Do not start the next phase unsolicited.

## End of every task (mandatory, no exceptions)

1. Update README.md if setup, env vars, or commands changed.
2. Update CRM\_HANDOVER.md: what was done, files touched, schema changes, open TODOs, known issues, next step.
3. Commit with a conventional message (feat/fix/chore/refactor: scope). Push to main. Confirm Vercel deploy succeeded; if it fails, fix before ending the task.

## CRM\_HANDOVER.md format

Keep it under 200 lines. Sections: Current phase and status. Architecture decisions (append-only, dated). Schema state (table list + last migration file). Env vars required. Open TODOs. Known issues. Next step. Prune completed TODOs; never prune decisions.

## Code conventions

* Structure: app/(auth), app/(dashboard), lib/ (supabase clients, plans, permissions, activity), components/ui (shadcn), components/feature-name.
* Permissions live in one file, lib/permissions.ts, as a role-action matrix. All checks import from it.
* Server actions in actions/ per domain (contacts.ts, deals.ts, tasks.ts). Return { data, error } shape, never throw to the client.
* Errors: user-safe message to the UI, full detail to console.error with a context tag like \[deals:update].
* UI: shadcn components, loading and empty states for every list, optimistic updates only on kanban drag.
* Dates in UTC in the DB, format at the edge with the org locale.

## Maintenance behavior

* Migrations: forward-only, numbered, one concern per file. Include a rollback comment at the top of each. Never edit a merged migration; write a new one.
* After any schema change: regenerate types (supabase gen types typescript) and commit the output.
* RLS audit: whenever a new table is added, write and run the isolation test (two orgs, cross-access attempts) before building UI on it.
* Webhooks: every incoming event first writes to webhook\_events with a unique constraint on (source, external\_id) for idempotency, then processes. Retries must be safe.
* Dependencies: no proactive upgrades mid-phase. At phase boundaries only, patch/minor updates allowed if build and lint pass; major upgrades require an explicit user request.
* Dead code: delete it, do not comment it out. Git is the archive.
* If a bug is found in earlier-phase code while working, fix it in the same task if under 15 lines, otherwise log it in CRM\_HANDOVER.md Known issues and continue.
* Performance: no premature optimization; add an index only when a query plan or slow behavior justifies it, and note it in the handover.

## Advisor consults (Claude Code sessions)

Consult the advisor (Fable 5, fallback Opus 4.8) only at the checkpoints listed in CRM\_BUILD\_PLAN.md, when stuck after two failed approaches, or before any change touching RLS or permissions. Keep asks under 80 words. Treat advice as binding unless it contradicts observed behavior; if it does, do one reconcile consult instead of silently overriding.

## Things you must never do

* Skip the handover update because the change was small.
* Ship a table without RLS because it is temporary.
* Add billing/checkout code before the user asks. Hooks only.
* Refactor across domains while implementing a feature. One concern per task.
* Declare done without a successful Vercel deploy.

