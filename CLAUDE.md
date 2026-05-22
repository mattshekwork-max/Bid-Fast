# JobCedar

Solid AI backbone for your trades business

## Step 1: Check Supabase MCP

Before doing anything, check if the Supabase MCP is connected. Look for supabase MCP tools in your available tools.

If the Supabase MCP is NOT connected, tell the user:

"You need to connect the Supabase MCP first. Open the Claude desktop app, go to Settings > Connectors, search for 'Supabase' in the official connectors, and add it. Then restart Claude Code."

Important: Do NOT tell users to run `claude mcp add` in the terminal. That command is broken on macOS Tahoe. All MCP connectors should be added through the Claude desktop app under Settings > Connectors.

**STOP HERE if Supabase MCP is not connected. Do not proceed.**

## Step 2: Ask about payments, email, and deployment

Ask the user these three questions (you can ask all at once):

1. **"Do you want Stripe payments in this app? (yes/no)"**
2. **"Do you want Resend email in this app? (yes/no)"**
3. **"Do you want to deploy to Vercel when we're done building? (yes/no)"**

**WAIT for their answers before continuing.**

### Stripe (payments)

If yes:
- Check if the Stripe MCP is connected (look for stripe MCP tools)
- If not connected, tell the user: "Connect the Stripe MCP first. Open the Claude desktop app, go to Settings > Connectors, search for 'Stripe' in the official connectors, and add it. Then restart Claude Code."
- **STOP and wait for them to reconnect if Stripe MCP is missing.**

If no:
- Leave existing Stripe boilerplate files in place. They're guarded by `isStripeConfigured()` and won't run without keys.
- Do NOT delete Stripe files or remove Stripe env vars. The user can add Stripe later.
- Skip building any NEW payment features (no pricing page, no checkout flow).

### Resend (email)

