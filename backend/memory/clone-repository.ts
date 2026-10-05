import { isSupabaseConfigured } from "./flags";
import { createServerSupabaseClient } from "@/lib/core/supabase/server";
import type {
  Clone,
  ClonePersonality,
  Memory,
  PersonContext,
} from "@/lib/core/types";

interface SupabaseCloneRow {
  id: string;
  name: string;
  avatar_url: string | null;
  personality: unknown;
  expertise_tags: string[] | null;
  status: Clone["status"];
  owner_name: string | null;
  owner_email: string | null;
  owner_role: string | null;
  owner_department: string | null;
  created_at: string;
  trained_at: string | null;
}

type RuntimeOwner = {
  name: string;
  role: string;
  department?: string;
};

export interface CloneRuntime {
  clone: Clone | null;
  owner?: RuntimeOwner;
}

export interface CloneApiSummary extends Clone {
  owner_name?: string;
  owner_role?: string;
  owner_department?: string;
}

// Document shape for the detail API
interface DocumentView {
  id: string;
  clone_id: string;
  title: string;
  content: string;
  doc_type: string;
  created_at: string;
}

export interface CloneApiDetail {
  clone: Clone & {
    owner: PersonContext;
    documents: DocumentView[];
    memories: Memory[];
    stats: {
      document_count: number;
      memory_count: number;
      training_sources: string[];
    };
  };
}

function defaultPersonality(): ClonePersonality {
  return {
    communication_style: "direct",
    tone: "",
    bio: "",
    expertise_areas: [],
  };
}

function normalizePersonality(value: unknown): ClonePersonality {
  if (!value || typeof value !== "object") return defaultPersonality();
  const raw = value as Partial<ClonePersonality>;
  const style =
    raw.communication_style === "direct" ||
    raw.communication_style === "detailed" ||
    raw.communication_style === "casual" ||
    raw.communication_style === "formal"
      ? raw.communication_style
      : "direct";
  return {
    communication_style: style,
    tone: raw.tone || "",
    bio: raw.bio || "",
    expertise_areas: Array.isArray(raw.expertise_areas)
      ? raw.expertise_areas.filter((v): v is string => typeof v === "string")
      : [],
    sources: raw.sources && typeof raw.sources === "object" ? raw.sources : {},
  };
}

function stripCloneSuffix(name: string): string {
  return name.replace(/\s*\(Clone\)$/i, "");
}

function mapClone(row: SupabaseCloneRow): Clone {
  return {
    id: row.id,
    name: stripCloneSuffix(row.name),
    avatar_url: row.avatar_url || undefined,
    personality: normalizePersonality(row.personality),
    expertise_tags: row.expertise_tags || [],
    status: row.status,
    owner_name: row.owner_name || undefined,
    owner_email: row.owner_email || undefined,
    owner_role: row.owner_role || undefined,
    owner_department: row.owner_department || undefined,
    created_at: row.created_at,
    trained_at: row.trained_at || undefined,
  };
}

function ownerFromClone(clone: Clone): PersonContext {
  return {
    id: clone.id,
    name: clone.owner_name || clone.name,
    role: clone.owner_role || "member",
    department: clone.owner_department || "Unknown",
    avatar_url: clone.avatar_url,
    recent_interactions: [],
    relationship: "Owner profile loaded from workspace data.",
    key_facts: clone.owner_email
      ? [`Primary email: ${clone.owner_email}`]
      : ["No owner profile available."],
  };
}

export async function getCloneRuntime(cloneId?: string): Promise<CloneRuntime> {
  const requestedId = cloneId;
  if (!requestedId || !isSupabaseConfigured()) {
    return { clone: null };
  }

  const supabase = createServerSupabaseClient();
  const { data: cloneRow } = await supabase
    .from("clones")
    .select(
      "id, name, avatar_url, personality, expertise_tags, status, owner_name, owner_email, owner_role, owner_department, created_at, trained_at"
    )
    .eq("id", requestedId)
    .maybeSingle();

  if (!cloneRow) {
    return { clone: null };
  }

  const mappedClone = mapClone(cloneRow as SupabaseCloneRow);
  return {
    clone: mappedClone,
    owner: {
      name: mappedClone.owner_name || mappedClone.name,
      role: mappedClone.owner_role || "member",
      department: mappedClone.owner_department || "Unknown",
    },
  };
}

