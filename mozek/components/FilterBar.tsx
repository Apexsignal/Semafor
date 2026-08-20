import type { IdeaFilters } from "@/lib/queryIdeas";

interface FilterBarProps {
  categories: string[];
  regions: string[];
  userCategories: string[];
  current: Record<string, string | undefined>;
  action?: string;
}

// Plain GET <form> — App Router server components already re-render from
// the URL's search params, so no client JS is needed for filtering.
export function FilterBar({ categories, regions, userCategories, current, action = "/filtr" }: FilterBarProps) {
  return (
    <form method="get" action={action} className="card flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
        <input
          type="text"
          name="q"
          defaultValue={current.q ?? ""}
          placeholder='Hledej… např. "AI projekty do 100 000 Kč do 30 dní"'
          className="input flex-1"
        />
        <button type="submit" className="btn btn-active">🔍 Hledat / filtrovat</button>
        <a href={action} className="btn text-xs">Vymazat filtry</a>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <label className="flex flex-col gap-1 text-xs text-mozek-muted">
          Skóre min
          <input type="number" name="score_min" min={0} max={100} defaultValue={current.score_min ?? ""} className="input" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-mozek-muted">
          Skóre max
          <input type="number" name="score_max" min={0} max={100} defaultValue={current.score_max ?? ""} className="input" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-mozek-muted">
          Obtížnost min
          <input type="number" name="difficulty_min" min={1} max={10} defaultValue={current.difficulty_min ?? ""} className="input" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-mozek-muted">
          Obtížnost max
          <input type="number" name="difficulty_max" min={1} max={10} defaultValue={current.difficulty_max ?? ""} className="input" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-mozek-muted">
          MVP náklady max (Kč)
          <input type="number" name="cost_max" min={0} defaultValue={current.cost_max ?? ""} className="input" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-mozek-muted">
          Čas do MVP max (dní)
          <input type="number" name="days_max" min={0} defaultValue={current.days_max ?? ""} className="input" />
        </label>

        <label className="flex flex-col gap-1 text-xs text-mozek-muted">
          Země inspirace
          <select name="region" defaultValue={current.region ?? ""} className="input">
            <option value="">Všechny</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-mozek-muted">
          Kategorie
          <select name="category" defaultValue={current.category ?? ""} className="input">
            <option value="">Všechny</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-mozek-muted">
          B2B / B2C
          <select name="b2b" defaultValue={current.b2b ?? ""} className="input">
            <option value="">Obojí</option>
            <option value="b2b">Jen B2B</option>
            <option value="b2c">Jen B2C</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-mozek-muted">
          Priorita
          <select name="priority" defaultValue={current.priority ?? ""} className="input">
            <option value="">Všechny</option>
            <option value="IMMEDIATE">IMMEDIATE</option>
            <option value="HIGH_POTENTIAL">HIGH_POTENTIAL</option>
            <option value="WATCH">WATCH</option>
            <option value="EXPERIMENT">EXPERIMENT</option>
            <option value="LOW_POTENTIAL">LOW_POTENTIAL</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-mozek-muted">
          Datum od
          <input type="date" name="date_from" defaultValue={current.date_from ?? ""} className="input" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-mozek-muted">
          Datum do
          <input type="date" name="date_to" defaultValue={current.date_to ?? ""} className="input" />
        </label>

        {userCategories.length > 0 && (
          <label className="flex flex-col gap-1 text-xs text-mozek-muted">
            Moje kategorie
            <select name="user_category" defaultValue={current.user_category ?? ""} className="input">
              <option value="">Všechny</option>
              {userCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        )}

        <label className="flex items-center gap-2 self-end pb-1.5 text-xs text-mozek-muted">
          <input type="checkbox" name="favorites" value="1" defaultChecked={current.favorites === "1"} className="h-4 w-4" />
          Jen oblíbené ⭐
        </label>

        <label className="flex flex-col gap-1 text-xs text-mozek-muted">
          Řadit podle
          <select name="sort" defaultValue={current.sort ?? "mozek_score"} className="input">
            <option value="mozek_score">MOZEK SCORE</option>
            <option value="created_at">Data přidání</option>
            <option value="difficulty_score">Obtížnosti</option>
            <option value="mvp_cost_czk">MVP nákladů</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-mozek-muted">
          Směr
          <select name="dir" defaultValue={current.dir ?? "desc"} className="input">
            <option value="desc">Sestupně</option>
            <option value="asc">Vzestupně</option>
          </select>
        </label>
      </div>
    </form>
  );
}

export function filtersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): IdeaFilters {
  const get = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const num = (key: string) => {
    const value = get(key);
    return value ? Number(value) : undefined;
  };

  const b2b = get("b2b");

  return {
    q: get("q") || undefined,
    scoreMin: num("score_min"),
    scoreMax: num("score_max"),
    difficultyMin: num("difficulty_min"),
    difficultyMax: num("difficulty_max"),
    costMaxCzk: num("cost_max"),
    daysMax: num("days_max"),
    region: get("region") || undefined,
    category: get("category") || undefined,
    isB2b: b2b === "b2b" ? true : b2b === "b2c" ? false : undefined,
    priority: (get("priority") as IdeaFilters["priority"]) || undefined,
    dateFrom: get("date_from") || undefined,
    dateTo: get("date_to") || undefined,
    userCategory: get("user_category") || undefined,
    favoritesOnly: get("favorites") === "1",
    sortField: (get("sort") as IdeaFilters["sortField"]) || "mozek_score",
    sortDir: (get("dir") as IdeaFilters["sortDir"]) || "desc",
  };
}
