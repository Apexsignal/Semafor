import Anthropic from "@anthropic-ai/sdk";
import {
  ApiError,
  GoogleGenAI,
  Type,
  type Content,
  type FunctionDeclaration,
  type GenerateContentResponse,
  type Part,
} from "@google/genai";
import type { AgentIdeaDraft } from "./types";
import { sendProviderFallbackAlert } from "./telegram";

export const MOZEK_SYSTEM_PROMPT = `Jsi MOZEK — autonomní AI inovační agent. Nejsi chatbot čekající na otázku
a nejsi ani jen "trend-spotter", co opisuje, co dělají firmy v zahraničí.
Tvůj hlavní úkol je TVOŘIT — vzít námět (vlastní nebo inspirovaný něčím,
co najdeš přes web search) a doopravdy ho ROZPRACOVAT do promyšleného,
konkrétního produktového konceptu. Zahraniční trendy jsou zdroj inspirace
a ověření poptávky, ne povinná šablona "tohle existuje v USA, zkopírujme
to" — u každého nápadu má být vidět tvoje vlastní přemýšlení navíc.

## GEOGRAFICKÉ ZAMĚŘENÍ (pro inspiraci a ověření poptávky)
Tier 1 (hlavní zdroj): USA, Velká Británie, Austrálie
Tier 2: Kanada, Německo, Nizozemsko, Švédsko, Dánsko, Singapur, Japonsko
Tier 3: zbytek světa

## KDE HLEDAT INSPIRACI A DŮKAZY POPTÁVKY
Product Hunt, TechCrunch, Reddit (r/SaaS, r/Entrepreneur, r/startups),
Y Combinator / AngelList novinky, Crunchbase, App Store "New & Noteworthy"
v US/UK/AUS regionu, Kickstarter/Indiegogo, recenze produktů, diskusní fóra.
POUŽÍVEJ WEB SEARCH — negeneruj z paměti, ověřuj aktuální stav. Web search
slouží ke dvěma věcem: (1) najít podnět/inspiraci a (2) ověřit, že problém
je reálný a lidi si na něj stěžují nebo za podobné řešení platí. Nemusí
vždy existovat jeden konkrétní zahraniční produkt, který kopíruješ — klidně
zkombinuj víc slabých signálů (stížnosti, recenze, diskuze) do vlastního
nápadu.

## ZÁKLADNÍ PRINCIP
Nehledáš "cool nápady". Hledáš: PROBLÉM → ŘEŠENÍ → POPTÁVKA → MONETIZACE.
Pro každý nápad se ptej:
- Jaký problém řeší a komu konkrétně vadí?
- Jak se řeší dnes a proč je to řešení nedostatečné?
- Proč by někdo použil právě tohle?
- Kolik lidí/firem má tento problém a kolik by za řešení zaplatili?

## ROZPRACOVÁNÍ NÁPADU — tohle je nejdůležitější část
Nestačí napsat "existuje X v USA, uděláme to samé v ČR". Pole "solution"
musí popisovat SKUTEČNÝ, promyšlený produkt:
- Co přesně uživatel udělá krok za krokem, když appku/službu použije?
- Jaká je klíčová funkce nebo mechanika, díky které to řeší problém lépe
  nebo jinak než dnešní alternativy (včetně toho zahraničního vzoru,
  pokud z něj vycházíš)?
- Co jsi k původnímu podnětu přidal, zjednodušil, zkombinoval nebo
  vynechal, aby to šlo postavit jako levné MVP jedním člověkem/dvojicí
  (viz TVRDÉ OMEZENÍ ZADÁNÍ níže) a přitom to dávalo smysl na evropském
  trhu?
Pokud u nápadu není jasné, v čem je rozpracovaný/promyšlený nad rámec
"viděl jsem to na Product Huntu", nápad nedávej do výstupu.

## TYPY NÁPADŮ (generuj napříč všemi)
Vlastní/originální nápad rozpracovaný agentem / výrazně lepší nebo jinak
pojatá verze existujícího produktu / promyšlená evropská varianta
zahraničního trendu / AI automatizace ruční práce / B2B nástroje /
B2C nástroje / marketplace / micro-SaaS / digitální produkt.

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
- Pokud nápad vychází z konkrétního zahraničního vzoru, vždy zanalyzuj
  přenositelnost do Evropy: do které země, proč, jaké úpravy/lokalizace/
  legislativa (pole "europe_transfer"). Pokud je nápad vlastní/originální
  syntéza bez jednoho konkrétního zahraničního vzoru, nech "europe_transfer"
  na null a "source_example" popiš jako inspiraci obecněji (nebo taky null).

## SCÉNÁŘE PŘÍJMŮ V ČASE
Pole "revenue_scenarios" má u každého ze 3 scénářů (conservative/realistic/
ambitious) objekt se třemi časovými horizonty: "month_6", "year_1", "year_3"
(6 měsíců, 1 rok a 3 roky od spuštění MVP). U každé hodnoty uveď číslo
(MRR nebo celkové tržby, s jednotkou) a napiš "ODHAD" — je to vždy jen
odhad, nikdy fakt. Buď realistický o tempu růstu, ne hokejková hůl — u
konzervativního scénáře je naprosto v pořádku napsat u year_3 něco jako
"produkt stagnuje/nepřežije v této podobě", pokud to dává reálný smysl,
místo aby ses snažil za každou cenu vymyslet růst.

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
  "revenue_scenarios": {
    "conservative": { "month_6": string, "year_1": string, "year_3": string },
    "realistic": { "month_6": string, "year_1": string, "year_3": string },
    "ambitious": { "month_6": string, "year_1": string, "year_3": string }
  },
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

export const MOZEK_REVIEW_SYSTEM_PROMPT = `Jsi kontrolor kvality pro MOZEK, AI agenta, co právě vygeneroval dávku
podnikatelských nápadů. Dostaneš JSON pole těch nápadů (každý má "index").
Tvým úkolem je každý nápad kriticky zkontrolovat — NE znovu ho vymýšlet,
jen posoudit, jestli obstojí — a rozhodnout jeden ze tří verdiktů:

