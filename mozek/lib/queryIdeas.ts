import { getSupabaseAnonClient } from "./supabase";
import { parseNaturalQuery } from "./naturalQuery";
import { extractMaxDays, extractMaxNumber } from "./parseEstimates";
import type { Idea, Priority } from "./types";

export type SortField = "mozek_score" | "created_at" | "difficulty_score" | "mvp_cost_czk";
export type SortDir = "asc" | "desc";

export interface IdeaFilters {
  q?: string; // free text, may include natural-language cost/time hints
  scoreMin?: number;
  scoreMax?: number;
  difficultyMin?: number;
  difficultyMax?: number;
  costMaxCzk?: number;
  daysMax?: number;
  region?: string; // source_region
  category?: string;
  isB2b?: boolean;
  priority?: Priority;
  dateFrom?: string;
  dateTo?: string;
  userCategory?: string;
  favoritesOnly?: boolean;
  includeArchived?: boolean; // default false everywhere except the trash view
  onlyArchived?: boolean;
  sortField?: SortField;
  sortDir?: SortDir;
  limit?: number;
}

const DB_FETCH_LIMIT = 500;

/**
 * Shared query used by the dashboard, /filtr and /moje. DB-level filters
 * (score, category, region, dates, priority, favorites, archive state) are
 * pushed to Postgres; the two free-text estimate fields (mvp_cost_czk,
 * time_to_mvp) and natural-language query parsing happen in JS afterwards
 * since they're stored as free-form text, not numeric columns.
 */
export async function queryIdeas(filters: IdeaFilters): Promise<Idea[]> {
  const supabase = getSupabaseAnonClient();

  const natural = filters.q ? parseNaturalQuery(filters.q) : null;
  const costMaxCzk = filters.costMaxCzk ?? natural?.costMaxCzk;
  const daysMax = filters.daysMax ?? natural?.daysMax;
  const keywords = (natural?.remainingKeywords ?? filters.q ?? "").trim();

  let query = supabase.from("ideas").select("*");

  if (filters.onlyArchived) {
    query = query.eq("is_archived", true);
  } else if (!filters.includeArchived) {
    query = query.eq("is_archived", false);
  }

  if (filters.scoreMin != null) query = query.gte("mozek_score", filters.scoreMin);
  if (filters.scoreMax != null) query = query.lte("mozek_score", filters.scoreMax);
  if (filters.difficultyMin != null) query = query.gte("difficulty_score", filters.difficultyMin);
  if (filters.difficultyMax != null) query = query.lte("difficulty_score", filters.difficultyMax);
  if (filters.region) query = query.eq("source_region", filters.region);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.isB2b != null) query = query.eq("is_b2b", filters.isB2b);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.dateFrom) query = query.gte("date_generated", filters.dateFrom);
  if (filters.dateTo) query = query.lte("date_generated", filters.dateTo);
  if (filters.userCategory) query = query.eq("user_category", filters.userCategory);
  if (filters.favoritesOnly) query = query.eq("is_favorite", true);

  if (keywords) {
    const escaped = keywords.replace(/[%,]/g, "");
    query = query.or(
      [
        `title.ilike.%${escaped}%`,
        `one_liner.ilike.%${escaped}%`,
        `problem.ilike.%${escaped}%`,
        `solution.ilike.%${escaped}%`,
        `category.ilike.%${escaped}%`,
      ].join(",")
    );
  }

  const sortField = filters.sortField ?? "mozek_score";
  if (sortField !== "mvp_cost_czk") {
    query = query.order(sortField, { ascending: filters.sortDir === "asc", nullsFirst: false });
  }

  query = query.limit(DB_FETCH_LIMIT);

  const { data, error } = await query;
  if (error) {
    console.error("[queryIdeas] Supabase query failed:", error.message);
    return [];
  }

  let rows = (data ?? []) as Idea[];

  if (costMaxCzk != null) {
    rows = rows.filter((idea) => {
      const value = extractMaxNumber(idea.mvp_cost_czk);
      return value == null ? true : value <= costMaxCzk;
    });
  }
  if (daysMax != null) {
    rows = rows.filter((idea) => {
      const value = extractMaxDays(idea.time_to_mvp);
      return value == null ? true : value <= daysMax;
    });
  }
  if (sortField === "mvp_cost_czk") {
    const dir = filters.sortDir === "asc" ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      const av = extractMaxNumber(a.mvp_cost_czk) ?? Number.POSITIVE_INFINITY;
      const bv = extractMaxNumber(b.mvp_cost_czk) ?? Number.POSITIVE_INFINITY;
      return (av - bv) * dir;
    });
  }

  if (filters.limit) {
    rows = rows.slice(0, filters.limit);
  }

  return rows;
}

/** Distinct values for filter dropdowns, computed from the live (non-archived) dataset. */
export async function getFilterOptions(): Promise<{
  categories: string[];
  regions: string[];
  userCategories: string[];
}> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase
    .from("ideas")
    .select("category, source_region, user_category")
    .eq("is_archived", false)
    .limit(DB_FETCH_LIMIT);

  if (error || !data) return { categories: [], regions: [], userCategories: [] };

  const categories = new Set<string>();
  const regions = new Set<string>();
  const userCategories = new Set<string>();
  for (const row of data as Array<{ category: string | null; source_region: string | null; user_category: string | null }>) {
    if (row.category) categories.add(row.category);
    if (row.source_region) regions.add(row.source_region);
    if (row.user_category) userCategories.add(row.user_category);
  }

  return {
    categories: [...categories].sort(),
    regions: [...regions].sort(),
    userCategories: [...userCategories].sort(),
  };
}
