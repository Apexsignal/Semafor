// mvp_cost_czk and time_to_mvp are free-form text (the agent writes things
// like "80 000 – 150 000" or "6-8 týdnů"), so exact filtering needs a
// best-effort numeric read rather than a real column. Used to apply
// cost/time range filters client- and server-side after the DB query.

export function extractMaxNumber(text: string | null | undefined): number | null {
  if (!text) return null;
  const matches = text.match(/\d[\d\s.,]*\d|\d/g);
  if (!matches) return null;
  const nums = matches
    .map((m) => parseInt(m.replace(/[\s.,]/g, ""), 10))
    .filter((n) => Number.isFinite(n));
  if (nums.length === 0) return null;
  return Math.max(...nums);
}

const DAYS_UNIT_RE = /(den|dny|dní|day|days|týden|týdny|týdnů|week|weeks|měsíc|měsíce|měsíců|month|months)/i;

export function extractMaxDays(text: string | null | undefined): number | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  const unitMatch = lower.match(DAYS_UNIT_RE);
  if (!unitMatch) return null;

  const multiplier = /týd|week/.test(unitMatch[0])
    ? 7
    : /měsí|month/.test(unitMatch[0])
      ? 30
      : 1;

  const maxNumber = extractMaxNumber(text);
  if (maxNumber == null) return null;
  return maxNumber * multiplier;
}
