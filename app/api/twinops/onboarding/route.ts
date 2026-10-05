import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/core/supabase/server";
import { askForJson, formatDate, formatDocsForPrompt, loadSourceDocs, pickDocs } from "@/lib/agents/briefs";
import type { OnboardingBrief } from "@/lib/twinops/types";

interface CloneRow {
  id: string;
  name: string;
  owner_role: string | null;
  owner_department: string | null;
  expertise_tags: string[] | null;
}

async function loadActiveClones(): Promise<CloneRow[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase is not configured.");
  }
  const { data, error } = await createServerSupabaseClient()
    .from("clones")
    .select("id, name, owner_role, owner_department, expertise_tags")
    .eq("status", "active")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CloneRow[];
}

/** GET /api/twinops/onboarding: role/team options taken from the real twins. */
export async function GET() {
  try {
    const clones = await loadActiveClones();
    const seen = new Set<string>();
    const options: { role: string; team: string }[] = [];
    for (const c of clones) {
      const role = c.owner_role || "Team Member";
      const team = c.owner_department || "General";
      if (!seen.has(`${role}|${team}`)) {
        seen.add(`${role}|${team}`);
        options.push({ role, team });
      }
    }
    return NextResponse.json({ options });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

type BriefDraft = {
  keyContext: string[];
  decisions: { decision: string; rationale: string; source_ids: number[] }[];
  risks: { risk: string; severity: string; context: string; source_ids: number[] }[];
};

/**
 * POST /api/twinops/onboarding  { role, team }
 * Builds an onboarding brief for a new joiner from the team's synced GitHub/Jira data.
 */
export async function POST(request: NextRequest) {
  try {
    const { role, team } = (await request.json()) as { role?: string; team?: string };
    if (!role || !team) return NextResponse.json({ error: "role and team are required" }, { status: 400 });

    const allClones = await loadActiveClones();
    const teamClones = allClones.filter((c) => (c.owner_department || "General") === team);
    const scope = teamClones.length > 0 ? teamClones : allClones;
    const docs = await loadSourceDocs(scope.map((c) => c.id), 25);

    const keyPeople = scope.map((c) => ({
      name: c.name,
      role: c.owner_role || "Team Member",
      relationship: `${c.owner_role || "Team Member"} in ${c.owner_department || "General"}`,
      tip: c.expertise_tags?.length ? `Ask about: ${c.expertise_tags.slice(0, 4).join(", ")}` : "",
    }));

    const keyDocs = docs.slice(0, 6).map((d) => ({
      title: d.title,
      type: d.source,
      url: d.url,
      relevance: d.content.slice(0, 140) + (d.content.length > 140 ? "…" : ""),
    }));

    const base: OnboardingBrief = {
      role,
      team,
      generatedAt: new Date().toISOString(),
      keyContext: [],
      keyPeople,
      keyDocs,
      decisions: [],
      risks: [],
    };

    if (docs.length === 0) {
      base.keyContext = ["No GitHub or Jira data has been synced for this team yet. Sync the twins in Settings."];
      return NextResponse.json({ brief: base });
    }

    const draft = await askForJson<BriefDraft>(`You are writing an onboarding brief for a new ${role} joining the ${team} team.
Use ONLY these numbered sources (the team's real GitHub repos and Jira tickets):
${formatDocsForPrompt(docs)}

Return raw JSON:
{
  "keyContext": ["3-5 short sentences on what the team is working on right now"],
  "decisions": [{ "decision": "...", "rationale": "...", "source_ids": [n] }],
  "risks": [{ "risk": "...", "severity": "low" | "medium" | "high", "context": "...", "source_ids": [n] }]
}
Only include decisions and risks that are clearly visible in the sources (e.g. blocked or overdue tickets, high-priority bugs, chosen approaches in READMEs or tickets). Return empty arrays if there are none. Do not invent people, dates, or numbers.`);

    base.keyContext = Array.isArray(draft.keyContext) ? draft.keyContext.filter((s) => typeof s === "string").slice(0, 5) : [];

    base.decisions = (Array.isArray(draft.decisions) ? draft.decisions : []).slice(0, 5).flatMap((d) => {
      const cited = pickDocs(docs, d?.source_ids);
      if (!d?.decision || cited.length === 0) return [];
      // Only name people that actually appear in the cited sources.
      const participants = scope
        .map((c) => c.name)
        .filter((name) => cited.some((doc) => doc.content.includes(name)));
      return [{
        decision: d.decision,
        date: formatDate(cited[0].occurredAt),
        rationale: `${d.rationale || ""} (Source: ${cited.map((c) => c.title).join("; ")})`.trim(),
        participants,
      }];
    });

    base.risks = (Array.isArray(draft.risks) ? draft.risks : []).slice(0, 5).flatMap((r) => {
      const cited = pickDocs(docs, r?.source_ids);
      if (!r?.risk || cited.length === 0) return [];
      const severity = r.severity === "high" || r.severity === "medium" ? r.severity : "low";
      return [{ risk: r.risk, severity, context: `${r.context || ""} (Source: ${cited.map((c) => c.title).join("; ")})`.trim() }];
    });

    return NextResponse.json({ brief: base });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
