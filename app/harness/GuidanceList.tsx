"use client";

import type { GuidanceScore } from "@/lib/db";

type Node = GuidanceScore & { depth: number };

function scoreClass(score: number) {
  if (score >= 100) return "border-emerald-300 bg-emerald-50 text-emerald-900";
  if (score > 0) return "border-amber-300 bg-amber-50 text-amber-900";
  return "border-red-300 bg-red-50 text-red-900";
}

// A file's parent is the nearest ancestor directory holding another CLAUDE.md in the list.
function buildTree(scores: GuidanceScore[]): Node[] {
  const sources = new Set(scores.map((s) => s.source));
  const childrenOf = new Map<string, GuidanceScore[]>();
  const roots: GuidanceScore[] = [];

  for (const s of scores) {
    let parent: string | undefined;
    // Start one level above the file's folder: a sibling in the same folder is never a parent.
    let dir = s.source.slice(0, s.source.lastIndexOf("/"));
    dir = dir.slice(0, dir.lastIndexOf("/"));
    while (dir.length > 0) {
      const candidate = `${dir}/CLAUDE.md`;
      if (candidate !== s.source && sources.has(candidate)) {
        parent = candidate;
        break;
      }
      dir = dir.slice(0, dir.lastIndexOf("/"));
    }
    if (parent) {
      childrenOf.set(parent, [...(childrenOf.get(parent) ?? []), s]);
    } else {
      roots.push(s);
    }
  }

  const out: Node[] = [];
  const walk = (list: GuidanceScore[], depth: number) => {
    const sorted = [...list].sort((a, b) => a.source.localeCompare(b.source));
    for (const s of sorted) {
      out.push({ ...s, depth });
      walk(childrenOf.get(s.source) ?? [], depth + 1);
    }
  };
  walk(roots, 0);
  return out;
}

export default function GuidanceList({ scores }: { scores: GuidanceScore[] }) {
  const nodes = buildTree(scores);

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-lg font-semibold text-slate-900">Guidance files</h3>
      <div className="flex items-center gap-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <span className="grow" style={{ color: "black" }}>
          File
        </span>
        <span className="w-24 text-right" style={{ color: "black" }}>
          Lines
        </span>
        <span className="w-24 text-right" style={{ color: "black" }}>
          Score
        </span>
      </div>
      {nodes.length === 0 ? (
        <p className="px-3 text-sm text-slate-500">No guidance files yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {nodes.map((s) => (
            <li
              key={s.source}
              style={{ marginLeft: s.depth * 20 }}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 ${scoreClass(s.score)}`}
            >
              <span className="min-w-0 grow break-all font-mono text-sm">
                {s.depth > 0 && <span className="opacity-50">↳ </span>}
                {s.source}
              </span>
              <span
                className="flex w-24 shrink-0 items-center justify-end font-mono text-xs font-semibold tabular-nums"
                aria-label={`lines ${s.lines}`}
              >
                {s.lines}
              </span>
              <span
                className="flex w-24 shrink-0 items-center justify-end font-mono text-xs font-semibold tabular-nums"
                aria-label={`score ${s.score.toFixed(2)}`}
              >
                {s.score.toFixed(2)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
