import type { MemoryResourceInput } from "@/lib/core/types";
import type { SyntheticProject, SyntheticWorld } from "./context";
import { randomIsoBetween, type SeededRng } from "./random";

interface SlackSourceMetadata extends Record<string, unknown> {
  source_type: "slack";
  channel_id: string;
  channel_name: string;
  sender_id: string;
  sender_name: string;
  thread_ts: string | null;
}

interface SlackGeneratorParams {
  world: SyntheticWorld;
  rng: SeededRng;
  count: number;
  startIso: string;
  endIso: string;
}

function buildStandupMessage(
  world: SyntheticWorld,
  sender: { id: string; name: string; role: string; owns: string[] },
  rng: SeededRng
): string {
  const templates = [
    `*Standup Update — ${sender.name} (${sender.role})*
• *Yesterday:* Reviewed PRs for vector index tuning and Microsoft Teams Adaptive Card dispatch pipeline.
• *Today:* Validating pgvector IVFFlat probe latency under concurrent load testing.
• *Blockers:* None. Need sign-off on the credential encryption migration PR before staging deployment.`,

    `*Standup Update — ${sender.name} (${sender.role})*
• *Yesterday:* Implemented OAuth2 token exchange and correlation ID tracing across all API route handlers.
• *Today:* Testing inter-service communication between delivery pod digital twins and verifying audit logs.
• *Blockers:* Waiting on staging environment certificate renewal.`,

    `*Standup Update — ${sender.name} (${sender.role})*
• *Yesterday:* Completed unit test coverage for memory compaction and zero-mock database repository.
• *Today:* Hardening input sanitization and prompt injection boundary filters.
• *Blockers:* None. All automated CI checks passing.`,
  ];
  return rng.pick(templates);
}

function buildArchitecturalDiscussion(
  world: SyntheticWorld,
  rng: SeededRng
): string {
  const conflict = rng.pick(world.conflicts);
  const m = world.people[0]?.name || "Marcus Vance";
  const e = world.people[1]?.name || "Elena Rostova";
  const d = world.people[2]?.name || "David Kim";

  const templates = [
    `${m}: @here Team, please review the ADR on vector similarity retrieval contracts. We need deterministic citation grounding for all digital twin responses.
${e}: Looked at the numbers. IVFFlat with probes=10 gives us 38ms p95 latency on 50k memories. That meets our SLA.
${d}: Verified in staging. The connection pooling configuration handles 500 concurrent active streams with zero connection leaks.
${m}: Excellent. Let's merge the PR and verify the continuous integration suite.`,

    `${e}: Quick note on inter-pod security: we must enforce strict tenant_id isolation in all PostgreSQL queries. Cross-tenant leakage is unacceptable.
${d}: Added Row-Level Security (RLS) policies to both clones and memories tables. Tests pass with zero regressions.
${m}: Great work. This satisfies the enterprise data protection requirements for our pilot rollout.`,

    `${m}: ${conflict.side_a.position}
${e}: ${conflict.side_b.position}
${d}: ${conflict.passive_aggressive[rng.int(0, conflict.passive_aggressive.length - 1)]}
${m}: Let's adopt dual indexing: semantic chunks for documentation and episodic facts for sprint events. That gives us both accuracy and timeline context.`,
  ];

  return rng.pick(templates);
}

export function generateSlackResources({
  world,
  rng,
  count,
  startIso,
  endIso,
}: SlackGeneratorParams): MemoryResourceInput[] {
  const resources: MemoryResourceInput[] = [];
  const project = rng.pick(world.projects);

  for (let i = 0; i < count; i++) {
    const sender = rng.pick(world.people);
    const isDiscussion = i % 3 === 0;

    const content = isDiscussion
      ? buildArchitecturalDiscussion(world, rng)
      : buildStandupMessage(world, sender, rng);

    const occurredAt = randomIsoBetween(rng, startIso, endIso);
    const ts = String(new Date(occurredAt).getTime() / 1000);

    const metadata: SlackSourceMetadata = {
      source_type: "slack",
      channel_id: project.channel_id,
      channel_name: project.channel,
      sender_id: sender.id,
      sender_name: sender.name,
      thread_ts: isDiscussion ? ts : null,
    };

    resources.push({
      clone_id: world.cloneId,
      source_type: "slack",
      external_id: `slack_${project.channel_id}_${ts}`,
      content,
      modality: "text",
      source_metadata: metadata,
      occurred_at: occurredAt,
    });
  }

  return resources;
}
