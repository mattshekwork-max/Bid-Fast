# Bid.Fast

Talk through the job. Get a bid in 60 seconds.

Bid.Fast turns your voice walkthrough into a professional estimate — line items, materials, and labor. No typing. No spreadsheets.

## How It Works

1. **Record** — Walk the job, describe the scope out loud. Bid.Fast listens.
2. **Generate** — AI builds a complete estimate with line items, materials, and realistic pricing.
3. **Send** — One tap emails a professional estimate with a built-in Accept/Decline link.

## Tech Stack

- **Frontend:** Next.js 16, Tailwind v4, Radix UI
- **Backend:** Next.js API Routes, Supabase (Postgres + Auth)
- **AI:** Groq Whisper (transcription), Gemini 1.5 Flash (estimate generation)

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY, GEMINI_API_KEY

# Run database schema
# Copy supabase-schema.sql into your Supabase SQL Editor and execute

# Start dev server
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transcribe` | Audio file → transcript (Groq Whisper) |
| POST | `/api/estimates/generate` | Transcript → structured estimate (Gemini) |
| POST | `/api/estimates/[id]/send` | Generate client_token, set status=sent, return public URL |
| POST | `/api/estimates/[id]/respond` | Client accepts or declines estimate |
| GET | `/api/estimates/[id]/pdf` | Print-ready HTML for PDF download |
| GET | `/api/estimates/[id]/materials` | Material list for export |
| PATCH | `/api/estimates/[id]/materials` | Mark materials as exported |

## License

Proprietary — Built with SaasOpportunities.com
