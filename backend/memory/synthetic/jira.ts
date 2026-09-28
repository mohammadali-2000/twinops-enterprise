import type { MemoryResourceInput } from "@/lib/core/types";
import type { SyntheticProject, SyntheticWorld } from "./context";
import { randomIsoBetween, type SeededRng } from "./random";

interface JiraSourceMetadata extends Record<string, unknown> {
  source_type: "jira";
  board_id: string;
  issue_key: string;
  issue_type: string;
  assignee: string;
  reporter: string;
  priority: string;
  sprint: string;
}

interface JiraGeneratorParams {
  world: SyntheticWorld;
  rng: SeededRng;
  count: number;
  startIso: string;
  endIso: string;
}

function buildNormalTicket(
  project: SyntheticProject,
  assignee: string,
  rng: SeededRng,
  issueKey: string
): string {
  if (project.phase === "early") {
    const templates = [
      `[${issueKey}] Configure Zero-Trust API Gateway Token Exchange

Acceptance Criteria:
- Implement OAuth2 mTLS token exchange for inter-service communication
- API endpoint: POST /api/auth/token-exchange
- Validates corporate tenant ID and service claim scopes
- Latency < 15ms for cached token verification
- Structured audit log emitted for every authorization request

Assignee: ${assignee}
Story Points: 5
Sprint: Sprint 42 - Gateway Resilience & Token Security`,

      `[${issueKey}] Instrument OpenTelemetry distributed tracing across API routes

Acceptance Criteria:
- Propagate traceparent and correlation IDs across all incoming HTTP headers
- Spans recorded for PostgreSQL queries, pgvector searches, and LLM calls
- Export traces to enterprise OTLP collector
- Performance overhead < 2% CPU at 1,000 req/sec

Assignee: ${assignee}
Story Points: 3
Sprint: Sprint 42 - Gateway Resilience & Token Security`,
    ];
    return rng.pick(templates);
  }

  if (project.phase === "mid") {
    const templates = [
      `[${issueKey}] Deploy Kafka broker partition scaling for event streaming

Acceptance Criteria:
- Configure 12 partitions per delivery pod topic with compaction
- Consumer group auto-rebalancing with zero message loss
- Dead-letter queue (DLQ) configured with automated retry backoff
- Prometheus metrics: consumer lag, throughput, and error rates

Assignee: ${assignee}
Story Points: 8
Sprint: Sprint 43 - Vector Optimization & Stream Resilience`,

      `[${issueKey}] Encrypt integration tokens at rest with AES-256-GCM

Acceptance Criteria:
- Encrypt third-party integration configs before PostgreSQL insertion
- Master key derived from HSM or enterprise KMS environment variable
- Automated key rotation hook with zero-downtime re-encryption
- Unit tests verifying decryption failure on tampering

Assignee: ${assignee}
Story Points: 8
Sprint: Sprint 43 - Vector Optimization & Stream Resilience`,
    ];
    return rng.pick(templates);
  }

  // Final phase
  const templates = [
    `[${issueKey}] Implement RAG retrieval pipeline with pgvector index tuning

Acceptance Criteria:
- Ingest documents: chunk into 500-token semantic segments
- Generate embeddings with text-embedding-3-small (1536 dimensions)
- Store in PostgreSQL with pgvector IVFFlat index tuned with probes=10
- Search: query vector embedding → cosine similarity → top-K retrieval
- Sub-50ms execution time for 50,000 memory entries

Assignee: ${assignee}
Story Points: 8
Sprint: Sprint 44 - Enterprise Pod Delivery & SLA Hardening`,

    `[${issueKey}] Microsoft Teams Adaptive Card v1.4 delivery engine

Acceptance Criteria:
- Dispatched via Power Automate inbound webhook
- Renders structured card with citations, source links, and agent confidence
- Handles timeout and network retry with exponential backoff
- Gracefully falls back to plain text payload on malformed card errors

Assignee: ${assignee}
Story Points: 5
Sprint: Sprint 44 - Enterprise Pod Delivery & SLA Hardening`,

    `[${issueKey}] Implement continual memory extraction from conversations

Acceptance Criteria:
- Asynchronously extract verified facts from employee interactions
- Generate embeddings for extracted facts and deduplicate against existing memories
- Store as memory entries with type="fact" and verified source attribution
- Provide audit trail of learned facts in management dashboard

Assignee: ${assignee}
Story Points: 5
Sprint: Sprint 44 - Enterprise Pod Delivery & SLA Hardening`,

    `[${issueKey}] Executive multi-twin polling and sentiment aggregation

Acceptance Criteria:
- Executive types architectural query or sprint trade-off question
- System queries all delivery pod digital twins in parallel
- Each twin responds with: stance, confidence, summary, and citations
- Aggregates sentiment distribution and key themes into real-time SSE stream
- Zero mock fallbacks — queries active PostgreSQL memories

Assignee: ${assignee}
Story Points: 13
Sprint: Sprint 44 - Enterprise Pod Delivery & SLA Hardening`,
  ];
  return rng.pick(templates);
}

