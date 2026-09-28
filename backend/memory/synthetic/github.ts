import type { MemoryResourceInput } from "@/lib/core/types";
import type { SyntheticProject, SyntheticWorld } from "./context";
import { randomIsoBetween, type SeededRng } from "./random";

interface GithubSourceMetadata extends Record<string, unknown> {
  source_type: "github";
  repo: string;
  commit_sha: string;
  author: string;
  branch: string;
  files_changed: string[];
}

interface GithubGeneratorParams {
  world: SyntheticWorld;
  rng: SeededRng;
  count: number;
  startIso: string;
  endIso: string;
}

function randomHex(rng: SeededRng, len: number): string {
  const chars = "abcdef0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[rng.int(0, chars.length - 1)];
  }
  return out;
}

function buildEnterpriseCommit(
  project: SyntheticProject,
  author: string,
  rng: SeededRng
): { message: string; files: string[] } {
  const templates = [
    {
      message: `feat(memory): implement pgvector IVFFlat index tuning and similarity retrieval\n\nOptimized vector similarity search across memories table.\nConfigured IVFFlat index with lists=100 and probes=10 for sub-50ms p95 latency.\nAdded SHA-256 embedding caching to eliminate redundant vectorization calls.\n\nOwner: Marcus Vance\nVerified against 50,000 synthetic episodic memories.`,
      files: ["supabase/migrations/001_initial_schema.sql", "backend/memory/repository.ts", "lib/agents/openai.ts"],
    },
    {
      message: `feat(teams): configure Microsoft Teams Adaptive Card v1.4 dispatcher\n\nImplemented structured card formatting for Power Automate webhook endpoints.\nCard includes citation provenance, confidence metrics, and deep-link action buttons.\nAdded resilient error handling and exponential backoff retry on webhook rate limits.\n\nOwner: Marcus Vance`,
      files: ["app/api/teams/events/route.ts", "lib/integrations/teams.ts", "components/twinops/SlackSimulatorView.tsx"],
    },
    {
      message: `security(core): enforce tenant-scoped isolation and token encryption\n\nAdded AES-256-GCM encryption for third-party connector tokens stored at rest.\nEnforced tenant_id filtering across all database query boundaries.\nImplemented prompt injection boundary checks and system role isolation.\n\nOwner: Elena Rostova`,
      files: ["lib/core/security.ts", "app/api/twinops/chat/route.ts", "tests/security-boundaries.test.mjs"],
    },
    {
      message: `perf(api): configure Supavisor connection pooling and streaming resilience\n\nConfigured database connection pooling for serverless Next.js App Router handlers.\nResolved stream truncation under high concurrent loads.\nAdded OpenTelemetry tracing headers to outgoing integration requests.\n\nOwner: David Kim`,
      files: ["lib/core/supabase/server.ts", "app/api/twinops/insights/route.ts", "app/api/twinops/clones/route.ts"],
    },
    {
      message: `test(ci): author comprehensive unit and integration test suite\n\nAdded test coverage for Agent Brain prompt construction, memory repository,\nintegration connectors, and security isolation boundaries.\nConfigured GitHub Actions CI workflow to run secret scans, typechecks, and tests.\n\nOwner: Marcus Vance`,
      files: [".github/workflows/ci.yml", "tests/agent-brain.test.mjs", "tests/memory-repository.test.mjs"],
    },
    {
      message: `feat(agents): implement peer consultation protocol with verified attribution\n\nImplemented consult_clone tool enabling digital twins to request domain expertise\nfrom peer agents when queries exceed local context boundaries.\nEnsured multi-hop citations preserve original source provenance.\n\nOwner: Marcus Vance`,
      files: ["lib/agents/clone-brain.ts", "lib/agents/collaboration.ts", "lib/twinops/api.ts"],
    },
  ];

  return rng.pick(templates);
}

export function generateGithubResources({
  world,
  rng,
  count,
  startIso,
  endIso,
}: GithubGeneratorParams): MemoryResourceInput[] {
  const resources: MemoryResourceInput[] = [];
  const project = rng.pick(world.projects);

  for (let i = 0; i < count; i++) {
    const author = rng.pick(world.people);
    const commit = buildEnterpriseCommit(project, author.name, rng);
    const occurredAt = randomIsoBetween(rng, startIso, endIso);
    const sha = randomHex(rng, 40);
    const shortSha = sha.slice(0, 7);

    const metadata: GithubSourceMetadata = {
      source_type: "github",
      repo: project.repo,
      commit_sha: sha,
      author: author.name,
      branch: "main",
      files_changed: commit.files,
    };

    resources.push({
      clone_id: world.cloneId,
      source_type: "github",
      external_id: `github_${project.repo}_${shortSha}`,
      content: `commit ${sha}\nAuthor: ${author.name} <${author.email}>\nDate: ${occurredAt}\n\n${commit.message}\n\nFiles changed:\n${commit.files.map((f) => `  ${f}`).join("\n")}`,
      modality: "text",
      source_metadata: metadata,
      occurred_at: occurredAt,
    });
  }

  return resources;
}
