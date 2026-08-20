// Simple keyword-matching parser for queries like "projekty do 100 000 Kč",
// "AI projekty", "projekty do 30 dní". Not NLP on purpose — see CLAUDE.md
// section 6: "nemusí to být NLP, stačí keyword matching na existující sloupce."
export interface ParsedNaturalQuery {
  costMaxCzk?: number;
  daysMax?: number;
  remainingKeywords: string;
}

const COST_RE = /(?:do|pod|max(?:imálně)?)\s*([\d]{1,3}(?:[\s.]?\d{3})*)\s*(?:k[čc]|czk)/i;
const DAYS_RE =
  /(?:do|pod|max(?:imálně)?)\s*(\d+)\s*(dn[íyů]|den|týdn[ůy]|týden|měsíc[ůe]?)/i;

export function parseNaturalQuery(raw: string): ParsedNaturalQuery {
  let text = raw;
  let costMaxCzk: number | undefined;
  let daysMax: number | undefined;

  const costMatch = text.match(COST_RE);
  if (costMatch) {
    costMaxCzk = parseInt(costMatch[1].replace(/[\s.]/g, ""), 10);
    text = text.replace(costMatch[0], " ");
  }

  const daysMatch = text.match(DAYS_RE);
  if (daysMatch) {
    const n = parseInt(daysMatch[1], 10);
    const unit = daysMatch[2].toLowerCase();
    const multiplier = unit.startsWith("týd") ? 7 : unit.startsWith("měsí") ? 30 : 1;
    daysMax = n * multiplier;
    text = text.replace(daysMatch[0], " ");
  }

  return {
    costMaxCzk,
    daysMax,
    remainingKeywords: text.replace(/\s+/g, " ").trim(),
  };
}
