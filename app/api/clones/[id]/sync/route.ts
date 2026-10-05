import { NextResponse } from "next/server";
import { getCloneRuntime, markCloneTrained } from "@backend/memory/clone-repository";
import { syncGitHubContextToSupabase } from "@/lib/integrations/github";
import { syncJiraContext } from "@/lib/integrations/jira";

type SourceResult =
  | { status: "synced"; summary: string }
  | { status: "skipped"; summary: string }
  | { status: "failed"; summary: string };

/**
 * POST /api/clones/:id/sync
 * Pulls this twin's GitHub repos (personality.sources.github_username) and
 * Jira issues (personality.sources.jira_jql) into its memory.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { clone } = await getCloneRuntime(id);
  if (!clone) return NextResponse.json({ error: "Clone not found" }, { status: 404 });

  const sources = clone.personality.sources ?? {};
  const results: { github: SourceResult; jira: SourceResult } = {
    github: { status: "skipped", summary: "No GitHub username set for this twin." },
    jira: { status: "skipped", summary: "No Jira filter (JQL) set for this twin." },
  };

  if (sources.github_username) {
    try {
      const r = await syncGitHubContextToSupabase({ cloneId: clone.id, username: sources.github_username });
      results.github = {
        status: "synced",
        summary: `${r.repositories_scanned} repos, ${r.chunks_created} searchable chunks`,
      };
    } catch (err) {
      results.github = { status: "failed", summary: err instanceof Error ? err.message : "GitHub sync failed" };
    }
  }

  if (sources.jira_jql) {
    try {
      const r = await syncJiraContext({ cloneId: clone.id, jql: sources.jira_jql });
      results.jira = { status: "synced", summary: `${r.issues_fetched} issues, ${r.chunks_created} searchable chunks` };
    } catch (err) {
      results.jira = { status: "failed", summary: err instanceof Error ? err.message : "Jira sync failed" };
    }
  }

  if (results.github.status === "synced" || results.jira.status === "synced") {
    await markCloneTrained(clone.id);
  }

  const anyFailed = results.github.status === "failed" || results.jira.status === "failed";
  return NextResponse.json({ clone_id: clone.id, results }, { status: anyFailed ? 502 : 200 });
}
