import type { Priority } from "./types";

export const PRIORITY_LABELS: Record<Priority, string> = {
  IMMEDIATE: "IMMEDIATE",
  HIGH_POTENTIAL: "HIGH POTENTIAL",
  WATCH: "WATCH",
  EXPERIMENT: "EXPERIMENT",
  LOW_POTENTIAL: "LOW POTENTIAL",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  IMMEDIATE: "bg-mozek-bad/15 text-mozek-bad border border-mozek-bad/30",
  HIGH_POTENTIAL: "bg-mozek-warn/15 text-mozek-warn border border-mozek-warn/30",
  WATCH: "bg-mozek-accent2/15 text-mozek-accent2 border border-mozek-accent2/30",
  EXPERIMENT: "bg-mozek-muted/15 text-mozek-muted border border-mozek-muted/30",
  LOW_POTENTIAL: "bg-mozek-border text-mozek-muted border border-mozek-border",
};

export const FEEDBACK_LABELS: Record<string, string> = {
  ZAJIMAVE: "❤️ Zajímavé",
  FAVORIT: "⭐ Favorit",
  CHCI_POSTAVIT: "🚀 Chci postavit",
  NEZAJIMA: "❌ Nezajímá",
  ZAMITNUTO: "🗑 Zamítnuto",
};

// High score = good news, so it reads as good news: green at the top,
// fading through the brand teal and blue down to neutral gray — never red/
// amber, which read as "warning" regardless of what the number means.
export function scoreColor(score: number | null | undefined): string {
  const s = score ?? 0;
  if (s >= 85) return "text-mozek-good";
  if (s >= 70) return "text-mozek-accent";
  if (s >= 50) return "text-mozek-accent2";
  return "text-mozek-muted";
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
      new Date(value)
    );
  } catch {
    return value;
  }
}