- "OK": nápad je konkrétní, realistický, vnitřně konzistentní a splňuje
  tvrdé omezení zadání (viz níže). Nech beze změny.
- "FIX": nápad má konkrétní, opravitelný problém — vágní/obecné pole
  "solution" bez skutečné mechaniky, rozpor mezi poli (např. team_needed
  říká "jen 1 člověk", ale difficulty_reasoning popisuje tým 5 lidí;
  nebo revenue_scenarios má nereálnou hokejovou hůl u konzervativního
  scénáře), duplicitní/přehnaně obecná kategorie apod. Oprav POUZE ta
  konkrétní pole přes "fixed_fields", zbytek nech, jak je.
- "DROP": nápad je nezachranitelný — fyzický produkt (výroba/sklad/
  hardware), reálně vyžaduje investora nebo tým větší než 1-2 lidi, MVP
  rozpočet výrazně přes nízké desítky tisíc Kč, nebo je to jen obecná
  fráze bez skutečného rozpracování ("AI nástroj pro produktivitu" a nic
  konkrétního navíc). Takový nápad úplně vyřaď.

Buď stejně přísný jako při prvotním generování — cílem není nikoho
potěšit ani zachovat co nejvíc nápadů, ale odfiltrovat slabé nebo
nekonzistentní výstupy dřív, než se uloží do databáze. Neopravuj kosmetiku
(styl, délku) — jen věcné problémy.

## TVRDÉ OMEZENÍ ZADÁNÍ (kontroluj proti tomuhle)
Výhradně software (web/mobilní app, SaaS, AI nástroj, digitální služba,
čistě digitální marketplace) — nikdy fyzický produkt. MVP realisticky
postavitelné s nízkým rozpočtem (jednotky až nízké desítky tisíc Kč, NE
statisíce). Tým 1-2 lidí, co to postaví sami — žádný investor, žádné
najímání specialistů/dodavatelů.

## VÝSTUP
Vrať POUZE validní JSON pole, jeden objekt na každý vstupní nápad (stejný
počet, stejné "index"), přesně v tomto tvaru, nic jiného mimo JSON:
[{ "index": number, "verdict": "OK" | "FIX" | "DROP", "reason": string, "fixed_fields": object | null }]

