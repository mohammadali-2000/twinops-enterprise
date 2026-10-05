import type { Clone, Message } from "@/lib/core/types";

export interface SystemPromptContext {
  owner?: {
    name?: string;
    role?: string;
    department?: string;
  };
  meetings?: string[];
  memories?: string[];
  slackMessages?: string[];
  categorySummaries?: string[];
  itemFacts?: string[];
  resourceHighlights?: string[];
  episodes?: string[];
  retrievedSources?: string[];
}

export function buildSystemPrompt(
  clone: Clone,
  context?: SystemPromptContext
): string {
  const meetingsSection =
    context?.meetings && context.meetings.length > 0
      ? context.meetings.join("\n")
      : "- No recent meeting notes recorded.";

  const memorySection =
    context?.memories && context.memories.length > 0
      ? context.memories.join("\n")
      : "- No durable facts recorded yet.";

  const slackSection =
    context?.slackMessages && context.slackMessages.length > 0
      ? context.slackMessages.join("\n")
      : "- No relevant communication messages recorded.";

  const categorySection =
    context?.categorySummaries && context.categorySummaries.length > 0
      ? `\n### Category Summaries\n${context.categorySummaries.join("\n")}\n`
      : "";

  const itemsSection =
    context?.itemFacts && context.itemFacts.length > 0
      ? `\n### Atomic Memory Items\n${context.itemFacts.join("\n")}\n`
      : "";

  const resourceSection =
    context?.resourceHighlights && context.resourceHighlights.length > 0
      ? `\n### Recent Source Highlights\n${context.resourceHighlights.join("\n")}\n`
      : "";

  const episodicSection =
    context?.episodes && context.episodes.length > 0
      ? `\n### Recent Episodes (What Happened)\n${context.episodes.join("\n")}\n`
      : "";

  const retrievedSection =
    context?.retrievedSources && context.retrievedSources.length > 0
      ? `\n### Retrieved Sources (most relevant to the current question)\n${context.retrievedSources.join("\n\n")}\n`
      : "";

  return `You are the AI Digital Twin of ${clone.name}. You embody their knowledge, communication style, and expertise.

## Your Identity
- Name: ${clone.name}'s Digital Twin
- Role: ${context?.owner?.role || clone.owner_role || "Team Member"}
- Department: ${context?.owner?.department || clone.owner_department || "General"}
- Communication Style: ${clone.personality.communication_style}
- Tone: ${clone.personality.tone}
- Bio: ${clone.personality.bio}
- Expertise: ${(clone.expertise_tags || []).join(", ")}

## Your Knowledge Base

### Recent Meetings
${meetingsSection}

### Key Facts & Memories
${memorySection}

### Recent Communications
${slackSection}
${retrievedSection}${categorySection}${itemsSection}${resourceSection}${episodicSection}
## Behavior Guidelines
1. Speak as ${clone.name}'s twin — use first person, reference "my" meetings, "my" team, etc.
2. Be concise, professional, and clear.
3. When asked about meetings, provide key decisions, action items, and anything requiring attention.
4. **When you don't have enough information to answer confidently, use the consult_clone tool to ask another team member's clone.** Don't guess or fabricate information — consult. This includes questions about another person's work, projects outside your expertise, or decisions you weren't part of.
5. When you consult another clone, naturally weave their input into your response. Mention that you checked with them.
6. Proactively flag important items: upcoming deadlines, unresolved conflicts, items needing follow-up.
7. When you truly don't know something and no other clone can help, state so honestly.
8. For follow-up questions, reference prior context naturally.
9. Keep responses focused and actionable.
10. Ground claims in the knowledge above. When you use a Retrieved Source, cite it inline as [1], [2], etc. Never invent ticket keys, commit hashes, PR numbers, or people that do not appear above.
`;
}

export function formatMessagesForAPI(
  messages: Message[]
): { role: "system" | "user" | "assistant"; content: string }[] {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
}

export function findRelevantClone(
  query: string,
  excludeCloneId: string,
  clones: Clone[] = []
): Clone | null {
  const queryLower = query.toLowerCase();
  return (
    clones.find((c) => {
      if (c.id === excludeCloneId) return false;
      const nameMatch =
        c.name.toLowerCase().includes(queryLower) ||
        queryLower.includes(c.name.toLowerCase());
      const tagMatch = (c.expertise_tags || []).some((tag) =>
        queryLower.includes(tag.toLowerCase())
      );
      return nameMatch || tagMatch;
    }) || null
  );
}
