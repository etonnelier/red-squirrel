"use client";

import type { GuidanceScore } from "@/lib/db";

function scoreClass(score: number) {
  if (score >= 100) return "border-emerald-300 bg-emerald-50 text-emerald-900";
  if (score > 0) return "border-amber-300 bg-amber-50 text-amber-900";
  return "border-red-300 bg-red-50 text-red-900";
}

export default function GuidanceList({ scores }: { scores: GuidanceScore[] }) {
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
      {scores.length === 0 ? (
        <p className="px-3 text-sm text-slate-500">No guidance files yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {scores.map((s) => (
            <li
              key={s.source}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 ${scoreClass(s.score)}`}
            >
              <span className="min-w-0 grow break-all font-mono text-sm">
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
