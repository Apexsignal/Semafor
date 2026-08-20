import type { Priority } from "./types";

// The 9 sub-scores the agent (or a human editing an idea) fills in. Each is
// meant to be scored roughly 0-11 by the model so the sum lands in 0-100,
// but we don't trust that — we clamp the final sum ourselves.
export interface SubScores {
  score_problem: number | null | undefined;
  score_market_size: number | null | undefined;
  score_monetization: number | null | undefined;
  score_competition: number | null | undefined;
  score_mvp_simplicity: number | null | undefined;
  score_speed: number | null | undefined;
  score_trend: number | null | undefined;
  score_scalability: number | null | undefined;
  score_europe_potential: number | null | undefined;
}

export const SUB_SCORE_FIELDS = [
  "score_problem",
  "score_market_size",
  "score_monetization",
  "score_competition",
  "score_mvp_simplicity",
  "score_speed",
  "score_trend",
  "score_scalability",
  "score_europe_potential",
] as const;

export const STRONG_IDEA_THRESHOLD = 70;

/** Sum the 9 sub-scores into the 0-100 MOZEK SCORE. */
export function computeMozekScore(scores: SubScores): number {
  const sum = SUB_SCORE_FIELDS.reduce((total, field) => {
    const value = scores[field];
    return total + (typeof value === "number" && Number.isFinite(value) ? value : 0);
  }, 0);
  return Math.max(0, Math.min(100, Math.round(sum)));
}

/** Map a 0-100 MOZEK SCORE to its priority bucket. */
export function computePriority(mozekScore: number): Priority {
  if (mozekScore >= 85) return "IMMEDIATE";
  if (mozekScore >= 70) return "HIGH_POTENTIAL";
  if (mozekScore >= 50) return "WATCH";
  if (mozekScore >= 30) return "EXPERIMENT";
  return "LOW_POTENTIAL";
}

/** Whether an idea is strong enough to trigger a Telegram notification. */
export function computeFlagStrong(mozekScore: number): boolean {
  return mozekScore >= STRONG_IDEA_THRESHOLD;
}

export function scoreIdea(scores: SubScores): {
  mozek_score: number;
  priority: Priority;
  flag_strong: boolean;
} {
  const mozek_score = computeMozekScore(scores);
  return {
    mozek_score,
    priority: computePriority(mozek_score),
    flag_strong: computeFlagStrong(mozek_score),
  };
}
