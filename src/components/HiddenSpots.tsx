import type { HiddenSpot } from "@/types/travel";

interface HiddenSpotsProps {
  spots: HiddenSpot[];
}

/** 숨은 로컬 맛집 2열 그리드 — 현지인 비율 뱃지 포함 */
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
              <span className="shrink-0 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 font-mono text-xs text-gold">
                현지인 {spot.localRatio}%
              </span>
            </div>
            <p className="mt-3 text-sm text-subtext">{spot.location}</p>
            <p className="mt-1 text-sm text-white/80">{spot.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
