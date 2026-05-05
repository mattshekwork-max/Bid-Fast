# CatchFlow

Never lose a lead again. AI-powered follow-up queue for small service businesses.

## How It Works

1. **Ingest** — Emails, missed calls, and texts flow in via API webhooks
2. **Classify** — Groq AI scores urgency (1-10) and detects intent (quote, booking, complaint, etc.)
3. **Summarize** — Gemini generates a concise summary + ready-to-send suggested reply
4. **Prioritize** — Dashboard shows your queue sorted by urgency — hottest leads first
5. **Follow Up** — One-click actions: mark contacted, dismiss, or create follow-up tasks

## Tech Stack

- **Frontend:** Next.js 16, Tailwind v4, shadcn/ui, React Query, Framer Motion
- **Backend:** Next.js API Routes, Supabase (Postgres + Auth)
- **AI:** Groq (urgency classification), Gemini 1.5 Flash (summarization)

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY, GEMINI_API_KEY

# Run database schema
# Copy supabase-schema.sql into your Supabase SQL Editor and execute

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, or [http://localhost:3000/dashboard](http://localhost:3000/dashboard) for the queue.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ingest/email` | Email webhook — stores event, runs AI, upserts lead |
| GET | `/api/leads` | List leads (filter by status, source) |
| POST | `/api/leads` | Create lead manually (auto-runs AI if message given) |
| PATCH | `/api/leads/[id]` | Update lead status |
| GET | `/api/queue` | Dashboard queue (new + contacted leads by urgency) |
| POST | `/api/followups` | Create follow-up task |
| PATCH | `/api/followups/[id]` | Complete or skip a follow-up |
| POST | `/api/ai/classify` | Standalone Groq urgency classification |
| POST | `/api/ai/summarize` | Standalone Gemini summarization |

## Architecture

```
Email/SMS/Call ──▶ /api/ingest/email
                        │
                 ┌──────┴──────┐
                 │  Store Raw   │
                 │  email_event │
                 └──────┬──────┘
                        │
              ┌─────────┴─────────┐
              │                   │
         Groq Classify      Gemini Summarize
        (urgency + intent)  (summary + reply)
              │                   │
              └─────────┬─────────┘
                        │
                  Upsert Lead
                        │
              urgency ≥ 7? ──▶ Auto-create Follow-up
                        │
                  Dashboard Queue
```

## License

Proprietary — HelloKetch Platform