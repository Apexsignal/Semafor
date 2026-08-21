// Shared types mirroring /supabase/schema.sql. Keep in sync by hand —
// there's no codegen step in this project.

export type Priority =
  | "IMMEDIATE"
  | "HIGH_POTENTIAL"
  | "WATCH"
  | "EXPERIMENT"
  | "LOW_POTENTIAL";

export type UserFeedback =
  | "ZAJIMAVE"
  | "FAVORIT"
  | "CHCI_POSTAVIT"
  | "NEZAJIMA"
  | "ZAMITNUTO";

export const USER_FEEDBACK_VALUES: UserFeedback[] = [
  "ZAJIMAVE",
  "FAVORIT",
  "CHCI_POSTAVIT",
  "NEZAJIMA",
  "ZAMITNUTO",
];

export const PRIORITY_VALUES: Priority[] = [
  "IMMEDIATE",
  "HIGH_POTENTIAL",
  "WATCH",
  "EXPERIMENT",
  "LOW_POTENTIAL",
];

export interface EuropeTransfer {
  target_country?: string;
  why?: string;
  adaptations_needed?: string;
  legal_notes?: string;
}

// New ideas get a timeline (6 měsíců / 1 rok / 3 roky) per scenario;
// older DB rows still hold the flat string this replaced. Both render fine.
export interface RevenueTimeline {
  month_6?: string;
  year_1?: string;
  year_3?: string;
}

export interface RevenueScenarios {
  conservative?: string | RevenueTimeline;
  realistic?: string | RevenueTimeline;
  ambitious?: string | RevenueTimeline;
}

export interface Idea {
  id: string;
  date_generated: string;
  title: string;
  one_liner: string;
  category: string | null;
  is_b2b: boolean | null;

  source_region: string | null;
  source_example: string | null;
  europe_transfer: EuropeTransfer | null;

  problem: string | null;
  solution: string | null;
  target_customer: string | null;
  demand_evidence: string | null;
  competition: string | null;
  our_advantage: string | null;

  pros: string[] | null;
  cons: string[] | null;
  risks: string[] | null;

  monetization_model: string | null;
  price_estimate: string | null;
  revenue_scenarios: RevenueScenarios | null;

  difficulty_score: number | null;
  difficulty_reasoning: string | null;
  tech_stack: string[] | null;
  team_needed: string | null;
  time_to_mvp: string | null;

  mvp_cost_czk: string | null;
  monthly_cost_czk: string | null;
  cost_reasoning: string | null;

  build_steps: string[] | null;
  first_10_customers: string | null;
  first_100_customers: string | null;
  marketing_channels: string[] | null;
  scaling_plan: string | null;

  score_problem: number | null;
  score_market_size: number | null;
  score_monetization: number | null;
  score_competition: number | null;
  score_mvp_simplicity: number | null;
  score_speed: number | null;
  score_trend: number | null;
  score_scalability: number | null;
  score_europe_potential: number | null;
  mozek_score: number | null;

  priority: Priority | null;
  flag_strong: boolean;

  sources_checked: string[] | null;
  user_feedback: UserFeedback | null;
  is_favorite: boolean;
  is_archived: boolean;
  user_category: string | null;
  created_at: string;
  updated_at: string;

  reserved_by_user_id: string | null;
  reserved_at: string | null;
  is_free_sample: boolean;
}

export type SubscriptionStatus = "incomplete" | "active" | "past_due" | "canceled";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export type PurchaseType = "reservation" | "build";
export type PurchaseStatus = "pending" | "paid" | "failed" | "refunded";

export interface Purchase {
  id: string;
  user_id: string;
  type: PurchaseType;
  idea_id: string | null;
  amount_czk: number | null;
  stripe_payment_intent_id: string | null;
  status: PurchaseStatus;
  created_at: string;
}

// Fields the agent produces per idea, before scoring/priority are computed
// server-side by lib/scoring.ts and before DB defaults are applied.
export type AgentIdeaDraft = Omit<
  Idea,
  | "id"
  | "date_generated"
  | "mozek_score"
  | "priority"
  | "flag_strong"
  | "user_feedback"
  | "is_favorite"
  | "is_archived"
  | "user_category"
  | "created_at"
  | "updated_at"
  | "reserved_by_user_id"
  | "reserved_at"
  | "is_free_sample"
>;

export interface AgentRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  ideas_generated: number;
  ideas_inserted: number;
  ideas_flagged_strong: number;
  status: "running" | "success" | "error";
  error_message: string | null;
  model: string | null;
  created_at: string;
}
