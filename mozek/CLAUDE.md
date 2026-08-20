# MOZEK — Autonomous Innovation & Business Opportunity Engine

Tento dokument je build spec pro Claude Code. Cíl: postavit celý funkční
systém — AI agent, databázi, web a Telegram bota — ne jen system prompt.

---

## 0) CO SE STAVÍ (shrnutí)

Autonomní systém, který:
1. Automaticky (cron, ne na vyžádání) spouští LLM agenta "Mozek", který
   pomocí web search hledá zahraniční trendy (primárně USA, UK, Austrálie, cina, japonsko)
   a generuje 1–50 kvalitních podnikatelských nápadů denně.
2. Každý nápad ukládá do databáze v přesně definované struktuře (viz níže).
3. Nápady jsou dostupné na webu — dashboard, filtrování, vyhledávání,
   detail stránka projektu.
4. Uživatel může projekty hodnotit (❤️ / ⭐ / 🚀 / ❌ / 🗑) a systém se
   z toho postupně učí, co dál generovat.
5. Při nálezu silného projektu (MOZEK SCORE ≥ 70) pošle Telegram notifikaci.

---

## 1) TECH STACK

- **Backend / DB**: Supabase (Postgres + REST API + Auth zdarma tier)
- **Frontend**: Next.js (App Router) + Tailwind
- **AI volání**: Anthropic API (Claude), s web search tool zapnutým
- **Scheduler**: Vercel Cron / GitHub Actions scheduled workflow (spouští
  agenta 2–4x denně, ne 1x — kvůli čerstvosti zdrojů)
- **Telegram**: Telegram Bot API (jednoduchý HTTPS POST, žádná knihovna
  není nutná)
- **Hosting**: Vercel/Netlify pro web, serverless funkce pro agent běh

