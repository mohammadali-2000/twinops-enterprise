import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getActiveCloneId } from "@/lib/integrations/credentials";
import { answerAsClone, CloneNotFoundError, type AnswerResult } from "@/lib/agents/answer";

/**
 * POST /api/teams/events
 *
 * Called synchronously by a Power Automate flow (see docs/integrations.md).
 * Header: x-twinops-secret: <TEAMS_FLOW_SECRET>
 * Body:   { question: string (may be Teams HTML), sender?: string, channel?: string, cloneId?: string }
 * Returns { answer, answerHtml, sources } for the flow to post back to the channel.
 */

const TRIGGER_KEYWORD = /\btwin:\s*/i;

function secretMatches(provided: string | null): boolean {
  const expected = process.env.TEAMS_FLOW_SECRET;
  if (!expected || !provided) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function teamsHtmlToText(html: string): string {
  return html
    .replace(/<at>.*?<\/at>/gi, " ")
    .replace(/<br\s*\/?>|<\/p>|<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(TRIGGER_KEYWORD, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatReply(result: AnswerResult): { text: string; html: string } {
  const cited = result.sources.filter((s) => result.answer.includes(`[${s.index}]`));
  const sources = cited.length > 0 ? cited : result.sources.slice(0, 3);
  const sourceLines = sources.map((s) => `[${s.index}] ${s.title}${s.url ? ` — ${s.url}` : ""}`);
  const consultLines = result.consultations.map((c) => `Checked with ${c.target_clone_name}'s twin`);
  const footer = [...consultLines, ...sourceLines];
  const text = footer.length ? `${result.answer}\n\nSources:\n${footer.join("\n")}` : result.answer;

  const htmlSources = sources.map((s) =>
    s.url
      ? `[${s.index}] <a href="${escapeHtml(s.url)}">${escapeHtml(s.title)}</a>`
      : `[${s.index}] ${escapeHtml(s.title)}`
  );
  const htmlFooter = [...consultLines.map(escapeHtml), ...htmlSources];
  const html =
    escapeHtml(result.answer).replace(/\n/g, "<br>") +
    (htmlFooter.length ? `<br><br><b>Sources</b><br>${htmlFooter.join("<br>")}` : "");

  return { text, html };
}

export async function POST(request: NextRequest) {
  if (!secretMatches(request.headers.get("x-twinops-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    question?: unknown;
    sender?: unknown;
    channel?: unknown;
    cloneId?: unknown;
  };

  const question = typeof body.question === "string" ? teamsHtmlToText(body.question) : "";
  if (question.length < 2) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const sender = typeof body.sender === "string" && body.sender ? body.sender : "Teams user";
  const channel = typeof body.channel === "string" && body.channel ? body.channel : "teams";
  console.log(`[teams-events] ${sender} in ${channel}: "${question}"`);

  try {
    const cloneId = typeof body.cloneId === "string" && body.cloneId ? body.cloneId : await getActiveCloneId();
    const result = await answerAsClone({ cloneId, question, askedBy: sender });
    const reply = formatReply(result);
    return NextResponse.json({
      answer: reply.text,
      answerHtml: reply.html,
      sources: result.sources,
      consultations: result.consultations.map((c) => c.target_clone_name),
    });
  } catch (err) {
    console.error("[teams-events] Error:", err);
    if (err instanceof CloneNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate a response" },
      { status: 500 }
    );
  }
}
