import { NextRequest, NextResponse } from "next/server";
import { harnesses } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/harnesses/[id]">,
) {
  const { id } = await ctx.params;
  const name = decodeURIComponent(id);
  const harness = harnesses.get(name);
  if (!harness) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(harness);
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/harnesses/[id]">,
) {
  const { id } = await ctx.params;
  const name = decodeURIComponent(id);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { description } = body as Record<string, unknown>;
  if (typeof description !== "string" || description.length === 0) {
    return NextResponse.json(
      { error: "description is required" },
      { status: 400 },
    );
  }

  try {
    const updated = harnesses.update(name, description);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    if (/UNIQUE/.test(message)) {
      return NextResponse.json(
        { error: "description already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/harnesses/[id]">,
) {
  const { id } = await ctx.params;
  const name = decodeURIComponent(id);
  const removed = harnesses.remove(name);
  if (!removed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