> **Změna po prvním nasazení:** místo placeného Anthropic API (Claude) se
> skutečně používá **Google Gemini API** (`gemini-3.6-flash`, `lib/agent.ts`)
> — má trvalý free tier bez karty (klíč z aistudio.google.com).
> `ANTHROPIC_API_KEY`/`ANTHROPIC_MODEL` v textu níže tedy odpovídají
> `GEMINI_API_KEY`/`GEMINI_MODEL` ve skutečném kódu — viz `.env.example`.
>
> **Druhá změna:** Gemini má sice vlastní Google Search grounding tool, ale
> ten (ověřeno naostro) vrací HTTP 429, pokud projekt nemá propojenou
> platební kartu — na rozdíl od čistého generování textu to na free tieru
> bez karty vůbec nefunguje. Web search je proto implementovaný jako
> vlastní function-calling tool (`web_search`) napojený na
> [Tavily](https://tavily.com), který má opravdový bezkartový free tier
> (1000 hledání/měsíc). Viz `TAVILY_API_KEY` v `.env.example` a
> `tavilySearch()`/`webSearchDeclaration` v `lib/agent.ts`.

Postav to jako jeden monorepo projekt:
```
/mozek
  /app                 -> Next.js frontend (dashboard, detail, filtrování)
  /lib/agent.ts         -> volání Claude API + web search + zápis do DB
  /lib/telegram.ts       -> odeslání notifikace
  /lib/supabase.ts       -> klient + queries
  /scripts/run-agent.ts  -> entrypoint spouštěný cronem
  /supabase/schema.sql   -> DB schéma (viz sekce 3)
  CLAUDE.md              -> tento soubor
```

---

## 2) AGENT SYSTEM PROMPT (vlož do volání Claude API v `/lib/agent.ts`)

```
Jsi MOZEK — autonomní AI inovační agent. Nejsi chatbot čekající na otázku.
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
micro-SaaS / fyzický produkt / digitální produkt.

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

## VÝSTUP
Vrať POUZE validní JSON pole objektů přesně podle schématu (viz níže),
nic jiného mimo JSON.
```

Skutečný system prompt použitý v kódu (`lib/agent.ts`, export `MOZEK_SYSTEM_PROMPT`)
je rozšířený o explicitní JSON schéma jednoho nápadu a o instrukci k
9 dílčím skóre (viz sekce 3 a `lib/scoring.ts`) — obsahově jde o totéž.

**Uživatelské zpřesnění zadání (přidáno po prvním nasazení):** agent smí
generovat jen appky/služby (software), ne fyzické produkty, a jen nápady
s nízkým rozpočtem na MVP a týmovou potřebou 1–2 lidí, kteří to postaví
sami — bez investora, bez najímání, bez výrobního partnera. V promptu jde
o sekci `## TVRDÉ OMEZENÍ ZADÁNÍ` a je to vylučovací filtr (nápad, který
podmínky nesplňuje, se do výstupu vůbec nedostane), ne jen bonus do skóre.

**Druhé zpřesnění:** zahraniční trendy (web search) jsou zdroj inspirace
a ověření poptávky, ne povinná šablona "existuje to v USA, zkopírujme to".
Hlavní hodnota nápadu je v tom, že ho MOZEK doopravdy rozpracuje — pole
"solution" má popisovat konkrétní fungování produktu, ne jen obecnou
větu. Sekce `## ROZPRACOVÁNÍ NÁPADU` v promptu tohle vynucuje a
"europe_transfer"/"source_example" jsou teď nepovinné (null), pokud
nápad není přímým přenosem jednoho konkrétního zahraničního produktu,
ale vlastní syntézou/inovací.

---

## 3) DATABÁZOVÉ SCHÉMA (`/supabase/schema.sql`)

```sql
create table ideas (
  id uuid primary key default gen_random_uuid(),
  date_generated date not null default current_date,
  title text not null,
  one_liner text not null,
  category text, -- SaaS / mobilní app / marketplace / AI nástroj / fyzický produkt / služba
  is_b2b boolean,

  -- Zdroj a mezera
  source_region text,          -- USA / UK / Austrálie / ...
  source_example text,         -- konkrétní existující produkt tam
  europe_transfer jsonb,        -- {target_country, why, adaptations_needed, legal_notes}

  -- Analýza
  problem text,
  solution text,
  target_customer text,
  demand_evidence text,         -- FAKT / ODHAD / HYPOTÉZA + popis důkazu
  competition text,
  our_advantage text,

  pros text[],
  cons text[],
  risks text[],

  -- Monetizace
  monetization_model text,
  price_estimate text,
  revenue_scenarios jsonb,      -- {conservative, realistic, ambitious}

  -- Technická náročnost
  difficulty_score int,         -- 1-10
  difficulty_reasoning text,
  tech_stack text[],
  team_needed text,
  time_to_mvp text,

  -- Finance
  mvp_cost_czk text,
  monthly_cost_czk text,
  cost_reasoning text,

  -- Go-to-market
  build_steps text[],
  first_10_customers text,
  first_100_customers text,
  marketing_channels text[],
  scaling_plan text,

  -- Skóre
  score_problem int,
  score_market_size int,
  score_monetization int,
  score_competition int,
  score_mvp_simplicity int,
  score_speed int,
  score_trend int,
  score_scalability int,
  score_europe_potential int,
  mozek_score int,              -- 0-100 celkem

  priority text,                -- IMMEDIATE / HIGH_POTENTIAL / WATCH / EXPERIMENT / LOW_POTENTIAL
  flag_strong boolean default false, -- true když mozek_score >= 70 -> Telegram

  sources_checked text[],
  user_feedback text,           -- ZAJIMAVE / FAVORIT / CHCI_POSTAVIT / NEZAJIMA / ZAMITNUTO / null
  is_favorite boolean default false,   -- ⭐ rychlé oblíbené, nezávislé na user_feedback
  is_archived boolean default false,   -- "smazání" = soft delete, ať se dá vrátit zpět
  user_category text,                  -- vlastní kategorie/složka, kterou si uživatel pojmenuje sám
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on ideas (mozek_score desc);
create index on ideas (date_generated desc);
create index on ideas (category);
create index on ideas (priority);
create index on ideas (is_favorite);
create index on ideas (is_archived);
create index on ideas (user_category);
```

Skutečné schéma v `supabase/schema.sql` navíc obsahuje tabulku `agent_runs`
(log běhů agenta, sekce 4 bod 7), fulltext index, `updated_at` trigger a
RLS politiky (veřejné čtení, zápis jen přes service-role klíč).

---

## 4) BACKEND LOGIKA (`/scripts/run-agent.ts`)

1. Načti z DB posledních ~200 `title` + `one_liner` (pro deduplikaci).
2. Zavolej Claude API se system promptem ze sekce 2, web search tool
   zapnutý, do promptu vlož seznam existujících nápadů.
3. Naparsuj JSON odpověď, pro každý nápad dopočítej `mozek_score` jako
   součet 9 dílčích skóre (viz schéma) a urči `priority` podle score:
   - ≥ 85 → IMMEDIATE
   - 70–84 → HIGH_POTENTIAL
   - 50–69 → WATCH
   - 30–49 → EXPERIMENT
   - < 30 → LOW_POTENTIAL
4. Nastav `flag_strong = true` pokud `mozek_score >= 70`.
5. Ulož všechny nápady do Supabase (`insert`, nikdy `delete`/`update`
   existujících záznamů kromě `user_feedback`).
6. Pro každý nový záznam s `flag_strong = true` zavolej `/lib/telegram.ts`.
7. Zaloguj běh (počet vygenerovaných nápadů, čas běhu) do jednoduché
   tabulky `agent_runs` pro přehled v dashboardu.

---

## 5) TELEGRAM (`/lib/telegram.ts`)

Env proměnné: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

Formát zprávy (Markdown):
```
🧠 MOZEK NAŠEL NOVÝ PROJEKT

🚀 {title}

Problém: {problem}
Řešení: {solution}
Pro koho: {target_customer}
Monetizace: {monetization_model}

💰 MVP: {mvp_cost_czk} Kč
⏱ Čas: {time_to_mvp}
🔥 MOZEK SCORE: {mozek_score}/100
⚠️ Hlavní riziko: {risks[0]}

👉 {WEB_URL}/napad/{id}
```

---

## 6) FRONTEND — STRÁNKY

### `/` — Dashboard
- Header: 🧠 MOZEK — AI Innovation Engine
- Statistiky: celkem projektů / projekty dnes / průměrné MOZEK SCORE /
  nejlevnější projekt / nejjednodušší projekt / počet IMMEDIATE
- "MOZEK DAILY" box s dnešním datem a TOP 5 dne (viz níže)
- Seznam karet nápadů (title, one_liner, mozek_score, priority badge,
  difficulty, mvp_cost) — klik → detail

### `/napad/[id]` — Detail projektu
Zobraz všechna pole ze schématu čitelně rozdělená do sekcí: Přehled,
Problém & řešení, Trh & konkurence, Monetizace & scénáře příjmů,
Technická náročnost, Finance, Go-to-market, Rizika, Skóre (rozpad 9
kategorií + celkové), Zdroje. Tlačítka pro `user_feedback`
(❤️ ⭐ 🚀 ❌ 🗑) ukládající zpět do DB. Navíc: tlačítko ⭐ oblíbit
(`is_favorite`), dropdown pro přiřazení do vlastní kategorie
(`user_category`) a tlačítko 🗑 Smazat (soft delete → `is_archived = true`,
nemaže se natvrdo).

### `/filtr` nebo filtr přímo na dashboardu
Filtrování podle: score rozsah, země inspirace, kategorie, B2B/B2C,
náklady rozsah, obtížnost, čas do MVP, priorita, datum, vlastní kategorie,
jen oblíbené.
Fulltext vyhledávání nad title/problem/solution (Postgres `ilike` nebo
Supabase full-text search) — podpoř dotazy typu "projekty do 100 000 Kč",
"AI projekty", "projekty do 30 dní" jednoduchým parserem klíčových slov
nad filtry (nemusí to být NLP, stačí keyword matching na existující sloupce).

### `/moje` — Moje nápady (správa)
Osobní pohled na celou databázi, kde uživatel nápady prochází a spravuje:
- **Řazení**: podle mozek_score, data přidání, obtížnosti, MVP nákladů
  (přepínač vzestupně/sestupně).
- **Kategorie**: nápady jde přetáhnout/přiřadit do vlastních kategorií
  (`user_category`) — např. "chci postavit", "sledovat", "zahodit".
  Zobraz je jako záložky/sloupce (podobně jako Kanban).
- **Oblíbené**: záložka jen s `is_favorite = true`.
- **Mazání**: tlačítko 🗑 u každé karty i hromadně (checkbox výběr více
  karet najednou) — vždy soft delete (`is_archived = true`). Přidej
  záložku "Koš" se seznamem archivovaných a možností trvale smazat nebo
  obnovit.
- Karty lze přepínat mezi zobrazením mřížka/seznam.
- Výchozí dotazy na dashboardu (`/`) i v seznamu `/napad` musí filtrovat
  `is_archived = false`, aby smazané nápady nezavazely v běžném přehledu.

---

## 7) UČENÍ ZE ZPĚTNÉ VAZBY

Když uživatel označí `user_feedback = ZAMITNUTO` nebo `NEZAJIMA`, při
příštím běhu agenta pošli do promptu i krátký souhrn odmítnutých kategorií/
regionů z posledních 30 dní, ať se agent přizpůsobí (např. "uživatel
opakovaně odmítá fyzické produkty vyžadující výrobu — omez jejich podíl").
Toto shrnutí generuj jednoduchým SQL group-by, ne dalším LLM voláním.

---

## 8) POŘADÍ IMPLEMENTACE (udělej v tomto pořadí)

1. Supabase projekt + schema.sql
2. `/lib/agent.ts` + `/scripts/run-agent.ts` — ověř ručním spuštěním, že
   se do DB zapíší validní řádky
3. `/lib/telegram.ts` — ověř na jednom testovacím nápadu
4. Next.js dashboard (`/`) napojený na Supabase read
5. Detail stránka (`/napad/[id]`)
6. Filtrování a vyhledávání
7. Cron (Vercel Cron nebo GitHub Actions) — spouštění 2–4x denně
8. Feedback tlačítka + logika učení v promptu

Po každém kroku dodej funkční, nahratelný stav (ne rozpracovaný kód).

---

## 9) STAV IMPLEMENTACE / MAPA SOUBORŮ

Vše z bodů 1–8 je implementováno. Rychlá mapa spec → kód:

| Spec | Soubor |
|---|---|
| DB schéma (3) | `supabase/schema.sql` (+ `agent_runs`, RLS, fulltext index) |
| Sdílené typy | `lib/types.ts` |
| Supabase klienti | `lib/supabase.ts` (anon = read, service-role = write) |
| Skórování (4.3–4.4) | `lib/scoring.ts` |
| Učení ze zpětné vazby (7) | `lib/feedbackSummary.ts` |
| Agent + web search (2) | `lib/agent.ts` |
| Telegram (5) | `lib/telegram.ts` |
| Cron entrypoint (4) | `scripts/run-agent.ts` |
| GitHub Actions cron (1, 8.7) | `../.github/workflows/mozek-agent-cron.yml` (repo root — GH Actions musí být tam) |
| Dashboard (6 `/`) | `app/page.tsx`, `lib/stats.ts`, `components/StatsBar.tsx` |
| Detail (6 `/napad/[id]`) | `app/napad/[id]/page.tsx`, `components/FeedbackButtons.tsx`, `components/DetailSections.tsx` |
| Filtr + fulltext (6 `/filtr`) | `app/filtr/page.tsx`, `components/FilterBar.tsx`, `lib/queryIdeas.ts`, `lib/naturalQuery.ts`, `lib/parseEstimates.ts` |
| Moje nápady / Kanban / Koš (6 `/moje`) | `app/moje/page.tsx`, `components/MojeBoard.tsx`, `components/MojeCard.tsx` |
| Feedback/favorite/archive API | `app/api/ideas/[id]/route.ts`, `app/api/ideas/bulk/route.ts` |

Pro lokální/nasazovací kroky viz `README.md` v tomto adresáři.
