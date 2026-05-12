import { useEffect, useState } from "react";

function calc(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff / 3600000) % 24),
    m: Math.floor((diff / 60000) % 60),
    s: Math.floor((diff / 1000) % 60),
  };
}

export function Countdown() {
  const target = typeof window !== "undefined"
    ? Date.now() + 7 * 86400000
    : Date.now() + 7 * 86400000;
  const [t, setT] = useState(() => calc(target));
  useEffect(() => {
    const id = setInterval(() => setT(calc(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  const cells = [
    { l: "Days", v: t.d }, { l: "Hours", v: t.h },
    { l: "Mins", v: t.m }, { l: "Secs", v: t.s },
  ];
  return (
    <div className="flex gap-2 sm:gap-3">
      {cells.map(c => (
        <div key={c.l} className="flex w-16 flex-col items-center rounded-2xl bg-card px-2 py-3 shadow-card sm:w-20">
          <span className="text-2xl font-bold tabular-nums text-primary sm:text-3xl">{String(c.v).padStart(2,"0")}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">{c.l}</span>
        </div>
      ))}
    </div>
  );
}
