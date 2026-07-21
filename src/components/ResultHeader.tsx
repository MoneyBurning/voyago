import type { TravelMonth, TravelScore } from "@/types/travel";

interface ResultHeaderProps {
  score: TravelScore;
  travelMonth: TravelMonth;
}

const STAT_LABELS: { key: keyof Omit<TravelScore, "total">; label: string }[] = [
  { key: "route", label: "동선" },
  { key: "budget", label: "예산" },
  { key: "food", label: "먹방" },
  { key: "photo", label: "사진" },
  { key: "satisfaction", label: "만족도예측" },
];

/** 다낭은 1~8월 건기 / 9~12월 우기 — lib/groq.ts의 isRainySeason과 동일한 기준 */
function isRainySeason(travelMonth: TravelMonth): boolean {
  return travelMonth >= 9 && travelMonth <= 12;
}

/** 결과 상단 점수 배너 — 총점을 크게, 세부 지표를 나열, 우기 시즌이면 날씨 경고 배너 표시 */
export default function ResultHeader({ score, travelMonth }: ResultHeaderProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
      {isRainySeason(travelMonth) ? (
        <div className="mb-6 rounded-xl border border-blue-400/30 bg-blue-400/10 px-4 py-3 text-sm text-blue-200">
          ☔ 9~12월은 우기입니다. 우산/우비를 준비하세요.
        </div>
      ) : null}
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