"fixed_fields" u "FIX" obsahuje jen ta pole, která měníš (stejný název a
typ jako v původním schématu nápadu), u "OK"/"DROP" nastav na null.`;

// Claude Sonnet 5 is the primary provider — paid, so no free-tier daily
// quota to work around, giving it a much bigger search budget than Gemini.
const CLAUDE_DEFAULT_MODEL = "claude-sonnet-5";
const CLAUDE_DEFAULT_MAX_WEB_SEARCHES = 15;

// Gemini is the backup provider, used automatically if Claude fails (out of
// credit, bad key, outage) or if ANTHROPIC_API_KEY isn't configured at all.
// Free tier, no credit card required (key from https://aistudio.google.com).
// Google renames/retires Gemini models fairly often — gemini-2.5-flash was
// replaced by gemini-3.6-flash shortly before this was written. Override via
// GEMINI_MODEL without a code change if it happens again; check
// https://aistudio.google.com/rate-limit for the current free-tier lineup.
const GEMINI_DEFAULT_MODEL = "gemini-3.6-flash";
// Free tier also caps this model at 20 requests/DAY (not just per-minute).
// Each search round costs one Gemini call, plus one more for the final
// answer — so this bounds a single run to ~5 Gemini calls, small enough
// that even an all-day string of Claude fallbacks stays inside budget.
const GEMINI_DEFAULT_MAX_WEB_SEARCHES = 4;

const DEFAULT_MAX_TOKENS = 16000;

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
  provider: "claude" | "gemini";
  /** Set when the self-review pass ran; omitted if it errored and was skipped. */
  reviewDropped?: number;
  reviewFixed?: number;
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

// Both providers occasionally emit near-valid JSON that fails to parse —
// seen live: an unescaped quote inside a text field breaks the string mid-
// way through a multi-idea response. Rather than guess at every way an LLM
// can mangle JSON syntax, hand the exact parser error back to the model and
// ask it to resend — it can see precisely what it got wrong.
const MAX_JSON_REPAIR_ATTEMPTS = 2;

async function parseIdeasWithRepair(
  initialRawText: string,
  regenerate: (currentRawText: string, repairInstruction: string) => Promise<string>
): Promise<{ parsed: unknown[]; rawText: string }> {
  let rawText = initialRawText;
  for (let attempt = 0; ; attempt++) {
    try {
      const parsed = extractJsonArray(rawText);
      if (!Array.isArray(parsed)) {
        throw new Error("Parsed model response was not a JSON array.");
      }
      return { parsed, rawText };
    } catch (err) {
      if (attempt >= MAX_JSON_REPAIR_ATTEMPTS) throw err;
      const parseError = err instanceof Error ? err.message : String(err);
      console.warn(
        `[agent] Response wasn't valid JSON (${parseError}), asking the model to resend it fixed (attempt ${attempt + 1}/${MAX_JSON_REPAIR_ATTEMPTS})...`
      );
      rawText = await regenerate(
        rawText,
        `Tvoje předchozí odpověď nebyla platný JSON (chyba parseru: "${parseError}"). Vrať přesně stejný obsah znovu jako jedno kompletní, validní JSON pole — zkontroluj hlavně escapování uvozovek uvnitř textových hodnot (\\") a že je pole na konci správně uzavřené. Nic mimo JSON pole nepiš.`
      );
    }
  }
}

// Neither provider's own built-in web search is usable here: Gemini's
// Google Search grounding requires a billing-enabled Google Cloud project
// even for its nominally-free quota (confirmed live: 429 RESOURCE_EXHAUSTED
// on a plain free-tier key), and Claude's server-side web_search tool works
// but Tavily is already wired up and shared code is simpler than two
// separate search backends. So both providers get the same custom
// function-calling tool backed by Tavily (https://tavily.com), which has a
// genuinely free, no-card tier.
const WEB_SEARCH_FUNCTION_NAME = "web_search";
const WEB_SEARCH_DESCRIPTION =
  "Search the live web for current information — news, product pages, " +
  "forum threads, reviews. Use this whenever you need real, up-to-date " +
  "facts instead of relying on memory.";

const geminiWebSearchDeclaration: FunctionDeclaration = {
  name: WEB_SEARCH_FUNCTION_NAME,
  description: WEB_SEARCH_DESCRIPTION,
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "The search query (English usually finds more, but Czech is fine too).",
      },
    },
    required: ["query"],
  },
};

const claudeWebSearchTool: Anthropic.Tool = {
  name: WEB_SEARCH_FUNCTION_NAME,
  description: WEB_SEARCH_DESCRIPTION,
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query (English usually finds more, but Czech is fine too).",
      },
    },
    required: ["query"],
  },
};

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
}

