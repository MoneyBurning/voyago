import { ExternalLink } from "lucide-react";
import type { RecommendedSpot } from "@/types/travel";

interface HiddenSpotsProps {
  spots: RecommendedSpot[];
}

/** 숨은 로컬 맛집 2열 그리드 — 현지인 비율, AI 추천 이유, 예상 대기시간, 평균 가격 */
export default function HiddenSpots({ spots }: HiddenSpotsProps) {
  if (spots.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 font-display text-2xl text-white">숨은 로컬 맛집</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {spots.map((spot) => (
          <div key={spot.name} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg text-white">{spot.name}</p>
                <p className="text-xs text-subtext">{spot.nameEn}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className="font-mono text-2xl font-bold text-gold">{spot.localRatio}%</span>
                <span className="text-[10px] text-subtext">현지인 비율</span>
              </div>
            </div>

            <p className="mt-3 text-sm text-subtext">{spot.location}</p>
            <p className="mt-1 text-sm text-white/80">{spot.desc}</p>

            {spot.menu ? <p className="mt-2 text-xs text-white/70">🍽 대표 메뉴 {spot.menu}</p> : null}
            {spot.hours ? <p className="mt-1 text-xs text-subtext">🕒 영업시간 {spot.hours}</p> : null}

            {spot.reason ? (
              <div className="mt-3 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2">
                <p className="text-xs text-gold">🤖 AI 추천 이유</p>
                <p className="mt-0.5 text-xs text-white/80">{spot.reason}</p>
              </div>
            ) : null}

            <div className="mt-3 flex gap-4 text-xs text-subtext">
              <span>⏱ 웨이팅 {spot.waitTime}</span>
              <span>💰 평균 {spot.avgPrice}만원</span>
            </div>

            {spot.googleMapsUrl ? (
              <a
                href={spot.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/5 px-3 py-1.5 text-xs text-gold transition-colors hover:bg-gold/15"
              >
                <ExternalLink size={12} />
                구글맵에서 보기
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
