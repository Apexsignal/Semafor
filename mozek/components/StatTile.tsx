export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-mozek-muted">{label}</div>
      <div className="mt-1 truncate text-xl font-bold">{value}</div>
      {sub && <div className="mt-0.5 truncate text-xs text-mozek-muted">{sub}</div>}
    </div>
  );
}
