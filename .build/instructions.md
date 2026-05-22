# JobCedar - Build Instructions

Solid AI backbone for your trades business

## Feature Plan

### Core Feature: Voice-to-Estimate
The user speaks a plain-language job description into their phone (e.g., 'I need to re-tile a 200 square foot bathroom with subway tile, rip out the old floor first, and replace the vanity') and the AI instantly generates a formatted estimate with line-item costs, a material list with quantities, and a shareable PDF — all without typing a single character.

### One-Tap Client Send
After the estimate is generated, the user taps one button to send a professionally branded PDF estimate to the client via text or email, with a built-in accept/decline link.

### Material List Export
The generated material list can be copied or shared directly to a supplier or hardware store app so the user can order or pick up supplies without re-entering items.

### Trade-Aware AI Vocabulary
The AI is fine-tuned to understand trade-specific jargon, common abbreviations, and regional material names (e.g., 'Romex', 'PEX', '5/8 rock') so it doesn't misinterpret spoken input.

## Landing Page Copy

**Hero headline:** Your Jobs, Estimated in Seconds
**Hero subheadline:** Describe any job by voice. Foreman gives you material lists, cost estimates, crew schedules, and permit info instantly. Built for tradespeople who'd rather be on the jobsite than behind a desk.
**CTA text:** Try Foreman Free

**How it works headline:** From Job Description to Full Estimate
**How it works subheadline:** Three steps. No typing required.

**Steps:**
1. **Describe the Job** - Talk through the scope of work in plain language, trade lingo and all.
2. **Get Your Estimate** - Foreman generates a material list, cost breakdown, and timeline in seconds.
3. **Send It to the Client** - Share a clean, professional estimate directly from the app.

**Features:**
- **Voice-First Input** - undefined
- **Instant Material Lists** - undefined
- **Crew Scheduling** - undefined
- **Permit Lookups** - undefined
- **Supply Ordering** - undefined
- **Client Follow-Ups** - undefined

**Final CTA headline:** Spend Less Time Quoting, More Time Building
**Final CTA subheadline:** Free to start. No credit card needed. Create your first estimate in under a minute.
**Final CTA button:** Try Foreman Free

## Database Schema

The schema is in `supabase-schema.sql`. It was already executed via the Supabase MCP in the setup step. Here it is for reference:

```sql
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(20) DEFAULT 'free',
  subscription_ends_at TIMESTAMPTZ,
  subscription_created_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS users_subscription_status_idx ON users(subscription_status);

CREATE TABLE IF NOT EXISTS estimates (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  voice_transcript TEXT NOT NULL,
  parsed_description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  total_labor_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_material_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  client_phone VARCHAR(50),
  pdf_url TEXT,
  client_token VARCHAR(255),
  client_response VARCHAR(20),
  client_responded_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS estimates_user_id_idx ON estimates(user_id);
CREATE INDEX IF NOT EXISTS estimates_status_idx ON estimates(status);
CREATE INDEX IF NOT EXISTS estimates_client_token_idx ON estimates(client_token);
CREATE INDEX IF NOT EXISTS estimates_created_at_idx ON estimates(created_at DESC);

CREATE TABLE IF NOT EXISTS estimate_line_items (
  id SERIAL PRIMARY KEY,
  estimate_id INTEGER NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit VARCHAR(30) NOT NULL DEFAULT 'each',
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  item_type VARCHAR(20) NOT NULL DEFAULT 'labor',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS estimate_line_items_estimate_id_idx ON estimate_line_items(estimate_id);
CREATE INDEX IF NOT EXISTS estimate_line_items_item_type_idx ON estimate_line_items(item_type);

CREATE TABLE IF NOT EXISTS material_list_items (
  id SERIAL PRIMARY KEY,
  estimate_id INTEGER NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  material_name VARCHAR(500) NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit VARCHAR(30) NOT NULL DEFAULT 'each',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  supplier_note TEXT,
  exported BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS material_list_items_estimate_id_idx ON material_list_items(estimate_id);

CREATE TABLE IF NOT EXISTS voice_sessions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  estimate_id INTEGER REFERENCES estimates(id) ON DELETE SET NULL,
  audio_url TEXT,
  raw_transcript TEXT NOT NULL,
  ai_parsed_json JSONB,
  session_type VARCHAR(30) NOT NULL DEFAULT 'new_estimate',
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS voice_sessions_user_id_idx ON voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS voice_sessions_estimate_id_idx ON voice_sessions(estimate_id);
CREATE INDEX IF NOT EXISTS voice_sessions_created_at_idx ON voice_sessions(created_at DESC);
```