export async function listClonesForApi(): Promise<CloneApiSummary[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createServerSupabaseClient();
  const { data: cloneRows, error } = await supabase
    .from("clones")
    .select(
      "id, name, avatar_url, personality, expertise_tags, status, owner_name, owner_email, owner_role, owner_department, created_at, trained_at"
    )
    .order("created_at", { ascending: false });

  if (error || !cloneRows || cloneRows.length === 0) {
    return [];
  }

  return (cloneRows as SupabaseCloneRow[]).map((row) => {
    const clone = mapClone(row);
    return {
      ...clone,
      owner_name: clone.owner_name,
      owner_role: clone.owner_role,
      owner_department: clone.owner_department,
    };
  });
}

export async function getCloneDetailForApi(
  cloneId: string
): Promise<CloneApiDetail | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data: cloneRow } = await supabase
    .from("clones")
    .select(
      "id, name, avatar_url, personality, expertise_tags, status, owner_name, owner_email, owner_role, owner_department, created_at, trained_at"
    )
    .eq("id", cloneId)
    .maybeSingle();

  if (!cloneRow) return null;
  const clone = mapClone(cloneRow as SupabaseCloneRow);

  // Fetch documents and facts from the unified memories table
  const [{ data: documentRows }, { data: factRows }] = await Promise.all([
    supabase
      .from("memories")
      .select("id, clone_id, content, metadata, created_at")
      .eq("clone_id", clone.id)
      .eq("type", "document")
      .order("created_at", { ascending: false }),
    supabase
      .from("memories")
      .select("id, clone_id, type, source, content, confidence, metadata, occurred_at, created_at")
      .eq("clone_id", clone.id)
      .eq("type", "fact")
      .order("created_at", { ascending: false }),
  ]);

  const documents: DocumentView[] =
    (documentRows || []).map((row: { id: string; clone_id: string; content: string; metadata: Record<string, unknown>; created_at: string }) => ({
      id: row.id,
      clone_id: row.clone_id,
      title: (row.metadata?.title as string) || "Untitled",
      content: row.content,
      doc_type: (row.metadata?.doc_type as string) || "document",
      created_at: row.created_at,
    }));

  const memories: Memory[] = (factRows as Memory[]) || [];
  const owner = ownerFromClone(clone);

  return {
    clone: {
      ...clone,
      owner,
      documents,
      memories,
      stats: {
        document_count: documents.length,
        memory_count: memories.length,
        training_sources: Array.from(
          new Set(documents.map((d) => d.doc_type))
        ),
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Clone management
// ---------------------------------------------------------------------------

export interface CloneInput {
  name: string;
  owner_email?: string;
  owner_role?: string;
  owner_department?: string;
  expertise_tags?: string[];
  communication_style?: ClonePersonality["communication_style"];
  bio?: string;
  github_username?: string;
  jira_jql?: string;
}

const CLONE_COLUMNS =
  "id, name, avatar_url, personality, expertise_tags, status, owner_name, owner_email, owner_role, owner_department, created_at, trained_at";

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createServerSupabaseClient();
}

function personalityFromInput(input: CloneInput, existing?: ClonePersonality): ClonePersonality {
  const base = existing ?? defaultPersonality();
  return {
    ...base,
    communication_style: input.communication_style ?? base.communication_style,
    tone: base.tone || "Professional, clear, and concise.",
    bio: input.bio ?? base.bio,
    expertise_areas: input.expertise_tags ?? base.expertise_areas,
    sources: {
      ...base.sources,
      ...(input.github_username !== undefined ? { github_username: input.github_username } : {}),
      ...(input.jira_jql !== undefined ? { jira_jql: input.jira_jql } : {}),
    },
  };
}

export async function createClone(input: CloneInput): Promise<Clone> {
  const { data, error } = await requireSupabase()
    .from("clones")
    .insert({
      name: input.name,
      owner_name: input.name,
      owner_email: input.owner_email || null,
      owner_role: input.owner_role || null,
      owner_department: input.owner_department || null,
      expertise_tags: input.expertise_tags ?? [],
      personality: personalityFromInput(input),
      status: "active",
    })
    .select(CLONE_COLUMNS)
    .single();
  if (error) throw new Error(`Could not create twin: ${error.message}`);
  return mapClone(data as SupabaseCloneRow);
}

export async function updateClone(id: string, input: Partial<CloneInput>): Promise<Clone | null> {
  const supabase = requireSupabase();
  const { data: existing } = await supabase.from("clones").select(CLONE_COLUMNS).eq("id", id).maybeSingle();
  if (!existing) return null;
  const current = mapClone(existing as SupabaseCloneRow);

  const patch: Record<string, unknown> = {
    personality: personalityFromInput({ name: current.name, ...input }, current.personality),
  };
  if (input.name !== undefined) {
    patch.name = input.name;
    patch.owner_name = input.name;
  }
  if (input.owner_email !== undefined) patch.owner_email = input.owner_email || null;
  if (input.owner_role !== undefined) patch.owner_role = input.owner_role || null;
  if (input.owner_department !== undefined) patch.owner_department = input.owner_department || null;
  if (input.expertise_tags !== undefined) patch.expertise_tags = input.expertise_tags;

  const { data, error } = await supabase.from("clones").update(patch).eq("id", id).select(CLONE_COLUMNS).single();
  if (error) throw new Error(`Could not update twin: ${error.message}`);
  return mapClone(data as SupabaseCloneRow);
}

export async function deleteClone(id: string): Promise<boolean> {
  const { data, error } = await requireSupabase().from("clones").delete().eq("id", id).select("id");
  if (error) throw new Error(`Could not delete twin: ${error.message}`);
  return (data ?? []).length > 0;
}

export async function markCloneTrained(id: string): Promise<void> {
  await requireSupabase().from("clones").update({ trained_at: new Date().toISOString() }).eq("id", id);
}

const STYLES = ["direct", "detailed", "casual", "formal"] as const;

function optionalString(value: unknown, field: string, max: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`${field} is too long (max ${max} characters)`);
  return trimmed;
}

/** Validate a create/update body from the API. Throws with a user-readable message. */
export function parseCloneInput(body: unknown, requireName: boolean): Partial<CloneInput> {
  if (!body || typeof body !== "object") throw new Error("Request body must be a JSON object");
  const b = body as Record<string, unknown>;

  const name = optionalString(b.name, "name", 100);
  if (requireName && !name) throw new Error("name is required");

  const tagsRaw = b.expertise_tags;
  let expertise_tags: string[] | undefined;
  if (tagsRaw !== undefined) {
    const list = Array.isArray(tagsRaw) ? tagsRaw : typeof tagsRaw === "string" ? tagsRaw.split(",") : null;
    if (!list) throw new Error("expertise_tags must be a list or comma-separated string");
    expertise_tags = list
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  const style = b.communication_style;
  if (style !== undefined && !STYLES.includes(style as (typeof STYLES)[number])) {
    throw new Error(`communication_style must be one of: ${STYLES.join(", ")}`);
  }

  const github_username = optionalString(b.github_username, "github_username", 39);
  if (github_username && !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(github_username)) {
    throw new Error("github_username is not a valid GitHub username");
  }

  return {
    ...(name !== undefined ? { name } : {}),
    ...(expertise_tags !== undefined ? { expertise_tags } : {}),
    ...(style !== undefined ? { communication_style: style as CloneInput["communication_style"] } : {}),
    owner_email: optionalString(b.owner_email, "owner_email", 200),
    owner_role: optionalString(b.owner_role, "owner_role", 100),
    owner_department: optionalString(b.owner_department, "owner_department", 100),
    bio: optionalString(b.bio, "bio", 1000),
    github_username,
    jira_jql: optionalString(b.jira_jql, "jira_jql", 500),
  };
}
