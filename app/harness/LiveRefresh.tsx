"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-runs the server component so guidance scores update without a full reload.
const REFRESH_INTERVAL_MS = 2000;

export default function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
