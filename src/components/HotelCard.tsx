import { ExternalLink, MapPin, Star } from "lucide-react";
import type { HotelRecommendation } from "@/types/travel";

interface HotelCardProps {
  hotel: HotelRecommendation;
}

/** 추천 숙소 카드 — 이름/별점/위치/가격/특징/예약 링크 */
export default function HotelCard({ hotel }: HotelCardProps) {
  return (
    <section>
      <h2 className="mb-4 font-display text-2xl text-white">추천 숙소</h2>
      <div className="rounded-2xl border border-gold/40 bg-white/5 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-xl text-white">{hotel.name}</p>
            <p className="text-sm text-subtext">{hotel.nameEn}</p>
          </div>
          <div className="flex items-center gap-1 font-mono text-sm text-gold">
            <Star size={16} className="fill-gold text-gold" />
            {hotel.rating.toFixed(1)}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-sm text-subtext">
          <MapPin size={14} />
          {hotel.location}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {hotel.features.map((feature) => (
            <span
              key={feature}
              className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold"
            >
              {feature}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-4">
          <div>
            <p className="font-mono text-lg text-white">
              {hotel.pricePerNight}만원<span className="text-sm text-subtext"> / 박</span>
            </p>
            <p className="text-xs text-subtext">총 숙박비 {hotel.totalCost}만원</p>
          </div>
          <a
            href={hotel.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            예약하기
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
