"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { ChecklistItem } from "@/types/travel";

interface ChecklistProps {
  items: ChecklistItem[];
}

/** 준비물 체크리스트 — 클릭하면 완료 처리 토글 */
export default function Checklist({ items }: ChecklistProps) {
  const [done, setDone] = useState<Set<string>>(
    () => new Set(items.filter((item) => item.done).map((item) => item.id))
  );

  function toggle(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 font-display text-2xl text-white">준비물 체크리스트</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => {
          const isDone = done.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                isDone
                  ? "border-gold/40 bg-gold/10 text-gold line-through"
                  : "border-white/15 bg-white/5 text-white hover:border-gold/30"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  isDone ? "border-gold bg-gold text-background" : "border-white/30"
                }`}
              >
                {isDone ? <Check size={12} strokeWidth={3} /> : null}
              </span>
              {item.text}
            </button>
          );
        })}
      </div>
    </section>
  );
}
