import { getSupabaseAuthClient } from "./supabase";
import type { Idea } from "./types";

/**
 * Full idea detail (everything past "Přehled" + "Problém & řešení") is
 * visible to: the one `is_free_sample` idea (even anonymous visitors), or
 * a logged-in user with an active subscription row. RLS on `subscriptions`
 * already scopes the select to the caller's own row (auth.uid() = user_id),
 * so there's no separate user-id filter to add here.
 */
export async function hasFullAccess(idea: Idea): Promise<boolean> {
  if (idea.is_free_sample) return true;

  const supabase = getSupabaseAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("status", "active")
    .maybeSingle();

  return !!data;
}
