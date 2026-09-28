import { NextRequest, NextResponse } from "next/server";
import { getActiveCloneId } from "@/lib/integrations/credentials";
import { syncJiraContext } from "@/lib/integrations/jira";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { cloneId?: string; jql?: string; maxResults?: number };
    const cloneId = body.cloneId?.trim() || await getActiveCloneId();
    const result = await syncJiraContext({ cloneId, jql: body.jql, maxResults: body.maxResults });
    return NextResponse.json({ success: true, message: "Jira issues synced into the local TwinOps memory.", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Jira sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
