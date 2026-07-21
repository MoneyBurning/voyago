"use client";

import { useEffect, useState } from "react";
import type { BudgetCalculation } from "@/types/travel";

interface BudgetGridProps {
  budget: BudgetCalculation;
}

/** "44만원 (최소 30만 ~ 최대 65만원)" 형태로 총액 옆에 범위를 인라인 표기 */
function AmountWithRange({ total, min, max }: { total: number; min: number; max: number }) {
  return (
    <p className="mt-1 font-mono text-xl text-white">
      {total}만원
      {min < max ? <span className="ml-1 font-sans text-xs text-subtext">(최소 {min}만 ~ 최대 {max}만원)</span> : null}
    </p>
  );
}

function Bar({ percent, filled }: { percent: number; filled: boolean }) {
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gold transition-all duration-1000 ease-out"
        style={{ width: filled ? `${percent}%` : "0%" }}
      />
    </div>
  );
}

/** 예산 배분 카드 — 항공/숙소/식비/교통/음주/입장료/비상금 총액·1인당·근거·범위 + 예산 초과/여유 안내 */
export default function BudgetGrid({ budget }: BudgetGridProps) {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const total = budget.total || 1;
  const pct = (amount: number) => Math.round((amount / total) * 100);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl text-white">예산 배분</h2>
        <p className="font-mono text-sm text-subtext">
          총 <span className="text-gold">{budget.total}만원</span> · 1인당 {budget.perPerson}만원
        </p>
      </div>

      {budget.budgetStatus === "over" ? (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          ⚠️ 선택하신 예산보다 실제 예상 지출이 더 많습니다. 숙소 스타일이나 예산 구간을 조정해보세요.
        </div>
      ) : null}
      {budget.budgetStatus === "under" ? (
        <div className="mb-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          💡 선택하신 예산에 여유가 있어요. 조금 더 좋은 숙소나 액티비티를 고려해봐도 좋아요.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-subtext">항공</p>
          <AmountWithRange total={budget.flight.total} min={budget.flight.min} max={budget.flight.max} />
          <p className="text-xs text-subtext">1인당 {budget.flight.perPerson}만원</p>
          <Bar percent={pct(budget.flight.total)} filled={filled} />
          <p className="mt-2 text-xs text-subtext">{budget.flight.note}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-subtext">숙소</p>
          <AmountWithRange total={budget.hotel.total} min={budget.hotel.min} max={budget.hotel.max} />
          <p className="text-xs text-subtext">
            1박 {budget.hotel.perNight}만원 × {budget.hotel.nights}박
          </p>
          <Bar percent={pct(budget.hotel.total)} filled={filled} />
          <p className="mt-2 text-xs text-subtext">{budget.hotel.note}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-subtext">식비</p>
          <AmountWithRange total={budget.food.total} min={budget.food.min} max={budget.food.max} />
          <p className="text-xs text-subtext">1인당 {budget.food.perPerson}만원</p>
          <Bar percent={pct(budget.food.total)} filled={filled} />
          <p className="mt-2 text-xs text-subtext">{budget.food.note}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-subtext">교통</p>
          <AmountWithRange total={budget.transport.total} min={budget.transport.min} max={budget.transport.max} />
          <p className="text-xs text-subtext">1인당 {budget.transport.perPerson}만원</p>
          <Bar percent={pct(budget.transport.total)} filled={filled} />
          <p className="mt-2 text-xs text-subtext">{budget.transport.note}</p>
          <p className="mt-1 text-xs text-gold">💡 {budget.transport.tip}</p>
        </div>

        {budget.alcohol.included ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-subtext">음주비</p>
            <AmountWithRange total={budget.alcohol.total} min={budget.alcohol.min} max={budget.alcohol.max} />
            <Bar percent={pct(budget.alcohol.total)} filled={filled} />
            <p className="mt-2 text-xs text-subtext">{budget.alcohol.note}</p>
          </div>
        ) : null}

        {budget.entrance.items.length > 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-subtext">입장료</p>
            <AmountWithRange total={budget.entrance.total} min={budget.entrance.min} max={budget.entrance.max} />
            <Bar percent={pct(budget.entrance.total)} filled={filled} />
            <p className="mt-2 text-xs text-subtext">{budget.entrance.note}</p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-subtext">비상금</p>
          <AmountWithRange total={budget.emergency.total} min={budget.emergency.min} max={budget.emergency.max} />
          <Bar percent={pct(budget.emergency.total)} filled={filled} />
          <p className="mt-2 text-xs text-subtext">예상 지출의 {budget.emergency.rate}</p>
        </div>
      </div>
    </section>
  );
}
