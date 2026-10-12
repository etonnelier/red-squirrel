import type { Metadata } from "next";
import { harnesses } from "@/lib/db";
import BranchesList from "./BranchesList";
import GuidanceList from "./GuidanceList";

type Props = PageProps<"/harness">;

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { name } = await searchParams;
  const title = typeof name === "string" && name.length > 0 ? name : "Harness";
  return { title };
}

export default async function HarnessPage({ searchParams }: Props) {
  const { name } = await searchParams;
  const harness = typeof name === "string" ? harnesses.get(name) : undefined;

  return (
    <main className="relative min-h-dvh w-full">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 lg:max-w-5xl lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {harness?.name ?? "Harness"}
        </h1>
        <h2 className="text-1xl font-bold tracking-tight text-slate-700 sm:text-2xl">
          Current branch :{" "}
          <span className="font-normal" style={{ color: "black" }}>
            {"/main"}
          </span>
        </h2>
        <BranchesList />
        <GuidanceList />
        <br />
      </div>
    </main>
  );
}
