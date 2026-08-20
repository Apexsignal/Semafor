import Link from "next/link";
import type { Idea } from "@/lib/types";
import { PriorityBadge } from "./ScoreBadge";
import { scoreColor, formatDate } from "@/lib/format";

export function IdeaCard({ idea, layout = "grid" }: { idea: Idea; layout?: "grid" | "list" }) {
  if (layout === "list") {
    return (
      <Link
        href={`/napad/${idea.id}`}
        className="card flex items-center justify-between gap-4 p-4 transition hover:border-mozek-accent"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{idea.title}</h3>
            {idea.is_favorite && <span title="Oblíbené">⭐</span>}
          </div>
          <p className="truncate text-sm text-mozek-muted">{idea.one_liner}</p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <PriorityBadge priority={idea.priority} />
          <span className={`text-lg font-bold tabular-nums ${scoreColor(idea.mozek_score)}`}>
            {idea.mozek_score ?? "—"}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/napad/${idea.id}`}
      className="card flex flex-col gap-3 p-4 transition hover:border-mozek-accent hover:shadow-lg hover:shadow-mozek-accent/5"
    >
      <div className="flex items-start justify-between gap-2">
        <PriorityBadge priority={idea.priority} />
        <span className={`text-xl font-bold tabular-nums ${scoreColor(idea.mozek_score)}`}>
          {idea.mozek_score ?? "—"}
          <span className="text-xs font-normal text-mozek-muted">/100</span>
        </span>
      </div>
      <div>
        <h3 className="flex items-center gap-1.5 font-semibold leading-snug">
          {idea.title}
          {idea.is_favorite && <span title="Oblíbené">⭐</span>}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-mozek-muted">{idea.one_liner}</p>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mozek-muted">
        {idea.category && <span className="badge bg-mozek-border/60">{idea.category}</span>}
        {idea.difficulty_score != null && <span>⚙️ obtížnost {idea.difficulty_score}/10</span>}
        {idea.mvp_cost_czk && <span>💰 {idea.mvp_cost_czk} Kč</span>}
        <span className="ml-auto">{formatDate(idea.date_generated)}</span>
      </div>
    </Link>
  );
}
