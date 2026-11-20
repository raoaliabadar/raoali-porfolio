"use client";

import { useEffect, useState } from "react";

/** Live local time for a given IANA timezone. Renders after mount to avoid hydration mismatch. */
export function LocalClock({ timezone, className = "" }: { timezone: string; className?: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone,
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [timezone]);

  return (
    <time className={`tabular-nums ${className}`} suppressHydrationWarning>
      {time ?? "--:-- --"}
    </time>
  );
}
