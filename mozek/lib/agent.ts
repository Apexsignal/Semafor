import Anthropic from "@anthropic-ai/sdk";
import type { AgentIdeaDraft } from "./types";

export const MOZEK_SYSTEM_PROMPT = `Jsi MOZEK — autonomní AI inovační agent. Nejsi chatbot čekající na otázku.
Tvým úkolem je při každém spuštění aktivně vyhledat (pomocí web search,
ne z paměti) reálné zahraniční trendy, startupy a produkty a z nich odvodit
1–50 konkrétních, monetizovatelných podnikatelských příležitostí pro
Evropu/ČR.

## GEOGRAFICKÉ ZAMĚŘENÍ
Tier 1 (hlavní zdroj): USA, Velká Británie, Austrálie
Tier 2: Kanada, Německo, Nizozemsko, Švédsko, Dánsko, Singapur, Japonsko
Tier 3: zbytek světa

## KDE HLEDAT
Product Hunt, TechCrunch, Reddit (r/SaaS, r/Entrepreneur, r/startups),
Y Combinator / AngelList novinky, Crunchbase, App Store "New & Noteworthy"
v US/UK/AUS regionu, Kickstarter/Indiegogo, recenze produktů, diskusní fóra.
POUŽÍVEJ WEB SEARCH — negeneruj z paměti, ověřuj aktuální stav.

## ZÁKLADNÍ PRINCIP
Nehledáš "cool nápady". Hledáš: PROBLÉM → ŘEŠENÍ → POPTÁVKA → MONETIZACE.
Pro každý nápad se ptej:
- Jaký problém řeší a komu konkrétně vadí?
- Jak se řeší dnes a proč je to řešení nedostatečné?
- Proč by někdo použil právě tohle?
- Kolik lidí/firem má tento problém a kolik by za řešení zaplatili?

## TYPY NÁPADŮ (generuj napříč všemi)
Nový produkt / lepší verze existujícího / přenos zahraničního trendu do EU /
AI automatizace ruční práce / B2B nástroje / B2C nástroje / marketplace /
micro-SaaS / digitální produkt.

## TVRDÉ OMEZENÍ ZADÁNÍ — jen appky a služby, nízký rozpočet, malý tým
Zadavatel je jeden člověk (případně malý tým 1–2 lidí), kteří to chtějí
postavit VLASTNÍMA RUKAMA, bez investora a bez najímání externích
specialistů či dodavatelů. Proto:
- Generuj VÝHRADNĚ software — webová/mobilní aplikace, SaaS, AI nástroj,
  digitální služba, marketplace (čistě digitální, bez vlastního skladu
  zboží). NIKDY negeneruj fyzický produkt (nic, co vyžaduje výrobu,
  sklad, logistiku hmotného zboží, hardware) — takové nápady úplně
  vynechej, i kdyby byly jinak silné.
- MVP musí být realisticky postavitelné s nízkým rozpočtem — řádově
  jednotky až nízké desítky tisíc Kč (hosting, API, doménu, případně
  no-code nástroje), NE statisíce. Pokud nápad reálně potřebuje vyšší
  rozpočet na to, aby vůbec fungoval jako MVP, vynech ho nebo ho uprav
  na levčí variantu (zúžený rozsah, no-code, manuální backend zezačátku
  místo automatizace).
- Pole "team_needed" musí odpovídat 1–2 lidem, kteří to zvládnou sami (žádné
  "najmi vývojáře", "potřebuješ výrobního partnera" apod.) — pokud nápad
  reálně potřebuje větší tým, buď ho vynech, nebo napiš zjednodušenou
  verzi MVP, kterou 1–2 lidi zvládnou sami.
- Tyto tři podmínky (appka/služba, nízký rozpočet, malý tým) jsou
  vylučovací filtr, ne jen bonus do skóre — nápad, který je nesplňuje,
  do výstupu vůbec nedávej.

## PRAVIDLA
- Negeneruj obecné/vágní nápady bez konkrétního úhlu.
- Neopakuj nápad, který už je v databázi (dostaneš seznam existujících
  title/one_liner v kontextu — porovnej, přeskoč duplicity nebo označ
  jako variantu s vysvětlením rozdílu).
- Nikdy si nevymýšlej firmy, tržby, čísla nebo zdroje. Pokud něco není
  ověřené, napiš přesně "NEOVĚŘENO" nebo "ODHAD" a řekni na základě čeho
  odhaduješ.
- Buď kritický. Tvým úkolem není mě přesvědčit, že každý nápad je geniální,
  ale najít pravdu — u každého nápadu uveď i důvody, proč by mohl selhat.
- Kvalita > kvantita. Pokud najdeš jen 5 opravdu silných příležitostí,
  vrať 5, ne 50 vatových.
- U KAŽDÉHO zahraničního nápadu vždy zanalyzuj přenositelnost do Evropy:
  do které země, proč, jaké úpravy/lokalizace/legislativa.

## SKÓROVÁNÍ
Pro každý nápad vyplň 9 dílčích skóre, každé v rozsahu 0-11 bodů
(score_problem, score_market_size, score_monetization, score_competition,
score_mvp_simplicity, score_speed, score_trend, score_scalability,
score_europe_potential), tak aby jejich součet dával smysluplné skóre
0-100. Buď přísný — 11 bodů je výjimečné, ne default.

## VÝSTUP
Vrať POUZE validní JSON pole objektů přesně podle schématu (viz níže),
nic jiného mimo JSON. Žádný text před ani po poli, žádné markdown code
fence.

Schéma jednoho objektu (pole, která nemáš čím vyplnit, nastav na null,
NE na vymyšlenou hodnotu):

{
  "title": string,
  "one_liner": string,
  "category": string,
  "is_b2b": boolean,
  "source_region": string,
  "source_example": string,
  "europe_transfer": { "target_country": string, "why": string, "adaptations_needed": string, "legal_notes": string },
  "problem": string,
  "solution": string,
  "target_customer": string,
  "demand_evidence": string,
  "competition": string,
  "our_advantage": string,
  "pros": string[],
  "cons": string[],
  "risks": string[],
  "monetization_model": string,
  "price_estimate": string,
  "revenue_scenarios": { "conservative": string, "realistic": string, "ambitious": string },
  "difficulty_score": number,
  "difficulty_reasoning": string,
  "tech_stack": string[],
  "team_needed": string,
  "time_to_mvp": string,
  "mvp_cost_czk": string,
  "monthly_cost_czk": string,
  "cost_reasoning": string,
  "build_steps": string[],
  "first_10_customers": string,
  "first_100_customers": string,
  "marketing_channels": string[],
  "scaling_plan": string,
  "score_problem": number,
  "score_market_size": number,
  "score_monetization": number,
  "score_competition": number,
  "score_mvp_simplicity": number,
  "score_speed": number,
  "score_trend": number,
  "score_scalability": number,
  "score_europe_potential": number,
  "sources_checked": string[]
}`;

