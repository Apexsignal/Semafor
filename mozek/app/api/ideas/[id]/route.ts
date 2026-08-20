import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { USER_FEEDBACK_VALUES } from "@/lib/types";

// Fields a client is allowed to mutate through this endpoint. Everything
// else on `ideas` is agent-written and read-only from the UI.
interface PatchBody {
  user_feedback?: string | null;
  is_favorite?: boolean;
  is_archived?: boolean;
  user_category?: string | null;
}

function validatePatch(body: unknown): { data?: PatchBody; error?: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Body must be a JSON object." };
  }
  const input = body as Record<string, unknown>;
  const patch: PatchBody = {};

  if ("user_feedback" in input) {
    const value = input.user_feedback;
    if (value !== null && !USER_FEEDBACK_VALUES.includes(value as never)) {
      return { error: `Invalid user_feedback. Must be one of ${USER_FEEDBACK_VALUES.join(", ")} or null.` };
    }
    patch.user_feedback = value as string | null;
  }
  if ("is_favorite" in input) {
    if (typeof input.is_favorite !== "boolean") return { error: "is_favorite must be boolean." };
    patch.is_favorite = input.is_favorite;
  }
  if ("is_archived" in input) {
    if (typeof input.is_archived !== "boolean") return { error: "is_archived must be boolean." };
    patch.is_archived = input.is_archived;
  }
  if ("user_category" in input) {
    const value = input.user_category;
    if (value !== null && typeof value !== "string") {
      return { error: "user_category must be a string or null." };
    }
    patch.user_category = value as string | null;
  }

  if (Object.keys(patch).length === 0) {
    return { error: "No recognized fields in body." };
  }
  return { data: patch };
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { data: patch, error: validationError } = validatePatch(body);
  if (validationError || !patch) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("ideas")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ idea: data });
}
