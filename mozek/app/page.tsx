import Link from "next/link";
import { getDashboardStats, getTopOfLatestDay } from "@/lib/stats";
import { queryIdeas } from "@/lib/queryIdeas";
import { StatsBar } from "@/components/StatsBar";
import { IdeaCard } from "@/components/IdeaCard";
import { CategoryChart, PriorityChart } from "@/components/AggregateBarChart";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, daily, recentRaw] = await Promise.all([
    getDashboardStats(),
    getTopOfLatestDay(),
    queryIdeas({ sortField: "mozek_score", sortDir: "desc", limit: 24 }),
  ]);

  // Don't repeat ideas already shown in the BRAIN ENGINE DAILY box right above.
  const dailyIds = new Set(daily.ideas.map((idea) => idea.id));
  const recent = recentRaw.filter((idea) => !dailyIds.has(idea.id));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">BRAIN ENGINE — AI Innovation Engine</h1>
        <p className="text-sm text-mozek-muted">
          Autonomní agent, který denně prochází zahraniční trendy a mění je v konkrétní podnikatelské příležitosti pro Evropu.
        </p>
      </section>

      <section className="card overflow-hidden border-mozek-good/30">
        <div className="flex items-center justify-between border-b border-mozek-border bg-mozek-good/5 px-4 py-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <span>✅</span> Úspěšný projekt
          </h2>
          <span className="badge bg-mozek-good/15 text-mozek-good">Hotovo</span>
        </div>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-bold">ApexSignal</h3>
            <p className="mt-1 max-w-2xl text-sm text-mozek-muted">
              Matematický generátor sázkových tiketů na fotbal — místo tipů
              &bdquo;od oka&ldquo; statistický model (Poissonovo rozdělení,
              Dixon-Coles korekce), který denně analyzuje 400+ zápasů a hledá,
              kde se model neshoduje s kurzem bookmakera.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mozek-muted">
              <span>⏱ Vývoj: 2 měsíce</span>
              <span>💳 Pay-per-tiket i měsíční členství</span>
            </div>
          </div>
          <a
            href="https://apexsignal.cz"
            target="_blank"
            rel="noopener noreferrer"
            className="btn shrink-0 whitespace-nowrap"
          >
            Otevřít web →
          </a>
        </div>
      </section>

      <StatsBar stats={stats} />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-mozek-muted">Nápady podle kategorie</h2>
          <CategoryChart data={stats.categoryBreakdown} />
        </div>
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-mozek-muted">Nápady podle priority</h2>
          <PriorityChart data={stats.priorityBreakdown} />
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-mozek-border bg-mozek-accent/5 px-4 py-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <span>📅</span> BRAIN ENGINE DAILY
            <span className="text-sm font-normal text-mozek-muted">
              {daily.date ? formatDate(daily.date) : "zatím nic vygenerováno"}
            </span>
          </h2>
          <Link href="/filtr" className="btn text-xs">Zobrazit vše →</Link>
        </div>
        {daily.ideas.length === 0 ? (
          <p className="p-6 text-sm text-mozek-muted">
            Agent ještě nic nevygeneroval. Spusť ho ručně (`npm run agent:run`) nebo počkej na naplánovaný běh.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
            {daily.ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        )}
      </section>

      {daily.ideas.length === 0 && recent.length === 0 && (
        <div className="card p-6 text-sm text-mozek-muted">
          Zatím žádné nápady v databázi. Jakmile agent poprvé proběhne, objeví se zde.
        </div>
      )}

      {recent.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Další silné nápady</h2>
            <Link href="/filtr" className="btn text-xs">Filtrovat a hledat →</Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
