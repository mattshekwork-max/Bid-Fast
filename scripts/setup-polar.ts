/**
 * Polar.sh Automated Setup Script
 *
 * This script is run by Claude during MVP builds to automate Polar setup.
 * Prerequisites: POLAR_ACCESS_TOKEN must be set in .env
 *
 * Usage: npx tsx scripts/setup-polar.ts
 *
 * What it does:
 * 1. Lists existing orgs or creates a new one
 * 2. Creates the product with pricing from args
 * 3. Registers the webhook endpoint
 * 4. Outputs the env vars to add to .env
 */

import { Polar } from "@polar-sh/sdk";

const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN;
const POLAR_ENVIRONMENT =
  (process.env.POLAR_ENVIRONMENT as "sandbox" | "production") || "sandbox";

if (!POLAR_ACCESS_TOKEN) {
  console.error(
    "ERROR: POLAR_ACCESS_TOKEN is not set. Create one at https://polar.sh (Settings → Developers → Access Tokens)"
  );
  process.exit(1);
}

const polar = new Polar({
  accessToken: POLAR_ACCESS_TOKEN,
  server: POLAR_ENVIRONMENT,
});

// Parse CLI args
const args = process.argv.slice(2);
const productName = args[0] || "Pro Plan";
const priceInCents = parseInt(args[1] || "999", 10);
const interval = (args[2] || "month") as "month" | "year" | "week" | "day";
const webhookUrl = args[3]; // e.g., https://your-app.vercel.app/api/polar/webhook

async function main() {
  console.log(`\n🔧 Polar Setup (${POLAR_ENVIRONMENT})\n`);

  // Step 1: List orgs
  console.log("Step 1: Checking organizations...");
  const orgsResponse = await polar.organizations.list({});
  const orgItems: Array<{ id: string; name: string; slug: string }> = [];
  for await (const page of orgsResponse) {
    for (const org of page.result.items) {
      orgItems.push(org);
    }
  }

  let orgId: string;
  if (orgItems.length === 0) {
    console.log("  No organizations found. Please create one at polar.sh first.");
    process.exit(1);
  } else if (orgItems.length === 1) {
    orgId = orgItems[0].id;
    console.log(`  Using org: ${orgItems[0].name} (${orgItems[0].slug})`);
  } else {
    console.log("  Multiple orgs found:");
    orgItems.forEach((org, i) => {
      console.log(`    ${i + 1}. ${org.name} (${org.slug}) - ${org.id}`);
    });
    // Default to first org
    orgId = orgItems[0].id;
    console.log(`  Using first org: ${orgItems[0].name}`);
  }

  // Step 2: Create product
  console.log(`\nStep 2: Creating product "${productName}" at $${(priceInCents / 100).toFixed(2)}/${interval}...`);
  const product = await polar.products.create({
    name: productName,
    organizationId: orgId,
    prices: [
      {
        type: "fixed",
        priceAmount: priceInCents,
        priceCurrency: "usd",
        recurringInterval: interval,
      },
    ],
  });
  console.log(`  Product created: ${product.id}`);

  // Step 3: Register webhook (if URL provided)
  let webhookSecret = "";
  if (webhookUrl) {
    console.log(`\nStep 3: Registering webhook at ${webhookUrl}...`);
    const webhook = await polar.webhookEndpoints.create({
      url: webhookUrl,
      events: [
        "subscription.created",
        "subscription.active",
        "subscription.updated",
        "subscription.canceled",
        "subscription.revoked",
        "order.created",
      ],
      organizationId: orgId,
    });
    webhookSecret = (webhook as any).secret || "CHECK_POLAR_DASHBOARD";
    console.log(`  Webhook registered: ${(webhook as any).id}`);
  } else {
    console.log(
      "\nStep 3: Skipping webhook registration (no URL provided)."
    );
    console.log(
      "  Run again with webhook URL after deploying, or register manually in Polar dashboard."
    );
  }

  // Output
  console.log("\n✅ Setup complete! Add these to your .env:\n");
  console.log("# Polar Configuration");
  console.log("NEXT_PUBLIC_PAYMENT_PROVIDER=polar");
  console.log(`POLAR_ACCESS_TOKEN=${POLAR_ACCESS_TOKEN}`);
  console.log(`POLAR_ORGANIZATION_ID=${orgId}`);
  console.log(`POLAR_PRODUCT_ID=${product.id}`);
  console.log(`POLAR_ENVIRONMENT=${POLAR_ENVIRONMENT}`);
  if (webhookSecret) {
    console.log(`POLAR_WEBHOOK_SECRET=${webhookSecret}`);
  } else {
    console.log("POLAR_WEBHOOK_SECRET=  # Set after registering webhook");
  }
  console.log("");
}

main().catch((err) => {
  console.error("Setup failed:", err.message || err);
  process.exit(1);
});
