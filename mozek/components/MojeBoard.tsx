"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Idea } from "@/lib/types";
import { MojeCard } from "./MojeCard";
import { extractMaxNumber } from "@/lib/parseEstimates";

type Tab = "kanban" | "favorites" | "trash";
type ViewLayout = "grid" | "list";
type SortField = "mozek_score" | "created_at" | "difficulty_score" | "mvp_cost_czk";
type SortDir = "asc" | "desc";

const UNASSIGNED = "__bez_kategorie__";

async function patchIdea(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/ideas/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Uložení se nepovedlo.");
}

async function bulkAction(ids: string[], action: "archive" | "restore" | "delete_forever") {
  const res = await fetch(`/api/ideas/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, action }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Hromadná akce se nepovedla.");
}

function sortIdeas(ideas: Idea[], field: SortField, dir: SortDir): Idea[] {
  const mul = dir === "asc" ? 1 : -1;
  return [...ideas].sort((a, b) => {
    if (field === "mvp_cost_czk") {
      const av = extractMaxNumber(a.mvp_cost_czk) ?? Number.POSITIVE_INFINITY;
      const bv = extractMaxNumber(b.mvp_cost_czk) ?? Number.POSITIVE_INFINITY;
      return (av - bv) * mul;
    }
    if (field === "created_at") {
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * mul;
    }
    const av = a[field] ?? -Infinity;
    const bv = b[field] ?? -Infinity;
    return ((av as number) - (bv as number)) * mul;
  });
}

export function MojeBoard({ activeIdeas, archivedIdeas }: { activeIdeas: Idea[]; archivedIdeas: Idea[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("kanban");
  const [view, setView] = useState<ViewLayout>("grid");
  const [sortField, setSortField] = useState<SortField>("mozek_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [extraColumns, setExtraColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const run = (fn: () => Promise<void>) => {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        clearSelection();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Chyba");
      }
    });
  };

  const columns = useMemo(() => {
    const set = new Set<string>(extraColumns);
    for (const idea of activeIdeas) {
      if (idea.user_category) set.add(idea.user_category);
    }
    return [UNASSIGNED, ...[...set].sort()];
  }, [activeIdeas, extraColumns]);

  const grouped = useMemo(() => {
    const map = new Map<string, Idea[]>();
    for (const col of columns) map.set(col, []);
    for (const idea of activeIdeas) {
      const key = idea.user_category ?? UNASSIGNED;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(idea);
    }
    for (const [key, list] of map) map.set(key, sortIdeas(list, sortField, sortDir));
    return map;
  }, [activeIdeas, columns, sortField, sortDir]);

  const favorites = useMemo(
    () => sortIdeas(activeIdeas.filter((i) => i.is_favorite), sortField, sortDir),
    [activeIdeas, sortField, sortDir]
  );
  const trash = useMemo(() => sortIdeas(archivedIdeas, sortField, sortDir), [archivedIdeas, sortField, sortDir]);

  const handleDrop = (column: string, ideaId: string) => {
    const user_category = column === UNASSIGNED ? null : column;
    run(() => patchIdea(ideaId, { user_category }));
  };

  const addColumn = () => {
    const name = window.prompt("Název nové kategorie/sloupce:");
    if (name && name.trim()) setExtraColumns((prev) => [...new Set([...prev, name.trim()])]);
  };

  const currentListForBulk = tab === "favorites" ? favorites : tab === "trash" ? trash : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          <button className={`btn ${tab === "kanban" ? "btn-active" : ""}`} onClick={() => { setTab("kanban"); clearSelection(); }}>
            🗂 Kanban
          </button>
          <button className={`btn ${tab === "favorites" ? "btn-active" : ""}`} onClick={() => { setTab("favorites"); clearSelection(); }}>
            ⭐ Oblíbené ({favorites.length})
          </button>
          <button className={`btn ${tab === "trash" ? "btn-active" : ""}`} onClick={() => { setTab("trash"); clearSelection(); }}>
            🗑 Koš ({trash.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select className="input" value={sortField} onChange={(e) => setSortField(e.target.value as SortField)}>
            <option value="mozek_score">BRAIN ENGINE SCORE</option>
            <option value="created_at">Datum přidání</option>
            <option value="difficulty_score">Obtížnost</option>
            <option value="mvp_cost_czk">MVP náklady</option>
          </select>
          <button className="btn" onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>
            {sortDir === "asc" ? "↑ Vzestupně" : "↓ Sestupně"}
          </button>
          {tab !== "kanban" && (
            <div className="flex gap-1">
              <button className={`btn ${view === "grid" ? "btn-active" : ""}`} onClick={() => setView("grid")}>▦ Mřížka</button>
              <button className={`btn ${view === "list" ? "btn-active" : ""}`} onClick={() => setView("list")}>☰ Seznam</button>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-mozek-bad">{error}</p>}

      {selected.size > 0 && tab !== "kanban" && (
        <div className="card flex flex-wrap items-center gap-2 border-mozek-accent/40 p-3 text-sm">
          <span>{selected.size} vybráno</span>
          {tab === "favorites" && (
            <button className="btn hover:border-mozek-bad hover:text-mozek-bad" onClick={() => run(() => bulkAction([...selected], "archive"))}>
              🗑 Archivovat vybrané
            </button>
          )}
          {tab === "trash" && (
            <>
              <button className="btn" onClick={() => run(() => bulkAction([...selected], "restore"))}>↩️ Obnovit vybrané</button>
              <button
                className="btn hover:border-mozek-bad hover:text-mozek-bad"
                onClick={() => {
                  if (confirm(`Trvale smazat ${selected.size} nápad(ů)? Toto nelze vrátit zpět.`)) {
                    run(() => bulkAction([...selected], "delete_forever"));
                  }
                }}
              >
                ⛔ Smazat natrvalo
              </button>
            </>
          )}
          <button className="btn ml-auto" onClick={clearSelection}>Zrušit výběr</button>
        </div>
      )}

      {tab === "kanban" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-3 sm:overflow-x-auto sm:pb-2 sm:scrollbar-thin">
          {columns.map((col) => (
            <div
              key={col}
              onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col); }}
              onDragLeave={() => setDragOverColumn((c) => (c === col ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverColumn(null);
                const id = e.dataTransfer.getData("text/plain");
                if (id) handleDrop(col, id);
              }}
              className={`flex w-full flex-col gap-2 rounded-xl border p-2 sm:w-72 sm:shrink-0 ${dragOverColumn === col ? "border-mozek-accent bg-mozek-accent/5" : "border-mozek-border bg-mozek-panel/50"}`}
            >
              <div className="flex items-center justify-between px-1 text-sm font-semibold">
                <span>{col === UNASSIGNED ? "Bez kategorie" : col}</span>
                <span className="text-xs text-mozek-muted">{grouped.get(col)?.length ?? 0}</span>
              </div>
              <div className="flex flex-col gap-2">
                {(grouped.get(col) ?? []).map((idea) => (
                  <MojeCard
                    key={idea.id}
                    idea={idea}
                    layout="grid"
                    selected={selected.has(idea.id)}
                    onToggleSelect={toggleSelect}
                    draggable
                    onDragStart={(e, id) => e.dataTransfer.setData("text/plain", id)}
                    actions={
                      <select
                        className="input ml-auto py-0.5 text-xs"
                        value={col}
                        onChange={(e) => handleDrop(e.target.value, idea.id)}
                      >
                        {columns.map((c) => (
                          <option key={c} value={c}>{c === UNASSIGNED ? "Bez kategorie" : c}</option>
                        ))}
                      </select>
                    }
                  />
                ))}
                {(grouped.get(col) ?? []).length === 0 && (
                  <div className="rounded-lg border border-dashed border-mozek-border p-3 text-center text-xs text-mozek-muted">
                    Přetáhni sem kartu
                  </div>
                )}
              </div>
            </div>
          ))}
          <div className="flex w-full items-start sm:w-56 sm:shrink-0">
            <button className="btn w-full" onClick={addColumn}>+ Nový sloupec</button>
          </div>
        </div>
      )}

      {tab === "favorites" && (
        <IdeaGrid ideas={favorites} view={view} selected={selected} onToggleSelect={toggleSelect} empty="Zatím žádné oblíbené nápady." />
      )}

      {tab === "trash" && (
        <IdeaGrid
          ideas={trash}
          view={view}
          selected={selected}
          onToggleSelect={toggleSelect}
          empty="Koš je prázdný."
          renderActions={(idea) => (
            <div className="ml-auto flex gap-1">
              <button className="btn py-0.5 text-xs" onClick={() => run(() => patchIdea(idea.id, { is_archived: false }))}>↩️</button>
              <button
                className="btn py-0.5 text-xs hover:border-mozek-bad hover:text-mozek-bad"
                onClick={() => {
                  if (confirm(`Trvale smazat „${idea.title}“?`)) run(() => bulkAction([idea.id], "delete_forever"));
                }}
              >
                ⛔
              </button>
            </div>
          )}
        />
      )}

      <p className="text-xs text-mozek-muted">
        {tab === "kanban" && "Přetáhni kartu do jiného sloupce nebo použij dropdown u karty."}
        {currentListForBulk.length > 0 && tab !== "kanban" && "Zaškrtni karty pro hromadnou akci."}
      </p>
    </div>
  );
}

function IdeaGrid({
  ideas,
  view,
  selected,
  onToggleSelect,
  empty,
  renderActions,
}: {
  ideas: Idea[];
  view: ViewLayout;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  empty: string;
  renderActions?: (idea: Idea) => React.ReactNode;
}) {
  if (ideas.length === 0) {
    return <div className="card p-6 text-sm text-mozek-muted">{empty}</div>;
  }
  return (
    <div className={view === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-2"}>
      {ideas.map((idea) => (
        <MojeCard
          key={idea.id}
          idea={idea}
          layout={view}
          selected={selected.has(idea.id)}
          onToggleSelect={onToggleSelect}
          actions={renderActions?.(idea)}
        />
      ))}
    </div>
  );
}
