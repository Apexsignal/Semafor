"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Idea, UserFeedback } from "@/lib/types";

const FEEDBACK_OPTIONS: Array<{ value: UserFeedback; emoji: string; label: string }> = [
  { value: "ZAJIMAVE", emoji: "❤️", label: "Zajímavé" },
  { value: "FAVORIT", emoji: "⭐", label: "Favorit" },
  { value: "CHCI_POSTAVIT", emoji: "🚀", label: "Chci postavit" },
  { value: "NEZAJIMA", emoji: "❌", label: "Nezajímá" },
  { value: "ZAMITNUTO", emoji: "🗑", label: "Zamítnuto" },
];

async function patchIdea(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/ideas/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "Neznámá chyba" }));
    throw new Error(error ?? "Uložení se nepovedlo.");
  }
  return res.json();
}

export function FeedbackButtons({ idea, existingCategories = [] as string[] }: { idea: Idea; existingCategories?: string[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");

  const apply = (body: Record<string, unknown>) => {
    setError(null);
    startTransition(async () => {
      try {
        await patchIdea(idea.id, body);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Chyba");
      }
    });
  };

  const toggleFeedback = (value: UserFeedback) => {
    apply({ user_feedback: idea.user_feedback === value ? null : value });
  };

  const toggleFavorite = () => apply({ is_favorite: !idea.is_favorite });

  const archive = () => {
    if (!confirm(`Přesunout „${idea.title}“ do koše? Nic se nesmaže natvrdo, dá se to vrátit.`)) return;
    apply({ is_archived: true });
  };

  const restore = () => apply({ is_archived: false });

  const setCategory = (value: string) => apply({ user_category: value || null });

  return (
    <div className="card flex flex-col gap-4 p-4">
      <div>
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-mozek-muted">Hodnocení</div>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={isPending}
              onClick={() => toggleFeedback(opt.value)}
              className={`btn ${idea.user_feedback === opt.value ? "btn-active" : ""}`}
              title={opt.label}
            >
              <span>{opt.emoji}</span>
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-mozek-border pt-4">
        <button
          type="button"
          disabled={isPending}
          onClick={toggleFavorite}
          className={`btn ${idea.is_favorite ? "btn-active" : ""}`}
        >
          <span>⭐</span> {idea.is_favorite ? "Oblíbené" : "Oblíbit"}
        </button>

        <label className="flex flex-col gap-1 text-xs text-mozek-muted">
          Vlastní kategorie
          <div className="flex gap-1.5">
            <select
              className="input"
              value={idea.user_category ?? ""}
              disabled={isPending}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">— žádná —</option>
              {existingCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </label>

        <form
          className="flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (newCategory.trim()) {
              setCategory(newCategory.trim());
              setNewCategory("");
            }
          }}
        >
          <input
            type="text"
            className="input w-36"
            placeholder="nová kategorie…"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button type="submit" className="btn" disabled={isPending || !newCategory.trim()}>+ Přidat</button>
        </form>

        <div className="ml-auto">
          {idea.is_archived ? (
            <button type="button" disabled={isPending} onClick={restore} className="btn">
              ↩️ Obnovit z koše
            </button>
          ) : (
            <button type="button" disabled={isPending} onClick={archive} className="btn hover:border-mozek-bad hover:text-mozek-bad">
              🗑 Smazat
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-mozek-bad">{error}</p>}
    </div>
  );
}
