import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/core/supabase/server";
import { askForJson, formatDate, formatDocsForPrompt, isOpenIssue, loadSourceDocs } from "@/lib/agents/briefs";
import type { Employee, HandoffPack } from "@/lib/twinops/types";

interface CloneRow {
  id: string;
  name: string;
  owner_role: string | null;
  owner_department: string | null;
  expertise_tags: string[] | null;
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function toEmployee(c: CloneRow): Employee {
  return {
    id: c.id,
    name: c.name,
    role: c.owner_role || "Team Member",
    team: c.owner_department || "General",
    tenure: "",
    initials: getInitials(c.name),
  };
}

function requireSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase is not configured.");
  }
  return createServerSupabaseClient();
}

/** GET /api/twinops/offboarding: twins that a handoff pack can be built for. */
export async function GET() {
  try {
    const { data, error } = await requireSupabase()
      .from("clones")
      .select("id, name, owner_role, owner_department, expertise_tags")
      .eq("status", "active")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return NextResponse.json({ employees: ((data ?? []) as CloneRow[]).map(toEmployee) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

type PackDraft = {
  summaryBullets: string[];
  ownershipAreas: { area: string; description: string }[];
};

const PRIORITY_MAP: Record<string, HandoffPack["unresolvedWork"][number]["priority"]> = {
  highest: "critical",
  blocker: "critical",
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
  lowest: "low",
};

/**
 * POST /api/twinops/offboarding  { employeeId }
 * Builds a handoff pack from the person's synced GitHub repos and Jira tickets.
 * Open work and links come straight from the data; only the summary is written by the model.
 */
export async function POST(request: NextRequest) {
  try {
    const { employeeId } = (await request.json()) as { employeeId?: string };
    if (!employeeId) return NextResponse.json({ error: "employeeId is required" }, { status: 400 });

    const { data: cloneRow } = await requireSupabase()
      .from("clones")
      .select("id, name, owner_role, owner_department, expertise_tags")
      .eq("id", employeeId)
      .maybeSingle();
    if (!cloneRow) return NextResponse.json({ error: "Clone not found" }, { status: 404 });

    const clone = cloneRow as CloneRow;
    const docs = await loadSourceDocs([clone.id], 40);

    const keyLinks = docs
      .filter((d) => d.url)
      .slice(0, 12)
      .map((d) => ({ title: d.title, url: d.url, category: d.source === "jira" ? "Jira" : "GitHub" }));

    const unresolvedWork = docs.filter(isOpenIssue).slice(0, 10).map((d) => {
      const priority = /Priority:\s*([A-Za-z]+)/.exec(d.content)?.[1]?.toLowerCase() ?? "";
      return {
        title: d.title,
        priority: PRIORITY_MAP[priority] ?? "medium",
        description: `Status: ${d.status}. Last updated ${formatDate(d.occurredAt)}.`,
      };
    });

    const pack: HandoffPack = {
      employee: toEmployee(clone),
      generatedAt: new Date().toISOString(),
      ownershipAreas: [],
      keyLinks,
      unresolvedWork,
      summaryBullets: [],
    };

    if (docs.length === 0) {
      pack.summaryBullets = [`No GitHub or Jira data has been synced for ${clone.name} yet. Sync this twin in Settings.`];
      return NextResponse.json({ pack });
    }

    const draft = await askForJson<PackDraft>(`${clone.name} (${clone.owner_role || "Team Member"}) is handing over their work.
Use ONLY these numbered sources from their real GitHub repos and Jira tickets:
${formatDocsForPrompt(docs)}

Return raw JSON:
{
  "summaryBullets": ["3-5 bullets a successor must know, naming specific repos or ticket keys"],
  "ownershipAreas": [{ "area": "repo, component, or Jira project they own", "description": "what it is and its current state" }]
}
Do not invent anything that is not in the sources.`);

    pack.summaryBullets = Array.isArray(draft.summaryBullets)
      ? draft.summaryBullets.filter((s) => typeof s === "string").slice(0, 6)
      : [];
    pack.ownershipAreas = (Array.isArray(draft.ownershipAreas) ? draft.ownershipAreas : [])
      .filter((a) => a?.area)
      .slice(0, 6)
      .map((a) => ({ area: a.area, description: a.description || "", status: "transitioning" as const }));

    return NextResponse.json({ pack });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
