import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Browser client (singleton)
let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        detectSessionInUrl: true,
        flowType: "implicit",
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return browserClient;
}

// Server client (no cache)
export function getSupabaseServerClient() {
  if (!supabaseUrl) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL.");
  }
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey ?? "",
    { auth: { persistSession: false } }
  );
}

export { supabaseUrl, supabaseAnonKey };
