-- TwinOps Enterprise Digital Twin - Initial Seed Data (Real PostgreSQL Database)
-- Clone: Marcus Vance (Principal AI & Cloud Architect)

INSERT INTO clones (
  id,
  name,
  avatar_url,
  personality,
  expertise_tags,
  status,
  owner_name,
  owner_email,
  owner_role,
  owner_department,
  created_at,
  trained_at
) VALUES (
  'c1000000-0000-0000-0000-000000000001',
  'Marcus Vance (Principal Architect)',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=face',
  '{"tone": "Direct, visionary, highly technical, and concise.", "bio": "Principal AI Architect architecting autonomous agent workflows, neural grounding, and real-time enterprise digital twins.", "expertise_areas": ["Principal AI Architect", "Enterprise AI Architecture", "Autonomous Agent Systems"]}'::jsonb,
  ARRAY['AI Architecture', 'Next.js', 'PostgreSQL', 'pgvector', 'Agent Systems', 'LangChain', 'TypeScript', 'Multi-Agent Workflows'],
  'active',
  'Marcus Vance',
  'marcus.vance@twinops.ai',
  'Principal AI Architect',
  'AI Engineering & Architecture',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  personality = EXCLUDED.personality,
  expertise_tags = EXCLUDED.expertise_tags,
  owner_role = EXCLUDED.owner_role,
  owner_department = EXCLUDED.owner_department;

-- Real Integrations
INSERT INTO integrations (id, provider, config, created_at, updated_at)
VALUES 
  ('a1000000-0000-0000-0000-000000000001', 'github', '{"token": "ghp_PLACEHOLDER_GITHUB_TOKEN", "username": "enterprise-twinops", "connected": true}'::jsonb, NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000002', 'teams', '{"webhook_url": "https://outlook.office.com/webhook/0000-sample-enterprise-webhook", "channel": "core-platform-delivery", "connected": true}'::jsonb, NOW(), NOW())

ON CONFLICT (provider) DO UPDATE SET
  config = EXCLUDED.config,
  updated_at = NOW();

-- Real Memories for Marcus Vance (Documents, Chunks, and Facts)
INSERT INTO memories (
  clone_id,
  type,
  source,
  content,
  confidence,
  metadata,
  occurred_at,
  created_at
) VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'document',
    'github',
    '# TwinOps Architecture Specification v3.0\nTwinOps operates as an autonomous enterprise digital twin system built on Supabase PostgreSQL (pgvector), Next.js App Router, OpenRouter LLMs, and multi-tenant connector bridges for Microsoft Teams and GitHub.',
    0.95,
    '{"title": "TwinOps Architecture Specification v3.0", "doc_type": "architecture", "repo": "enterprise-twinops/TwinOps"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'c1000000-0000-0000-0000-000000000001',
    'chunk',
    'github',
    'The core data layer uses PostgreSQL 17 with the pgvector extension for sub-50ms cosine similarity searches across enterprise episodic memories and technical documentation.',
    0.98,
    '{"title": "Database & Vector Retrieval Layer", "source": "github", "doc_type": "technical_spec"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'c1000000-0000-0000-0000-000000000001',
    'fact',
    'teams',
    'All backend APIs communicate directly with PostgreSQL tables (clones, memories, messages, integrations) without intermediate mock JSON files.',
    0.99,
    '{"channel_name": "core-platform-delivery", "sender_name": "Marcus Vance", "title": "Zero-Mock Database Architecture"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'c1000000-0000-0000-0000-000000000001',
    'fact',
    'github',
    'GitHub repository ingestion extracts AST code definitions, PR discussions, and commit metadata directly into the pgvector memories table for real-time RAG context.',
    0.92,
    '{"channel_name": "architecture-governance", "sender_name": "Marcus Vance", "title": "GitHub Ingestion Engine"}'::jsonb,
    NOW(),
    NOW()
  );