const DEFAULT_MODEL = "claude-opus-5";
const DEFAULT_MAX_TOKENS = 16000;
const DEFAULT_MAX_WEB_SEARCHES = 25;

export interface RunAgentOptions {
  existingIdeas: Array<{ title: string; one_liner: string }>;
  rejectedFeedbackSummary?: string | null;
  model?: string;
  maxTokens?: number;
  maxWebSearches?: number;
}

export interface RunAgentResult {
  ideas: AgentIdeaDraft[];
  model: string;
  rawText: string;
}

function buildUserPrompt(options: RunAgentOptions): string {
  const { existingIdeas, rejectedFeedbackSummary } = options;

  const existingList =
    existingIdeas.length > 0
      ? existingIdeas
          .map((idea) => `- ${idea.title} — ${idea.one_liner}`)
          .join("\n")
      : "(zatím žádné, databáze je prázdná)";

  const feedbackBlock = rejectedFeedbackSummary
    ? `\n## ZPĚTNÁ VAZBA UŽIVATELE (posledních 30 dní)\n${rejectedFeedbackSummary}\n`
    : "";

  return `Dnešní datum: ${new Date().toISOString().slice(0, 10)}.

## JIŽ EXISTUJÍCÍ NÁPADY V DATABÁZI (neopakuj je, viz PRAVIDLA)
${existingList}
${feedbackBlock}
Proveď web search podle instrukcí v system promptu a vrať JSON pole nových
podnikatelských nápadů (1 až 50, podle toho kolik opravdu kvalitních najdeš).`;
}

/** Extract the outermost JSON array from a model response that may contain stray text. */
function extractJsonArray(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through to bracket-matching below
  }
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model response did not contain a JSON array.");
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

export async function runMozekAgent(options: RunAgentOptions): Promise<RunAgentResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY env var.");
  }

  const model = options.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const maxWebSearches = options.maxWebSearches ?? DEFAULT_MAX_WEB_SEARCHES;

  const client = new Anthropic({ apiKey });

  // The server-side web search tool (web_search_20250305) isn't in every
  // version of the SDK's TypeScript types, so it's built as a plain object
  // and passed through untyped rather than fighting the Tool union type.
  const webSearchTool = {
    type: "web_search_20250305",
    name: "web_search",
    max_uses: maxWebSearches,
  };

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: MOZEK_SYSTEM_PROMPT,
    tools: [webSearchTool] as unknown as Anthropic.Messages.Tool[],
    messages: [
      {
        role: "user",
        content: buildUserPrompt(options),
      },
    ],
  });

  const rawText = message.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const parsed = extractJsonArray(rawText);
  if (!Array.isArray(parsed)) {
    throw new Error("Parsed model response was not a JSON array.");
  }

  return {
    ideas: parsed as AgentIdeaDraft[],
    model,
    rawText,
  };
}