function buildSpicyTicket(
  project: SyntheticProject,
  world: SyntheticWorld,
  assigneeName: string,
  reporterName: string,
  rng: SeededRng,
  issueKey: string
): string {
  const conflict = rng.pick(world.conflicts);
  const other = rng.pick(world.people.filter((p) => p.name !== assigneeName && p.name !== reporterName)) || world.people[0];

  const templates = [
    `[${issueKey}] INCIDENT: Memory vector query latency spike under high concurrency

Priority: CRITICAL
Reporter: ${reporterName}
Assignee: ${assigneeName}

During concurrent load testing across 10 delivery pods, vector similarity queries experienced p99 latency spikes exceeding 650ms.

Root cause analysis:
- Missing partial index on clone_id partition
- Default pgvector probes parameter set too high for memory pool size
- Connection pool exhaustion under parallel SSE stream generation

Action items:
1. ${assigneeName} tuned IVFFlat probes parameter and added composite index
2. ${other.name} configured Supavisor connection pooling for serverless routes
3. Latency verified at 38ms p99 under 500 concurrent active streams

${reporterName}: "${conflict.heated_exchange[rng.int(0, conflict.heated_exchange.length - 1)]}"
${assigneeName}: "${conflict.passive_aggressive[rng.int(0, conflict.passive_aggressive.length - 1)]}"

Status: RESOLVED & VERIFIED IN STAGING`,

    `[${issueKey}] ARCHITECTURE REVIEW: Finalize data isolation boundary for enterprise deployment

Priority: HIGH
Reporter: ${reporterName}

Delivery pod architecture review required before production pilot onboarding.

Key trade-off discussion:
${conflict.side_a.position}

Counter-proposal:
${conflict.side_b.position}

${other.name}: "We must guarantee that one delivery pod's memories are never queryable by another pod."

Resolution:
Enforce tenant_id filtering on all PostgreSQL queries and enable Row-Level Security (RLS) policies across clones and memories tables.`,
  ];

  return rng.pick(templates);
}

export function generateJiraResources({
  world,
  rng,
  count,
  startIso,
  endIso,
}: JiraGeneratorParams): MemoryResourceInput[] {
  const resources: MemoryResourceInput[] = [];
  const project = rng.pick(world.projects);

  for (let i = 0; i < count; i++) {
    const isSpicy = i === 0 || rng.next() < 0.25;
    const assignee = rng.pick(world.people);
    const reporter = rng.pick(world.people.filter((p) => p.id !== assignee.id)) || world.people[0];
    const issueNum = 100 + i * 7 + rng.int(1, 6);
    const issueKey = `${project.key}-${issueNum}`;

    const content = isSpicy
      ? buildSpicyTicket(project, world, assignee.name, reporter.name, rng, issueKey)
      : buildNormalTicket(project, assignee.name, rng, issueKey);

    const occurredAt = randomIsoBetween(rng, startIso, endIso);

    const metadata: JiraSourceMetadata = {
      source_type: "jira",
      board_id: project.jira_board_id,
      issue_key: issueKey,
      issue_type: isSpicy ? "Incident / Architecture Spike" : "Story",
      assignee: assignee.name,
      reporter: reporter.name,
      priority: isSpicy ? "High" : "Medium",
      sprint: project.phase === "early" ? "Sprint 42" : project.phase === "mid" ? "Sprint 43" : "Sprint 44",
    };

    resources.push({
      clone_id: world.cloneId,
      source_type: "jira",
      external_id: `jira_${issueKey}_${occurredAt}`,
      content,
      modality: "text",
      source_metadata: metadata,
      occurred_at: occurredAt,
    });
  }

  return resources;
}
