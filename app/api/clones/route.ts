import { NextRequest, NextResponse } from "next/server";
import { createClone, listClonesForApi, parseCloneInput, type CloneInput } from "@backend/memory/clone-repository";

export async function GET() {
  const clones = await listClonesForApi();
  return NextResponse.json({ clones });
}

export async function POST(request: NextRequest) {
  let input: Partial<CloneInput>;
  try {
    input = parseCloneInput(await request.json(), true);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid request" }, { status: 400 });
  }
  try {
    const clone = await createClone(input as CloneInput);
    return NextResponse.json({ clone }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not create twin" }, { status: 500 });
  }
}
