import type { DashboardStats } from "@/lib/stats";
import { extractMaxNumber } from "@/lib/parseEstimates";

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-mozek-muted">{label}</div>
      <div className="mt-1 truncate text-xl font-bold">{value}</div>
      {sub && <div className="mt-0.5 truncate text-xs text-mozek-muted">{sub}</div>}
    </div>
  );
}

export function StatsBar({ stats }: { stats: DashboardStats }) {
  const cheapestCost = stats.cheapest ? extractMaxNumber(stats.cheapest.mvp_cost_czk) : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatTile label="Celkem projektů" value={String(stats.total)} />
      <StatTile label="Přidáno dnes" value={String(stats.todayCount)} />
      <StatTile label="Průměrné skóre" value={stats.avgScore != null ? `${stats.avgScore}/100` : "—"} />
      <StatTile label="IMMEDIATE" value={String(stats.immediateCount)} />
      <StatTile
        label="Nejlevnější"
        value={cheapestCost != null ? `${cheapestCost.toLocaleString("cs-CZ")} Kč` : "—"}
        sub={stats.cheapest?.title}
      />
      <StatTile
        label="Nejjednodušší"
        value={stats.simplest?.difficulty_score != null ? `${stats.simplest.difficulty_score}/10` : "—"}
        sub={stats.simplest?.title}
      />
    </div>
  );
}
