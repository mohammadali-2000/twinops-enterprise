/**
 * Microsoft Teams Integration Module
 *
 * Supports modern Microsoft Teams Power Automate / Workflows Incoming Webhooks
 * using Adaptive Cards (v1.4 / v1.5 standard).
 *
 * Background:
 * Office 365 connector-based incoming webhooks were retired by Microsoft in 2024-2025.
 * Modern Teams channels use the "Workflows" app (Power Automate) to create
 * webhook triggers that accept Adaptive Cards.
 */

export interface TeamsAdaptiveCardOptions {
  title: string;
  subtitle?: string;
  text: string;
  badge?: string;
  facts?: Array<{ title: string; value: string }>;
  actions?: Array<{ title: string; url: string }>;
  accentColor?: "Default" | "Accent" | "Good" | "Warning" | "Attention";
}

/**
 * Builds a Microsoft Teams Power Automate-compliant Adaptive Card JSON payload.
 */
export function buildTeamsAdaptiveCard(options: TeamsAdaptiveCardOptions) {
  const {
    title,
    subtitle = "TwinOps Enterprise Digital Twin",
    text,
    badge = "AI DIGITAL TWIN",
    facts = [],
    actions = [],
    accentColor = "Accent",
  } = options;

  const cardBody: Array<Record<string, unknown>> = [
    {
      type: "ColumnSet",
      columns: [
        {
          type: "Column",
          width: "auto",
          items: [
            {
              type: "TextBlock",
              text: "🟣",
              size: "Large",
            },
          ],
        },
        {
          type: "Column",
          width: "stretch",
          items: [
            {
              type: "TextBlock",
              text: title,
              weight: "Bolder",
              size: "Medium",
              color: accentColor,
            },
            {
              type: "TextBlock",
              text: `${subtitle} • ${badge}`,
              spacing: "None",
              isSubtle: true,
              size: "Small",
            },
          ],
        },
      ],
    },
    {
      type: "TextBlock",
      text,
      wrap: true,
      spacing: "Medium",
    },
  ];

  if (facts.length > 0) {
    cardBody.push({
      type: "FactSet",
      spacing: "Medium",
      facts: facts.map((f) => ({
        title: f.title,
        value: f.value,
      })),
    });
  }

  const cardActions = actions.map((a) => ({
    type: "Action.OpenUrl",
    title: a.title,
    url: a.url,
  }));

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          msteams: {
            width: "Full",
          },
          body: cardBody,
          actions: cardActions.length > 0 ? cardActions : undefined,
        },
      },
    ],
  };
}

/**
 * Dispatches an Adaptive Card to a Microsoft Teams Power Automate webhook URL.
 */
export async function sendTeamsAdaptiveCard(
  webhookUrl: string,
  options: TeamsAdaptiveCardOptions
): Promise<{ success: boolean; status?: number; error?: string }> {
  if (!webhookUrl || !webhookUrl.startsWith("http")) {
    return { success: false, error: "Invalid Microsoft Teams Webhook URL" };
  }

  const payload = buildTeamsAdaptiveCard(options);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { success: true, status: response.status };
    }

    const errorText = await response.text();
    return {
      success: false,
      status: response.status,
      error: `Teams Webhook failed (${response.status}): ${errorText}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error posting to Teams Webhook",
    };
  }
}
