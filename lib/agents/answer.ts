import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import getOpenAIClient, { getChatModel } from "@/lib/agents/openai";
import { buildSystemPrompt } from "@/lib/agents/clone-brain";
import { canConsult, consultClone, CONSULT_CLONE_TOOL } from "@/lib/agents/collaboration";
import { getCloneRuntime } from "@backend/memory/clone-repository";
import { getKnowledgeContext, type KnowledgeContext } from "@backend/memory";

const MAX_TOOL_ROUNDS = 3;
const MAX_SOURCES = 6;
const RESOURCE_PREVIEW_CHARS = 500;

export interface AnswerSource {
  index: number;
  source: string;
  title: string;
  url?: string;
  date?: string;
}

export interface AnswerConsultation {
  target_clone_name: string;
  query: string;
  response: string;
}

export type AnswerEvent =
  | { type: "consulting"; clone_name: string; topic: string }
  | { type: "consultation"; consultation: AnswerConsultation };

export interface AnswerResult {
  answer: string;
  sources: AnswerSource[];
  consultations: AnswerConsultation[];
}

export class CloneNotFoundError extends Error {
  constructor(cloneId: string) {
    super(`Clone not found: ${cloneId}`);
  }
}

function buildSources(knowledge: KnowledgeContext | null): {
  sources: AnswerSource[];
  promptBlocks: string[];
} {
  const chunks = knowledge?.chunks.slice(0, MAX_SOURCES) ?? [];
  const sources: AnswerSource[] = [];
  const promptBlocks: string[] = [];

  chunks.forEach((chunk, i) => {
    const meta = chunk.metadata ?? {};
    const source = (meta.source as string) || "document";
    const title =
      (meta.document_title as string) || (meta.title as string) || chunk.content.slice(0, 80);
    const url = (meta.url as string) || undefined;
    const date = (meta.updated as string) || chunk.created_at;
    sources.push({ index: i + 1, source, title, url, date });
    promptBlocks.push(`[${i + 1}] (${source}) ${title}${url ? ` <${url}>` : ""}\n${chunk.content}`);
  });

  return { sources, promptBlocks };
}

export async function answerAsClone(opts: {
  cloneId: string;
  question: string;
  history?: { role: string; content: string }[];
  /** Shown to the model as the asker; kept out of retrieval so names don't skew search. */
  askedBy?: string;
  onEvent?: (event: AnswerEvent) => void;
}): Promise<AnswerResult> {
  const runtime = await getCloneRuntime(opts.cloneId);
  const clone = runtime.clone;
  if (!clone) throw new CloneNotFoundError(opts.cloneId);

  const knowledge = await getKnowledgeContext(clone.id, opts.question, 5);
  const { sources, promptBlocks } = buildSources(knowledge);

  const systemPrompt = buildSystemPrompt(
    clone,
    knowledge
      ? {
          owner: runtime.owner,
          retrievedSources: promptBlocks,
          memories: knowledge.items
            .slice(0, 8)
            .map(
              (item) =>
                `- ${item.fact} (confidence: ${item.confidence.toFixed(2)}, source: ${item.source_type})`
            ),
          slackMessages: knowledge.resources
            .filter((r) => r.source_type === "slack")
            .slice(0, 8)
            .map((r) => `[slack] ${r.title || "message"}: ${r.content.slice(0, RESOURCE_PREVIEW_CHARS)}`),
          categorySummaries: knowledge.categories.map(
            (c) => `- ${c.category_key}: ${c.summary} (confidence: ${c.confidence.toFixed(2)})`
          ),
          resourceHighlights: knowledge.resources
            .filter((r) => r.source_type !== "slack" && r.title)
            .slice(0, 6)
            .map(
              (r) =>
                `- [${r.source_type}] ${r.title}: ${r.content.slice(0, RESOURCE_PREVIEW_CHARS)}`
            ),
          episodes: knowledge.episodes.slice(0, 6).map((ep) => {
            const date = new Date(ep.occurred_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            const people = ep.participants.length > 0 ? ` with ${ep.participants.join(", ")}` : "";
            const outcome = ep.outcome ? `. Outcome: ${ep.outcome}` : "";
            return `- [${date}] ${ep.event_type}${people}: ${ep.content}${outcome}`;
          }),
        }
      : { owner: runtime.owner }
  );

  const messages: ChatCompletionMessageParam[] = [{ role: "system", content: systemPrompt }];
  for (const msg of (opts.history ?? []).slice(-6)) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({ role: msg.role, content: msg.content });
    }
  }
  messages.push({
    role: "user",
    content: opts.askedBy ? `${opts.askedBy} asks: ${opts.question}` : opts.question,
  });

  const openai = getOpenAIClient();
  const model = getChatModel();
  const consultations: AnswerConsultation[] = [];
  let consultCount = 0;

  let assistantMessage = (
    await openai.chat.completions.create({
      model,
      messages,
      tools: [CONSULT_CLONE_TOOL],
      tool_choice: "auto",
      temperature: 0.4,
      max_tokens: 1500,
    })
  ).choices[0]?.message;

  for (let round = 0; round < MAX_TOOL_ROUNDS && assistantMessage?.tool_calls?.length; round++) {
    messages.push(assistantMessage);

    for (const toolCall of assistantMessage.tool_calls) {
      if (toolCall.type !== "function" || toolCall.function.name !== "consult_clone") {
        messages.push({ role: "tool", tool_call_id: toolCall.id, content: "Unknown tool." });
        continue;
      }

      let args: { topic: string; clone_name?: string };
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        messages.push({ role: "tool", tool_call_id: toolCall.id, content: "Failed to parse tool arguments." });
        continue;
      }

      if (!canConsult(0, consultCount).allowed) {
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: "Consultation limit reached. Answer with the knowledge you already have.",
        });
        continue;
      }

      opts.onEvent?.({ type: "consulting", clone_name: args.clone_name || "a colleague", topic: args.topic });

      const consultation = await consultClone({
        callerCloneId: clone.id,
        targetCloneName: args.clone_name || "",
        query: args.topic,
        depth: 0,
        conversationId: `conv_${Date.now()}`,
      });
      consultCount++;

      const record = {
        target_clone_name: consultation.target_clone_name,
        query: args.topic,
        response: consultation.response,
      };
      consultations.push(record);
      opts.onEvent?.({ type: "consultation", consultation: record });

      messages.push({ role: "tool", tool_call_id: toolCall.id, content: consultation.response });
    }

    assistantMessage = (
      await openai.chat.completions.create({
        model,
        messages,
        tools: [CONSULT_CLONE_TOOL],
        tool_choice: "auto",
        temperature: 0.4,
        max_tokens: 1500,
      })
    ).choices[0]?.message;
  }

  let answer = assistantMessage?.content?.trim() || "";
  if (!answer) {
    // Model stopped on a tool call after the round limit; force a plain answer.
    const final = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 1500,
    });
    answer = final.choices[0]?.message?.content?.trim() || "I couldn't produce an answer for that.";
  }

  return { answer, sources, consultations };
}
