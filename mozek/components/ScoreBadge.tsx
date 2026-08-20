import type { Priority } from "@/lib/types";
import { PRIORITY_COLORS, PRIORITY_LABELS, scoreColor } from "@/lib/format";

export function PriorityBadge({ priority }: { priority: Priority | null }) {
  if (!priority) return null;
  return (
    <span className={`badge ${PRIORITY_COLORS[priority]}`}>{PRIORITY_LABELS[priority]}</span>
  );
}

export function MozekScore({ score }: { score: number | null }) {
  return (
    <span className={`text-2xl font-bold tabular-nums ${scoreColor(score)}`}>
      {score ?? "—"}
      <span className="text-sm font-normal text-mozek-muted">/100</span>
    </span>
  );
}
