import { getSupabaseAnonClient } from "./supabase";
import { extractMaxNumber } from "./parseEstimates";
import type { Idea, Priority } from "./types";
import { PRIORITY_VALUES } from "./types";

export interface CategoryCount {
  label: string;
  count: number;
}

export interface PriorityCount {
  priority: Priority;
  count: number;
}

export interface DashboardStats {
  total: number;
  todayCount: number;
  avgScore: number | null;
  cheapest: Idea | null;
  simplest: Idea | null;
  immediateCount: number;
  categoryBreakdown: CategoryCount[];
  priorityBreakdown: PriorityCount[];
}

const STATS_FETCH_LIMIT = 2000;
// Beyond this many distinct categories, the tail folds into "Ostatní" —
// a bar chart with dozens of rows stops being a chart (see dataviz skill:
// "more than ~7 classes that all carry meaning -> a table, not more colors").
const CATEGORY_CHART_TOP_N = 6;

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabaseAnonClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("ideas")
    .select("id, mozek_score, date_generated, mvp_cost_czk, difficulty_score, priority, category, title, one_liner")
    .eq("is_archived", false)
    .limit(STATS_FETCH_LIMIT);

  if (error || !data) {
    return {
      total: 0,
      todayCount: 0,
      avgScore: null,
      cheapest: null,
      simplest: null,
      immediateCount: 0,
      categoryBreakdown: [],
      priorityBreakdown: PRIORITY_VALUES.map((priority) => ({ priority, count: 0 })),
    };
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

  // Agent-generated categories are free-text "Segment / Sub / Tag" strings
  // that are near-unique per idea — grouping by the top-level segment only
  // is what actually makes this a chart instead of a list of 1s.
  const categoryMap = new Map<string, number>();
  for (const r of rows) {
    const key = r.category?.split("/")[0]?.trim() || "Nezařazeno";
    categoryMap.set(key, (categoryMap.get(key) ?? 0) + 1);
  }
  const sortedCategories = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]);
  const topCategories = sortedCategories.slice(0, CATEGORY_CHART_TOP_N).map(([label, count]) => ({ label, count }));
  const restCount = sortedCategories.slice(CATEGORY_CHART_TOP_N).reduce((sum, [, count]) => sum + count, 0);
  const categoryBreakdown = restCount > 0 ? [...topCategories, { label: "Ostatní", count: restCount }] : topCategories;

  const priorityMap = new Map<Priority, number>();
  for (const r of rows) {
    if (r.priority) priorityMap.set(r.priority, (priorityMap.get(r.priority) ?? 0) + 1);
  }
  const priorityBreakdown = PRIORITY_VALUES.map((priority) => ({ priority, count: priorityMap.get(priority) ?? 0 }));

  return {
    total,
    todayCount,
    avgScore,
    cheapest,
    simplest,
    immediateCount,
    categoryBreakdown,
    priorityBreakdown,
  };
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
