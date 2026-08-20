# 🧠 MOZEK — AI Innovation Engine

Autonomní systém, který cronem spouští LLM agenta, jenž pomocí web search
hledá zahraniční trendy a generuje podnikatelské nápady pro Evropu, ukládá
je do Supabase a zobrazuje na webu. Silné nápady (MOZEK SCORE ≥ 70) pošlou
Telegram notifikaci. Celý build spec je v [`CLAUDE.md`](./CLAUDE.md).

## 1. Supabase

1. Založ nový projekt na [supabase.com](https://supabase.com) (free tier stačí).
2. V SQL editoru spusť celý obsah [`supabase/schema.sql`](./supabase/schema.sql).
3. V **Project Settings → API** si zkopíruj `Project URL`, `anon public` klíč
   a `service_role` klíč (tajný, nikdy ho nedávej do frontendu / gitu).

## 2. Telegram bot

1. Založ bota přes [@BotFather](https://t.me/BotFather) → dostaneš `TELEGRAM_BOT_TOKEN`.
2. Napiš svému botovi zprávu, pak zjisti `chat_id` (např. přes
   `https://api.telegram.org/bot<token>/getUpdates` nebo bota @userinfobot).

## 3. Gemini API klíč (zdarma)

Vytvoř klíč zdarma (bez karty) na [aistudio.google.com/apikey](https://aistudio.google.com/apikey) →
`GEMINI_API_KEY`. Agent používá model `gemini-3.6-flash` (nejštědřejší
free tier). Free tier má denní/minutové limity requestů — při 2–4 bězích
denně je s rezervou dostatečný; kdyby Google limity/název modelu časem
změnil, uprav `GEMINI_MODEL` v env proměnných (aktuální nabídku modelů
vidíš na [aistudio.google.com/rate-limit](https://aistudio.google.com/rate-limit)).

## 4. Tavily API klíč (zdarma) — web search pro agenta

Gemini má sice vlastní Google Search nástroj, ale ten (na rozdíl od
samotného modelu) vyžaduje propojenou platební kartu i na svém "free"
tieru — ověřeno naostro, bez karty vrací chybu 429. Proto agent pro
vyhledávání používá [Tavily](https://tavily.com), který má opravdový
free tier bez karty (1000 hledání/měsíc, s rezervou stačí na 2–4 běhy
denně). Založ si účet na [app.tavily.com](https://app.tavily.com)
(stačí e-mail nebo Google/GitHub) a zkopíruj klíč → `TAVILY_API_KEY`.

## 5. Env proměnné

```
cp .env.example .env.local
```
a vyplň hodnoty z kroků 1–4. `.env.local` čte jak `next dev`, tak
`npm run agent:run` (explicitně přes `dotenv`, viz `scripts/run-agent.ts`).

## 6. Instalace a lokální běh

```bash
npm install
npm run dev              # web na http://localhost:3000
npm run agent:run        # jeden ruční běh agenta (zapíše nápady do DB)
npm run typecheck        # tsc --noEmit
npm run build            # produkční build
```

Doporučený první krok po nastavení env: spusť `npm run agent:run` ručně a
zkontroluj v Supabase Table Editoru, že se v `ideas` objevily nové řádky a
v `agent_runs` přibyl řádek se `status = success`.

## 7. Cron (automatické spouštění 2–4x denně)

Řešeno přes GitHub Actions: [`../.github/workflows/mozek-agent-cron.yml`](../.github/workflows/mozek-agent-cron.yml)
(workflow soubory musí být v kořeni repa, ne v `/mozek`). Spouští se v
6:00 a 16:00 UTC (2x/den kvůli dennímu limitu Gemini free tieru — viz
`.github/workflows/mozek-agent-cron.yml`) a dá se spustit i ručně (`workflow_dispatch`).

V nastavení repozitáře (**Settings → Secrets and variables → Actions**)
přidej:
- **Secrets**: `GEMINI_API_KEY`, `TAVILY_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- **Variables** (nepovinné): `GEMINI_MODEL`, `NEXT_PUBLIC_WEB_URL`

Alternativa: Vercel Cron Jobs (zavolat endpoint, který uvnitř spustí
stejnou logiku jako `scripts/run-agent.ts`) — pokud nasazuješ web na
Vercel a chceš mít cron na stejném místě.

## 8. Nasazení webu

Web je čistý Next.js App Router projekt, jde nasadit na Vercel/Netlify:
- Root directory: `mozek`
- Build command: `npm run build`
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (pro `/api/ideas/*` route handlery),
  `NEXT_PUBLIC_WEB_URL`

## Struktura projektu

```
mozek/
  app/                    Next.js stránky (dashboard, detail, filtr, moje) + API routes
  components/             Sdílené UI komponenty
  lib/                    Supabase klienti, typy, agent, telegram, scoring, filtrování
  scripts/run-agent.ts    Cron entrypoint
  supabase/schema.sql     DB schéma
  CLAUDE.md               Build spec + mapa spec → kód
```
