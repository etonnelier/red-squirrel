"use client";

type Entry = {
  name: string;
  lines: number;
  regex?: string;
  variant?: "managed" | "rules" | "default";
  children?: Entry[];
};

const ENTRIES: Entry[] = [
  {
    name: "/Library/Application Support/ClaudeCode/managed-settings.json",
    lines: 90,
    variant: "managed",
    children: [
      {
        name: "~/.claude/CLAUDE.md",
        lines: 50,
        variant: "default",
        children: [
          {
            name: "~/.claude/rules/rule1.md",
            regex: "/**/*.json",
            lines: 40,
            variant: "rules",
            children: [
              {
                name: "<project>/CLAUDE.md",
                lines: 120,
                variant: "default",
                children: [
                  {
                    name: "<project>/.claude/rules/rule2.md",
                    regex: "scripts/**",
                    lines: 30,
                    variant: "rules",
                    children: [
                      {
                        name: "<project>/<subdir>/CLAUDE.md",
                        lines: 50,
                        variant: "default",
                      },
                      {
                        name: "<project>/<subdir>/CLAUDE.md",
                        lines: 90,
                        variant: "default",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

function rowClass(v: Entry["variant"]) {
  switch (v) {
    case "managed":
      return "border-amber-300 bg-amber-50 text-amber-900";
    case "rules":
      return "border-violet-300 bg-violet-50 text-violet-900";
    default:
      return "border-slate-200 bg-white text-slate-800";
  }
}

function totals(entry: Entry): { lines: number; total: number } {
  const childTotal = (entry.children ?? []).reduce(
    (sum, c) => sum + totals(c).total,
    0,
  );
  return { lines: entry.lines, total: entry.lines + childTotal };
}

function Row({ entry, depth }: { entry: Entry; depth: number }) {
  const t = totals(entry);
  return (
    <li className="list-none">
      <div className="flex items-stretch gap-2">
        <div
          className={`flex min-w-0 grow flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-3 py-2 ${rowClass(entry.variant)}`}
          style={{ marginLeft: depth * 20 }}
          aria-label={`L${depth + 1} ${entry.name}`}
        >
          <span
            aria-hidden="true"
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 font-mono text-[10px] font-bold text-white"
          >
            L{depth + 1}
          </span>
          <span className="break-all font-mono text-sm">{entry.name}</span>
          {entry.regex && (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-violet-400 bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-violet-700"
              aria-label={`regex ${entry.regex}`}
            >
              <span className="opacity-60">⌘</span>
              {entry.regex}
            </span>
          )}
        </div>
        <span
          className="flex w-24 shrink-0 items-center justify-end rounded-md border border-slate-200 bg-white px-3 font-mono text-xs font-semibold tabular-nums text-slate-700"
          aria-label={`lines ${t.lines}`}
        >
          {t.lines}
        </span>
        <span
          className="flex w-24 shrink-0 items-center justify-end rounded-md border border-slate-200 bg-white px-3 font-mono text-xs font-semibold tabular-nums text-slate-700"
          aria-label={`total ${t.total}`}
        >
          {t.total}
        </span>
      </div>
      {entry.children && (
        <ul className="mt-2 flex flex-col gap-2">
          {entry.children.map((c, i) => (
            <Row key={i} entry={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function GuidanceList() {
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
          Total
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {ENTRIES.map((e, i) => (
          <Row key={i} entry={e} depth={0} />
        ))}
      </ul>
    </section>
  );
}
