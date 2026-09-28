import type { MemoryResourceInput } from "@/lib/core/types";
import type { SyntheticPerson, SyntheticProject, SyntheticWorld } from "./context";
import { randomIsoBetween, type SeededRng } from "./random";

interface EmailSourceMetadata extends Record<string, unknown> {
  source_type: "email";
  message_id: string;
  thread_id: string;
  from: string;
  to: string[];
  cc: string[];
  subject: string;
}

interface EmailGeneratorParams {
  world: SyntheticWorld;
  rng: SeededRng;
  count: number;
  startIso: string;
  endIso: string;
}

function buildCorporateEmail(
  project: SyntheticProject,
  from: SyntheticPerson,
  to: SyntheticPerson,
  rng: SeededRng
): { subject: string; body: string } {
  const templates = [
    {
      subject: `Architecture Review: TwinOps Vector Retrieval SLA & Token Security`,
      body: `Hi ${to.name},

Following our platform architecture review for ${project.name}, here is the verified status of the core services:

1. Vector Retrieval Performance:
- The IVFFlat index on the memories table with lists=100 and probes=10 delivers sub-50ms p95 latency on cosine similarity searches.
- SHA-256 embedding caching is operational, preventing redundant vectorization calls for recurring queries.

2. Credential Security:
- Third-party connector credentials (GitHub, Slack, Microsoft Teams) are encrypted at rest with AES-256-GCM.
- Secrets are never emitted in API responses or structured audit logs.

3. Omnichannel Dispatch:
- The Microsoft Teams Power Automate webhook integration delivers Adaptive Cards v1.4 with complete source provenance and citation metadata.

Please let me know if you need any adjustments before our client governance walkthrough.

Best regards,
${from.name}
${from.role}`,
    },
    {
      subject: `Enterprise Delivery Pod Onboarding & Knowledge Transfer Plan`,
      body: `Hi ${to.name},

I've documented our delivery pod knowledge preservation strategy for incoming and rotating team members:

• Automated Onboarding Briefs: Incoming engineers are provisioned with an auto-generated brief summarizing recent architectural decision records (ADRs), active commit histories, and upcoming sprint deliverables.

• Ambient Digital Twin Assistance: When senior architects are in client meetings or planned leave, their digital twins respond to technical queries in Microsoft Teams with citations directly linked to verified PR diffs.

• Offboarding Knowledge Capture: System ownership matrices and unmerged branch contexts are indexed into the pod's persistent memory before rotation.

This addresses our primary objective: eliminating asynchronous communication bottlenecks while preserving institutional engineering memory.

Regards,
${from.name}
${from.role}`,
    },
    {
      subject: `Database Schema Governance & Row-Level Security Verification`,
      body: `Team,

The database schema for the enterprise platform is locked and verified in staging:

• clones: Represents employee digital twins with personality configuration and expertise tags.
• memories: Unified episodic and semantic store with pgvector cosine similarity indexing.
• messages: Ephemeral and persistent conversation telemetry per digital twin session.
• integrations: Encrypted connector configs for enterprise communication channels.

All database queries strictly enforce tenant and pod isolation. Cross-tenant leakage is prohibited at the query boundary.

Best regards,
${from.name}`,
    },
    {
      subject: `Sprint Velocity & Digital Twin Pilot Metrics`,
      body: `Hi ${to.name},

Here is the initial telemetry from our delivery pod digital twin pilot:

- Blocker Resolution Time: Reduced by 64% for recurring architectural and interface questions.
- Senior Architect Interruption Reduction: Average uninterrupted focus time increased from 1.5 to 4.2 hours daily.
- Citation Verification Rate: 98.4% of responses accurately ground in active repository PRs and Jira sprint tickets.

We will present these metrics at the upcoming delivery executive review.

Best,
${from.name}`,
    },
  ];

  return rng.pick(templates);
}

export function generateEmailResources({
  world,
  rng,
  count,
  startIso,
  endIso,
}: EmailGeneratorParams): MemoryResourceInput[] {
  const resources: MemoryResourceInput[] = [];
  const project = rng.pick(world.projects);

  for (let i = 0; i < count; i++) {
    const from = rng.pick(world.people);
    const to = rng.pick(world.people.filter((p) => p.id !== from.id)) || world.people[0];
    const cc = world.people
      .filter((p) => p.id !== from.id && p.id !== to.id)
      .map((p) => p.email);

    const email = buildCorporateEmail(project, from, to, rng);
    const occurredAt = randomIsoBetween(rng, startIso, endIso);
    const threadId = `thread_${project.key.toLowerCase()}_${rng.int(100, 999)}`;
    const messageId = `<msg_${rng.int(10000, 99999)}@twinops.ai>`;

    const metadata: EmailSourceMetadata = {
      source_type: "email",
      message_id: messageId,
      thread_id: threadId,
      from: from.email,
      to: [to.email],
      cc,
      subject: email.subject,
    };

    resources.push({
      clone_id: world.cloneId,
      source_type: "email",
      external_id: `email_${messageId}`,
      content: `From: ${from.name} <${from.email}>\nTo: ${to.name} <${to.email}>\nDate: ${occurredAt}\nSubject: ${email.subject}\n\n${email.body}`,
      modality: "text",
      source_metadata: metadata,
      occurred_at: occurredAt,
    });
  }

  return resources;
}
