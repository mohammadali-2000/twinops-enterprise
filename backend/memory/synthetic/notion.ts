import type { MemoryResourceInput } from "@/lib/core/types";
import type { SyntheticPerson, SyntheticProject, SyntheticWorld } from "./context";
import { randomIsoBetween, type SeededRng } from "./random";

interface NotionSourceMetadata extends Record<string, unknown> {
  source_type: "notion";
  page_id: string;
  workspace_id: string;
  last_edited_by: string;
  path: string[];
}

interface NotionGeneratorParams {
  world: SyntheticWorld;
  rng: SeededRng;
  count: number;
  startIso: string;
  endIso: string;
}

function buildEnterprisePage(
  project: SyntheticProject,
  editor: SyntheticPerson,
  world: SyntheticWorld,
  rng: SeededRng
): { title: string; content: string } {
  const templates = [
    {
      title: "ADR-001: PostgreSQL 17 with pgvector for Enterprise Memory Tier",
      content: `Architectural Decision Record: ADR-001
Status: APPROVED
Author: Marcus Vance (Principal AI & Cloud Architect)
Reviewers: Elena Rostova, David Kim, Rachel Hayes

Context:
Enterprise delivery pods require sub-50ms similarity search over both long-form technical documentation (semantic chunks) and chronological sprint events (episodic facts).

Decision:
Adopt PostgreSQL 17 with the native pgvector extension.
- Embeddings: text-embedding-3-small (1536 dimensions)
- Index: IVFFlat with lists=100 and probes=10
- Caching: In-memory SHA-256 hash lookup to skip repeat vectorization

Consequences:
- Positive: Single database engine handles relational data (clones, integrations, audit logs) and vector embeddings, eliminating external vector database synchronization lag.
- Trade-off: Requires index rebuilding as table grows past 500,000 memories. Handled via automated maintenance scripts.`,
    },
    {
      title: "ADR-002: Dual-Index Strategy (Semantic Chunks & Episodic Facts)",
      content: `Architectural Decision Record: ADR-002
Status: APPROVED
Author: Marcus Vance
Reviewer: Elena Rostova

Context:
Digital twins need to answer two fundamentally different types of questions:
1. "What is our API rate limiting specification?" (Semantic knowledge)
2. "Why did we decide to reject Redis in favor of database read replicas?" (Episodic timeline)

Decision:
Implement dual-memory indexing in the memories table:
- type="document" / type="chunk": 500-token chunks with 50-token overlap for architectural specifications and READMEs.
- type="fact": Atomic verified statements extracted from PR debates, Jira ticket resolutions, and sprint retrospectives.

Retrieval Strategy:
Weighted cosine similarity: 60% semantic relevance score + 40% recency/confidence decay for episodic facts.`,
    },
    {
      title: "ADR-003: Microsoft Teams Adaptive Card v1.4 Integration Pattern",
      content: `Architectural Decision Record: ADR-003
Status: APPROVED
Author: Marcus Vance
Reviewer: Rachel Hayes

Context:
Enterprise delivery teams collaborate primarily inside Microsoft Teams. The digital twin must interact within native channels without requiring tenant-wide administrative bot permissions.

Decision:
Deploy an omnichannel webhook dispatcher utilizing Microsoft Power Automate Workflows.
- Inbound: Teams workflow posts event payloads to /api/teams/events.
- Outbound: TwinOps formats and dispatches structured Adaptive Cards (Schema v1.4) containing verifiable PR citations, commit SHAs, and confidence scores.

Benefits:
- Zero tenant admin approval required.
- Pod leads can self-service activate the connector in under 3 minutes.`,
    },
    {
      title: "ADR-004: Zero-Trust Tenant Isolation & AES-256 Credential Encryption",
      content: `Architectural Decision Record: ADR-004
Status: APPROVED
Author: Elena Rostova
Reviewer: David Kim

Context:
Multiple delivery pods operating on a shared instance must guarantee complete tenant and pod data isolation.

Decision:
1. All database queries must enforce tenant_id and clone_id partitioning at the query boundary.
2. Row-Level Security (RLS) policies enabled in PostgreSQL to block cross-pod queries at the database engine level.
3. Third-party integration tokens (GitHub, Slack, Teams) must be encrypted using AES-256-GCM before writing to the database.

Audit:
Automated regression tests in CI verify that unauthorized queries fail with explicit access denial.`,
    },
    {
      title: "TwinOps - Delivery Pod Playbook & Best Practices",
      content: `TwinOps Enterprise Delivery Pod Operational Playbook
Governance & Architecture Working Group

1. Ambient Monitoring Mode:
When an engineer sets their status to "In Meeting" or "Away", TwinOps ambient monitoring engages to respond to channel inquiries on their behalf.

2. Peer Consultation Protocol:
If a query requires cross-pod expertise (e.g., asking the Frontend twin about a backend database schema), the twin invokes the consult_clone tool to query the peer twin and synthesizes a unified answer with multi-hop citations.

3. Continual Learning:
After resolving an architectural question, the twin automatically extracts verified facts and queues them for human approval or automated embedding indexing.`,
    },
  ];

  return rng.pick(templates);
}

export function generateNotionResources({
  world,
  rng,
  count,
  startIso,
  endIso,
}: NotionGeneratorParams): MemoryResourceInput[] {
  const resources: MemoryResourceInput[] = [];
  const project = rng.pick(world.projects);

  for (let i = 0; i < count; i++) {
    const editor = rng.pick(world.people);
    const page = buildEnterprisePage(project, editor, world, rng);
    const occurredAt = randomIsoBetween(rng, startIso, endIso);
    const pageId = `notion_page_${project.key.toLowerCase()}_${rng.int(100, 999)}`;

    const metadata: NotionSourceMetadata = {
      source_type: "notion",
      page_id: pageId,
      workspace_id: project.notion_page_id,
      last_edited_by: editor.name,
      path: ["Engineering", project.name, page.title],
    };

    resources.push({
      clone_id: world.cloneId,
      source_type: "notion",
      external_id: pageId,
      content: `# ${page.title}\n\n${page.content}`,
      modality: "text",
      source_metadata: metadata,
      occurred_at: occurredAt,
    });
  }

  return resources;
}
