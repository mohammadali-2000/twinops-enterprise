import { NextRequest, NextResponse } from "next/server";
import {
  deleteClone,
  getCloneDetailForApi,
  parseCloneInput,
  updateClone,
  type CloneInput,
} from "@backend/memory/clone-repository";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const data = await getCloneDetailForApi(id);
  if (!data) {
    return NextResponse.json({ error: "Clone not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  let input: Partial<CloneInput>;
  try {
    input = parseCloneInput(await request.json(), false);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid request" }, { status: 400 });
  }
  try {
    const clone = await updateClone(id, input);
    if (!clone) return NextResponse.json({ error: "Clone not found" }, { status: 404 });
    return NextResponse.json({ clone });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not update twin" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const deleted = await deleteClone(id);
    if (!deleted) return NextResponse.json({ error: "Clone not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not delete twin" }, { status: 500 });
  }
}
