import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

// Deliberately simple — good enough to reject obvious junk, not a full RFC
// 5322 validator. The real check that matters is Supabase's `unique` column.
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

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("waitlist_signups").insert({ email });

  // Unique-constraint violation just means they already signed up — treat
  // that as success rather than surfacing a confusing error to the visitor.
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: "Něco se pokazilo, zkus to prosím znovu." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
