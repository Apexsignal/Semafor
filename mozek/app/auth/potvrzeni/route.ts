import { NextResponse } from "next/server";
import { getSupabaseAuthClient } from "@/lib/supabase";

// Landing spot for the magic-link email (see emailRedirectTo in
// app/api/auth/magic-link/route.ts). Exchanges the one-time `code` for a
// real session and redirects home.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    const supabase = getSupabaseAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/prihlaseni?error=1", url));
    }
  }

  return NextResponse.redirect(new URL("/", url));
}