## Payments (Stripe)

Stripe is OPTIONAL. The user was already asked about this during setup.

- If the user said **yes** to payments: keep the Stripe files, set up products via the Stripe MCP, and integrate checkout/webhook flows
- If the user said **no** to payments: skip building new payment features. Stripe boilerplate files stay in place (dormant without keys). The user can add Stripe later.

When Stripe IS included:
- Use the existing Stripe patterns from the boilerplate
- Create a pricing/upgrade page at a public route (accessible without login)
- Stripe webhooks need `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
- Use `getSupabaseAdmin()` from "@/lib/supabase" ONLY in Stripe webhook handlers

## Email (Resend)

Resend is OPTIONAL. The user was already asked about this during setup.

- If the user said **yes** to email: use `lib/email.ts` which is already wired up. Add product-specific email templates (e.g. onboarding sequences, feature notifications, weekly digests) and connect them to the right triggers (signup, subscription events, feature-specific actions).
- If the user said **no** to email: skip building new email features. Email files stay in place (emails log to console without an API key). The user can add Resend later.

When Resend IS included:
- Use the existing `sendEmail()`, `sendWelcomeEmail()`, and `sendSubscriptionEmail()` functions from `lib/email.ts`
- Add new email functions to `lib/email.ts` following the same pattern
- The welcome email is already triggered on signup in `app/api/users/route.ts`
- Subscription emails are already triggered in the Stripe webhook handler
- `RESEND_FROM_EMAIL` defaults to `onboarding@resend.dev` for testing. The user can verify a custom domain in Resend later.

## Auth Patterns

Supabase Auth is already set up in the boilerplate. The login, signup, and auth callback pages exist. Customize them to match the app's brand.

### Server-side (server components, server actions, API routes):
```ts
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  redirect("/login");
}
// user.id is a UUID, user.email is the email
```

### Client-side (client components):
```tsx
"use client";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

### Auth URLs:
- Login: `/login`
- Signup: `/signup`
- Logout: call `supabase.auth.signOut()` then `router.push("/")`

### Library functions pattern:
Library functions in lib/ should accept a SupabaseClient parameter:
```ts
import type { SupabaseClient } from "@supabase/supabase-js";
export async function myFunction(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from('table').select('*').eq('user_id', userId);
  return data;
}
```

### DO NOT:
- Install @auth0/nextjs-auth0, @clerk/nextjs, next-auth, or any other auth library
- Create a separate auth provider
- Use Drizzle ORM (use the Supabase JS client)
- Modify middleware.ts

## Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── (app)/             # Authenticated pages (has Navbar + Footer)
│   │   ├── dashboard/     # Main dashboard
│   │   └── ...            # Other authenticated pages
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── auth/callback/     # Auth callback handler
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page (outside (app) group)
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── Navbar.tsx         # Navigation bar
│   ├── Footer.tsx         # Footer component
│   └── LandingPageClient.tsx  # Landing page client component
├── db/                   # Database
│   └── schema.ts         # TypeScript types
├── lib/                  # Utilities
│   ├── supabase/         # Supabase client helpers
│   └── ...               # Additional utilities
├── supabase-schema.sql   # Database schema (already executed)
└── .build/               # Build instructions (this file)
```

## RLS Best Practices

Every table MUST have Row Level Security enabled. Here are common patterns:

### Owner-only access (most tables):
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own records" ON table_name
  FOR ALL USING (user_id = auth.uid());
```

