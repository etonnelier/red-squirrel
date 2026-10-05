"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Branch = { name: string; score: number };

const SEED: Branch[] = [
  { name: "/main", score: 96 },
  { name: "/feature/auth", score: 92 },
  { name: "/chore/deps", score: 88 },
  { name: "/fix/typo", score: 81 },
  { name: "/ui/v1", score: 76 },
  { name: "/dev", score: 94 },
  { name: "/refactor/db", score: 71 },
  { name: "/docs/readme", score: 99 },
];

function scoreClass(score: number) {
  if (score > 90) return "bg-green-100 text-green-700 border-green-300";
  if (score >= 80) return "bg-orange-100 text-orange-700 border-orange-300";
  return "bg-red-100 text-red-700 border-red-300";
}

export default function BranchesList() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const scan = () => {
    setPending(true);
    router.refresh();
    setTimeout(() => setPending(false), 400);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {SEED.map((b) => (
          <span
            key={b.name}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${scoreClass(b.score)}`}
          >
            <span className="font-mono">{b.name}</span>
            <span className="tabular-nums">{b.score}%</span>
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={scan}
        disabled={pending}
        className="cursor-pointer self-start rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {pending ? "Scanning…" : "Refresh (scan all branches)"}
      </button>
    </div>
  );
}
