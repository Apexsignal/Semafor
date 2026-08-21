import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

// supabase-js's internal fetch goes through Next.js's patched global
// fetch(), which Netlify's Next.js Runtime can still serve out of its
// persistent Data Cache even on a `dynamic = "force-dynamic"` route —
// found the hard way: the dashboard kept rendering a stale idea count
// straight into the initial HTML, with no CDN/edge caching involved
// (fresh `age: 0` on every request). Forcing `cache: "no-store"` on every
// Supabase REST call opts each fetch out of that cache individually.
const NO_STORE_FETCH = {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, { ...init, cache: "no-store" as RequestCache }),
};

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
      global: NO_STORE_FETCH,
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
    global: NO_STORE_FETCH,
  });
}

/**
 * Cookie-aware client for logged-in-user auth (magic link sign-in, session
 * lookup, sign-out). Server Components / Route Handlers only — reads and
 * writes the Supabase session cookies via `next/headers`. Per Supabase's
 * own guidance, create a fresh client per request rather than reusing one.
 *
 * Server Components can't set cookies (Next.js restriction — only Route
 * Handlers/Server Actions can), so `setAll` no-ops there; `middleware.ts`
 * is what actually persists a refreshed session in that case.
 */
export function getSupabaseAuthClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseAuthClient() must only be called on the server.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY env vars."
    );
  }
  const cookieStore = cookies();
  return createServerClient(url, anonKey, {
    ...REALTIME_TRANSPORT,
    global: NO_STORE_FETCH,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render — expected, ignore.
        }
      },
    },
  });
}
