# JobCedar

Solid AI backbone for your trades business

## Get Started

### 1. Connect your MCPs in the Claude desktop app

Open the Claude desktop app and go to **Settings > Connectors**. Add these before opening your project:

- **Supabase** (required): Search for "Supabase" in the official connectors and add it. This lets Claude create your database, set up auth, and run SQL automatically.

Don't use the terminal `claude mcp add` command. It's broken on macOS Tahoe. Use the desktop app connectors instead.

### 2. Open in Claude Code and say "build this app"

```bash
cd jobcedar
claude
```

Then tell Claude: **"build this app"**

Claude will set up your database, ask about payments, and build everything.

### Optional: Payment processing

Add one of these in the Claude desktop app (**Settings > Connectors**) before opening your project:

- **Stripe**: Search for "Stripe" in the official connectors and add it.
- **Polar**: Add a custom connector. Name: `polar-sandbox`, URL: `https://mcp.polar.sh/mcp/polar-sandbox`

Built with [SaasOpportunities.com](https://saasopportunities.com)
