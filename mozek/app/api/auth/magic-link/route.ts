import { NextResponse } from "next/server";
import { getSupabaseAuthClient } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = typeof (body as { email?: unknown })?.email === "string"
    ? (body as { email: string }).email.trim().toLowerCase()
    : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Zadej platný e-mail." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const supabase = getSupabaseAuthClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/potvrzeni` },
  });

  if (error) {
    return NextResponse.json({ error: "Něco se pokazilo, zkus to prosím znovu." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
