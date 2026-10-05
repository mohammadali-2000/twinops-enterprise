import { createServerSupabaseClient } from "@/lib/core/supabase/server";
import { chunkText } from "@/lib/core/chunker";
import { generateEmbeddings } from "@/lib/agents/openai";
import { getJiraCredentials } from "./credentials";

export interface JiraSyncResult {
  issues_fetched: number;
  memories_saved: number;
  chunks_created: number;
}

const MAX_COMMENTS_PER_ISSUE = 5;

type AdfNode = { type?: string; text?: string; content?: AdfNode[] };
const ADF_BLOCK_TYPES = new Set(["paragraph", "heading", "listItem", "codeBlock", "blockquote", "tableRow"]);

/** Flatten Atlassian Document Format (Jira API v3 rich text) into plain text. */
export function adfToText(node: unknown): string {
  if (typeof node === "string") return node;
  if (!node || typeof node !== "object") return "";
  const n = node as AdfNode;
  if (n.type === "text") return n.text ?? "";
  if (n.type === "hardBreak") return "\n";
  const inner = (n.content ?? []).map(adfToText).join("");
  return ADF_BLOCK_TYPES.has(n.type ?? "") ? `${inner}\n` : inner;
}

type MemoryRow = {
  clone_id: string;
  type: string;
  source: string;
  content: string;
  confidence: number;
  metadata: Record<string, unknown>;
  occurred_at: string;
  embedding?: string;
};

/** Fetch a bounded Jira search result and store it as searchable clone memory. */
export async function syncJiraContext(opts: {
  cloneId: string;
  jql?: string;
  maxResults?: number;
}): Promise<JiraSyncResult> {
  const credentials = await getJiraCredentials();
  const maxResults = Math.min(Math.max(opts.maxResults ?? 50, 1), 100);
  const params = new URLSearchParams({
    jql: opts.jql?.trim() || "updated >= -30d ORDER BY updated DESC",
    maxResults: String(maxResults),
    fields: "summary,status,assignee,reporter,priority,updated,description,issuetype,project,comment,labels",
  });
  const authorization = Buffer.from(`${credentials.email}:${credentials.apiToken}`).toString("base64");
  const response = await fetch(`${credentials.baseUrl}/rest/api/3/search/jql?${params}`, {
    headers: { Authorization: `Basic ${authorization}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Jira API request failed (${response.status}). Check the site URL, account email, API token, and project permissions.`);
  }

  const payload = (await response.json()) as { issues?: Array<Record<string, unknown>> };
  const issues = payload.issues ?? [];
  const now = new Date().toISOString();
  const rows: MemoryRow[] = [];
  const issueKeys: string[] = [];

  for (const issue of issues) {
    const fields = (issue.fields ?? {}) as Record<string, unknown>;
    const name = (v: unknown, key = "name") => String(((v ?? {}) as Record<string, unknown>)[key] ?? "");
    const key = String(issue.key ?? "JIRA-UNKNOWN");
    const url = `${credentials.baseUrl}/browse/${key}`;
    const updated = String(fields.updated ?? now);
    const summary = String(fields.summary ?? "Untitled issue");
    const description = adfToText(fields.description).trim();
    const commentList =
      ((fields.comment as { comments?: Array<Record<string, unknown>> } | undefined)?.comments ?? [])
        .slice(-MAX_COMMENTS_PER_ISSUE)
        .map((c) => `- ${name(c.author, "displayName") || "Someone"} (${String(c.created ?? "").slice(0, 10)}): ${adfToText(c.body).trim()}`);
    const labels = Array.isArray(fields.labels) ? (fields.labels as string[]).join(", ") : "";

    const content = [
      `Jira issue ${key}: ${summary}`,
      `Project: ${name(fields.project, "key")} | Type: ${name(fields.issuetype)} | Status: ${name(fields.status) || "Unknown"} | Priority: ${name(fields.priority) || "Unspecified"}`,
      `Assignee: ${name(fields.assignee, "displayName") || "Unassigned"} | Reporter: ${name(fields.reporter, "displayName") || "Unknown"}`,
      labels ? `Labels: ${labels}` : "",
      `Last updated: ${updated}`,
      `URL: ${url}`,
      description ? `\nDescription:\n${description}` : "",
      commentList.length ? `\nRecent comments:\n${commentList.join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const metadata = {
      source: "jira",
      title: `${key}: ${summary}`,
      document_title: `${key}: ${summary}`,
      issue_key: key,
      project: name(fields.project, "key"),
      status: name(fields.status) || "Unknown",
      url,
      updated,
    };

    issueKeys.push(key);
    rows.push({ clone_id: opts.cloneId, type: "document", source: "jira", content, confidence: 0.95, metadata, occurred_at: updated });
    for (const chunk of chunkText(content, { chunkSize: 700, overlap: 100 })) {
      rows.push({
        clone_id: opts.cloneId,
        type: "chunk",
        source: "jira",
        // Prefix each chunk so later chunks still say which ticket they belong to.
        content: chunk.metadata.chunk_index === 0 ? chunk.content : `${key}: ${summary}\n${chunk.content}`,
        confidence: 0.9,
        metadata: { ...chunk.metadata, ...metadata },
        occurred_at: updated,
      });
    }
  }

  const chunkRows = rows.filter((r) => r.type === "chunk");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (chunkRows.length > 0) {
    const embeddings = await generateEmbeddings(chunkRows.map((r) => r.content));
    chunkRows.forEach((row, i) => {
      row.embedding = JSON.stringify(embeddings[i]);
    });
  }

  const supabase = createServerSupabaseClient();
  if (issueKeys.length > 0) {
    const { error: deleteError } = await supabase
      .from("memories")
      .delete()
      .eq("clone_id", opts.cloneId)
      .eq("source", "jira")
      .in("metadata->>issue_key", issueKeys);
    if (deleteError) throw new Error(`Old Jira rows could not be replaced: ${deleteError.message}`);
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("memories").insert(rows);
    if (error) throw new Error(`Jira issues could not be saved to Supabase: ${error.message}`);
  }
  return { issues_fetched: issues.length, memories_saved: rows.length, chunks_created: chunkRows.length };
}