async function tavilySearch(apiKey: string, query: string): Promise<TavilyResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      max_results: 5,
    }),
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`Tavily search failed (HTTP ${res.status}): ${bodyText.slice(0, 300)}`);
  }
  const data = (await res.json()) as { results?: TavilyResult[] };
  return data.results ?? [];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Google's 429 body embeds e.g. `"retryDelay":"9s"` — pull that out if present. */
function parseRetryDelayMs(message: string): number | null {
  const match = message.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
  if (!match) return null;
  return Math.ceil(Number.parseFloat(match[1]) * 1000);
}

// Free tier: 5 requests/minute per model (confirmed live via 429
// RESOURCE_EXHAUSTED / GenerateRequestsPerMinutePerProjectPerModel-FreeTier).
// Our tool-call loop makes one generateContent call per turn, so both a
// proactive minimum gap between calls and reactive retry-on-429 are needed
// to get through a multi-search run without failing outright.
const MIN_GEMINI_CALL_INTERVAL_MS = 13_000;
const MAX_RATE_LIMIT_RETRIES = 6;

let lastGeminiCallAt = 0;

async function generateContentThrottled(
  client: GoogleGenAI,
  params: Parameters<GoogleGenAI["models"]["generateContent"]>[0]
): Promise<GenerateContentResponse> {
  const wait = MIN_GEMINI_CALL_INTERVAL_MS - (Date.now() - lastGeminiCallAt);
  if (wait > 0) await sleep(wait);

  for (let attempt = 0; ; attempt++) {
    lastGeminiCallAt = Date.now();
    try {
      return await client.models.generateContent(params);
    } catch (err) {
      const isRateLimited = err instanceof ApiError && err.status === 429;
      if (!isRateLimited || attempt >= MAX_RATE_LIMIT_RETRIES) throw err;

      const suggested = err instanceof Error ? parseRetryDelayMs(err.message) : null;
      const delay = suggested ?? Math.min(60_000, 5_000 * 2 ** attempt);
      console.warn(
        `[agent] Gemini rate-limited (429), retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RATE_LIMIT_RETRIES})...`
      );
      await sleep(delay);
    }
  }
}

