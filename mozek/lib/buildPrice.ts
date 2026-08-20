// Estimated price for having this idea built to order (freelancer or small
// agency) instead of DIY — the pricing methodology worked out with the user:
// convert the agent's own time/difficulty estimate into billable hours, price
// those at freelancer/agency rates with a safety margin, then apply a
// value-based floor so a project with big projected revenue never prices
// under what it's actually worth to build.
//
// Rates and multipliers below are ODHAD (estimates), not verified market
// data — worth checking against a few real quotes before using these
// numbers in an actual client-facing offer.

import { extractMaxDays, extractMaxNumber } from "./parseEstimates";
import type { RevenueScenarios } from "./types";

const SOLO_HOURS_PER_WEEK = 25;
const FREELANCER_RATE_CZK = 1200;
const AGENCY_RATE_CZK = 2200;
const SAFETY_MARGIN = 1.3;
const VALUE_FLOOR_PCT = 0.15;
const AGENCY_VALUE_FLOOR_MULTIPLIER = 1.6;
const ROUND_TO_CZK = 5000;

function difficultyMultiplier(score: number | null | undefined): number {
  const s = score ?? 5;
  if (s <= 3) return 1.0;
  if (s <= 6) return 1.15;
  return 1.35;
}

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** Pulls a number out of whichever shape revenue_scenarios.realistic has. */
function realisticRevenueNumber(scenarios: RevenueScenarios | null | undefined): number | null {
  const realistic = scenarios?.realistic;
  if (!realistic) return null;
  const text = typeof realistic === "string" ? realistic : realistic.year_1;
  return extractMaxNumber(text ?? null);
}

export interface BuildPriceEstimate {
  freelancer_czk: number;
  agency_czk: number;
}

export function estimateBuildPrice(idea: {
  time_to_mvp: string | null;
  difficulty_score: number | null;
  revenue_scenarios: RevenueScenarios | null;
}): BuildPriceEstimate | null {
  const days = extractMaxDays(idea.time_to_mvp);
  if (days == null) return null;

  const weeks = days / 7;
  const estimatedHours = weeks * SOLO_HOURS_PER_WEEK * difficultyMultiplier(idea.difficulty_score);

  let freelancer = roundToNearest(estimatedHours * FREELANCER_RATE_CZK * SAFETY_MARGIN, ROUND_TO_CZK);
  let agency = roundToNearest(estimatedHours * AGENCY_RATE_CZK * SAFETY_MARGIN, ROUND_TO_CZK);

  const revenueSignal = realisticRevenueNumber(idea.revenue_scenarios);
  if (revenueSignal != null) {
    const valueFloor = roundToNearest(revenueSignal * VALUE_FLOOR_PCT, ROUND_TO_CZK);
    freelancer = Math.max(freelancer, valueFloor);
    agency = Math.max(agency, roundToNearest(valueFloor * AGENCY_VALUE_FLOOR_MULTIPLIER, ROUND_TO_CZK));
  }

  return { freelancer_czk: freelancer, agency_czk: agency };
}
