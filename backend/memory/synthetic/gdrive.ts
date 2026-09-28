import type { MemoryResourceInput } from "@/lib/core/types";
import type { SyntheticProject, SyntheticWorld } from "./context";
import { randomIsoBetween, type SeededRng } from "./random";

interface GdriveSourceMetadata extends Record<string, unknown> {
  source_type: "gdrive";
  file_id: string;
  mime_type: string;
  folder_id: string;
  owner: string;
  shared_with: string[];
}

interface GdriveGeneratorParams {
  world: SyntheticWorld;
  rng: SeededRng;
  count: number;
  startIso: string;
  endIso: string;
}

function buildDoc(
  project: SyntheticProject,
  world: SyntheticWorld,
  owner: string,
  rng: SeededRng
): { title: string; content: string; mime: string } {
  if (project.phase === "early") {
    const templates = [
      {
        title: "TwinOps - Technical Architecture Specification v3.0",
        content: `TwinOps Enterprise Architecture Specification v3.0
Platform Engineering & Delivery Architecture

Architecture Core Team: ${world.people.map((p) => p.name).join(", ")}

1. Executive Summary:
TwinOps operates as an autonomous enterprise digital twin system built on PostgreSQL (pgvector), Next.js App Router, OpenRouter LLM orchestration, and multi-tenant connector bridges for Microsoft Teams and GitHub.

2. Core Components:
- Data Tier: PostgreSQL 17 with the pgvector extension for sub-50ms cosine similarity searches across enterprise episodic memories and technical documentation.
- Vector Dimensions: 1536-dimensional embeddings generated via text-embedding-3-small with in-memory SHA-256 caching.
- Agent Orchestration: CloneBrain multi-agent collaboration with peer consultation protocols.
- Omnichannel Delivery: Microsoft Teams Power Automate webhooks delivering Adaptive Cards v1.4, alongside Slack channel simulator bridges.

3. Enterprise Governance:
- Zero cross-tenant leakage enforced via database query boundaries.
- Deterministic RAG grounding with source citations and verifiable commit SHAs.
- AES-256-GCM encryption for integration credentials stored at rest.`,
        mime: "application/vnd.google-apps.document",
      },
      {
        title: "Enterprise Digital Twin Governance & Privacy Policy",
        content: `TwinOps Enterprise Governance & Privacy Policy
Compliance & Security Working Group

Policy Lead: Marcus Vance (Principal AI & Cloud Architect)
Reviewers: Elena Rostova, David Kim, Rachel Hayes

Scope:
This specification governs data classification, vector memory retention, and authorization boundaries for digital twins operating inside enterprise delivery pods.

Mandatory Requirements:
1. Zero Client Data Training: LLM provider policies prohibit data persistence or model fine-tuning on corporate source code.
2. Tenant Isolation: Every delivery pod maintains isolated vector namespaces in PostgreSQL.
3. Access Control: Digital twins respect role-based access control (RBAC). A twin will only cite repositories, documents, and tickets accessible to its associated user profile.
4. Audit Trails: All agent responses include immutable provenance metadata linking to source commits, tickets, or policy documents.`,
        mime: "application/vnd.google-apps.document",
      },
    ];
    return rng.pick(templates);
  }

  if (project.phase === "mid") {
    const templates = [
      {
        title: "PostgreSQL 17 & pgvector Retrieval Benchmark Report",
        content: `PostgreSQL 17 & pgvector Performance Benchmarking
Platform Infrastructure Team

Lead: David Kim
Reviewer: Marcus Vance

Evaluation Parameters:
- Total vectors: 100,000 synthetic episodic memories (1536 dimensions)
- Index type: IVFFlat with lists=100 and probes=10
- Hardware: 8 vCPU, 32GB RAM managed PostgreSQL instance

Results Summary:
- Top-5 Cosine Similarity: 34ms p50, 48ms p95, 62ms p99
- Concurrent Query Throughput: 420 queries/second at < 5% CPU utilization
- SHA-256 Embedding Cache Hit Rate: 68% for recurring sprint inquiries

Recommendation:
Maintain IVFFlat index with periodic REINDEX during scheduled maintenance windows. Deploy Supavisor connection pooling for high-concurrency serverless route handlers.`,
        mime: "application/vnd.google-apps.document",
      },
      {
        title: "Microsoft Teams Adaptive Cards Integration Runbook",
        content: `Microsoft Teams Adaptive Cards Integration Runbook
Delivery Pod Automation Guide

Author: Marcus Vance
Approved By: Rachel Hayes

Architecture:
1. Trigger: Channel mentions or direct questions invoke the TwinOps orchestrator.
2. Context Retrieval: The agent queries the pgvector memories table for matching commits, PRs, and meeting facts.
3. Card Dispatch: The orchestrator constructs a structured Adaptive Card (Schema v1.4) and dispatches it via HTTPS to the pod's Power Automate webhook endpoint.
4. Fallback Handling: In case of webhook delivery timeouts, the system records the failure in the audit log and retries with exponential backoff.

Card Elements:
- Primary response text summarizing the architectural or status answer.
- Expandable citation container listing source files, commit SHAs, or Jira issue keys.
- Action buttons allowing teammates to inspect the live documentation or verify the code diff.`,
        mime: "application/vnd.google-apps.document",
      },
    ];
    return rng.pick(templates);
  }

  // Final phase
  const templates = [
    {
      title: "TwinOps - Delivery Pod Onboarding Runbook",
      content: `TwinOps Enterprise Delivery Pod Onboarding Runbook

Purpose:
Accelerate time-to-productivity for incoming engineers joining an active delivery pod by leveraging the digital twin memory layer.

Automated Onboarding Sequence:
1. Identity Provisioning: The engineer is authenticated via corporate single sign-on (SSO).
2. Pod Memory Hydration: The system loads the pod's digital twin network, recent sprint decisions, and architectural specifications.
3. Automated Onboarding Brief: TwinOps synthesizes key project contacts, active architectural decision records (ADRs), upcoming deliverables, and known system dependencies into a unified brief.
4. Interactive Twin Q&A: The new engineer can converse with digital twins of lead architects to clarify design rationales and API conventions without blocking senior staff.`,
      mime: "application/vnd.google-apps.document",
    },
    {
      title: "TwinOps - Offboarding & Knowledge Transfer Handoff Pack",
      content: `TwinOps Enterprise Offboarding & Knowledge Transfer Handoff Pack

Objective:
Prevent organizational knowledge drain when senior architects or domain specialists rotate off an enterprise delivery pod.

Handoff Artifacts Captured:
- Critical Ownership Map: Systems, repositories, and third-party integrations owned by the departing specialist.
- Historical Decision Trail: Chronological timeline of architecture debates, trade-off decisions, and sprint resolutions.
- Residual Risk Matrix: Open technical debt items and unmerged PRs requiring handover.
- Persistent Digital Twin: The departing specialist's digital twin remains accessible in ambient mode to answer historical context questions from remaining pod members.`,
      mime: "application/vnd.google-apps.document",
    },
  ];
  return rng.pick(templates);
}

export function generateGdriveResources({
  world,
  rng,
  count,
  startIso,
  endIso,
}: GdriveGeneratorParams): MemoryResourceInput[] {
  const resources: MemoryResourceInput[] = [];
  const project = rng.pick(world.projects);

  for (let i = 0; i < count; i++) {
    const owner = rng.pick(world.people);
    const sharedWith = world.people
      .filter((p) => p.id !== owner.id)
      .map((p) => p.email);

    const doc = buildDoc(project, world, owner.name, rng);
    const occurredAt = randomIsoBetween(rng, startIso, endIso);
    const fileId = `gdrive_file_${project.key.toLowerCase()}_${i}_${rng.int(1000, 9999)}`;

    const metadata: GdriveSourceMetadata = {
      source_type: "gdrive",
      file_id: fileId,
      mime_type: doc.mime,
      folder_id: project.gdrive_folder_id,
      owner: owner.email,
      shared_with: sharedWith,
    };

    resources.push({
      clone_id: world.cloneId,
      source_type: "gdrive",
      external_id: fileId,
      content: `# ${doc.title}\n\n${doc.content}`,
      modality: "text",
      source_metadata: metadata,
      occurred_at: occurredAt,
    });
  }

  return resources;
}
