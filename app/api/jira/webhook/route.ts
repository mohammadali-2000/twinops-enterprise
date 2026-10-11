import { NextRequest, NextResponse } from "next/server";
import { ingestSingleJiraIssue } from "@/lib/integrations/jira";
import { getActiveCloneId, getJiraCredentials } from "@/lib/integrations/credentials";
import { createServerSupabaseClient } from "@/lib/core/supabase/server";

/**
 * POST /api/jira/webhook
 *
 * Real-time Jira Cloud webhook endpoint.
 * Receives live issue/comment events from Jira Cloud and updates
 * the digital twin's episodic memory instantly with pgvector embeddings.
 *
 * Supported Jira Events:
 * - jira:issue_created
 * - jira:issue_updated
 * - jira:issue_deleted
 * - comment_created
 * - comment_updated
 *
 * Webhook URL to configure in Jira Cloud Settings -> System -> WebHooks:
 *   https://<YOUR_DEPLOYED_DOMAIN>/api/jira/webhook?secret=<OPTIONAL_SECRET>
 */

export async function POST(request: NextRequest) {
  // 1. Optional secret verification
  const expectedSecret = process.env.JIRA_WEBHOOK_SECRET;
  if (expectedSecret) {
    const urlSecret = request.nextUrl.searchParams.get("secret");
    const headerSecret = request.headers.get("x-jira-webhook-secret");
    if (urlSecret !== expectedSecret && headerSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized webhook secret" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const webhookEvent = String(body.webhookEvent || body.issue_event_type_name || "");
  const issue = body.issue as { key?: string; fields?: Record<string, unknown> } | undefined;

  if (!issue || !issue.key) {
    return NextResponse.json({ ok: true, message: "Ignored: no issue payload found" });
  }

  const issueKey = issue.key;
  const fields = issue.fields ?? {};

  // Resolve Jira Cloud base URL
  let baseUrl = "https://atlassian.net";
  try {
    const creds = await getJiraCredentials();
    baseUrl = creds.baseUrl;
  } catch {
    // If credentials aren't loaded yet, default to Jira standard browse path
  }

  // 2. Handle issue deletion
  if (webhookEvent === "jira:issue_deleted") {
    try {
      const supabase = createServerSupabaseClient();
      await supabase
        .from("memories")
        .delete()
        .eq("source", "jira")
        .eq("metadata->>issue_key", issueKey);

      return NextResponse.json({ ok: true, deleted: issueKey });
    } catch (err) {
      console.error("[jira-webhook] Failed to delete issue memory:", err);
      return NextResponse.json({ error: "Failed to process issue deletion" }, { status: 500 });
    }
  }

  // 3. Match issue assignee to a delivery pod clone
  const supabase = createServerSupabaseClient();
  const assignee = fields.assignee as Record<string, unknown> | undefined;
  const assigneeName = String(assignee?.displayName || "");
  const assigneeEmail = String(assignee?.emailAddress || "");

  let targetCloneId: string | null = null;
  if (assigneeName || assigneeEmail) {
    const query = supabase.from("clones").select("id");
    if (assigneeEmail) {
      const { data } = await query.eq("owner_email", assigneeEmail).limit(1).maybeSingle();
      if (data) targetCloneId = data.id as string;
    }
    if (!targetCloneId && assigneeName) {
      const { data } = await supabase
        .from("clones")
        .select("id")
        .ilike("name", `%${assigneeName}%`)
        .limit(1)
        .maybeSingle();
      if (data) targetCloneId = data.id as string;
    }
  }

  if (!targetCloneId) {
    targetCloneId = await getActiveCloneId();
  }

  // 4. Ingest issue in real time into vector memory
  try {
    const { chunksCreated } = await ingestSingleJiraIssue({
      cloneId: targetCloneId,
      key: issueKey,
      fields,
      baseUrl,
    });

    return NextResponse.json({
      ok: true,
      event: webhookEvent,
      issueKey,
      cloneId: targetCloneId,
      chunksCreated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[jira-webhook] Failed to ingest issue ${issueKey}:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to ingest Jira issue" },
      { status: 500 }
    );
  }
}
