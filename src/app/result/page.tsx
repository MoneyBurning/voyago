"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ResultHeader from "@/components/ResultHeader";
import HotelCard from "@/components/HotelCard";
import Timeline from "@/components/Timeline";
import BudgetGrid from "@/components/BudgetGrid";
import HiddenSpots from "@/components/HiddenSpots";
import Checklist from "@/components/Checklist";
import type { TravelResult } from "@/types/travel";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const RESULT_STORAGE_KEY = "voyago_result";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<TravelResult | null>(null);
  const [activeDay, setActiveDay] = useState<number | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (!raw) {
      router.replace("/");
      return;
    }

    try {
      const parsed = JSON.parse(raw) as TravelResult;
      // Guards against stale sessionStorage saved by an older build whose
      // TravelResult shape didn't include newer required fields (e.g. hotel).
      if (!parsed.days || !parsed.hotel) {
        router.replace("/");
        return;
      }
      // sessionStorage only exists client-side, so this data is unknowable during
      // the server render — updating state after mount is unavoidable here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult(parsed);
      setActiveDay(parsed.days[0]?.day ?? 1);
    } catch {
      router.replace("/");
    }
  }, [router]);

  const allItems = useMemo(() => result?.days.flatMap((day) => day.items) ?? [], [result]);
  const activeItems = useMemo(
    () => result?.days.find((day) => day.day === activeDay)?.items ?? [],
    [result, activeDay]
  );

  if (!result || activeDay === null) {
    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-16">
      <ResultHeader score={result.score} />

      <HotelCard hotel={result.hotel} />

      <section>
        <h2 className="mb-4 font-display text-2xl text-white">일정</h2>
        <div className="mb-6 flex flex-wrap gap-2">
          {result.days.map((day) => (
            <button
              key={day.day}
              type="button"
              onClick={() => setActiveDay(day.day)}
              className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
                activeDay === day.day
                  ? "border-gold bg-gold/20 text-gold"
                  : "border-white/15 text-subtext hover:border-gold/40 hover:text-white"
              }`}
            >
              Day {day.day}
            </button>
          ))}
        </div>
        <Timeline items={activeItems} />
      </section>

      <BudgetGrid budget={result.budget} />
      <HiddenSpots spots={result.hiddenSpots} />
      <MapView items={allItems} />
      <Checklist items={result.checklist} />
    </main>
  );
}