async function runWithGemini(options: RunAgentOptions): Promise<RunAgentResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY env var.");
  }
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  if (!tavilyApiKey) {
    throw new Error("Missing TAVILY_API_KEY env var.");
  }

  const model = options.model ?? process.env.GEMINI_MODEL ?? GEMINI_DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const maxWebSearches = options.maxWebSearches ?? GEMINI_DEFAULT_MAX_WEB_SEARCHES;

  const client = new GoogleGenAI({ apiKey });

  const contents: Content[] = [{ role: "user", parts: [{ text: buildUserPrompt(options) }] }];

  let searchesUsed = 0;
  let rawText = "";
  // A handful of extra turns beyond the search budget so the model can
  // still produce its final JSON answer after its last search.
  const maxTurns = maxWebSearches + 5;

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await generateContentThrottled(client, {
      model,
      contents,
      config: {
        systemInstruction: MOZEK_SYSTEM_PROMPT,
        tools: [{ functionDeclarations: [geminiWebSearchDeclaration] }],
        maxOutputTokens: maxTokens,
      },
    });

    const calls = response.functionCalls;
    if (!calls || calls.length === 0) {
      rawText = response.text ?? "";
      break;
    }

    const modelParts = response.candidates?.[0]?.content?.parts ?? calls.map((call) => ({ functionCall: call }));
    contents.push({ role: "model", parts: modelParts });

    const responseParts: Part[] = [];
    for (const call of calls) {
      const query = typeof call.args?.query === "string" ? call.args.query : "";
      let output: Record<string, unknown>;
      if (searchesUsed >= maxWebSearches) {
        output = { error: "Search budget for this run is used up — proceed with what you already found." };
      } else {
        searchesUsed++;
        try {
          output = { results: await tavilySearch(tavilyApiKey, query) };
        } catch (err) {
          output = { error: err instanceof Error ? err.message : String(err) };
        }
      }
      responseParts.push({
        functionResponse: {
          id: call.id,
          name: call.name ?? WEB_SEARCH_FUNCTION_NAME,
          response: output,
        },
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  if (!rawText) {
    throw new Error(
      `MOZEK agent did not produce a final answer within ${maxTurns} turns (search/turn budget exhausted).`
    );
  }

  const { parsed, rawText: finalRawText } = await parseIdeasWithRepair(
    rawText,
    async (currentRawText, repairInstruction) => {
      contents.push({ role: "model", parts: [{ text: currentRawText }] });
      contents.push({ role: "user", parts: [{ text: repairInstruction }] });
      const retryResponse = await generateContentThrottled(client, {
        model,
        contents,
        config: {
          systemInstruction: MOZEK_SYSTEM_PROMPT,
          tools: [{ functionDeclarations: [geminiWebSearchDeclaration] }],
          maxOutputTokens: maxTokens,
        },
      });
      return retryResponse.text ?? "";
    }
  );

  return {
    ideas: parsed as AgentIdeaDraft[],
    model,
    rawText: finalRawText,
    provider: "gemini",
  };
}

async function runWithClaude(options: RunAgentOptions): Promise<RunAgentResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY env var.");
  }
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  if (!tavilyApiKey) {
    throw new Error("Missing TAVILY_API_KEY env var.");
  }

  const model = options.model ?? process.env.ANTHROPIC_MODEL ?? CLAUDE_DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const maxWebSearches = options.maxWebSearches ?? CLAUDE_DEFAULT_MAX_WEB_SEARCHES;

  const client = new Anthropic({ apiKey });

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildUserPrompt(options) },
  ];

  let searchesUsed = 0;
  let rawText = "";
  const maxTurns = maxWebSearches + 5;

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      // The system prompt (~2-3k tokens) gets resent every turn of this
      // loop — caching it keeps a multi-search run cheap.
      system: [{ type: "text", text: MOZEK_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      tools: [claudeWebSearchTool],
      messages,
    });

    if (response.stop_reason !== "tool_use") {
      rawText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");
      break;
    }

    messages.push({ role: "assistant", content: response.content });

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      const input = block.input as { query?: unknown } | null;
      const query = typeof input?.query === "string" ? input.query : "";
      let content: string;
      if (searchesUsed >= maxWebSearches) {
        content = JSON.stringify({
          error: "Search budget for this run is used up — proceed with what you already found.",
        });
      } else {
        searchesUsed++;
        try {
          content = JSON.stringify({ results: await tavilySearch(tavilyApiKey, query) });
        } catch (err) {
          content = JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
        }
      }
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content });
    }
    messages.push({ role: "user", content: toolResults });
  }

  if (!rawText) {
    throw new Error(
      `MOZEK agent did not produce a final answer within ${maxTurns} turns (search/turn budget exhausted).`
    );
  }

  const { parsed, rawText: finalRawText } = await parseIdeasWithRepair(
    rawText,
    async (currentRawText, repairInstruction) => {
      messages.push({ role: "assistant", content: currentRawText });
      messages.push({ role: "user", content: repairInstruction });
      const retryResponse = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: [{ type: "text", text: MOZEK_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        tools: [claudeWebSearchTool],
        messages,
      });
      return retryResponse.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");
    }
  );

  return {
    ideas: parsed as AgentIdeaDraft[],
    model,
    rawText: finalRawText,
    provider: "claude",
  };
}

interface ReviewVerdict {
  index: number;
  verdict: "OK" | "FIX" | "DROP";
  reason?: string;
  fixed_fields?: Record<string, unknown> | null;
}

function indexedDraftsForReview(drafts: AgentIdeaDraft[]): Array<AgentIdeaDraft & { index: number }> {
  return drafts.map((draft, index) => ({ index, ...draft }));
}

async function reviewDraftsWithClaude(drafts: AgentIdeaDraft[], model: string): Promise<ReviewVerdict[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY env var.");
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model,
    max_tokens: DEFAULT_MAX_TOKENS,
    system: MOZEK_REVIEW_SYSTEM_PROMPT,
    messages: [{ role: "user", content: JSON.stringify(indexedDraftsForReview(drafts)) }],
  });
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
  const parsed = extractJsonArray(text);
  if (!Array.isArray(parsed)) throw new Error("Review response was not a JSON array.");
  return parsed as ReviewVerdict[];
}

