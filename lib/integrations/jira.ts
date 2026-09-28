import { saveLocalMemories } from "@/backend/memory/local-store";
import { createServerSupabaseClient } from "@/lib/core/supabase/server";
import { getJiraCredentials } from "./credentials";

export interface JiraSyncResult {
  issues_fetched: number;
  memories_saved: number;
  storage: "supabase" | "local-fallback";
}

/** Fetch a bounded Jira search result and store it in the offline TwinOps brain. */
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
    fields: "summary,status,assignee,priority,updated,description,issuetype,project",
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
  const memories = issues.map((issue) => {
    const fields = (issue.fields ?? {}) as Record<string, unknown>;
    const project = (fields.project ?? {}) as Record<string, unknown>;
    const status = (fields.status ?? {}) as Record<string, unknown>;
    const assignee = (fields.assignee ?? {}) as Record<string, unknown> | null;
    const priority = (fields.priority ?? {}) as Record<string, unknown> | null;
    const description = typeof fields.description === "string" ? fields.description : "";
    const key = String(issue.key ?? "JIRA-UNKNOWN");
    return {
      clone_id: opts.cloneId,
      type: "document",
      source: "jira",
      content: `${key}: ${String(fields.summary ?? "Untitled issue")}\nStatus: ${String(status.name ?? "Unknown")}\nAssignee: ${String(assignee?.displayName ?? "Unassigned")}\nPriority: ${String(priority?.name ?? "Unspecified")}\n${description}`,
      confidence: 0.95,
      metadata: { title: key, issue_key: key, project: String(project.key ?? ""), status: String(status.name ?? "Unknown"), updated: String(fields.updated ?? now) },
      occurred_at: String(fields.updated ?? now),
    };
  });

  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (hasSupabase) {
    const { error } = await createServerSupabaseClient().from("memories").insert(memories);
    if (error) throw new Error(`Jira issues could not be saved to Supabase: ${error.message}`);
    return { issues_fetched: issues.length, memories_saved: memories.length, storage: "supabase" };
  }

  const saved = saveLocalMemories(memories);
  return { issues_fetched: issues.length, memories_saved: saved, storage: "local-fallback" };
}
