"use client";

import Link from "next/link";
import type { Idea } from "@/lib/types";
import { PriorityBadge } from "./ScoreBadge";
import { scoreColor, formatDate } from "@/lib/format";

interface MojeCardProps {
  idea: Idea;
  layout: "grid" | "list";
  selected: boolean;
  onToggleSelect: (id: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  actions?: React.ReactNode;
}

export function MojeCard({ idea, layout, selected, onToggleSelect, draggable, onDragStart, actions }: MojeCardProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={draggable && onDragStart ? (e) => onDragStart(e, idea.id) : undefined}
      className={`card flex ${layout === "list" ? "flex-row items-center" : "flex-col"} gap-2 p-3 ${draggable ? "cursor-grab active:cursor-grabbing" : ""} ${selected ? "border-mozek-accent" : ""}`}
    >
      <div className={`flex items-start gap-2 ${layout === "list" ? "flex-1 items-center" : ""}`}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(idea.id)}
          className="mt-1 h-4 w-4 shrink-0"
        />
        <Link href={`/napad/${idea.id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold hover:text-mozek-accent">{idea.title}</h3>
            {idea.is_favorite && <span title="Oblíbené">⭐</span>}
          </div>
          {layout === "grid" && <p className="mt-0.5 line-clamp-2 text-xs text-mozek-muted">{idea.one_liner}</p>}
        </Link>
      </div>
      <div className={`flex items-center gap-2 ${layout === "list" ? "shrink-0" : "justify-between"}`}>
        <PriorityBadge priority={idea.priority} />
        <span className={`text-sm font-bold tabular-nums ${scoreColor(idea.mozek_score)}`}>{idea.mozek_score ?? "—"}</span>
        <span className="text-xs text-mozek-muted">{formatDate(idea.date_generated)}</span>
        {actions}
      </div>
    </div>
  );
}