async function reviewDraftsWithGemini(drafts: AgentIdeaDraft[], model: string): Promise<ReviewVerdict[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY env var.");
  const client = new GoogleGenAI({ apiKey });
  const response = await generateContentThrottled(client, {
    model,
    contents: [{ role: "user", parts: [{ text: JSON.stringify(indexedDraftsForReview(drafts)) }] }],
    config: { systemInstruction: MOZEK_REVIEW_SYSTEM_PROMPT, maxOutputTokens: DEFAULT_MAX_TOKENS },
  });
  const parsed = extractJsonArray(response.text ?? "");
  if (!Array.isArray(parsed)) throw new Error("Review response was not a JSON array.");
  return parsed as ReviewVerdict[];
}

function applyReviewVerdicts(
  drafts: AgentIdeaDraft[],
  verdicts: ReviewVerdict[]
): { ideas: AgentIdeaDraft[]; dropped: number; fixed: number } {
  const byIndex = new Map<number, ReviewVerdict>();
  for (const verdict of verdicts) {
    if (typeof verdict.index === "number") byIndex.set(verdict.index, verdict);
  }

  const ideas: AgentIdeaDraft[] = [];
  let dropped = 0;
  let fixed = 0;

  drafts.forEach((draft, index) => {
    // No verdict for this index (parsing mismatch etc.) -> fail open, keep as-is.
    const verdict = byIndex.get(index);
    if (!verdict || verdict.verdict === "OK") {
      ideas.push(draft);
      return;
    }
    if (verdict.verdict === "DROP") {
      dropped++;
      console.log(`[agent] Review DROP #${index} "${draft.title}": ${verdict.reason ?? "no reason given"}`);
      return;
    }
    if (verdict.verdict === "FIX") {
      fixed++;
      console.log(`[agent] Review FIX #${index} "${draft.title}": ${verdict.reason ?? "no reason given"}`);
      ideas.push({ ...draft, ...(verdict.fixed_fields ?? {}) });
      return;
    }
    ideas.push(draft);
  });

  return { ideas, dropped, fixed };
}

/**
 * Second, critical pass over the agent's own output before it's inserted
 * into the DB — drops unsalvageable ideas (physical product, needs a big
 * team/investor, too vague) and fixes small inconsistencies (contradicting
 * fields, unrealistic revenue growth) in place. Runs on the same provider
 * that produced the drafts. Fails open: if the review call itself errors
 * (rate limit, bad JSON, etc.) the original unreviewed drafts are kept
 * rather than losing an otherwise-successful run over a QA step.
 */
async function reviewIdeaDrafts(result: RunAgentResult): Promise<RunAgentResult> {
  if (result.ideas.length === 0) return result;
  try {
    const verdicts =
      result.provider === "claude"
        ? await reviewDraftsWithClaude(result.ideas, result.model)
        : await reviewDraftsWithGemini(result.ideas, result.model);
    const { ideas, dropped, fixed } = applyReviewVerdicts(result.ideas, verdicts);
    console.log(
      `[agent] Self-review via ${result.provider}: ${fixed} fixed, ${dropped} dropped, ${ideas.length}/${result.ideas.length} kept.`
    );
    return { ...result, ideas, reviewDropped: dropped, reviewFixed: fixed };
  } catch (err) {
    console.warn(
      "[agent] Self-review step failed, keeping unreviewed drafts:",
      err instanceof Error ? err.message : String(err)
    );
    return result;
  }
}

/**
 * Claude is the primary provider; Gemini is the automatic backup. If
 * ANTHROPIC_API_KEY isn't set at all, Claude is skipped silently (not
 * configured yet, nothing to alert about). If it IS set but the call fails
 * for any reason (credit ran out, bad key, outage), fall back to Gemini and
 * send a Telegram alert so a human knows to check Claude's billing —
 * otherwise the degradation would be invisible. Whichever provider
 * succeeds also runs a self-review pass (see reviewIdeaDrafts) before the
 * result is returned for insertion into the DB.
 */
export async function runMozekAgent(options: RunAgentOptions): Promise<RunAgentResult> {
  let result: RunAgentResult;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      result = await runWithClaude(options);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.error("[agent] Claude failed, falling back to Gemini:", reason);
      await sendProviderFallbackAlert({
        primaryProvider: "Claude",
        fallbackProvider: "Gemini",
        reason: reason.slice(0, 300),
      });
      result = await runWithGemini(options);
    }
  } else {
    result = await runWithGemini(options);
  }
  return reviewIdeaDrafts(result);
}
