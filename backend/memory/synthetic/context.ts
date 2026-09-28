import type { SeededRng } from "./random";

export interface SyntheticPerson {
  id: string;
  name: string;
  role: string;
  email: string;
  school: string;
  expertise: string[];
  github: string;
  owns: string[];
  background: string;
  opinions: string[];
}

export interface SyntheticProject {
  key: string;
  name: string;
  repo: string;
  channel: string;
  channel_id: string;
  gdrive_folder_id: string;
  notion_page_id: string;
  jira_board_id: string;
  target_date: string;
  status: "abandoned" | "pivoted" | "active";
  phase: "early" | "mid" | "final";
}

export interface SyntheticConflict {
  topic: string;
  side_a: { position: string; person_role: string };
  side_b: { position: string; person_role: string };
  passive_aggressive: string[];
  heated_exchange: string[];
}

export interface SyntheticWorld {
  cloneId: string;
  people: SyntheticPerson[];
  projects: SyntheticProject[];
  conflicts: SyntheticConflict[];
}

// ────────────────────────────────────────────────────
// Realistic enterprise architectural debates & technical trade-offs
// ────────────────────────────────────────────────────

const CONFLICTS: SyntheticConflict[] = [
  {
    topic: "Episodic event ingestion vs semantic RAG prioritization in memory store",
    side_a: {
      position:
        "Episodic memory capturing PR discussions, Jira ticket resolutions, and incident root causes is our primary differentiator. We must index structured event timelines so digital twins can reconstruct exact architectural decisions.",
      person_role: "Marcus (Principal AI Architect, memory systems focus)",
    },
    side_b: {
      position:
        "Semantic document indexing over stable architectural specs and codebases must be hardened first. We need 99.9% retrieval precision on core APIs before adding high-frequency event streaming.",
      person_role: "Elena (Lead Distributed Systems Engineer)",
    },
    passive_aggressive: [
      "Let's make sure our baseline vector search latency is under 50ms before we introduce an event streaming pipeline.",
      "Per our architectural review, stable specs have higher confidence scores. Let's not churn the schema prematurely.",
      "We already index commit diffs and ADRs. Adding live chat ingestion requires strict rate-limiting gates first.",
      "Let's verify the IVFFlat index probe counts on PostgreSQL 17 before ingesting more high-cardinality metadata.",
    ],
    heated_exchange: [
      "If our digital twins only search static documents, they are just conventional wiki search tools. The timeline of decisions is what unblocks delivery pods.",
      "Incorrect facts delivered with high confidence break production deployments. Retrieval accuracy on golden specifications must take precedence.",
      "We can support both by using dual-vector indexing: semantic chunks for documentation and episodic facts for sprint events.",
      "Agreed. Let's enforce strict source confidence weighting so verified architectural records override transient discussion snippets.",
    ],
  },
  {
    topic: "Synchronous gRPC vs Event-Driven Kafka for Inter-Twin Coordination",
    side_a: {
      position:
        "Event-driven Kafka message brokers ensure guaranteed delivery and auditability across asynchronous delivery pods without tight coupling.",
      person_role: "David (Staff Platform & Infrastructure Engineer)",
    },
    side_b: {
      position:
        "Low-latency gRPC with bidirectional streaming provides real-time multi-agent consensus when an executive polls multiple digital twins simultaneously.",
      person_role: "Elena (Lead Distributed Systems Engineer)",
    },
    passive_aggressive: [
      "Running a managed Kafka cluster for inter-twin polling adds unnecessary operational overhead for this service tier.",
      "Synchronous HTTP/gRPC cascades will cause cascading timeouts if one downstream integration encounters rate limits.",
      "Let's look at the p99 latency benchmarks before committing to another infrastructure dependency.",
    ],
    heated_exchange: [
      "Executive sentiment analysis across 20 twins needs sub-second response times. gRPC streaming is built for this.",
      "And what happens when two downstream APIs back off? Without an event queue, you lose the query state.",
      "We can use synchronous streaming for interactive user sessions, backed by persistent background event logging in PostgreSQL.",
    ],
  },
  {
    topic: "Scope & Governance — Enterprise Hardening vs Feature Expansion",
    side_a: {
      position:
        "We need to lock down SOC2 compliance, tenant-isolated vector namespaces, and credential encryption before onboarding pilot delivery pods.",
      person_role: "Marcus (Principal AI Architect, Governance Lead)",
    },
    side_b: {
      position:
        "Delivery leads need interactive Microsoft Teams Adaptive Cards and Jira auto-triage right away to measure sprint velocity impact.",
      person_role: "Rachel (Engineering Delivery Director)",
    },
    passive_aggressive: [
      "Enterprise clients will not approve production rollout without verified Row-Level Security and audit logging.",
      "Security hardening is critical, but we also have to demonstrate measurable sprint velocity improvement to leadership.",
      "Let's prioritize the automated integration test suite to validate both security gates and delivery throughput.",
    ],
    heated_exchange: [
      "Data isolation cannot be a phase 2 feature. Client confidentiality is non-negotiable across client engagements.",
      "We can enforce strict PostgreSQL schema partitioning while shipping the Microsoft Teams connector on schedule.",
      "Fair. We deliver the sanitized connector with encrypted credentials at rest as our baseline requirement.",
    ],
  },
];

