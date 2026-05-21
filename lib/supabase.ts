import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin client that bypasses RLS. Only for Stripe webhooks (no user session).
 * Requires SUPABASE_SERVICE_ROLE_KEY (optional, only needed for Stripe).
 * Find it in Supabase Dashboard: Project Settings > API Keys >
 * Legacy anon, service_role API keys (NOT the "Data API" page).
 */
let _adminClient: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is required for Stripe webhooks. " +
        "Find it in Supabase Dashboard: Project Settings > API Keys > " +
        "Legacy anon, service_role API keys (NOT the 'Data API' page)."
      );
    }
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      key
    );
  }
  return _adminClient;
}
