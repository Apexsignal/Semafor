import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import type { Idea } from "./types";

// @supabase/supabase-js always constructs a RealtimeClient, which throws
// ("Node.js detected but native WebSocket not found") on any Node runtime
// without a native global WebSocket (Node <22, and — found the hard way —
// Netlify's Next.js API route function runtime too, independent of the
// Node version configured for the build itself). We never use realtime
// subscriptions, but the client still needs a constructor to hand it;
// the `ws` package works on every runtime, sidestepping the whole check.
const REALTIME_TRANSPORT = { realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket } };

export type Database = {
  public: {
    Tables: {
      ideas: { Row: Idea; Insert: Partial<Idea>; Update: Partial<Idea> };
    };
  };
};

let browserClient: SupabaseClient | null = null;

/**
 * Client for use in Server Components / API routes that only ever READ
 * public data. Uses the anon key, safe to also expose to the browser.
 */
export function getSupabaseAnonClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY env vars."
    );
  }
  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: { persistSession: false },
      ...REALTIME_TRANSPORT,
    });
  }
  return browserClient;
}

/**
 * Client for server-only code that needs to WRITE (agent run, feedback API
 * routes). Uses the service-role key and must never be imported into
 * client components.
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseServiceClient() must only be called on the server.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars."
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...REALTIME_TRANSPORT,
  });
}