export function buildSyntheticWorld(
  cloneId: string,
  rng: SeededRng
): SyntheticWorld {
  const basePeople: SyntheticPerson[] = [
    {
      id: "u_marcus",
      name: "Marcus Vance",
      role: "Principal AI & Cloud Architect",
      email: "marcus.vance@twinops.ai",
      school: "Enterprise Core Architecture",
      expertise: ["AI Architecture", "Next.js", "PostgreSQL", "pgvector", "Agent Systems", "LangChain", "TypeScript", "Multi-Agent Workflows"],
      github: "marcusvance",
      owns: [
        "TwinOps enterprise architecture and multi-agent coordination",
        "pgvector memory indexing and similarity retrieval contracts",
        "Deterministic RAG retrieval and citation provenance pipelines",
        "Microsoft Teams and Slack digital twin integration orchestrator",
        "Prompt injection boundaries and enterprise governance filters",
        "Automated continuous integration and security test suites",
      ],
      background: "Principal AI Architect with 12+ years in enterprise cloud systems. Architected multi-region agentic platforms, zero-trust microservice meshes, and low-latency vector retrieval layers in PostgreSQL.",
      opinions: [
        "Digital twins must provide verifiable citation metadata for every claim, referencing specific commit SHAs, pull requests, or architecture decision records.",
        "Deterministic grounding over verified corporate repositories prevents hallucinations and ensures enterprise compliance.",
        "Episodic memory captures why a decision was made, while semantic memory captures what was built. Both are required for digital twins.",
        "Data isolation between enterprise pods must be enforced at the database query boundary, not merely in application logic.",
      ],
    },
    {
      id: "u_elena",
      name: "Elena Rostova",
      role: "Lead Distributed Systems Engineer",
      email: "elena.rostova@twinops.ai",
      school: "Platform Engineering",
      expertise: ["Distributed Systems", "Kubernetes", "gRPC", "PostgreSQL", "Kafka", "High-Throughput APIs"],
      github: "elenarostova",
      owns: [
        "Distributed backend services and streaming endpoints",
        "API Gateway resilience, rate limiting, and circuit breaking",
        "Connection pooling and database query optimization",
        "Multi-region deployment and zero-downtime migrations",
      ],
      background: "Staff distributed systems engineer specializing in high-throughput transactional backends, Kubernetes cluster management, and resilient event streaming.",
      opinions: [
        "Latency matters as much as accuracy. Sub-50ms vector query execution is required to keep interactive agent chats responsive.",
        "All third-party credentials and tokens must be encrypted with AES-256-GCM before writing to the database.",
        "Graceful degradation when external services rate-limit or fail is mandatory for enterprise SLAs.",
      ],
    },
    {
      id: "u_david",
      name: "David Kim",
      role: "Staff Infrastructure & Platform Engineer",
      email: "david.kim@twinops.ai",
      school: "Cloud Infrastructure",
      expertise: ["Terraform", "Docker", "CI/CD", "Security Hardening", "Observability", "PostgreSQL Administration"],
      github: "davidkim",
      owns: [
        "Cloud infrastructure automation and Docker container builds",
        "Continuous integration pipelines and secret scanning",
        "PostgreSQL maintenance, WAL replication, and vector indexing",
        "Structured logging, OpenTelemetry tracing, and metrics instrumentation",
      ],
      background: "Staff infrastructure engineer focused on immutable deployments, zero-trust identity architectures, and enterprise cloud reliability engineering.",
      opinions: [
        "Zero secrets committed to source repositories. All configuration must be injected via secure environment variables.",
        "Automated secret scanning and regression testing in CI prevent compliance failures before code hits production.",
        "Database migrations must be strictly backward compatible to support blue-green deployments.",
      ],
    },
    {
      id: "u_rachel",
      name: "Rachel Hayes",
      role: "Engineering Delivery Director",
      email: "rachel.hayes@twinops.ai",
      school: "Delivery Governance",
      expertise: ["Agile Governance", "Sprint Operations", "Enterprise Integration", "Stakeholder Management"],
      github: "rachelhayes",
      owns: [
        "Enterprise delivery pod governance and sprint velocity tracking",
        "Microsoft Teams and Slack workflow adoption across delivery pods",
        "Client SLA verification and architectural audit readiness",
      ],
      background: "Engineering executive directing global enterprise delivery pods across financial services, healthcare, and telecommunications sectors.",
      opinions: [
        "Digital twins eliminate asynchronous blocker delays when senior architects are in client governance meetings.",
        "Automated onboarding briefs allow incoming engineers to become productive in hours rather than weeks.",
        "Structured handoff packs preserve critical institutional memory when project leads rotate.",
      ],
    },
  ];

  const projects: SyntheticProject[] = [
    {
      key: "TWINOPS",
      name: "TwinOps Enterprise Platform",
      repo: "enterprise-twinops/twinops-platform",
      channel: "platform-delivery",
      channel_id: "C_CORE_DELIVERY",
      gdrive_folder_id: "folder_twinops_core",
      notion_page_id: "notion_twinops_core",
      jira_board_id: "board_enterprise_sprint",
      target_date: "2026-03-31 5:00 PM EST",
      status: "active",
      phase: "final",
    },
    {
      key: "STREAMING",
      name: "Event Mesh & Kafka Broker Migration",
      repo: "enterprise-twinops/event-streaming",
      channel: "event-stream",
      channel_id: "C_STREAM",
      gdrive_folder_id: "folder_streaming",
      notion_page_id: "notion_streaming",
      jira_board_id: "board_enterprise_sprint",
      target_date: "2026-03-31 5:00 PM EST",
      status: "active",
      phase: "mid",
    },
    {
      key: "IDENTITY",
      name: "Zero-Trust Service Mesh & API Security",
      repo: "enterprise-twinops/identity-mesh",
      channel: "security-mesh",
      channel_id: "C_SECURITY",
      gdrive_folder_id: "folder_security",
      notion_page_id: "notion_security",
      jira_board_id: "board_enterprise_sprint",
      target_date: "2026-03-31 5:00 PM EST",
      status: "active",
      phase: "early",
    },
  ];

  // Rotate people based on clone so each clone's data feels unique
  const rotatedPeople = [...basePeople];
  const rotation = rng.int(0, rotatedPeople.length - 1);
  for (let i = 0; i < rotation; i++) {
    const head = rotatedPeople.shift();
    if (head) rotatedPeople.push(head);
  }

  const shuffledConflicts = [...CONFLICTS].sort(() => rng.next() - 0.5);

  return {
    cloneId,
    people: rotatedPeople,
    projects,
    conflicts: shuffledConflicts,
  };
}
