import type { Idea } from "./types";

/** Escape characters that break Telegram's legacy Markdown parser. */
function escapeMarkdown(text: string): string {
  return text.replace(/([_*[\]`])/g, "\\$1");
}

export function formatTelegramMessage(idea: Idea, webUrl: string): string {
  const risk = idea.risks && idea.risks.length > 0 ? idea.risks[0] : "NEOVĚŘENO";

  return [
    `🧠 MOZEK NAŠEL NOVÝ PROJEKT`,
    ``,
    `🚀 ${escapeMarkdown(idea.title)}`,
    ``,
    `Problém: ${idea.problem ?? "—"}`,
    `Řešení: ${idea.solution ?? "—"}`,
    `Pro koho: ${idea.target_customer ?? "—"}`,
    `Monetizace: ${idea.monetization_model ?? "—"}`,
    ``,
    `💰 MVP: ${idea.mvp_cost_czk ?? "?"} Kč`,
    `⏱ Čas: ${idea.time_to_mvp ?? "?"}`,
    `🔥 MOZEK SCORE: ${idea.mozek_score ?? "?"}/100`,
    `⚠️ Hlavní riziko: ${risk}`,
    ``,
    `👉 ${webUrl}/napad/${idea.id}`,
  ].join("\n");
}

/**
 * Low-level sender shared by every notification type. Requires
 * TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars. Never throws — a
 * Telegram outage should not fail the whole agent run, so failures are
 * logged and swallowed.
 */
async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[telegram] Missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID, skipping notification.");
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: false,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[telegram] sendMessage failed (${response.status}): ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[telegram] sendMessage threw:", err);
    return false;
  }
}

/** Send a Telegram notification for a strong idea (mozek_score >= 70). */
export async function sendTelegramNotification(idea: Idea): Promise<boolean> {
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "https://mozek.example.com";
  return sendTelegramMessage(formatTelegramMessage(idea, webUrl));
}

/**
 * Send when the primary LLM provider (Claude) fails and the agent fell back
 * to the backup provider (Gemini) — e.g. Claude credit ran out, key expired,
 * or an outage. Lets the human know to check billing without the run just
 * silently degrading forever.
 */
export async function sendProviderFallbackAlert(params: {
  primaryProvider: string;
  fallbackProvider: string;
  reason: string;
}): Promise<boolean> {
  const text = [
    `⚠️ MOZEK: přepnuto na záložní model`,
    ``,
    `${params.primaryProvider} selhal, tenhle běh proběhl přes ${params.fallbackProvider}.`,
    ``,
    `Důvod: ${params.reason}`,
    ``,
    `Zkontroluj kredit/klíč u ${params.primaryProvider}, jinak poběží appka dál na záloze.`,
  ].join("\n");
  return sendTelegramMessage(text);
}
