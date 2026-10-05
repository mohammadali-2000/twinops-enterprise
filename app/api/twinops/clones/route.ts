import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/core/supabase/server";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase is not configured. Add the Supabase keys to .env.local.");
    }
    const supabase = createServerSupabaseClient();

    const { data: clones, error } = await supabase
      .from("clones")
      .select(
        "id, name, avatar_url, personality, expertise_tags, status, owner_name, owner_email, owner_role, owner_department, created_at, trained_at"
      )
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    if (!clones || clones.length === 0) {
      return NextResponse.json({ profiles: [], total: 0 });
    }

    const profiles = clones.map((clone) => {
      const personality = clone.personality as unknown as Record<string, unknown> | null;
      const tone = (personality?.tone as string) || "";
      const bio = (personality?.bio as string) || "";
      const expertiseAreas = (personality?.expertise_areas as string[]) || [];
      const displayName = clone.name.replace(/\s*\(Clone\)$/i, "");

      return {
        employee: {
          id: clone.id,
          name: displayName,
          role: clone.owner_role || expertiseAreas[0] || "Team Member",
          team: clone.owner_department || expertiseAreas[0] || "General",
          tenure: "",
          initials: getInitials(displayName),
        },
        personality: bio || tone,
        expertise: clone.expertise_tags ?? [],
        status: clone.status,
        trainedAt: clone.trained_at ?? null,
        suggestedQuestions: [
          "What are you currently working on?",
          "What's the most important thing I should know?",
          "What are the biggest risks right now?",
          "Tell me about recent decisions and their context.",
        ],
      };
    });

    return NextResponse.json({ profiles, total: profiles.length });
  } catch (err) {
    console.error("[api/twinops/clones] Error loading clones:", err);
    return NextResponse.json(
      { profiles: [], total: 0, error: err instanceof Error ? err.message : "Could not load twins" },
      { status: 500 }
    );
  }
}
