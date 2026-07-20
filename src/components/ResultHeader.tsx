import type { TravelScore } from "@/types/travel";

interface ResultHeaderProps {
  score: TravelScore;
}

const STAT_LABELS: { key: keyof Omit<TravelScore, "total">; label: string }[] = [
  { key: "route", label: "동선" },
  { key: "budget", label: "예산" },
  { key: "food", label: "먹방" },
  { key: "photo", label: "사진" },
  { key: "satisfaction", label: "만족도예측" },
];

/** 결과 상단 점수 배너 — 총점을 크게, 세부 지표를 나열 */
export default function ResultHeader({ score }: ResultHeaderProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
      <p className="font-mono text-xs tracking-widest text-subtext">VOYAGO SCORE</p>
      <p className="mt-2 font-display text-6xl font-bold text-gold sm:text-7xl">
        {score.total}
        <span className="ml-1 text-2xl text-subtext">점</span>
      </p>
      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {STAT_LABELS.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <dt className="font-mono text-lg text-white">{score[key]}</dt>
            <dd className="text-xs text-subtext">{label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
