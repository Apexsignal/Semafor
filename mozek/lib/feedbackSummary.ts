import type { SupabaseClient } from "@supabase/supabase-js";

const REJECTED_FEEDBACK = ["NEZAJIMA", "ZAMITNUTO"] as const;
const LOOKBACK_DAYS = 30;
const MIN_COUNT_TO_REPORT = 2;

interface RejectionCounts {
  category: Record<string, number>;
  sourceRegion: Record<string, number>;
  total: number;
}

/**
 * Plain SQL group-by (no extra LLM call) over the last 30 days of rejected
 * feedback, turned into a short human-readable summary the agent prompt can
 * use to steer away from categories/regions the user keeps rejecting.
 * See CLAUDE.md section 7 ("UČENÍ ZE ZPĚTNÉ VAZBY").
 */
export async function buildRejectedFeedbackSummary(
  supabase: SupabaseClient
): Promise<string | null> {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from("ideas")
    .select("category, source_region, user_feedback")
    .in("user_feedback", REJECTED_FEEDBACK as unknown as string[])
    .gte("date_generated", since);

  if (error || !data || data.length === 0) {
    return null;
  }

  const counts: RejectionCounts = { category: {}, sourceRegion: {}, total: data.length };
  for (const row of data as Array<{ category: string | null; source_region: string | null }>) {
    if (row.category) {
      counts.category[row.category] = (counts.category[row.category] ?? 0) + 1;
    }
    if (row.source_region) {
      counts.sourceRegion[row.source_region] = (counts.sourceRegion[row.source_region] ?? 0) + 1;
    }
  }

  const lines: string[] = [];
  const topCategories = Object.entries(counts.category)
    .filter(([, n]) => n >= MIN_COUNT_TO_REPORT)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const topRegions = Object.entries(counts.sourceRegion)
    .filter(([, n]) => n >= MIN_COUNT_TO_REPORT)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topCategories.length === 0 && topRegions.length === 0) {
    return null;
  }

  lines.push(
    `Za posledních ${LOOKBACK_DAYS} dní uživatel odmítl (NEZAJIMA/ZAMITNUTO) ${counts.total} nápadů.`
  );
  if (topCategories.length > 0) {
    lines.push(
      "Nejčastěji odmítané kategorie: " +
        topCategories.map(([cat, n]) => `${cat} (${n}x)`).join(", ") +
        ". Omez jejich podíl, pokud znovu nenabídneš jasně odlišný úhel."
    );
  }
  if (topRegions.length > 0) {
    lines.push(
      "Nejčastěji odmítané zdrojové regiony: " +
        topRegions.map(([region, n]) => `${region} (${n}x)`).join(", ") +
        "."
    );
  }

  return lines.join("\n");
}
