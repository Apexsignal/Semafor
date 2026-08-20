import type { CategoryCount, PriorityCount } from "@/lib/stats";
import { PRIORITY_LABELS } from "@/lib/format";

// Fixed, reserved steps — same semantics as the priority badges used
// everywhere else in the app (PRIORITY_COLORS in lib/format.ts), so the
// chart reads consistently with the rest of the UI rather than inventing a
// second color language for the same ordinal scale.
const PRIORITY_BAR_COLOR: Record<PriorityCount["priority"], string> = {
  IMMEDIATE: "#ff8080",
  HIGH_POTENTIAL: "#fbbf24",
  WATCH: "#5eb1ff",
  EXPERIMENT: "#8b8d92",
  LOW_POTENTIAL: "#3a3b3f",
};

// Nominal categorical (product category, region…): a single measure (count)
// broken down by identity, not several series that need telling apart — so
// every bar takes the same slot-1 hue and only length encodes magnitude.
const CATEGORY_BAR_COLOR = "#2ee6c6";

function BarRow({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.max(count > 0 ? 3 : 0, (count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-xs" title={`${label}: ${count}`}>
      <span className="w-28 shrink-0 truncate text-mozek-muted">{label}</span>
      <div className="h-[10px] flex-1 overflow-hidden rounded-sm bg-mozek-border/40">
        <div
          className="h-full"
          style={{ width: `${pct}%`, backgroundColor: color, borderRadius: "0 4px 4px 0" }}
        />
      </div>
      <span className="w-7 text-right tabular-nums font-medium text-mozek-text">{count}</span>
    </div>
  );
}

export function CategoryChart({ data }: { data: CategoryCount[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-mozek-muted">Zatím žádná data.</p>;
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d) => (
        <BarRow key={d.label} label={d.label} count={d.count} max={max} color={CATEGORY_BAR_COLOR} />
      ))}
    </div>
  );
}

export function PriorityChart({ data }: { data: PriorityCount[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d) => (
        <BarRow
          key={d.priority}
          label={PRIORITY_LABELS[d.priority]}
          count={d.count}
          max={max}
          color={PRIORITY_BAR_COLOR[d.priority]}
        />
      ))}
    </div>
  );
}
