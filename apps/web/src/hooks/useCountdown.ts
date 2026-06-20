"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/script/portal";

export function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setRemaining(formatCountdown(ms));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return remaining;
}
