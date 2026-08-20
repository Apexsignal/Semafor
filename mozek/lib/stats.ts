import { getSupabaseAnonClient } from "./supabase";
import { extractMaxNumber } from "./parseEstimates";
import type { Idea } from "./types";

export interface DashboardStats {
  total: number;
  todayCount: number;
  avgScore: number | null;
  cheapest: Idea | null;
  simplest: Idea | null;
  immediateCount: number;
}

const STATS_FETCH_LIMIT = 2000;

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabaseAnonClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("ideas")
    .select("id, mozek_score, date_generated, mvp_cost_czk, difficulty_score, priority, title, one_liner")
    .eq("is_archived", false)
    .limit(STATS_FETCH_LIMIT);

  if (error || !data) {
    return { total: 0, todayCount: 0, avgScore: null, cheapest: null, simplest: null, immediateCount: 0 };
  }

  const rows = data as unknown as Idea[];
  const total = rows.length;
  const todayCount = rows.filter((r) => r.date_generated === today).length;
  const scored = rows.filter((r) => typeof r.mozek_score === "number");
  const avgScore =
    scored.length > 0
      ? Math.round(scored.reduce((sum, r) => sum + (r.mozek_score ?? 0), 0) / scored.length)
      : null;
  const immediateCount = rows.filter((r) => r.priority === "IMMEDIATE").length;

  const withCost = rows
    .map((r) => ({ row: r, cost: extractMaxNumber(r.mvp_cost_czk) }))
    .filter((x): x is { row: Idea; cost: number } => x.cost != null);
  const cheapest = withCost.length > 0 ? withCost.reduce((a, b) => (b.cost < a.cost ? b : a)).row : null;

  const withDifficulty = rows.filter((r) => typeof r.difficulty_score === "number");
  const simplest =
    withDifficulty.length > 0
      ? withDifficulty.reduce((a, b) => ((b.difficulty_score ?? 99) < (a.difficulty_score ?? 99) ? b : a))
      : null;

  return { total, todayCount, avgScore, cheapest, simplest, immediateCount };
}

/** TOP 5 of the most recent generation day (the "MOZEK DAILY" box). */
export async function getTopOfLatestDay(): Promise<{ date: string | null; ideas: Idea[] }> {
  const supabase = getSupabaseAnonClient();

  const { data: latest, error: latestError } = await supabase
    .from("ideas")
    .select("date_generated")
    .eq("is_archived", false)
    .order("date_generated", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError || !latest?.date_generated) {
    return { date: null, ideas: [] };
  }

  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .eq("is_archived", false)
    .eq("date_generated", latest.date_generated)
    .order("mozek_score", { ascending: false })
    .limit(5);

  if (error || !data) return { date: latest.date_generated, ideas: [] };
  return { date: latest.date_generated, ideas: data as Idea[] };
}
