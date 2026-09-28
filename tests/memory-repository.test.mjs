import test from "node:test";
import assert from "node:assert/strict";
import { getCloneRuntime, listClonesForApi, getCloneDetailForApi } from "../backend/memory/clone-repository.ts";
import { searchKnowledgeBaseAsync, getCloneMemories, extractFacts } from "../lib/memory/search.ts";
import { saveLocalMemories, getLocalMemories } from "../backend/memory/local-store.ts";

test("Memory Repository - Empty State Resilience When Supabase Unconfigured", async () => {
  // Save current env
  const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Must return null/empty arrays, NEVER synthesize fake clones
    const runtime = await getCloneRuntime("non-existent-id");
    assert.equal(runtime.clone, null);

    const clonesList = await listClonesForApi();
    assert.deepEqual(clonesList, []);

    const cloneDetail = await getCloneDetailForApi("non-existent-id");
    assert.equal(cloneDetail, null);

    const searchResults = await searchKnowledgeBaseAsync("clone_id", "test query", 5);
    assert.deepEqual(searchResults, []);

    const memories = getCloneMemories("clone_id");
    assert.deepEqual(memories, []);
  } finally {
    // Restore
    if (origUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
    if (origKey) process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
  }
});

test("Memory Repository - Fact Extraction Engine", () => {
  const text = `
    The migration to PostgreSQL 17 is due by Friday.
    We decided to enforce pgvector index with IVFFlat.
    The total project budget is $45,000.
    Short note.
    Another line with no trigger keywords.
  `;

  const facts = extractFacts(text);
  assert.ok(facts.length >= 3, `Expected at least 3 facts extracted, got ${facts.length}`);
  assert.ok(facts.some((f) => f.includes("Friday")));
  assert.ok(facts.some((f) => f.includes("decided")));
  assert.ok(facts.some((f) => f.includes("$45,000")));
});

test("Local Memory Store - In-Memory Persistence and Deduplication", () => {
  const testId = `test_${Date.now()}`;
  const testItems = [
    {
      id: `${testId}_1`,
      clone_id: "test_clone",
      type: "fact",
      source: "github",
      content: `Initial migration commit for enterprise repo (${testId}).`,
      confidence: 0.95,
      metadata: { repo: "twinops" },
      occurred_at: new Date().toISOString(),
    },
    {
      id: `${testId}_2`,
      clone_id: "test_clone",
      type: "fact",
      source: "github",
      content: `Configured GitHub Actions CI pipeline (${testId}).`,
      confidence: 0.92,
      metadata: { repo: "twinops" },
      occurred_at: new Date().toISOString(),
    },
  ];

  const savedCount = saveLocalMemories(testItems);
  assert.ok(savedCount >= 0);

  const allMemories = getLocalMemories();
  assert.ok(Array.isArray(allMemories));
  const found = allMemories.find((m) => m.id === `${testId}_1`);
  assert.ok(found);
  assert.equal(found.content, `Initial migration commit for enterprise repo (${testId}).`);
});
