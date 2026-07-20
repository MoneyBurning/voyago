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

/** 동선을 표시하는 Leaflet 지도 (SSR 비활성화 필수, dynamic import로만 사용) */
export default function MapView({ items }: MapViewProps) {
  if (items.length === 0) return null;

  const positions: [number, number][] = items.map((item) => [item.lat, item.lng]);

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
          {items.map((item, index) => (
            <Marker key={`${item.name}-${index}`} position={[item.lat, item.lng]} icon={goldIcon}>
              <Popup>{item.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}
