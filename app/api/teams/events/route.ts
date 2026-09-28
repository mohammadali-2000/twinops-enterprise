import { NextRequest, NextResponse } from "next/server";
import { getActiveCloneId } from "@/lib/integrations/credentials";
import { sendTeamsAdaptiveCard } from "@/lib/integrations/teams";
import { createServerSupabaseClient } from "@/lib/core/supabase/server";
import { searchKnowledgeBase } from "@/backend/memory";
import { saveLocalMemories } from "@/backend/memory/local-store";

/**
 * POST /api/teams/events
 *
 * Inbound webhook endpoint for Microsoft Teams.
 * Receives pings, queries, or mentions triggered from Power Automate Workflows
 * or Azure Bot Service, queries the digital twin memory, and responds.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support both Power Automate Workflows payloads and direct JSON queries
    const question =
      body.question ||
      body.text ||
      body.content ||
      body?.body?.content ||
      body?.attachments?.[0]?.content?.body?.[0]?.text;

    const sender =
      body.sender ||
      body.userName ||
      body?.from?.name ||
      "Enterprise Teammate";

    const channel = body.channel || "teams-channel";
    const replyWebhookUrl = body.replyWebhookUrl || body.webhookUrl;

    if (!question || typeof question !== "string" || question.trim().length < 2) {
      return NextResponse.json(
        { ok: true, message: "Ignored empty or non-text event" },
        { status: 200 }
      );
    }

    console.log(`[teams-events] Received query from ${sender} in #${channel}: "${question}"`);

    // Supabase is the shared production memory. The local file is only used
    // when no database has been configured (offline/demo mode).
    const cloneId = await getActiveCloneId();
    const timestamp = new Date().toISOString();
    const memoryContent = `[Teams #${channel}] ${sender}: ${question}`;
    const memory = {
      clone_id: cloneId,
      type: "document",
      source: "teams",
      content: memoryContent,
      confidence: 0.9,
      metadata: {
        title: `Teams: #${channel} query`,
        channel_name: channel,
        sender_name: sender,
        ingestion_type: "teams_webhook",
      },
      occurred_at: timestamp,
    };

    const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    let remoteMatches: Array<{ content: string }> = [];
    try {
      const supabase = createServerSupabaseClient();
      const { error } = await supabase.from("memories").insert([memory]);
      if (error) throw new Error(error.message);

      const terms = question.toLowerCase().split(/\s+/).filter((term) => term.length > 3).slice(0, 5);
      if (terms.length > 0) {
        const { data } = await supabase
          .from("memories")
          .select("content")
          .eq("clone_id", cloneId)
          .or(terms.map((term) => `content.ilike.%${term.replace(/[%,'"]/g, "")}%`).join(","))
          .limit(3);
        remoteMatches = (data ?? []) as Array<{ content: string }>;
      }
    } catch (err) {
      if (hasSupabase) {
        throw new Error(`Teams event was not saved to Supabase: ${err instanceof Error ? err.message : "database unavailable"}`);
      }
      console.warn("[teams-events] No database configured; using local fallback:", err);
      saveLocalMemories([memory]);
    }

    // Ground the reply in real local GitHub/Jira/document memories before it
    // ever leaves the process. Do not claim verification when no source exists.
    const matches = remoteMatches.length > 0 ? remoteMatches : searchKnowledgeBase(cloneId, question, 3);
    const evidence = matches
      .map((item) => item.content.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .map((content) => `• ${content.slice(0, 280)}${content.length > 280 ? "…" : ""}`);
    const responseText = evidence.length
      ? `Hi ${sender} — I found the following relevant TwinOps context:\n\n${evidence.join("\n")}\n\nSm Ali is currently unavailable; please treat this as a grounded twin response and escalate if a human approval is required.`
      : `Hi ${sender} — I could not find sufficiently relevant TwinOps memory for that question. Sm Ali is currently unavailable, so I have not made an ungrounded technical claim. Please route this for human review.`;

    if (replyWebhookUrl && typeof replyWebhookUrl === "string" && replyWebhookUrl.startsWith("http")) {
      await sendTeamsAdaptiveCard(replyWebhookUrl, {
        title: "TwinOps Enterprise | Microsoft Teams",
        subtitle: `In response to ${sender}`,
        text: responseText,
        badge: "VERIFIED TWIN RESPONSE",
        facts: [
          { title: "Channel", value: `#${channel}` },
          { title: "Grounding", value: `${matches.length} local memory source${matches.length === 1 ? "" : "s"}` },
          { title: "Status", value: "Autonomously Delivered" },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      answer: responseText,
      channel,
      sender,
      timestamp,
    });
  } catch (err) {
    console.error("[teams-events] Error processing event:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process Teams event" },
      { status: 500 }
    );
  }
}