If yes:
- Tell the user: "Go to https://resend.com, create an account (or log in), then go to API Keys and create a new key. Open your .env file and paste it as the value for RESEND_API_KEY. Don't paste it in the chat."
- Verify `RESEND_API_KEY` is set in `.env` (read the file to check it's not empty). NEVER ask the user to share the key with you directly.
- `RESEND_FROM_EMAIL` defaults to `onboarding@resend.dev` which works for testing. Write that to `.env` for now.
- Tell the user: "You're good to go for local development. The `onboarding@resend.dev` sender works for testing. Later in Step 6, if you set up a custom domain, we'll wire up Resend properly so auth emails (verification, password reset) come from your domain."

If no:
- Leave existing email files in place. They're guarded by `isResendConfigured` and won't run without the API key (emails log to console instead).
- Do NOT delete email files or remove Resend env vars. The user can add Resend later.
- Skip building any NEW email features beyond what the boilerplate already has.

### Vercel (deployment)

If yes:
- Check if the Vercel MCP is connected (look for vercel MCP tools like `deploy_to_vercel`, `list_projects`)
- If not connected, tell the user: "Connect the Vercel MCP first. Open the Claude desktop app, go to Settings > Connectors, search for 'Vercel' in the official connectors, and add it. Then restart Claude Code."
- After reconnecting, the user will need to authenticate via the browser popup on first use.
- **STOP and wait for them to reconnect if Vercel MCP is missing.**
- Remember their answer. Deployment happens after the build is complete (Step 6).

If no:
- Skip deployment. The user can deploy manually later.

## Step 3: Set up the Supabase project

Use the Supabase MCP tools in this order:
1. `list_organizations` to get the org ID
2. `create_project` with region `us-east-1`
3. `get_project_url` to get the URL
4. `get_publishable_keys` to get the anon key. **If this returns a permissions error, wait 5 seconds and retry.** New projects need a moment to initialize.
5. Write `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env`

If the user wants Stripe, they'll also need the service role key:
- Tell the user: "Go to Supabase Dashboard > Project Settings > API Keys > Legacy anon, service_role API keys (NOT the 'Data API' page) > copy the service_role key and paste it into your .env file as the value for SUPABASE_SERVICE_ROLE_KEY. Don't paste it in the chat."
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env` (read the file to check it's not empty). NEVER ask the user to share the key with you directly.

## Step 4: Install dependencies and set up the database

1. Run `npm install --include=dev` to install all dependencies
2. Read `supabase-schema.sql` and run it via the Supabase MCP `execute_sql` tool. This creates all tables, RLS policies, and the user creation trigger.
3. **Email confirmation setup** depends on whether the user enabled Resend in Step 2:

   **If the user said YES to Resend:**
   - Wire up Supabase to send auth emails through Resend right now. Tell the user:
     "Let's connect Supabase to Resend so verification emails actually send. Go to Supabase Dashboard > Project Settings > Authentication > SMTP Settings > toggle ON 'Enable Custom SMTP' and enter these:"
     - **Sender email:** the `RESEND_FROM_EMAIL` value from .env (e.g. `onboarding@resend.dev` or their custom domain email)
     - **Sender name:** the app name
     - **Host:** `smtp.resend.com`
     - **Port:** `465`
     - **Username:** `resend`
     - **Password:** their `RESEND_API_KEY` value (the same key from .env)
   - **Leave email confirmation ON** (the default). Resend will handle sending verification emails.
   - Tell the user: "Verification emails will now send through Resend. If you set up a custom domain later in Step 6, we'll update the sender address to use your domain."

   **If the user said NO to Resend:**
   - Disable email confirmation so users can sign up instantly. Run this via `execute_sql`:
     ```sql
     UPDATE auth.config SET mailer_autoconfirm = true;
     ```
     If that fails (permissions vary), tell the user: "Go to Supabase Dashboard > Authentication > Providers > Email > toggle OFF 'Confirm email' > Save."
   - Tell the user: "Email verification is off. When you're ready for production, add Resend and a custom domain to get real verification and password reset emails working."

## Step 5: Build the app

Read `DESIGN.md` first — it is the **design authority** for this product. Every visual decision must follow that spec.

Then read `.build/instructions.md` for the feature plan and build process.

## Step 6: Deploy to Vercel

**Skip this step if the user said no to Vercel deployment in Step 2.**

1. Run `npm run build` first. Fix any build errors before deploying. Do NOT deploy a broken build.

2. **Push to GitHub first.** Vercel deploys from git, so the code needs to be in a repo:
   - Run `git init` (if not already a git repo)
   - Make sure `.gitignore` includes `.env`, `node_modules`, `.next`, `.DS_Store`
   - Double-check that no secrets (API keys, `.env`) are being committed
   - Run: `git add . && git commit -m "Initial commit"`
   - Tell the user: "Create a new repository on GitHub (https://github.com/new), then paste the repo URL here so I can push your code."
   - Run: `git remote add origin [their-repo-url] && git branch -M main && git push -u origin main`

3. Use the Vercel MCP `deploy_to_vercel` tool to deploy the project. This creates a new Vercel project automatically on first deploy.
4. After deployment, share the live URL with the user.
5. Set environment variables in the Vercel dashboard (or tell the user to). The same `.env` values need to be added to Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to the Vercel deployment URL)
   - If Stripe is enabled: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - If Resend is enabled: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
6. **Update Supabase Auth redirect URLs** for production. Go to Supabase Dashboard > Authentication > URL Configuration and add:
   - Site URL: the Vercel deployment URL
   - Redirect URLs: `https://your-vercel-url.vercel.app/**`
7. Ask the user: **"Want to set up a custom domain? You can buy one through Cloudflare (they sell at cost), or connect a domain you already own."**

   **Option A: Buy a new domain**
   - Tell the user: "Go to https://www.cloudflare.com/products/registrar/ to buy a domain. Cloudflare sells domains at cost (no markup), so you'll get the best price. Search for the domains from your MVP kit's `potentialDomains` list, or try other names you like."
   - Once they've bought it, tell them: "Now let's connect it to your project. Go to your Vercel dashboard (https://vercel.com), open your project, go to Settings > Domains, click 'Add', and type your new domain."
   - Then: "Vercel will show you DNS records to add. Go to your Cloudflare dashboard, open your domain, go to DNS > Records, and add those records. It's usually one A record and one CNAME. Propagation can take a few minutes."
   - Remind them to update `NEXT_PUBLIC_APP_URL` in their Vercel environment variables to the new domain.
   - Remind them to add the new domain to Supabase Auth redirect URLs: Supabase Dashboard > Authentication > URL Configuration > add `https://yourdomain.com/**` to Redirect URLs and update the Site URL.

   **Option B: Use a domain they already own**
   - Tell the user: "Go to your Vercel dashboard (https://vercel.com), open your project, go to Settings > Domains, click 'Add', and type your domain."
   - Then: "Vercel will show you DNS records to add. Go to wherever you manage your domain (Namecheap, Cloudflare, GoDaddy, etc.) and add those DNS records. It's usually one A record and one CNAME. Propagation can take a few minutes."
   - Remind them to update `NEXT_PUBLIC_APP_URL` in their Vercel environment variables to the new domain.
   - Remind them to add the new domain to Supabase Auth redirect URLs: Supabase Dashboard > Authentication > URL Configuration > add `https://yourdomain.com/**` to Redirect URLs and update the Site URL.

   **Option C: Skip for now**
   - That's fine. The `.vercel.app` URL works. They can add a custom domain anytime from the Vercel dashboard.

8. **Upgrade Resend to custom domain (if the user has both Resend AND a custom domain)**

   Skip this if the user said no to Resend, or if they skipped the custom domain.

   Resend SMTP is already working from Step 4 (using `onboarding@resend.dev` or whatever sender was configured). This step upgrades it so emails come from the user's own domain.

   **Part A: Add the domain to Resend**

   Check if the Resend MCP is connected (look for resend MCP tools like `create-domain`, `verify-domain`).
   If not connected, tell the user: "Connect the Resend MCP first. Open the Claude desktop app, go to Settings > Connectors, and add a custom connector with the URL: https://mcp.resend.com/sse. Then restart Claude Code."
   **STOP and wait if the Resend MCP is missing.**

   Once connected, use the Resend MCP `create-domain` tool with their custom domain name. This returns the DNS records needed (SPF, DKIM, and optionally MX).

   **Part B: Add DNS records**

   Show the user ALL the DNS records from the Resend response in a clear table format. Then:

   - Tell the user: "Go to wherever you manage your domain's DNS (Cloudflare, Namecheap, GoDaddy, etc.) and add each of the records above. They're usually TXT records for SPF and DKIM."

   **Part C: Verify the domain**

   Tell the user: "DNS records can take a few minutes to propagate. Let me know when you've added them and I'll check."

   When they're ready, use the Resend MCP `verify-domain` tool. If verification fails, tell the user which records are still missing and ask them to double-check. Retry when they say they've fixed it.

   **Part D: Update the sender address**

   Once the domain is verified in Resend, tell the user:

   "Your domain is verified. Now update the sender email so auth emails come from your domain. Go to Supabase Dashboard > Project Settings > Authentication > SMTP Settings and change the Sender email to `noreply@theircustomdomain.com`."

   Also update `RESEND_FROM_EMAIL` in both `.env` and Vercel environment variables to `noreply@theircustomdomain.com`.

   Tell the user: "That's it. All emails (verification, password reset, magic links) now come from your domain."

## Rules

- NEVER ask the user to paste API keys, tokens, or secrets in the chat. Always tell them to add secrets directly to their `.env` file. You can verify they did it by reading `.env` yourself.
- NEVER write real API keys to any file other than `.env` (which is gitignored)
- The boilerplate already has login, signup, and auth callback pages. Customize them for the brand, don't rebuild them.
- Use `import { createClient } from "@/lib/supabase/server"` for server-side auth
- Use `import { createClient } from "@/lib/supabase/client"` for client-side auth
- Do NOT install other auth libraries (Auth0, Clerk, NextAuth, etc.)
- The middleware refreshes the Supabase auth session. Do NOT modify middleware.ts.
- Footer must include "Built with SaasOpportunities.com"
