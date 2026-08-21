import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js Middleware always runs on the Edge Runtime (no Node.js APIs) —
// unlike lib/supabase.ts's server-only clients, this must NOT import the
// `ws` package (it requires Node's `net`/`tls`/`http`, which fail to bundle
// for the edge). The edge runtime has a native WebSocket global already, so
// the Supabase client's (unused here) realtime client construction is fine
// without a polyfill.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Required by Supabase: touching the session here refreshes an expiring
  // token and writes it back via setAll above, before any page renders.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)"],
};
