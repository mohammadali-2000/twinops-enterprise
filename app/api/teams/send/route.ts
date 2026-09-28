import { NextRequest, NextResponse } from "next/server";
import { getTeamsWebhookUrl } from "@/lib/integrations/credentials";
import { sendTeamsAdaptiveCard, TeamsAdaptiveCardOptions } from "@/lib/integrations/teams";

/**
 * POST /api/teams/send
 *
 * Sends a rich Adaptive Card message to a Microsoft Teams channel via
 * Power Automate / Workflows webhook.
 *
 * Request Body:
 * {
 *   "text": "Message content or twin response",
 *   "title": "Optional card title",
 *   "subtitle": "Optional subtitle",
 *   "webhookUrl": "Optional override, otherwise uses TEAMS_WEBHOOK_URL env/db",
 *   "facts": [{ "title": "Jira", "value": "HLS-402" }],
 *   "actions": [{ "title": "Open Dashboard", "url": "https://..." }]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      text,
      title = "TwinOps Enterprise | Digital Twin",
      subtitle = "Responding on behalf of Sm Ali",
      webhookUrl: overrideUrl,
      facts = [],
      actions = [],
      accentColor = "Accent",
    } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Field 'text' is required and must be a string" },
        { status: 400 }
      );
    }

    const webhookUrl = overrideUrl || (await getTeamsWebhookUrl());

    if (!webhookUrl) {
      return NextResponse.json(
        {
          error:
            "No Microsoft Teams Webhook URL configured. Please set TEAMS_WEBHOOK_URL in .env.local or provide 'webhookUrl' in request body.",
          tip: "In Teams: Channel -> ... -> Workflows -> 'Post to a channel when a webhook request is received' -> Copy URL.",
        },
        { status: 400 }
      );
    }

    const cardOptions: TeamsAdaptiveCardOptions = {
      title,
      subtitle,
      text,
      badge: "TEAMS BOT",
      facts,
      actions,
      accentColor,
    };

    const result = await sendTeamsAdaptiveCard(webhookUrl, cardOptions);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to post to Microsoft Teams" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Adaptive card delivered to Microsoft Teams successfully",
      status: result.status,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Internal error processing Teams webhook",
      },
      { status: 500 }
    );
  }
}
