import type { ScheduleBadge, ScheduleItem } from "@/types/travel";

interface TimelineProps {
  items: ScheduleItem[];
}

const BADGE_STYLES: Record<ScheduleBadge, string> = {
  식사: "border-gold/40 bg-gold/20 text-gold",
  관광: "border-sky-500/40 bg-sky-500/20 text-sky-300",
  이동: "border-white/20 bg-white/10 text-subtext",
  휴식: "border-teal-500/40 bg-teal-500/20 text-teal-300",
  추천: "border-red-500/40 bg-red-500/20 text-red-300",
};

/** 세로 타임라인 — 왼쪽 골드 선을 따라 하루 일정을 나열 */
export default function Timeline({ items }: TimelineProps) {
  if (items.length === 0) {
    return <p className="text-sm text-subtext">이 날의 일정이 없습니다.</p>;
  }

  return (
    <ol className="relative border-l border-gold/30 pl-6">
      {items.map((item, index) => (
        <li
          key={`${item.time}-${item.name}-${index}`}
          className="relative mb-8 animate-fade-in last:mb-0"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <span className="absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_6px_2px_rgba(201,147,58,0.6)]" />
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm text-gold">{item.time}</span>
            <span className="font-display text-lg text-white">{item.name}</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs ${BADGE_STYLES[item.badge]}`}>
              {item.badge}
            </span>
          </div>
          <p className="mt-1 text-sm text-subtext">{item.desc}</p>
        </li>
      ))}
    </ol>
  );
}
