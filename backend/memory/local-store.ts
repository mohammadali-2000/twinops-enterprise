import fs from "fs";
import path from "path";

export interface StoredMemoryItem {
  id: string;
  clone_id: string;
  type: string;
  source: string;
  content: string;
  confidence: number;
  metadata: Record<string, unknown>;
  occurred_at: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const MEMORIES_FILE = path.join(DATA_DIR, "local_memories.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Load all locally saved memories from disk.
 */
export function getLocalMemories(): StoredMemoryItem[] {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(MEMORIES_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(MEMORIES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.warn("[local-store] Failed to read local_memories.json:", err);
    return [];
  }
}

/**
 * Save new memories to local_memories.json with deduplication.
 */
export function saveLocalMemories(items: Array<Omit<StoredMemoryItem, "id"> & { id?: string }>): number {
  try {
    ensureDirectoryExists();
    const existing = getLocalMemories();
    const existingContents = new Set(existing.map((m) => m.content.trim()));

    let addedCount = 0;
    for (const item of items) {
      if (!existingContents.has(item.content.trim())) {
        existing.push({
          id: item.id || `local_mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          clone_id: item.clone_id,
          type: item.type,
          source: item.source,
          content: item.content,
          confidence: item.confidence,
          metadata: item.metadata,
          occurred_at: item.occurred_at || new Date().toISOString(),
        });
        existingContents.add(item.content.trim());
        addedCount++;
      }
    }

    fs.writeFileSync(MEMORIES_FILE, JSON.stringify(existing, null, 2), "utf-8");
    console.log(`[local-store] Saved ${addedCount} items to ${MEMORIES_FILE}`);
    return addedCount;
  } catch (err) {
    console.error("[local-store] Failed to write local_memories.json:", err);
    return 0;
  }
}

/**
 * Search local memories by query keywords.
 */
export function searchLocalMemories(query: string, limit = 5): StoredMemoryItem[] {
  const all = getLocalMemories();
  if (all.length === 0) return [];

  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (terms.length === 0) return all.slice(0, limit);

  const scored = all.map((item) => {
    const text = (item.content + " " + JSON.stringify(item.metadata)).toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (text.includes(term)) score += 1;
    }
    return { item, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
}
