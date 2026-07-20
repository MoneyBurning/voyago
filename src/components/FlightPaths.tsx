interface Route {
  path: string;
  delay: number;
}

const ROUTES: Route[] = [
  { path: "M 6 72 Q 35 18 58 54 T 96 28", delay: 0 },
  { path: "M 4 28 Q 32 66 56 24 T 94 62", delay: 1.5 },
  { path: "M 14 92 Q 46 42 72 82 T 98 48", delay: 3 },
  { path: "M 2 48 Q 42 8 66 46 T 90 12", delay: 4.5 },
];

/** 세계 곳곳을 잇는 추상적인 항로 애니메이션 — 특정 도시 대신 여행의 자유로움을 표현 */
export default function FlightPaths() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {ROUTES.map((route) => (
        <g key={route.path}>
          <path
            d={route.path}
            fill="none"
            stroke="#c9933a"
            strokeWidth="0.25"
            strokeLinecap="round"
            strokeDasharray="220"
            className="animate-draw-path"
            style={{ animationDelay: `${route.delay}s` }}
          />
          <circle r="0.55" fill="#e8b96a">
            <animateMotion
              dur="6s"
              begin={`${route.delay}s`}
              repeatCount="indefinite"
              path={route.path}
            />
          </circle>
        </g>
      ))}
    </svg>
  );
}
