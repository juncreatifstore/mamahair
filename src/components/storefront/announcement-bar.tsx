"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function remaining(end: string) {
  const endMs = new Date(end).getTime();
  if (!Number.isFinite(endMs)) return null;
  const diff = endMs - Date.now();
  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const totalSeconds = Math.floor(diff / 1000);
  return {
    expired: false,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function AnnouncementBar({ text, href, endsAt, countdown }: { text: string; href?: string; endsAt?: string; countdown?: boolean }) {
  const initial = useMemo(() => (endsAt ? remaining(endsAt) : null), [endsAt]);
  const [time, setTime] = useState(initial);

  useEffect(() => {
    if (!countdown || !endsAt) return;
    const update = () => setTime(remaining(endsAt));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [countdown, endsAt]);

  if (countdown && endsAt && time?.expired) return null;

  const content = (
    <div className="mx-auto flex min-h-9 max-w-[1440px] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-cream sm:text-[11px] lg:text-xs">
      <span>{text}</span>
      {countdown && time && !time.expired && (
        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-bold tracking-[0.08em] text-white">
          {time.days > 0 && <span>{time.days}D</span>}
          <span>{String(time.hours).padStart(2, "0")}H</span>
          <span>{String(time.minutes).padStart(2, "0")}M</span>
          <span>{String(time.seconds).padStart(2, "0")}S</span>
        </span>
      )}
    </div>
  );

  return <div className="bg-cocoa-deep">{href ? <Link href={href} className="block transition hover:bg-white/[0.035]">{content}</Link> : content}</div>;
}
