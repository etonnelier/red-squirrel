import Link from "next/link";
import { harnesses, type Harness } from "@/lib/db";

export default function HarnessList({ items }: { items: Harness[] }) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-baseline gap-3">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Activated Harnesses
        </h2>
        <span className="text-sm font-medium text-slate-500">
          {items.length} active
        </span>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-500">
          No harnesses yet. Add one above to get started.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((h) => (
            <li
              key={h.name}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 transition hover:border-slate-300"
            >
              <span className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500"
                />
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-base font-semibold text-slate-900">
                    {h.name}
                  </span>
                  <span className="truncate text-sm text-slate-500">
                    {h.description}
                  </span>
                </span>
              </span>
              <Link
                href={`/harness?name=${encodeURIComponent(h.name)}`}
                className="shrink-0 rounded-full border border-rose-500 px-4 py-1.5 text-sm font-semibold text-rose-500 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
              >
                Details <span aria-hidden>→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
