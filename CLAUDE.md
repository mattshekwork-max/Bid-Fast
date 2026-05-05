# CatchFlow — CLAUDE.md

## Project Overview
CatchFlow is a missed-opportunity follow-up queue for small service businesses. It ingests leads (email, missed calls, texts), runs AI classification (urgency + intent via Groq), generates summaries + suggested replies (Gemini), and presents a prioritized queue dashboard.

## Tech Stack
- Next.js 16 (App Router, Turbopack dev)
- Supabase (Postgres + Auth, instance: otztmrxfdaxfdxqlshht)
- Tailwind v4 + shadcn/ui + Radix primitives
- React Query (@tanstack/react-query) — all data fetching through hooks
- Framer Motion — UI animations
- Groq (llama-3.1-8b-instant) — urgency classification
- Gemini 1.5 Flash — lead summarization

## Commands
- `pnpm dev` — dev server on :3000 (Turbopack)
- `pnpm build` — production build
- `pnpm lint` — ESLint

## Project Structure
- `app/` — Next.js App Router pages + API routes
- `app/api/` — REST API (service role client, bypasses RLS)
- `app/dashboard/` — Authenticated dashboard UI
- `lib/ai/` — Groq + Gemini AI pipelines
- `lib/hooks/` — React Query hooks (always use these, never fetch directly)
- `lib/supabase/` — Supabase clients (server, browser, service-role)
- `lib/constants.ts` — DEMO_WORKSPACE_ID, urgency color scale, badge configs
- `types/database.ts` — TypeScript types matching Supabase schema

## Conventions
- All API routes use service role client (webhooks need to bypass RLS)
- Every route validates workspace_id
- AI failures return partial/default results, never crash the ingest
- React Query for all client-side data fetching — 30s refetch on queue
- Dark theme by default (next-themes)
- Teal brand color (#0d9488)
- Urgency color scale: 1-3 green, 4-6 amber, 7-8 orange, 9-10 red (9-10 pulses)
- Route handlers use Next.js 16 pattern: params as Promise

## Database
Schema in `supabase-schema.sql`. Tables: workspaces, users, leads, follow_ups, email_events.
RLS enabled on all tables. Service role bypasses RLS for API routes.

## AI Pipeline
Ingest flow: email_event → store raw → Groq classify (urgency + intent) → Gemini summarize → upsert lead → auto-create follow_up if urgency ≥ 7
Both AI calls run in parallel with 15s timeout. Graceful fallback on failure.

## Environment Variables
See `.env` — requires: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY, GEMINI_API_KEY