import { createServerSupabaseClient } from "@/lib/core/supabase/server";
import getOpenAIClient, { getChatModel } from "@/lib/agents/openai";

export interface SourceDoc {
  index: number;
  cloneId: string;
  source: string;
  title: string;
  url: string;
  status?: string;
  issueKey?: string;
  occurredAt: string;
  content: string;
}

const DOC_PROMPT_CHARS = 1200;
const DONE_STATUSES = /^(done|closed|resolved|complete|completed|cancelled|canceled)$/i;

export function isOpenIssue(doc: SourceDoc): boolean {
  return doc.source === "jira" && !!doc.status && !DONE_STATUSES.test(doc.status);
}

/** Latest synced GitHub/Jira documents for the given twins. */
export async function loadSourceDocs(cloneIds: string[], limit = 25): Promise<SourceDoc[]> {
  if (cloneIds.length === 0) return [];
  const { data, error } = await createServerSupabaseClient()
    .from("memories")
    .select("clone_id, source, content, metadata, occurred_at")
    .in("clone_id", cloneIds)
    .eq("type", "document")
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load synced documents: ${error.message}`);

  return (data ?? []).map((row, i) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      index: i + 1,
      cloneId: row.clone_id as string,
      source: (row.source as string) || "document",
      title: (meta.title as string) || "Untitled",
      url: (meta.url as string) || "",
      status: (meta.status as string) || undefined,
      issueKey: (meta.issue_key as string) || undefined,
      occurredAt: row.occurred_at as string,
      content: row.content as string,
    };
  });
}

export function formatDocsForPrompt(docs: SourceDoc[]): string {
  return docs
    .map((d) => `[${d.index}] (${d.source}) ${d.title}\n${d.content.slice(0, DOC_PROMPT_CHARS)}`)
    .join("\n---\n");
}

export async function askForJson<T>(prompt: string, maxTokens = 1200): Promise<Partial<T>> {
  const response = await getOpenAIClient().chat.completions.create({
    model: getChatModel(),
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
  });
  try {
    return JSON.parse(response.choices[0]?.message?.content ?? "{}") as Partial<T>;
  } catch {
    return {};
  }
}

/** Map model-provided source numbers back to real documents, dropping anything invented. */
export function pickDocs(docs: SourceDoc[], ids: unknown): SourceDoc[] {
  if (!Array.isArray(ids)) return [];
  return ids.map((n) => docs[Number(n) - 1]).filter((d): d is SourceDoc => Boolean(d));
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
