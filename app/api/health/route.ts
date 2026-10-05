import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { createServerSupabaseClient } from "@/lib/core/supabase/server";
import { generateEmbedding } from "@/lib/agents/openai";
import { getGitHubToken, getJiraCredentials, getTeamsWebhookUrl } from "@/lib/integrations/credentials";

type Check = { ok: boolean; detail: string };

async function check(fn: () => Promise<string>): Promise<Check> {
  try {
    return { ok: true, detail: await fn() };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "Failed" };
  }
}

/**
 * GET /api/health          quick configuration check
 * GET /api/health?live=1   also calls OpenAI, GitHub and Jira to prove the keys work
 * Never returns secret values.
 */
export async function GET(request: NextRequest) {
  const live = request.nextUrl.searchParams.get("live") === "1";

  const database = await check(async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
    }
    const supabase = createServerSupabaseClient();
    const { count: twins, error } = await supabase.from("clones").select("id", { count: "exact", head: true });
    if (error) throw new Error(`${error.message}. Did you run the schema SQL?`);
    const embeddedChunks = async (source: string) => {
      const res = await supabase
        .from("memories")
        .select("id", { count: "exact", head: true })
        .eq("source", source)
        .eq("type", "chunk")
        .not("embedding", "is", null);
      if (res.error) throw new Error(res.error.message);
      return res.count ?? 0;
    };
    const [github, jira] = await Promise.all([embeddedChunks("github"), embeddedChunks("jira")]);
    return `${twins ?? 0} twins, ${github} GitHub chunks, ${jira} Jira chunks (with embeddings)`;
  });

  const ragFlag: Check =
    process.env.USE_SUPABASE_MEMORY === "true"
      ? { ok: true, detail: "USE_SUPABASE_MEMORY=true" }
      : { ok: false, detail: "Set USE_SUPABASE_MEMORY=true or the twins can't search memory" };

  const openai = await check(async () => {
    if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) throw new Error("OPENAI_API_KEY not set");
    if (!live) return `Key set, model ${process.env.OPENAI_MODEL || "gpt-4o"}`;
    await generateEmbedding("health check");
    return `Key works, model ${process.env.OPENAI_MODEL || "gpt-4o"}`;
  });

  const github = await check(async () => {
    const token = await getGitHubToken();
    if (!live) return "Token set";
    const { data } = await new Octokit({ auth: token }).users.getAuthenticated();
    return `Token works (signed in as ${data.login})`;
  });

  const jira = await check(async () => {
    const creds = await getJiraCredentials();
    if (!live) return `Configured for ${creds.baseUrl}`;
    const auth = Buffer.from(`${creds.email}:${creds.apiToken}`).toString("base64");
    const res = await fetch(`${creds.baseUrl}/rest/api/3/myself`, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Jira returned ${res.status} for ${creds.baseUrl}`);
    const me = (await res.json()) as { displayName?: string };
    return `Token works (signed in as ${me.displayName ?? creds.email})`;
  });

  const teamsInbound: Check = process.env.TEAMS_FLOW_SECRET
    ? { ok: true, detail: "TEAMS_FLOW_SECRET set; endpoint /api/teams/events" }
    : { ok: false, detail: "TEAMS_FLOW_SECRET not set" };

  const teamsOutbound = await check(async () => {
    const url = await getTeamsWebhookUrl();
    if (!url) throw new Error("Optional: TEAMS_WEBHOOK_URL not set (only needed to push cards to Teams)");
    return "Webhook URL set";
  });

  const checks = { database, ragFlag, openai, github, jira, teamsInbound, teamsOutbound };
  const required = [database, ragFlag, openai, github, jira, teamsInbound];
  return NextResponse.json({ ok: required.every((c) => c.ok), live, checks });
}
