# Polar.sh Payment Setup Guide

This guide walks you through setting up Polar.sh payments for your project. Most steps can be done automatically by Claude — only the access token requires manual creation.

## Quick Start (with Claude)

If you have the **Polar MCP** configured, Claude can handle almost everything:

1. **You do manually (one time):** Create a Polar account at [polar.sh](https://polar.sh), generate an Organization Access Token, and paste it into your `.env` file
2. **Claude does automatically (via MCP or setup script):** Create organization, create products, register webhook endpoint, output remaining env vars

If you don't have the Polar MCP, Claude can still automate steps 2-4 using the Polar SDK directly via a setup script.

---

## Step-by-Step Setup

### Step 1: Create Polar Account (Manual — one time)

1. Go to [polar.sh](https://polar.sh) and sign up
2. You'll create your first organization during signup

### Step 2: Get Access Token (Manual — one time per org)

1. Go to your org's **Settings → Developers → Access Tokens**
2. Click **New Token**
3. Name it (e.g., "Claude Code")
4. Grant these scopes: `products:write`, `checkouts:write`, `customers:write`, `webhooks:write`, `organizations:read`
5. Copy the token — it starts with `polar_oat_`

> **Sandbox vs Production:** You need separate tokens for each environment. Start with sandbox at [sandbox.polar.sh](https://sandbox.polar.sh).

### Step 3: Create Organization (Automatable via API)

If you already have an org, skip this. Otherwise:

```typescript
// Claude can run this automatically
const org = await polar.organizations.create({
  name: "Your Product Name",
  slug: "your-product-name",
});
// Returns: { id: "org-uuid", name: "...", slug: "..." }
```

Or connect to an existing org:
```typescript
const orgs = await polar.organizations.list({});
// Pick the one you want and use its ID
```

### Step 4: Create Product (Automatable via API)

```typescript
const product = await polar.products.create({
  name: "Pro Plan",
  organizationId: "your-org-id", // omit if using org-scoped token
  prices: [
    {
      type: "fixed",
      priceAmount: 999, // $9.99 in cents
      priceCurrency: "usd",
      recurringInterval: "month",
    },
  ],
});
// Returns: { id: "product-uuid", ... }
// Use this ID as POLAR_PRODUCT_ID
```

### Step 5: Register Webhook (Automatable via API)

```typescript
const webhook = await polar.webhookEndpoints.create({
  url: "https://your-domain.com/api/polar/webhook",
  events: [
    "subscription.created",
    "subscription.active",
    "subscription.updated",
    "subscription.canceled",
    "subscription.revoked",
    "order.created",
  ],
});
// Returns: { id: "...", secret: "..." }
// Use the secret as POLAR_WEBHOOK_SECRET
```

### Step 6: Configure Environment Variables

Add to your `.env`:
```bash
NEXT_PUBLIC_PAYMENT_PROVIDER=polar
POLAR_ACCESS_TOKEN=polar_oat_your_token
POLAR_WEBHOOK_SECRET=your_webhook_secret
POLAR_PRODUCT_ID=your_product_id
POLAR_ORGANIZATION_ID=your_org_id
POLAR_ENVIRONMENT=sandbox  # or "production"
```

### Step 7: Add Polar columns to Supabase

Run this SQL in your Supabase project:
```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS polar_customer_id TEXT,
ADD COLUMN IF NOT EXISTS polar_subscription_id TEXT;
```

---

## What Claude Can Automate

| Step | With Polar MCP | With SDK Script | Manual Only |
|------|---------------|-----------------|-------------|
| Create account | | | X |
| Generate access token | | | X |
| Create organization | X | X | |
| List existing orgs | X | X | |
| Create products | X | X | |
| Register webhooks | X | X | |
| Set env vars | X | X | |
| Add DB columns | Via Supabase MCP | Via SQL | |

## Switching Between Sandbox and Production

Polar uses completely isolated environments:
- **Sandbox:** `POLAR_ENVIRONMENT=sandbox` — uses `sandbox-api.polar.sh`
- **Production:** `POLAR_ENVIRONMENT=production` — uses `api.polar.sh`

You need separate tokens, products, and webhook endpoints for each environment. Start with sandbox, then when ready:

1. Create a production access token at [polar.sh](https://polar.sh) (not sandbox.polar.sh)
2. Create production products (same API calls, different token)
3. Register production webhook endpoint
4. Update env vars to production values
5. Set `POLAR_ENVIRONMENT=production`

## Polar MCP Configuration

To give Claude direct access to Polar's API, add it as a custom connector in the Claude desktop app. Don't use the terminal `claude mcp add` command (it's broken on macOS Tahoe).

**Sandbox:**
1. Open the Claude desktop app
2. Go to **Settings > Connectors > Add Custom Connector**
3. Name: `polar-sandbox`
4. URL: `https://mcp.polar.sh/mcp/polar-sandbox`

**Production:**
1. Open the Claude desktop app
2. Go to **Settings > Connectors > Add Custom Connector**
3. Name: `polar`
4. URL: `https://mcp.polar.sh/mcp/polar-mcp`
