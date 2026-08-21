-- MOZEK — Autonomous Innovation & Business Opportunity Engine
-- Database schema. Run this once against a fresh Supabase (Postgres) project.

create extension if not exists "pgcrypto";

-- ============================================================
-- ideas — every business opportunity the agent generates
-- ============================================================
create table if not exists ideas (
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

create index if not exists ideas_mozek_score_idx on ideas (mozek_score desc);
create index if not exists ideas_date_generated_idx on ideas (date_generated desc);
create index if not exists ideas_category_idx on ideas (category);
create index if not exists ideas_priority_idx on ideas (priority);
create index if not exists ideas_is_favorite_idx on ideas (is_favorite);
create index if not exists ideas_is_archived_idx on ideas (is_archived);
create index if not exists ideas_user_category_idx on ideas (user_category);

-- Fulltext search index over the fields the UI searches (title/problem/solution/one_liner)
create index if not exists ideas_fulltext_idx on ideas
  using gin (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(one_liner, '') || ' ' ||
      coalesce(problem, '') || ' ' || coalesce(solution, '')
    )
  );

create or replace function ideas_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists ideas_updated_at on ideas;
create trigger ideas_updated_at
  before update on ideas
  for each row
  execute function ideas_set_updated_at();

-- ============================================================
-- agent_runs — log of every agent execution, for the dashboard
-- ============================================================
create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms int,
  ideas_generated int default 0,
  ideas_inserted int default 0,
  ideas_flagged_strong int default 0,
  status text default 'running', -- running / success / error
  error_message text,
  model text,
  created_at timestamptz default now()
);

create index if not exists agent_runs_started_at_idx on agent_runs (started_at desc);

-- ============================================================
-- Row Level Security
-- Reads are public (the dashboard is read-only for anonymous visitors);
-- writes go through the service-role key only (agent script + API routes).
-- ============================================================
alter table ideas enable row level security;
alter table agent_runs enable row level security;

drop policy if exists "public read ideas" on ideas;
create policy "public read ideas" on ideas
  for select using (true);

drop policy if exists "public read agent_runs" on agent_runs;
create policy "public read agent_runs" on agent_runs
  for select using (true);

-- No insert/update/delete policies are defined for anon/authenticated roles,
-- so all writes must go through the Supabase service-role key (server-side only).

-- ============================================================
-- waitlist_signups — early-access email capture on the landing page.
-- Paid access (subscription) isn't built yet; this collects interest in
-- the meantime. Written only via the service-role key (app/api/waitlist).
-- ============================================================
create table if not exists waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz default now()
);

create index if not exists waitlist_signups_created_at_idx on waitlist_signups (created_at desc);

alter table waitlist_signups enable row level security;
-- No select/insert policies for anon/authenticated — only the service-role
-- key (server-side, app/api/waitlist/route.ts) can read or write this table.
