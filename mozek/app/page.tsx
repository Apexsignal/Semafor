import Link from "next/link";
import { getDashboardStats, getTopOfLatestDay } from "@/lib/stats";
import { queryIdeas } from "@/lib/queryIdeas";
import { StatsBar } from "@/components/StatsBar";
import { IdeaCard } from "@/components/IdeaCard";
import { CategoryChart, PriorityChart } from "@/components/AggregateBarChart";
import { WaitlistForm } from "@/components/WaitlistForm";
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
      <section className="flex flex-col gap-6 rounded-2xl border border-mozek-border bg-gradient-to-b from-mozek-panel to-mozek-bg p-6 sm:p-8">
        <div className="flex flex-col gap-3">
          <span className="badge w-fit bg-mozek-accent/15 text-mozek-accent">Připravujeme placený přístup</span>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
            AI, co každý den najde a rozpracuje nový byznys nápad pro Evropu.
          </h1>
          <p className="max-w-2xl text-sm text-mozek-muted sm:text-base">
            Brain Engine denně prochází zahraniční trendy — Product Hunt, Reddit,
            startup zprávy — a z nich staví promyšlené, ohodnocené podnikatelské
            příležitosti: s monetizací, cenou za zakázku i odhadem rizik. Ne kopie
            cizích nápadů, ale rozpracované koncepty, co jde reálně postavit.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-2 text-sm">
            <span>🔍</span>
            <span className="text-mozek-muted">
              <b className="text-mozek-text">Denně hledá</b> — web search přes
              zahraniční zdroje, ne z paměti
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span>🧠</span>
            <span className="text-mozek-muted">
              <b className="text-mozek-text">Sám si to kontroluje</b> — druhý,
              kritický průchod před uložením
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span>📊</span>
            <span className="text-mozek-muted">
              <b className="text-mozek-text">Skóruje a rozpracuje</b> — 9 dílčích
              skóre, scénáře příjmů, cena za zakázku
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-mozek-border bg-mozek-bg/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums">4 900 Kč</span>
              <span className="text-sm text-mozek-muted">/ měsíc, kdykoliv zrušitelné</span>
            </div>
            <p className="mt-1 text-xs text-mozek-muted">
              Plný přístup ke všem nápadům. Konkrétní nápad si navíc můžeš
              natrvalo zablokovat za 2 000 Kč.
            </p>
          </div>
          <WaitlistForm />
        </div>
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
