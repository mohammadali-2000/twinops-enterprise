import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/core/supabase/server";
import getOpenAIClient, { getChatModel } from "@/lib/agents/openai";
import { getKnowledgeContext } from "@backend/memory";
import type OpenAI from "openai";

/**
 * POST /api/twinops/insights
 * Body: { question: string, filters: { teams: string[] } }
 *
 * Queries all clones from Supabase, retrieves relevant memories for each,
 * uses OpenAI to generate a stance per clone, then aggregates into themes.
 * Streams results as SSE matching the InsightEvent type.
 */

interface CloneRow {
  id: string;
  name: string;
  personality: Record<string, unknown> | null;
  expertise_tags: string[] | null;
  owner_role: string | null;
  owner_department: string | null;
}

interface StanceResult {
  stance: "support" | "neutral" | "oppose";
  confidence: number;
  summary: string;
  reasoning: string;
  citations: { source: string; snippet: string; date: string; url?: string }[];
}

interface ThemeResult {
  id: string;
  label: string;
  dominantStance: "support" | "neutral" | "oppose";
  description: string;
  employeeIds: string[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type Citation = { source: string; snippet: string; date: string; url?: string };

/** Retrieve this clone's real synced knowledge for the question, with matching citations. */
async function getCloneContext(
  cloneId: string,
  question: string
): Promise<{ context: string; citations: Citation[] }> {
  const knowledge = await getKnowledgeContext(cloneId, question, 5);
  const chunks = knowledge?.chunks.slice(0, 6) ?? [];
  const facts = knowledge?.items.slice(0, 5) ?? [];

  const citations: Citation[] = chunks.map((c) => {
    const meta = c.metadata ?? {};
    return {
      source: (meta.source as string) || "document",
      snippet: (meta.document_title as string) || (meta.title as string) || c.content.slice(0, 80),
      date: (meta.updated as string) || c.created_at || "",
      url: (meta.url as string) || undefined,
    };
  });

  const parts = chunks.map((c, i) => `[${i + 1}] (${citations[i].source}) ${citations[i].snippet}\n${c.content}`);
  if (facts.length > 0) parts.push("Key facts:\n" + facts.map((f) => `- ${f.fact}`).join("\n"));
  return { context: parts.join("\n---\n"), citations };
}

/** Ask the model for this clone's stance, grounded only in its retrieved sources. */
async function generateCloneStance(
  openai: OpenAI,
  cloneName: string,
  role: string,
  department: string,
  expertise: string[],
  context: string,
  citations: Citation[],
  question: string
): Promise<StanceResult> {
  if (!context) {
    return {
      stance: "neutral",
      confidence: 0,
      summary: `${cloneName}'s twin has no synced GitHub or Jira knowledge about this.`,
      reasoning: "No relevant sources were found in this twin's memory, so no position is given.",
      citations: [],
    };
  }

  const prompt = `You represent ${cloneName}, ${role} in ${department}. Expertise: ${expertise.join(", ") || "not specified"}.

Numbered sources from ${cloneName}'s real work (GitHub repos, Jira tickets):
${context}

Question from leadership: "${question}"

Answer only from the sources above. Respond with raw JSON:
{
  "stance": "support" | "neutral" | "oppose",
  "confidence": <0 to 1: how well the sources support this position>,
  "summary": "<1-2 sentences>",
  "reasoning": "<2-3 sentences that refer to specific tickets, repos, or commits>",
  "source_ids": [<numbers of the sources you relied on>]
}
If the sources don't address the question, use stance "neutral", a low confidence, and say so.`;

  const response = await openai.chat.completions.create({
    model: getChatModel(),
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 500,
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content ?? "{}") as Partial<StanceResult> & {
    source_ids?: unknown;
  };
  const ids = Array.isArray(parsed.source_ids) ? parsed.source_ids : [];
  return {
    stance: parsed.stance && ["support", "neutral", "oppose"].includes(parsed.stance) ? parsed.stance : "neutral",
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
    summary: parsed.summary || "",
    reasoning: parsed.reasoning || "",
    citations: ids
      .map((n) => citations[Number(n) - 1])
      .filter((c): c is Citation => Boolean(c))
      .slice(0, 3),
  };
}

/**
 * Ask OpenAI to aggregate employee responses into themes.
 */
async function generateThemes(
  openai: OpenAI,
  question: string,
  responses: { id: string; name: string; stance: string; summary: string }[]
): Promise<ThemeResult[]> {
  const responseSummaries = responses
    .map((r) => `- ${r.name} (${r.stance}): ${r.summary}`)
    .join("\n");

  const prompt = `Given the following management question and employee responses, identify 3-5 key themes that emerge.

Question: "${question}"

Employee responses:
${responseSummaries}

Respond with a JSON object (no markdown, just raw JSON) with a "themes" array:
{
  "themes": [
    {
      "label": "<short theme name, 3-5 words>",
      "dominantStance": "support" | "neutral" | "oppose",
      "description": "<1-2 sentence description of this theme>",
      "employeeIds": [<array of employee IDs from the list who align with this theme>]
    }
  ]
}

The employee IDs are: ${responses.map((r) => `"${r.id}" (${r.name})`).join(", ")}

Guidelines:
- Each theme should group employees who share a common concern or perspective.
- dominantStance reflects the majority stance within that theme.
- An employee can appear in multiple themes.
- Order themes by number of employees (most first).`;

  const response = await openai.chat.completions.create({
    model: getChatModel(),
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 800,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content) as { themes: ThemeResult[] };
    if (!Array.isArray(parsed.themes)) return [];
    return parsed.themes.map((t, i) => ({
      id: `t${i + 1}`,
      label: t.label || `Theme ${i + 1}`,
      dominantStance: ["support", "neutral", "oppose"].includes(t.dominantStance)
        ? t.dominantStance
        : "neutral",
      description: t.description || "",
      employeeIds: Array.isArray(t.employeeIds) ? t.employeeIds : [],
    }));
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, filters } = body as {
      question: string;
      filters: { teams: string[] };
    };

    if (!question) {
      return NextResponse.json(
        { error: "question is required" },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }

    const supabase = createServerSupabaseClient();
    const openai = getOpenAIClient();

    // Fetch all clones
    let query = supabase
      .from("clones")
      .select(
        "id, name, personality, expertise_tags, owner_role, owner_department"
      )
      .eq("status", "active")
      .order("created_at", { ascending: true });

    // Filter by teams/departments if specified
    if (filters?.teams && filters.teams.length > 0) {
      query = query.in("owner_department", filters.teams);
    }

    const { data: clones, error } = await query;

    if (error) {
      console.error("[insights] Clones query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!clones || clones.length === 0) {
      return NextResponse.json(
        { error: "No active twins yet. Create twins in Settings first." },
        { status: 404 }
      );
    }

    // Determine available teams from actual clone data
    const availableTeams = [
      ...new Set(
        clones
          .map((c: CloneRow) => c.owner_department)
          .filter((d): d is string => Boolean(d))
      ),
    ];

    const targetTeams =
      filters?.teams && filters.teams.length > 0
        ? filters.teams
        : availableTeams;

    // Stream SSE response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const emit = (data: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          // Stage: planning
          emit({
            type: "stage",
            stage: "planning",
            message:
              "Analyzing your question and identifying relevant employees…",
          });

          emit({
            type: "plan",
            plan: {
              question,
              targetTeams,
              estimatedResponses: clones.length,
              availableTeams,
              steps: [
                `Identified ${clones.length} employee clones across ${targetTeams.length} teams`,
                "Querying each clone's knowledge base for relevant context",
                "Generating stance assessment for each employee",
                "Aggregating responses and identifying themes",
              ],
            },
          });

          // Stage: querying
          emit({
            type: "stage",
            stage: "querying",
            message: `Querying ${clones.length} employee digital twins…`,
          });

          // Process each clone — generate stance
          const allResponses: {
            id: string;
            name: string;
            stance: string;
            summary: string;
            confidence: number;
          }[] = [];

          // Process clones in parallel batches of 3 to avoid rate limits
          const BATCH_SIZE = 3;
          for (let i = 0; i < clones.length; i += BATCH_SIZE) {
            const batch = clones.slice(i, i + BATCH_SIZE) as CloneRow[];
            const batchResults = await Promise.all(
              batch.map(async (clone) => {
                const displayName = clone.name.replace(/\s*\(Clone\)$/i, "");
                const role = clone.owner_role || "Team Member";
                const department = clone.owner_department || "General";
                const expertise = clone.expertise_tags ?? [];

                // Retrieve context for this clone
                const { context, citations } = await getCloneContext(clone.id, question);

                // Generate stance via LLM
                const stanceResult = await generateCloneStance(
                  openai,
                  displayName,
                  role,
                  department,
                  expertise,
                  context,
                  citations,
                  question
                );

                return {
                  employee: {
                    id: clone.id,
                    name: displayName,
                    role,
                    team: department,
                    tenure: "",
                    initials: getInitials(displayName),
                  },
                  ...stanceResult,
                };
              })
            );

            // Emit each response from this batch
            for (const result of batchResults) {
              emit({ type: "employee_response", response: result });
              allResponses.push({
                id: result.employee.id,
                name: result.employee.name,
                stance: result.stance,
                summary: result.summary,
                confidence: result.confidence,
              });
            }
          }

          // Stage: aggregating
          emit({
            type: "stage",
            stage: "aggregating",
            message: "Identifying patterns and synthesizing insights…",
          });

          // Generate themes via LLM
          const themes = await generateThemes(
            openai,
            question,
            allResponses
          );

          // Compute distribution
          const total = allResponses.length;
          const supportCount = allResponses.filter(
            (r) => r.stance === "support"
          ).length;
          const neutralCount = allResponses.filter(
            (r) => r.stance === "neutral"
          ).length;
          const opposeCount = allResponses.filter(
            (r) => r.stance === "oppose"
          ).length;

          const topStance =
            supportCount >= opposeCount ? "supportive" : "opposed";

          // Add counts to themes
          const themesWithCounts = themes.map((t) => ({
            ...t,
            count: t.employeeIds.length,
          }));

          emit({
            type: "aggregation",
            data: {
              distribution: {
                support: total > 0 ? Math.round((supportCount / total) * 100) : 0,
                neutral: total > 0 ? Math.round((neutralCount / total) * 100) : 0,
                oppose: total > 0 ? Math.round((opposeCount / total) * 100) : 0,
              },
              overallConfidence:
                total > 0 ? allResponses.reduce((sum, r) => sum + r.confidence, 0) / total : 0,
              themes: themesWithCounts,
              totalResponses: total,
              availableTeams,
              summary: `Across ${total} employees, the organization is predominantly ${topStance} (${
                total > 0 ? Math.round((supportCount / total) * 100) : 0
              }% support, ${
                total > 0 ? Math.round((opposeCount / total) * 100) : 0
              }% oppose). ${themesWithCounts[0]?.label || "Mixed sentiment"} emerged as the dominant theme.`,
            },
          });

          emit({
            type: "stage",
            stage: "complete",
            message: "Analysis complete.",
          });

          controller.close();
        } catch (err) {
          emit({
            type: "error",
            message:
              err instanceof Error ? err.message : "Unknown error during analysis",
          });
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
