import { NextRequest, NextResponse } from "next/server";
import { harnesses } from "@/lib/db";

export async function GET() {
  return NextResponse.json(harnesses.list());
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, description } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.length === 0) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 },
    );
  }
  if (typeof description !== "string" || description.length === 0) {
    return NextResponse.json(
      { error: "description is required" },
      { status: 400 },
    );
  }

  try {
    const created = harnesses.create(name, description);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Insert failed";
    if (/UNIQUE/.test(message)) {
      return NextResponse.json(
        { error: "name or description already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}