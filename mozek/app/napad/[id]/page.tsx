import { notFound } from "next/navigation";
import { getSupabaseAnonClient } from "@/lib/supabase";
import { getFilterOptions } from "@/lib/queryIdeas";
import type { Idea } from "@/lib/types";
import { PriorityBadge } from "@/components/ScoreBadge";
import { FeedbackButtons } from "@/components/FeedbackButtons";
import { Section, Field, BulletList, ChipList, SubScoreBar } from "@/components/DetailSections";
import { formatDate, scoreColor } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getIdea(id: string): Promise<Idea | null> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase.from("ideas").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as Idea;
}

export default async function IdeaDetailPage({ params }: { params: { id: string } }) {
  const [idea, options] = await Promise.all([getIdea(params.id), getFilterOptions()]);
  if (!idea) notFound();

  const europe = idea.europe_transfer;
  const revenue = idea.revenue_scenarios;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        {idea.is_archived && (
          <div className="rounded-lg border border-mozek-bad/40 bg-mozek-bad/10 px-3 py-2 text-sm text-mozek-bad">
            🗑 Tento nápad je v koši (soft-deleted). Data zůstávají zachovaná.
          </div>
        )}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-mozek-muted">
              <span>{formatDate(idea.date_generated)}</span>
              {idea.category && <span className="badge bg-mozek-border/60">{idea.category}</span>}
              {idea.is_b2b != null && <span className="badge bg-mozek-border/60">{idea.is_b2b ? "B2B" : "B2C"}</span>}
            </div>
            <h1 className="mt-1 text-2xl font-bold">{idea.title}</h1>
            <p className="mt-1 text-mozek-muted">{idea.one_liner}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <PriorityBadge priority={idea.priority} />
            <span className={`text-4xl font-bold tabular-nums ${scoreColor(idea.mozek_score)}`}>
              {idea.mozek_score ?? "—"}
              <span className="text-base font-normal text-mozek-muted">/100</span>
            </span>
          </div>
        </div>
      </div>

      <FeedbackButtons idea={idea} existingCategories={options.userCategories} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title="Přehled" icon="📋">
          <Field label="Zdrojový region" value={idea.source_region} />
          <Field label="Konkrétní příklad ze zahraničí" value={idea.source_example} />
          {europe && (
            <div className="rounded-lg border border-mozek-border bg-mozek-bg/50 p-3">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-mozek-muted">Přenos do Evropy</div>
              <Field label="Cílová země" value={europe.target_country} />
              <Field label="Proč" value={europe.why} />
              <Field label="Potřebné úpravy" value={europe.adaptations_needed} />
              <Field label="Legislativní poznámky" value={europe.legal_notes} />
            </div>
          )}
        </Section>

        <Section title="Problém & řešení" icon="🎯">
          <Field label="Problém" value={idea.problem} />
          <Field label="Řešení" value={idea.solution} />
          <Field label="Cílový zákazník" value={idea.target_customer} />
          <Field label="Důkaz poptávky" value={idea.demand_evidence} />
        </Section>

        <Section title="Trh & konkurence" icon="⚔️">
          <Field label="Konkurence" value={idea.competition} />
          <Field label="Naše výhoda" value={idea.our_advantage} />
          <BulletList label="Výhody" items={idea.pros} tone="good" />
          <BulletList label="Nevýhody" items={idea.cons} tone="bad" />
        </Section>

        <Section title="Rizika" icon="⚠️">
          <BulletList label="Hlavní rizika" items={idea.risks} tone="warn" />
        </Section>

        <Section title="Monetizace & scénáře příjmů" icon="💰">
          <Field label="Monetizační model" value={idea.monetization_model} />
          <Field label="Odhad ceny" value={idea.price_estimate} />
          {revenue && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-mozek-border p-2">
                <div className="text-xs text-mozek-muted">Konzervativní</div>
                <div className="mt-1 text-sm font-medium">{revenue.conservative ?? "—"}</div>
              </div>
              <div className="rounded-lg border border-mozek-border p-2">
                <div className="text-xs text-mozek-muted">Realistický</div>
                <div className="mt-1 text-sm font-medium">{revenue.realistic ?? "—"}</div>
              </div>
              <div className="rounded-lg border border-mozek-border p-2">
                <div className="text-xs text-mozek-muted">Ambiciózní</div>
                <div className="mt-1 text-sm font-medium">{revenue.ambitious ?? "—"}</div>
              </div>
            </div>
          )}
        </Section>

        <Section title="Technická náročnost" icon="⚙️">
          <Field label="Obtížnost" value={idea.difficulty_score != null ? `${idea.difficulty_score}/10` : null} />
          <Field label="Zdůvodnění" value={idea.difficulty_reasoning} />
          <ChipList label="Tech stack" items={idea.tech_stack} />
          <Field label="Potřebný tým" value={idea.team_needed} />
          <Field label="Čas do MVP" value={idea.time_to_mvp} />
        </Section>

        <Section title="Finance" icon="💸">
          <Field label="Náklady na MVP" value={idea.mvp_cost_czk ? `${idea.mvp_cost_czk} Kč` : null} />
          <Field label="Měsíční náklady" value={idea.monthly_cost_czk ? `${idea.monthly_cost_czk} Kč` : null} />
          <Field label="Zdůvodnění" value={idea.cost_reasoning} />
        </Section>

        <Section title="Go-to-market" icon="🚀">
          <BulletList label="Kroky ke stavbě" items={idea.build_steps} />
          <Field label="Prvních 10 zákazníků" value={idea.first_10_customers} />
          <Field label="Prvních 100 zákazníků" value={idea.first_100_customers} />
          <ChipList label="Marketingové kanály" items={idea.marketing_channels} />
          <Field label="Plán škálování" value={idea.scaling_plan} />
        </Section>

        <Section title="Skóre (rozpad)" icon="📊">
          <SubScoreBar label="Problém" value={idea.score_problem} />
          <SubScoreBar label="Velikost trhu" value={idea.score_market_size} />
          <SubScoreBar label="Monetizace" value={idea.score_monetization} />
          <SubScoreBar label="Konkurence" value={idea.score_competition} />
          <SubScoreBar label="Jednoduchost MVP" value={idea.score_mvp_simplicity} />
          <SubScoreBar label="Rychlost" value={idea.score_speed} />
          <SubScoreBar label="Trend" value={idea.score_trend} />
          <SubScoreBar label="Škálovatelnost" value={idea.score_scalability} />
          <SubScoreBar label="Potenciál pro Evropu" value={idea.score_europe_potential} />
          <div className="mt-2 flex items-center justify-between border-t border-mozek-border pt-2 text-sm font-semibold">
            <span>MOZEK SCORE celkem</span>
            <span className={scoreColor(idea.mozek_score)}>{idea.mozek_score ?? "—"}/100</span>
          </div>
        </Section>

        <Section title="Zdroje" icon="🔗">
          <BulletList label="Ověřené zdroje" items={idea.sources_checked} />
        </Section>
      </div>
    </div>
  );
}
