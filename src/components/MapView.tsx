"use client";

import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ScheduleItem } from "@/types/travel";

interface MapViewProps {
  items: ScheduleItem[];
}

const goldIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#c9933a;border:2px solid #0d1117;box-shadow:0 0 6px 2px rgba(201,147,58,0.7)"></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

/**
 * AI가 생성한 일부 항목의 lat/lng이 누락/손상(NaN, undefined 등)되면 Leaflet이
 * L.LatLng 생성 중 예외를 던져 지도 전체(모든 핀)가 함께 사라지는 문제가 있었다.
 * 유효한 좌표를 가진 항목만 걸러내 식당/카페/관광지 핀이 항상 복원되도록 한다.
 */
function hasValidCoords(item: ScheduleItem): boolean {
  return (
    Number.isFinite(item.lat) &&
    Number.isFinite(item.lng) &&
    !(item.lat === 0 && item.lng === 0) &&
    Math.abs(item.lat) <= 90 &&
    Math.abs(item.lng) <= 180
  );
}

/** 동선을 표시하는 Leaflet 지도 (SSR 비활성화 필수, dynamic import로만 사용) */
export default function MapView({ items }: MapViewProps) {
  const validItems = items.filter(hasValidCoords);
  if (validItems.length === 0) return null;

  const positions: [number, number][] = validItems.map((item) => [item.lat, item.lng]);

  return (
    <section>
      <h2 className="mb-4 font-display text-2xl text-white">동선 지도</h2>
      <div className="h-[420px] w-full overflow-hidden rounded-2xl border border-white/10">
        <MapContainer
          center={positions[0]}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={positions} pathOptions={{ color: "#c9933a", weight: 3, opacity: 0.8 }} />
          {validItems.map((item, index) => (
            <Marker key={`${item.name}-${index}`} position={[item.lat, item.lng]} icon={goldIcon}>
              <Popup>{item.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}
