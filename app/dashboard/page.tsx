import { harnesses } from "@/lib/db";
import Brand from "./Brand";
import CreateHarness from "./CreateHarness";
import HarnessList from "./HarnessList";

export default async function Dashboard() {
  const items = harnesses.list();

  return (
    <main className="relative min-h-dvh w-full">
      <Brand />

      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 pt-32">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Harness your claude code
        </h1>
        <CreateHarness />
        <HarnessList items={items} />
      </div>
    </main>
  );
}
