"use client";

import { useEffect, useState } from "react";
import type { BudgetBreakdown } from "@/types/travel";

interface BudgetGridProps {
  budget: BudgetBreakdown;
}

const CATEGORIES: { key: keyof BudgetBreakdown; label: string }[] = [
  { key: "flight", label: "항공" },
  { key: "hotel", label: "숙소" },
  { key: "food", label: "식비" },
  { key: "transport", label: "교통" },
  { key: "shopping", label: "쇼핑" },
  { key: "emergency", label: "비상금" },
];

/** 예산 배분 6개 카드 — 페이지 로드 시 바가 채워지는 애니메이션 */
export default function BudgetGrid({ budget }: BudgetGridProps) {
  const [filled, setFilled] = useState(false);
  const total = CATEGORIES.reduce((sum, { key }) => sum + budget[key], 0) || 1;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <section>
      <h2 className="mb-4 font-display text-2xl text-white">예산 배분</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {CATEGORIES.map(({ key, label }) => {
          const amount = budget[key];
          const percent = Math.round((amount / total) * 100);
          return (
            <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-subtext">{label}</p>
              <p className="mt-1 font-mono text-xl text-white">{amount}만원</p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gold transition-all duration-1000 ease-out"
                  style={{ width: filled ? `${percent}%` : "0%" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
