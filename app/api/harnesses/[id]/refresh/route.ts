import { NextRequest, NextResponse } from "next/server";
import { guidanceScores } from "@/lib/db";

// Called by scripts/watcher.py when a guidance file changes.
// Body: { source: string, lines: number, score: number, nbLignes?: number }
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/harnesses/[id]/refresh">,
) {
  const { id } = await ctx.params;
  const harness = decodeURIComponent(id);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { source, lines, score, nbLignes } = body as Record<string, unknown>;
  if (typeof source !== "string" || source.length === 0) {
    return NextResponse.json({ error: "source is required" }, { status: 400 });
  }
  // The watcher only sends lines/score for anti-dilution (CLAUDE.md) files.
  if (lines === undefined && score === undefined) {
    return NextResponse.json({ ok: true, stored: false });
  }
  if (
    typeof lines !== "number" ||
    !Number.isInteger(lines) ||
    lines < 0 ||
    typeof score !== "number" ||
    !Number.isFinite(score)
  ) {
    return NextResponse.json(
      { error: "lines must be an integer >= 0 and score a finite number" },
      { status: 400 },
    );
  }

  if (
    nbLignes !== undefined &&
    (typeof nbLignes !== "number" || !Number.isInteger(nbLignes) || nbLignes < 0)
  ) {
    return NextResponse.json(
      { error: "nbLignes must be an integer >= 0 when provided" },
      { status: 400 },
    );
  }

  guidanceScores.upsert(
    harness,
    source,
    lines,
    score,
    typeof nbLignes === "number" ? nbLignes : null,
  );
  return NextResponse.json({ ok: true, stored: true }, { status: 200 });
}
