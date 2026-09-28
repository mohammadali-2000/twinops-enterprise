import test from "node:test";
import assert from "node:assert/strict";
import { buildSystemPrompt, formatMessagesForAPI, findRelevantClone } from "../lib/agents/clone-brain.ts";
import { CONSULT_CLONE_TOOL } from "../lib/agents/collaboration.ts";

test("Agent Brain - System Prompt Construction without Mock Leakage", () => {
  const mockClone = {
    id: "clone_test_1",
    name: "Enterprise Architect Twin",
    avatar_url: "https://example.com/avatar.png",
    personality: {
      communication_style: "direct",
      tone: "analytical and crisp",
      bio: "Oversees enterprise distributed systems and data mesh architecture.",
      expertise_areas: ["Distributed Systems", "PostgreSQL", "Cloud Security"],
    },
    expertise_tags: ["Distributed Systems", "pgvector", "Security"],
    status: "active",
    owner_name: "Lead Architect",
    owner_role: "Principal Systems Architect",
    owner_department: "Core Engineering",
    created_at: new Date().toISOString(),
  };

  const emptyContext = {};
  const prompt = buildSystemPrompt(mockClone, emptyContext);

  // Assert identity formatting
  assert.match(prompt, /Enterprise Architect Twin/);
  assert.match(prompt, /Principal Systems Architect/);
  assert.match(prompt, /Core Engineering/);
  assert.match(prompt, /Communication Style: direct/i);
  assert.match(prompt, /analytical and crisp/);

  // Assert no mock/demo leakage (e.g., Alex Morgan, hackathon chatter)
  assert.doesNotMatch(prompt, /Alex Morgan/);
  assert.doesNotMatch(prompt, /Sarah Chen/);
  assert.doesNotMatch(prompt, /Jason Park/);
  assert.doesNotMatch(prompt, /hackathon/i);
  assert.doesNotMatch(prompt, /judging/i);

  // Assert empty state indicators
  assert.match(prompt, /No recent meeting notes recorded/);
  assert.match(prompt, /No durable facts recorded yet/);
});

test("Agent Brain - System Prompt Context Injection", () => {
  const mockClone = {
    id: "clone_test_2",
    name: "SecOps Twin",
    personality: {
      communication_style: "formal",
      tone: "authoritative",
      bio: "Enterprise Security Officer",
      expertise_areas: ["Compliance", "Zero Trust"],
    },
    expertise_tags: ["Compliance", "SOC2"],
    status: "active",
    owner_name: "Security Lead",
    owner_role: "CISO",
    owner_department: "Information Security",
    created_at: new Date().toISOString(),
  };

  const context = {
    meetings: ["**Weekly Threat Modeling** (2026-09-25)\n- Decision: Zero secrets policy enforced."],
    memories: ["- Enforced TLS 1.3 across all incoming webhooks (confidence: 0.99)"],
    slackMessages: ["[#security] SecOps: Rotated production certificates."],
    categorySummaries: ["- Security Policies: SOC2 Type II compliance audit passed."],
  };

  const prompt = buildSystemPrompt(mockClone, context);

  assert.match(prompt, /Weekly Threat Modeling/);
  assert.match(prompt, /Zero secrets policy enforced/);
  assert.match(prompt, /Enforced TLS 1\.3/);
  assert.match(prompt, /Rotated production certificates/);
  assert.match(prompt, /SOC2 Type II compliance audit passed/);
});

test("Agent Brain - Format Messages for API", () => {
  const messages = [
    { id: "1", role: "system", content: "System instruction" },
    { id: "2", role: "user", content: "What is our deployment status?" },
    { id: "3", role: "assistant", content: "Deployment is ready." },
  ];

  const formatted = formatMessagesForAPI(messages);
  assert.equal(formatted.length, 2);
  assert.equal(formatted[0].role, "user");
  assert.equal(formatted[0].content, "What is our deployment status?");
  assert.equal(formatted[1].role, "assistant");
  assert.equal(formatted[1].content, "Deployment is ready.");
});

test("Agent Brain - findRelevantClone Relevance Matching", () => {
  const clones = [
    {
      id: "clone_arch",
      name: "Architecture Twin",
      expertise_tags: ["PostgreSQL", "Database Design", "Kubernetes"],
    },
    {
      id: "clone_sec",
      name: "Security Twin",
      expertise_tags: ["Zero Trust", "OAuth2", "Cryptography"],
    },
  ];

  // Exact expertise match
  const match1 = findRelevantClone("We need help with Zero Trust policies", "clone_arch", clones);
  assert.ok(match1);
  assert.equal(match1.id, "clone_sec");

  // Name match
  const match2 = findRelevantClone("Consult Architecture Twin regarding schemas", "clone_sec", clones);
  assert.ok(match2);
  assert.equal(match2.id, "clone_arch");

  // Self-exclusion
  const matchSelf = findRelevantClone("Zero Trust", "clone_sec", clones);
  assert.equal(matchSelf, null);
});

test("Collaboration Tools - CONSULT_CLONE_TOOL Schema Integrity", () => {
  assert.equal(CONSULT_CLONE_TOOL.type, "function");
  assert.equal(CONSULT_CLONE_TOOL.function.name, "consult_clone");
  assert.ok(CONSULT_CLONE_TOOL.function.description.length > 20);
  assert.deepEqual(CONSULT_CLONE_TOOL.function.parameters.required, ["topic"]);
  assert.ok(CONSULT_CLONE_TOOL.function.parameters.properties.topic);
  assert.ok(CONSULT_CLONE_TOOL.function.parameters.properties.clone_name);
});
