import { NextRequest, NextResponse } from "next/server";
import { getSlackBotToken } from "@/lib/integrations/credentials";

export async function POST(request: NextRequest) {
  try {
    const { channel, text } = await request.json();

    if (!channel || typeof channel !== "string") {
      return NextResponse.json(
        { error: "channel is required (a Slack channel ID)" },
        { status: 400 }
      );
    }
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const token = await getSlackBotToken();
    const targetChannel = channel;

    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: targetChannel,
        text,
      }),
    });

    const data = await res.json();
    return NextResponse.json({ success: data.ok, data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to post to Slack" },
      { status: 500 }
    );
  }
}