### Public read, owner write:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read" ON table_name
  FOR SELECT USING (true);
CREATE POLICY "Users can manage own records" ON table_name
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own records" ON table_name
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own records" ON table_name
  FOR DELETE USING (user_id = auth.uid());
```

### Public read and write (rare, use sparingly):
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON table_name
  FOR ALL USING (true) WITH CHECK (true);
```

### Users table (special, ID references auth.users):
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (id = auth.uid());
```

Use `auth.uid()` directly (no ::text cast). User IDs are UUIDs.

## User Creation Trigger

The schema includes a trigger that auto-creates a user row when someone signs up:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Design System

**Read `DESIGN.md` — it is the design authority for this product.** All colors, typography, component styling, border radius, layout decisions, and brand personality are specified there. Do NOT deviate from it.

Key technical notes:
- This project uses Tailwind CSS v4 with oklch() color format. Convert the hex values in DESIGN.md to oklch() when writing CSS variables.
- Place Google Font @import statements at the VERY TOP of globals.css, BEFORE all other CSS.
- The landing page at `app/page.tsx` is OUTSIDE the (app) route group — it has NO Navbar/Footer and includes its own nav and footer.
- The landing page client component is `components/LandingPageClient.tsx` with copy already filled in.
- Authenticated pages go in `app/(app)/` which automatically includes Navbar + Footer.
- Footer must include "Built with SaasOpportunities.com"

## Build Process

1. **Read DESIGN.md** — understand the brand personality, colors, typography, component style, and layout decisions BEFORE writing any code
2. **Design first:** Update `app/globals.css` with the exact colors and fonts from DESIGN.md (converted to oklch()). Import the 2 Google Fonts specified.
3. **Customize the landing page:** Update `components/LandingPageClient.tsx` following DESIGN.md's layout, radius, and component guidance. Customize `app/page.tsx` metadata.
4. **Customize auth pages:** Update login and signup pages to match the brand
5. **Build server actions** for all core features using the Supabase JS client with auth checks
6. **Build dashboard pages** inside `app/(app)/` — follow DESIGN.md for component choices (modals vs drawers, card treatment, nav style, data display patterns)
7. **Set up Stripe** (only if user wants payments): pricing page, checkout, webhooks
8. **Run `npm run build`** and fix ALL errors
9. **Repeat step 8** until the build passes cleanly

## After the Build Passes

Replace this project's CLAUDE.md with a user-facing guide:

- App name and description
- "Getting Started" steps (connect MCP, "set up my project")
- MCP server commands (Supabase required, Stripe/Vercel/Cloudflare optional)
- Features list
- Key file paths
- "Built with SaasOpportunities.com"

## Critical Rules

- Do NOT modify package.json. Dependencies are pre-installed.
- Do NOT run `npm install` during the build phase (dependencies were installed during setup). Do NOT install new packages.
- Do NOT modify postcss.config.mjs, tailwind.config.ts, tsconfig.json, or next.config.ts unless required.
- Do NOT modify middleware.ts.
- Do NOT create a .env file with placeholder values. The .env is already set up.
- NEVER write API keys to any file other than .env.
- Routing: authenticated pages in `app/(app)/`, landing page at `app/page.tsx` (outside the group)
- Replace ALL instances of "YourApp", "example.com", "saas-boilerplate" with JobCedar

## Supabase Query Patterns

**Foreign key joins:** Use simple table name syntax: `.select("*, related_table(column)")`. Do NOT use `!constraint_name` hints — they are fragile and cause silent failures when constraint names don't match.

**Error handling:** Every Supabase query MUST check the `error` return value. NEVER destructure only `{ data }` and fall back to an empty array. Always return `{ data, error }` from server actions. Pages MUST check the error field and display a user-visible message (toast, alert, or inline), not just an empty state.
