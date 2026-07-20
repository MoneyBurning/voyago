import { DESTINATION_STATUS } from "@/types/travel";

/** 현재 지원 도시 뱃지 — 다낭만 활성, 나머지는 준비중 */
export default function CityStatus() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-20 text-center">
      <p className="mb-5 text-sm text-subtext">지원 도시</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {DESTINATION_STATUS.map(({ value, enabled }) => (
          <span
            key={value}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              enabled
                ? "border-gold bg-gold/15 text-gold"
                : "border-white/10 text-subtext"
            }`}
          >
            {value}
            {enabled ? "" : " · 준비중"}
          </span>
        ))}
      </div>
    </section>
  );
}
