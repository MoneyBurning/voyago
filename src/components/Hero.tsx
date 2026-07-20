import FlightPaths from "./FlightPaths";

const LATITUDE_LINES = [20, 35, 50, 65, 80];

const STATS = [
  { value: "1,240+", label: "검증 맛집" },
  { value: "98%", label: "만족도" },
  { value: "5초", label: "일정 완성" },
];

/** 메인 히어로 섹션 — 특정 도시 이미지 없이, 항로 애니메이션으로 여행의 자유로움을 표현 */
export default function Hero() {
  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      {/* 아우라 블롭 — 은은하게 떠다니는 골드 글로우 */}
      <div
        className="animate-drift pointer-events-none absolute -left-1/4 top-1/4 h-[36rem] w-[36rem] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #c9933a 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      <div
        className="animate-drift-reverse pointer-events-none absolute -right-1/4 bottom-0 h-[32rem] w-[32rem] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #e8b96a 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* 세계지도 격자 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,147,58,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(201,147,58,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      {/* 위도선 — 천천히 회전하는 지구본 느낌 */}
      <div className="animate-spin-slow pointer-events-none absolute inset-0" aria-hidden="true">
        <svg
          className="h-full w-full opacity-20"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          {LATITUDE_LINES.map((cy) => (
            <ellipse
              key={cy}
              cx="50"
              cy={cy}
              rx="70"
              ry={cy / 12}
              fill="none"
              stroke="#c9933a"
              strokeWidth="0.15"
            />
          ))}
        </svg>
      </div>

      {/* 항로 애니메이션 — 특정 도시 없이 전 세계를 잇는 여정 표현 */}
      <FlightPaths />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, var(--background) 78%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6">
        <span className="rounded-full border border-gold/30 px-4 py-1 font-mono text-xs tracking-widest text-gold">
          VOYAGO · AI TRAVEL OS
        </span>

        <h1 className="font-display text-4xl font-semibold leading-tight text-white sm:text-6xl">
          당신의 다음 여행, AI가 설계합니다
        </h1>

        <p className="max-w-xl text-base text-subtext sm:text-lg">
          블로그 검색 없이 — 취향·예산·동선까지 5초 완성
        </p>

        <dl className="mt-8 grid grid-cols-3 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <dt className="font-mono text-2xl font-bold text-gold sm:text-3xl">
                {stat.value}
              </dt>
              <dd className="text-xs text-subtext sm:text-sm">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
