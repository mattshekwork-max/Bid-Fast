# Bid.Fast — CLAUDE.md

## Product Overview
Bid.Fast is a voice-to-estimate tool for trade contractors. Record a job walkthrough, get a complete estimate (labor + materials) in seconds, and send it to the client with a built-in Accept/Decline link.

## Tech Stack
- Next.js 16 (App Router, Turbopack dev)
- Supabase (Postgres + Auth)
- Tailwind v4 + Radix primitives
- Groq (Whisper) — voice transcription
- Gemini 1.5 Flash — estimate generation from transcript
- Framer Motion — available but used sparingly

## Commands
- `npm run dev` — dev server on :3000 (Turbopack)
- `npm run build` — production build
- `npm run lint` — ESLint

## Project Structure
- `app/` — Next.js App Router pages + API routes
- `app/(app)/` — Authenticated app routes (dashboard, estimates)
- `app/client/[token]/` — Public client estimate view (no auth)
- `app/api/estimates/` — Estimate CRUD + generate + send + respond + pdf + materials
- `app/api/transcribe/` — Audio → transcript via Groq Whisper
- `lib/estimates.ts` — Server actions for estimates, line items, materials
- `lib/supabase/` — Supabase clients (server, browser, service-role)
- `types/database.ts` — TypeScript types matching Supabase schema

## Conventions
- API routes use service role client where ownership is already verified
- All Supabase queries check `{ data, error }` — never destructure only data
- Server actions return `{ data, error }`
- Pages display a visible error message, not silent empty state
- No middleware.ts edits
- Route handlers use Next.js 16 pattern: `params as Promise`
- Dark dashboard nav, light landing/auth pages

## Database
Schema in `supabase-schema.sql`. Tables: users, estimates, estimate_line_items, material_list_items, voice_sessions.
RLS enabled on all tables. Service role bypasses RLS for admin operations.

## Auth Flow
- `/login` → `supabase.auth.signInWithPassword` → redirect `/dashboard`
- `/signup` → `supabase.auth.signUp` → redirect `/dashboard`
- `app/(app)/layout.tsx` → checks `supabase.auth.getUser()`, redirects to `/login` if unauthenticated
- Sign-out: POST `/api/auth/signout`

## Core Feature Flow
1. `/estimates/new` — MediaRecorder records audio → POST `/api/transcribe` → review transcript
2. "Generate Estimate" → POST `/api/estimates/generate` → Gemini parses transcript → saves estimate + line items + materials → redirect `/estimates/[id]`
3. `/estimates/[id]` — view estimate, actions: Send to Client, Export Materials, Download PDF
4. "Send to Client" → POST `/api/estimates/[id]/send` → generates client_token, sets status=sent, returns public URL
5. `/client/[token]` — public view, Accept/Decline → POST `/api/estimates/[id]/respond`
6. "Download PDF" → GET `/api/estimates/[id]/pdf` → print-ready HTML (browser Print→Save as PDF)

## Environment Variables
See `.env.example`. Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY, GEMINI_API_KEY
Optional: RESEND_API_KEY (email client send), NEXT_PUBLIC_APP_URL

## Brand
- Name: Bid.Fast
- Primary: #F97316 (amber/orange)
- Navy: #0C1F3D
- Monospace initials: BF
- Footer: "Built with SaasOpportunities.com"
