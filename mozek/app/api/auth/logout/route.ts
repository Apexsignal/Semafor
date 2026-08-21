import { NextResponse } from "next/server";
import { getSupabaseAuthClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const supabase = getSupabaseAuthClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url));
}
