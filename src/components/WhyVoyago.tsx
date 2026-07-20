import { Route, UtensilsCrossed, Wallet } from "lucide-react";

const FEATURES = [
  {
    icon: Route,
    title: "AI 동선 최적화",
    desc: "걷는 거리와 이동 시간을 계산해 하루 일정을 가장 효율적인 순서로 짜드립니다.",
  },
  {
    icon: UtensilsCrossed,
    title: "로컬 맛집 추천",
    desc: "관광객용 식당 대신, 현지인 비율이 높은 진짜 로컬 맛집만 골라 추천합니다.",
  },
  {
    icon: Wallet,
    title: "예산 자동 배분",
    desc: "항공·숙소·식비·교통까지 입력한 예산 안에서 항목별로 자동 배분해드립니다.",
  },
];

/** "왜 VOYAGO인가" 3가지 핵심 특징 카드 */
export default function WhyVoyago() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-20">
      <h2 className="text-center font-display text-3xl text-white sm:text-4xl">
        왜 VOYAGO인가
      </h2>
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
              <Icon size={22} className="text-gold" />
            </div>
            <p className="mt-4 font-display text-lg text-white">{title}</p>
            <p className="mt-2 text-sm text-subtext">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
