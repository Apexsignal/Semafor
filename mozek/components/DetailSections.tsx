export function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="card mb-5 break-inside-avoid p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <span>{icon}</span> {title}
      </h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-mozek-text/90">{children}</div>
    </section>
  );
}

import type { RevenueTimeline } from "@/lib/types";

/** One revenue-scenario card: a plain string (older ideas) or a 6M/1R/3R timeline. */
export function RevenueCell({ label, value }: { label: string; value: string | RevenueTimeline | null | undefined }) {
  if (!value) {
    return (
      <div className="rounded-lg border border-mozek-border p-2 text-center">
        <div className="text-xs text-mozek-muted">{label}</div>
        <div className="mt-1 text-sm font-medium">—</div>
      </div>
    );
  }
  if (typeof value === "string") {
    return (
      <div className="rounded-lg border border-mozek-border p-2 text-center">
        <div className="text-xs text-mozek-muted">{label}</div>
        <div className="mt-1 text-sm font-medium">{value}</div>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-mozek-border p-2">
      <div className="text-center text-xs text-mozek-muted">{label}</div>
      <div className="mt-1.5 flex flex-col gap-1 text-xs">
        {value.month_6 && (
          <div><span className="text-mozek-muted">6 měsíců: </span>{value.month_6}</div>
        )}
        {value.year_1 && (
          <div><span className="text-mozek-muted">1 rok: </span>{value.year_1}</div>
        )}
        {value.year_3 && (
          <div><span className="text-mozek-muted">3 roky: </span>{value.year_3}</div>
        )}
      </div>
    </div>
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
    <div className="flex items-center gap-2 text-xs" title={`${label}: ${value ?? "—"}/11`}>
      <span className="w-40 shrink-0 text-mozek-muted">{label}</span>
      <div className="h-[10px] flex-1 overflow-hidden rounded-sm bg-mozek-border/40">
        <div
          className="h-full bg-mozek-accent"
          style={{ width: `${pct}%`, borderRadius: "0 4px 4px 0" }}
        />
      </div>
      <span className="w-6 text-right tabular-nums font-medium text-mozek-text">{value ?? "—"}</span>
    </div>
  );
}

/** Numbered step-by-step build guide (used for build_steps on the detail page). */
export function Steps({ items }: { items: string[] | null | undefined }) {
  if (!items || items.length === 0) return null;
  return (
    <ol className="flex flex-col gap-3">
      {items.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mozek-accent/15 text-xs font-semibold text-mozek-accent">
            {i + 1}
          </span>
          <span className="pt-0.5 leading-relaxed text-mozek-text/90">{step}</span>
        </li>
      ))}
    </ol>
  );
}
