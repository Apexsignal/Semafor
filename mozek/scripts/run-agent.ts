/**
 * Cron entrypoint. Invoked directly (`npm run agent:run`) by GitHub Actions
 * (see .github/workflows/mozek-agent-cron.yml) or any other scheduler.
 *
 * Steps (see CLAUDE.md section 4):
 *  1. Load the last ~200 ideas (title + one_liner) for deduplication context.
 *  2. Build a short summary of recently rejected feedback (section 7).
 *  3. Call the MOZEK agent (web search + Claude), which returns idea drafts.
 *  4. Score each idea, insert it (INSERT only — never update/delete existing rows).
 *  5. Telegram-notify for every newly inserted idea with flag_strong = true.
 *  6. Log the whole run to agent_runs.
 */
import { config as loadEnv } from "dotenv";
// Load .env.local first (local dev convention, matches Next.js), then fall
// back to .env. In CI/hosting (GitHub Actions, Vercel) neither file exists
// on disk — env vars are injected directly — so both calls are harmless no-ops.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });
import { getSupabaseServiceClient } from "../lib/supabase";
import { runMozekAgent } from "../lib/agent";
import { buildRejectedFeedbackSummary } from "../lib/feedbackSummary";
import { scoreIdea } from "../lib/scoring";
import { sendTelegramNotification } from "../lib/telegram";
import type { AgentIdeaDraft, Idea } from "../lib/types";

const DEDUPE_LOOKBACK = 200;

async function main() {
  const supabase = getSupabaseServiceClient();
  const startedAt = new Date();

  const { data: runRow, error: runInsertError } = await supabase
    .from("agent_runs")
    .insert({ started_at: startedAt.toISOString(), status: "running" })
    .select()
    .single();

  if (runInsertError) {
    console.error("[run-agent] Failed to create agent_runs row:", runInsertError.message);
  }
  const runId: string | undefined = runRow?.id;

  try {
    const { data: existing, error: existingError } = await supabase
      .from("ideas")
      .select("title, one_liner")
      .order("created_at", { ascending: false })
      .limit(DEDUPE_LOOKBACK);

    if (existingError) {
      throw new Error(`Failed to load existing ideas: ${existingError.message}`);
    }

    const rejectedFeedbackSummary = await buildRejectedFeedbackSummary(supabase);

    console.log(
      `[run-agent] Calling MOZEK agent with ${existing?.length ?? 0} existing ideas for dedup context...`
    );
    const { ideas: drafts, model, provider } = await runMozekAgent({
      existingIdeas: existing ?? [],
      rejectedFeedbackSummary,
    });

    console.log(`[run-agent] Agent returned ${drafts.length} idea(s) via ${provider} (${model}).`);

    const rowsToInsert = drafts.map((draft) => buildInsertRow(draft));

    let inserted: Idea[] = [];
    if (rowsToInsert.length > 0) {
      const { data, error: insertError } = await supabase
        .from("ideas")
        .insert(rowsToInsert)
        .select();

      if (insertError) {
        throw new Error(`Failed to insert ideas: ${insertError.message}`);
      }
      inserted = (data ?? []) as Idea[];
    }

    const strongIdeas = inserted.filter((idea) => idea.flag_strong);
    console.log(
      `[run-agent] Inserted ${inserted.length} idea(s), ${strongIdeas.length} flagged strong (>=70).`
    );

    for (const idea of strongIdeas) {
      await sendTelegramNotification(idea);
    }

    const finishedAt = new Date();
    if (runId) {
      await supabase
        .from("agent_runs")
        .update({
          finished_at: finishedAt.toISOString(),
          duration_ms: finishedAt.getTime() - startedAt.getTime(),
          ideas_generated: drafts.length,
          ideas_inserted: inserted.length,
          ideas_flagged_strong: strongIdeas.length,
          status: "success",
          model,
        })
        .eq("id", runId);
    }

    console.log("[run-agent] Done.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[run-agent] Run failed:", message);

    if (runId) {
      const finishedAt = new Date();
      await supabase
        .from("agent_runs")
        .update({
          finished_at: finishedAt.toISOString(),
          duration_ms: finishedAt.getTime() - startedAt.getTime(),
          status: "error",
          error_message: message.slice(0, 2000),
        })
        .eq("id", runId);
    }

    process.exitCode = 1;
  }
}

function buildInsertRow(draft: AgentIdeaDraft) {
  const { mozek_score, priority, flag_strong } = scoreIdea(draft);
  return {
    ...draft,
    mozek_score,
    priority,
    flag_strong,
  };
}

main();
