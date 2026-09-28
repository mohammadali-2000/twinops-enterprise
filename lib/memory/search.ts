import type { Memory, Chunk } from "@/lib/core/types";
import { createServerSupabaseClient } from "@/lib/core/supabase/server";
import { isSupabaseConfigured } from "@backend/memory/flags";

/**
 * Search knowledge base: tries Supabase vector search first,
 * falls back to Supabase keyword search. Returns empty array if no match.
 */
export async function searchKnowledgeBaseAsync(
  cloneId: string,
  query: string,
  topK: number = 5
): Promise<Chunk[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerSupabaseClient();

      // Try vector search via RPC
      try {
        const { generateEmbedding } = await import("@/lib/agents/openai");
        const queryEmbedding = await generateEmbedding(query);
        const { data: vectorResults } = await supabase.rpc("match_memories", {
          query_embedding: JSON.stringify(queryEmbedding),
          match_threshold: 0.4,
          match_count: topK,
          p_clone_id: cloneId,
          p_type: "chunk",
        });
        if (vectorResults && vectorResults.length > 0) {
          return vectorResults as Chunk[];
        }
      } catch {
        // Vector search unavailable, try keyword
      }

      // Keyword fallback
      const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length >= 3).slice(0, 6);
      if (terms.length > 0) {
        const orFilter = terms.map((t) => `content.ilike.%${t}%`).join(",");
        const { data } = await supabase
          .from("memories")
          .select("id, clone_id, content, metadata, created_at")
          .eq("clone_id", cloneId)
          .eq("type", "chunk")
          .or(orFilter)
          .limit(topK);
        if (data && data.length > 0) {
          return data as Chunk[];
        }
      }
    } catch {
      // Fall through cleanly
    }
  }

  return [];
}

/**
 * Synchronous search compatibility method.
 */
export function searchKnowledgeBase(
  _cloneId: string,
  _query: string,
  _topK: number = 5
): Chunk[] {
  return [];
}

export function getCloneMemories(_cloneId: string): Memory[] {
  return [];
}

export function extractFacts(content: string): string[] {
  const sentences = content
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  return sentences.filter((s) => {
    const factPatterns = [
      /deadline|due date|by \w+day/i,
      /decided|agreed|confirmed/i,
      /will|going to|plan to/i,
      /budget|cost|price|revenue/i,
      /\d+%|\$\d+/,
      /important|critical|urgent/i,
    ];
    return factPatterns.some((p) => p.test(s));
  });
}

export function saveFact(
  cloneId: string,
  fact: string,
  conversationId: string
): Memory {
  const memory: Memory = {
    id: `mem_${Date.now()}`,
    clone_id: cloneId,
    fact,
    source_conversation_id: conversationId,
    confidence: 0.85,
    created_at: new Date().toISOString(),
  };
  return memory;
}
