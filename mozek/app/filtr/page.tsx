import { queryIdeas, getFilterOptions } from "@/lib/queryIdeas";
import { FilterBar, filtersFromSearchParams } from "@/components/FilterBar";
import { IdeaCard } from "@/components/IdeaCard";

export const dynamic = "force-dynamic";

export default async function FiltrPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = filtersFromSearchParams(searchParams);
  const [ideas, options] = await Promise.all([queryIdeas(filters), getFilterOptions()]);

  const current: Record<string, string | undefined> = Object.fromEntries(
    Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  );

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold">🔍 Filtr a vyhledávání</h1>
      <FilterBar
        categories={options.categories}
        regions={options.regions}
        userCategories={options.userCategories}
        current={current}
      />
      <div className="flex items-center justify-between text-sm text-mozek-muted">
        <span>{ideas.length} {ideas.length === 1 ? "výsledek" : ideas.length < 5 ? "výsledky" : "výsledků"}</span>
      </div>
      {ideas.length === 0 ? (
        <div className="card p-6 text-sm text-mozek-muted">Žádné nápady neodpovídají zadaným filtrům.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}
