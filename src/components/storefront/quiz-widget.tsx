"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TEXTURES } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { Dict } from "@/i18n";

const QUESTIONS = (t: Dict["quiz"]) => [
  { key: "goal", label: t.q1, options: [["WIG", "A wig"], ["BUNDLE", "Bundles"], ["CLOSURE", "A closure"], ["FRONTAL", "A frontal"], ["HAIR_CARE", "Care products"]] },
  { key: "texture", label: t.q2, options: TEXTURES.map((x) => [x, x]) },
  { key: "length", label: t.q3, options: [["short", "8–14\""], ["medium", "16–22\""], ["long", "24–30\""], ["extra", "32\"+"]] },
  { key: "budget", label: t.q4, options: [["low", "Under $150"], ["mid", "$150–$350"], ["high", "$350+"]] },
  { key: "usage", label: t.q5, options: [["daily", "Every day"], ["occasional", "Occasions"]] },
  { key: "maintenance", label: t.q6, options: [["low", "As little as possible"], ["medium", "A weekly routine"], ["high", "I love styling"]] },
];

export function QuizWidget({ t }: { t: Dict["quiz"] }) {
  const qs = QUESTIONS(t);
  const [i, setI] = useState(0);
  const [a, setA] = useState<Record<string, string>>({});
  const router = useRouter();
  const q = qs[i];
  const finish = (answers: Record<string, string>) => router.push(`/quiz?done=1&${new URLSearchParams(answers)}`);
  return (
    <div className="rounded-3xl bg-white p-6 sm:p-10">
      <p className="text-xs text-ink-soft">{i + 1} / {qs.length}</p>
      <h2 className="mt-2 text-2xl text-cocoa">{q.label}</h2>
      <div className="mt-6 flex flex-wrap gap-2">
        {q.options.map(([v, l]) => <button key={v} onClick={() => { const next = { ...a, [q.key]: v }; setA(next); if (i < qs.length - 1) setI(i + 1); else finish(next); }} className={cn("rounded-pill border px-5 py-3 text-sm font-medium", a[q.key] === v ? "border-cocoa bg-cocoa text-cream" : "border-sand hover:bg-petal")}>{l}</button>)}
      </div>
      <div className="mt-8 flex gap-2">{i > 0 && <Button variant="ghost" onClick={() => setI(i - 1)}>←</Button>}<Button variant="ghost" onClick={() => (i < qs.length - 1 ? setI(i + 1) : finish(a))}>{i < qs.length - 1 ? t.next : t.results}</Button></div>
    </div>
  );
}
