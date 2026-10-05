"use client";

import Image from "next/image";
import { ViewTransition } from "react";
import logo from "../../public/logo.png";

export default function Brand() {
  return (
    <ViewTransition name="brand" share="morph" default="none">
      <div className="absolute left-6 top-6 flex items-center gap-3">
        <Image
          src={logo}
          alt="Red Squirrel logo"
          width={48}
          height={48}
          priority
          className="h-12 w-12 object-contain"
        />
        <span className="text-2xl font-bold tracking-tight text-ink">
          Red Squirrel
        </span>
      </div>
    </ViewTransition>
  );
}
