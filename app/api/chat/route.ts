import { NextRequest, NextResponse } from "next/server";
import { answerAsClone, CloneNotFoundError } from "@/lib/agents/answer";

const DEBRIEF_PROMPT =
  "Give me a debrief on our recent workspace activities, key decisions, and action items requiring attention. Be concise, actionable, and conversational, providing an executive briefing.";

export async function POST(request: NextRequest) {
  const {
    message,
    cloneId,
    conversationHistory = [],
    isProactiveDebrief = false,
  } = await request.json();

  if (!cloneId || (!message && !isProactiveDebrief)) {
    return NextResponse.json({ error: "cloneId and message are required" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, data: unknown) =>
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await answerAsClone({
          cloneId,
          question: isProactiveDebrief ? DEBRIEF_PROMPT : message,
          history: conversationHistory,
          onEvent: (event) => send(controller, event),
        });

        const CHUNK_SIZE = 8;
        for (let i = 0; i < result.answer.length; i += CHUNK_SIZE) {
          send(controller, { type: "content", content: result.answer.slice(i, i + CHUNK_SIZE) });
        }
        if (result.sources.length > 0) {
          send(controller, { type: "sources", sources: result.sources });
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        console.error("[chat] Error:", error);
        send(controller, {
          type: "error",
          message: error instanceof CloneNotFoundError ? "Clone not found" : "Failed to generate response",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
