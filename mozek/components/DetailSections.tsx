export function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <span>{icon}</span> {title}
      </h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-mozek-text/90">{children}</div>
    </section>
  );
}

export function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-mozek-muted">{label}</div>
      <div className="mt-0.5 whitespace-pre-wrap">{value}</div>
    </div>
  );
}

export function BulletList({ label, items, tone }: { label: string; items: string[] | null | undefined; tone?: "good" | "bad" | "warn" }) {
  if (!items || items.length === 0) return null;
  const color = tone === "good" ? "text-mozek-good" : tone === "bad" ? "text-mozek-bad" : tone === "warn" ? "text-mozek-warn" : "";
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-mozek-muted">{label}</div>
      <ul className="mt-1 list-inside list-disc space-y-1">
        {items.map((item, i) => (
          <li key={i} className={color}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function ChipList({ label, items }: { label: string; items: string[] | null | undefined }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-mozek-muted">{label}</div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={i} className="badge bg-mozek-border/60">{item}</span>
        ))}
      </div>
    </div>
  );
}

export function SubScoreBar({ label, value }: { label: string; value: number | null | undefined }) {
  const v = value ?? 0;
  const pct = Math.max(0, Math.min(100, (v / 11) * 100));
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-40 shrink-0 text-mozek-muted">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mozek-border">
        <div className="h-full rounded-full bg-mozek-accent" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right tabular-nums">{value ?? "—"}</span>
    </div>
  );
}
