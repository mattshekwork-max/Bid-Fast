import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service role client — bypasses RLS. Use in API routes and webhooks only.
 */
export function getServiceRoleClient(): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Validate that a workspace exists. Returns true if valid, false otherwise.
 */
export async function validateWorkspace(
  supabase: SupabaseClient<Database>,
  workspaceId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .single();

  return !error && !!data;
}