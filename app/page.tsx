"use client";

import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import logo from "../public/logo.png";

export default function Home() {
  return (
    <main className="relative min-h-dvh w-full">
      {/* Top bar: terminal prompt + build tag */}
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-12 py-8 text-sm font-medium tracking-tight text-white">
        <span aria-label="Terminal prompt">
          <span aria-hidden className="mr-2">
            {">"}
          </span>
          <span className="text-white/90">user@redsquirrelteam</span>
          <span aria-hidden>:</span>
          <span className="text-white/70">~</span>
          <span aria-hidden className="mr-1">
            $
          </span>
          <span className="text-white">squirrel</span>
        </span>
        <span className="tracking-[0.2em] text-white/80">
          {"[ BUILD 0.0.1 ]"}
        </span>
      </header>

      {/* Center stack */}
      <section className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6">
        <ViewTransition name="brand" share="morph" default="none">
          <div className="flex flex-col items-center gap-10">
            <div className="flex h-44 w-44 items-center justify-center bg-black shadow-[0_0_60px_-10px_rgba(180,30,30,0.6)]">
              <Image
                src={logo}
                alt="Red Squirrel logo"
                width={144}
                height={144}
                priority
                className="h-44 w-44 object-contain"
              />
            </div>
            <h1 className="max-w-full text-center font-mono text-4xl font-bold tracking-[0.15em] text-ink break-words sm:text-7xl sm:tracking-[0.25em] sm:break-normal md:text-8xl">
              RED SQUIRREL
            </h1>
            <p className="max-w-full text-center text-xs tracking-[0.2em] text-white break-words sm:text-sm sm:tracking-[0.3em] sm:break-normal md:text-base">
              team harness framework for claude code
            </p>
          </div>
        </ViewTransition>

        <ViewTransition exit="fade-out" default="none">
          <Link
            href="/dashboard"
            transitionTypes={["nav-forward"]}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Enter
          </Link>
        </ViewTransition>
      </section>
    </main>
  );
}
