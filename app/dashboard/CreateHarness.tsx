"use client";

export default function CreateHarness() {
  return (
    <button
      type="button"
      className="cursor-pointer flex w-full items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-4 text-left transition hover:border-slate-400 hover:bg-slate-50"
      onClick={() => {
        alert("TODO");
      }}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="h-5 w-5"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-base font-semibold text-slate-900">
          Add harness
        </span>
        <span className="text-sm text-slate-500">Configure new check</span>
      </span>
    </button>
  );
}
