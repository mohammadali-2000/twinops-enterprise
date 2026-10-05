import { NextRequest, NextResponse } from "next/server";
import { answerAsClone, CloneNotFoundError } from "@/lib/agents/answer";
import { getActiveCloneId } from "@/lib/integrations/credentials";

/**
 * POST /api/twinops/chat
 * Body: { cloneId: string | "auto", question: string, history?: { role: string, content: string }[] }
 * Streams SSE events: chunk | citations | done | error.
 */
export async function POST(request: NextRequest) {
  const { cloneId, question, history } = (await request.json()) as {
    cloneId?: string;
    question?: string;
    history?: { role: string; content: string }[];
  };

  if (!cloneId || !question) {
    return NextResponse.json({ error: "cloneId and question are required" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "LLM API key is not configured. Configure OPENAI_API_KEY in environment variables." },
      { status: 503 }
    );
  }

  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, data: unknown) =>
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const resolvedCloneId = cloneId === "auto" ? await getActiveCloneId() : cloneId;
        const result = await answerAsClone({ cloneId: resolvedCloneId, question, history });

        const CHUNK_SIZE = 8;
        for (let i = 0; i < result.answer.length; i += CHUNK_SIZE) {
          send(controller, { type: "chunk", text: result.answer.slice(i, i + CHUNK_SIZE) });
        }

        const citations = [
          ...result.consultations.map((c) => ({
            source: `Consulted ${c.target_clone_name}'s twin`,
            snippet: c.query,
            date: "",
          })),
          ...result.sources.map((s) => ({
            source: `[${s.index}] ${s.source}`,
            snippet: s.title,
            date: s.date ? new Date(s.date).toLocaleDateString() : "",
            url: s.url,
          })),
        ];
        if (citations.length > 0) send(controller, { type: "citations", citations });

        send(controller, { type: "done" });
      } catch (err) {
        console.error("[twinops-chat] Error:", err);
        // The UI's stream parser swallows "error" events, so surface the failure as text.
        const message =
          err instanceof CloneNotFoundError ? "Clone not found." : "Failed to generate a response. Check the server logs.";
        send(controller, { type: "chunk", text: message });
        send(controller, { type: "done" });
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
