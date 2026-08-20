import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

// Bulk operations for the /moje management view: multi-select archive,
// restore from trash, or permanently delete.
interface BulkBody {
  ids: string[];
  action: "archive" | "restore" | "delete_forever";
}

function validateBody(body: unknown): { data?: BulkBody; error?: string } {
  if (typeof body !== "object" || body === null) return { error: "Body must be a JSON object." };
  const input = body as Record<string, unknown>;

  if (!Array.isArray(input.ids) || input.ids.length === 0 || !input.ids.every((id) => typeof id === "string")) {
    return { error: "ids must be a non-empty array of strings." };
  }
  if (input.action !== "archive" && input.action !== "restore" && input.action !== "delete_forever") {
    return { error: "action must be one of: archive, restore, delete_forever." };
  }
  return { data: { ids: input.ids as string[], action: input.action } };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { data, error: validationError } = validateBody(body);
  if (validationError || !data) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  if (data.action === "delete_forever") {
    const { error } = await supabase.from("ideas").delete().in("id", data.ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, deleted: data.ids.length });
  }

  const { error, data: updated } = await supabase
    .from("ideas")
    .update({ is_archived: data.action === "archive" })
    .in("id", data.ids)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, updated: updated?.length ?? 0 });
}
