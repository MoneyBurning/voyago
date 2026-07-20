"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";
import ResultHeader from "@/components/ResultHeader";
import AIAnalysisCard from "@/components/AIAnalysisCard";
import HotelCard from "@/components/HotelCard";
import Timeline from "@/components/Timeline";
import BudgetGrid from "@/components/BudgetGrid";
import HiddenSpots from "@/components/HiddenSpots";
import Checklist from "@/components/Checklist";
import type { TravelInput, TravelResult } from "@/types/travel";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const RESULT_STORAGE_KEY = "voyago_result";
const INPUT_STORAGE_KEY = "voyago_input";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<TravelResult | null>(null);
  const [input, setInput] = useState<TravelInput | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  useEffect(() => {
    const rawResult = sessionStorage.getItem(RESULT_STORAGE_KEY);
    const rawInput = sessionStorage.getItem(INPUT_STORAGE_KEY);
    if (!rawResult || !rawInput) {
      router.replace("/");
      return;
    }

    try {
      const parsedResult = JSON.parse(rawResult) as TravelResult;
      const parsedInput = JSON.parse(rawInput) as TravelInput;
      // Guards against stale sessionStorage saved by an older build whose
      // TravelResult shape didn't include newer required fields (e.g. hotel, aiAnalysis)
      // or used the old flat-number budget shape instead of nested budget.flight.total etc.
      if (
        !parsedResult.days ||
        !parsedResult.hotel ||
        !parsedResult.aiAnalysis ||
        typeof parsedResult.budget?.flight !== "object"
      ) {
        router.replace("/");
        return;
      }
      // sessionStorage only exists client-side, so this data is unknowable during
      // the server render — updating state after mount is unavoidable here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult(parsedResult);
      setInput(parsedInput);
    } catch {
      router.replace("/");
    }
  }, [router]);

  const allItems = useMemo(() => result?.days.flatMap((day) => day.items) ?? [], [result]);

  function toggleDay(day: number) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  }

  if (!result || !input) {
    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-16">
      <AIAnalysisCard input={input} aiAnalysis={result.aiAnalysis} satisfaction={result.score.satisfaction} />

      <ResultHeader score={result.score} />

      <HotelCard hotel={result.hotel} />

      <section>
        <h2 className="mb-4 font-display text-2xl text-white">일정</h2>
        <div className="flex flex-col gap-3">
          {result.days.map((day) => {
            const isOpen = expandedDays.has(day.day);
            return (
              <div key={day.day} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <button
                  type="button"
                  onClick={() => toggleDay(day.day)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-display text-lg text-white">Day {day.day}</span>
                  <ChevronDown
                    size={20}
                    className={`text-gold transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen ? (
                  <div className="border-t border-white/10 px-5 py-5">
                    <Timeline items={day.items} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <BudgetGrid budget={result.budget} />
      <HiddenSpots spots={result.hiddenSpots} />
      <MapView items={allItems} />
      <Checklist items={result.checklist} />
    </main>
  );
}
