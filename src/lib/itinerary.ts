import { danangHiddenSpots } from "@/data/danang";
import type { DaySchedule, ScheduleItem, TimeOfDay } from "@/types/travel";

/**
 * Groq 시스템 프롬프트에 "하루 3끼 필수, 빠지면 스스로 검토 후 채워서 출력" 지시를
 * 넣어봤지만 단발성 completion에서는 실제로 지켜지지 않는 경우가 관측됐다
 * (예: 6일 일정 중 아침식사가 단 하루도 포함되지 않음). 그래서 재시도 대신
 * 코드에서 결정론적으로 빠진 끼니를 채워 넣어 보장한다.
 *
 * 단순히 시간창에 없으면 새 항목을 추가하는 방식은 두 가지 문제를 낳는다:
 * 1) Groq가 이미 비슷한 시간에 식사를 넣었지만 창을 살짝 벗어난 경우(예: 18:00 저녁)
 *    새 항목을 또 추가하면 저녁이 두 번 생긴다 — 기존 항목을 창 안으로 "재배치"해야 한다.
 * 2) 새로 끼워 넣은 시각이 "공항 도착"(Day 1 첫 항목)보다 이르거나 "호텔로 복귀"
 *    (마지막 항목)보다 늦으면, 시간순 정렬 후 그 앵커 항목이 더 이상 처음/끝이 아니게
 *    되어 하루 시작/종료 규칙이 깨진다.
 */

interface MealSlot {
  label: "아침식사" | "점심식사" | "저녁식사";
  windowStart: string;
  windowEnd: string;
  /** 끼니를 새로 끼워 넣거나 재배치할 때 사용할 대표 시각 */
  insertTime: string;
}

const MEAL_SLOTS: MealSlot[] = [
  { label: "아침식사", windowStart: "07:00", windowEnd: "09:00", insertTime: "08:00" },
  { label: "점심식사", windowStart: "12:00", windowEnd: "13:00", insertTime: "12:30" },
  { label: "저녁식사", windowStart: "19:00", windowEnd: "21:00", insertTime: "20:00" },
];

function isWithinWindow(time: string, start: string, end: string): boolean {
  return time >= start && time <= end;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * 이 날짜/도착·출발 시간대 조합에서 해당 끼니가 애초에 필요한지 판단.
 * - 도착일(Day 1)은 다낭에 도착하기 전이므로 아침식사는 항상 제외, 저녁 도착이면 점심도 제외
 * - 출발일(마지막 날)은 공항 이동과 겹치므로 저녁식사는 항상 제외, 새벽 출발이면 아침/점심도 제외,
 *   오후 출발이면 점심도 제외
 */
function isSlotRequired(
  slotLabel: MealSlot["label"],
  dayNumber: number,
  totalDays: number,
  arrivalTime: TimeOfDay,
  departureTime: TimeOfDay
): boolean {
  const isFirstDay = dayNumber === 1;
  const isLastDay = dayNumber === totalDays;

  if (isFirstDay) {
    if (slotLabel === "아침식사") return false;
    if (arrivalTime === "evening" && slotLabel === "점심식사") return false;
  }

  if (isLastDay) {
    if (slotLabel === "저녁식사") return false;
    if (departureTime === "morning") return false;
    if (departureTime === "afternoon" && slotLabel === "점심식사") return false;
  }

  return true;
}

function isAirportItem(item: ScheduleItem): boolean {
  return item.name.includes("공항") || item.desc.includes("공항");
}

function isHotelReturnItem(item: ScheduleItem): boolean {
  return item.category === "rest" && (item.name.includes("복귀") || item.name.includes("호텔로"));
}

/** 아직 이 일정에서 쓰이지 않은 로컬 맛집을 우선 선택 (같은 곳이 반복 등장하지 않도록) */
function pickUnusedSpot(usedNames: Set<string>) {
  return danangHiddenSpots.find((spot) => !usedNames.has(spot.name)) ?? danangHiddenSpots[0];
}

/**
 * 하루치 식사 항목을 필요한 3끼(제외되는 슬롯 제외)에 배정한다.
 * 이미 창 안에 있는 항목은 그대로 두고, 창 밖의 "떠돌이" 식사 항목은 가장 가까운
 * 빈 슬롯으로 재배치하며, 배정할 항목이 부족한 슬롯에만 새 항목을 추가한다.
 */
function fillDayMeals(
  items: ScheduleItem[],
  dayNumber: number,
  totalDays: number,
  arrivalTime: TimeOfDay,
  departureTime: TimeOfDay,
  usedNames: Set<string>
): ScheduleItem[] {
  const requiredSlots = MEAL_SLOTS.filter((slot) =>
    isSlotRequired(slot.label, dayNumber, totalDays, arrivalTime, departureTime)
  );

  const claimed = new Set<ScheduleItem>();
  const result = [...items];

  for (const slot of requiredSlots) {
    const alreadyInWindow = result.find(
      (item) => item.category === "eat" && !claimed.has(item) && isWithinWindow(item.time, slot.windowStart, slot.windowEnd)
    );
    if (alreadyInWindow) {
      claimed.add(alreadyInWindow);
      continue;
    }

    // 창 밖이지만 아직 다른 슬롯에 배정되지 않은 식사 항목 중 가장 가까운 것을 재배치
    const orphan = result
      .filter((item) => item.category === "eat" && !claimed.has(item))
      .sort(
        (a, b) =>
          Math.abs(timeToMinutes(a.time) - timeToMinutes(slot.insertTime)) -
          Math.abs(timeToMinutes(b.time) - timeToMinutes(slot.insertTime))
      )[0];

    if (orphan) {
      orphan.time = slot.insertTime;
      claimed.add(orphan);
      continue;
    }

    // 재배치할 항목도 없으면 실제 로컬 맛집 데이터로 새 항목을 추가
    const spot = pickUnusedSpot(usedNames);
    usedNames.add(spot.name);
    const newItem: ScheduleItem = {
      time: slot.insertTime,
      name: spot.name,
      desc: `${spot.location} — 현지인비율 ${spot.localRatio}% 로컬 맛집에서 ${slot.label}, 그랩 이동`,
      category: "eat",
      badge: "식사",
      lat: spot.lat,
      lng: spot.lng,
    };
    result.push(newItem);
    claimed.add(newItem);
  }

  return result;
}

/**
 * 시간순 정렬 후에도 Day 1은 공항 도착 항목이 항상 첫 항목이 되도록, 마지막 날이
 * 아닌 날은 호텔 복귀 항목이 항상 마지막 항목이 되도록, 마지막 날은 공항 이동
 * 항목이 항상 마지막 항목이 되도록 강제한다. 끼니를 끼워 넣거나 재배치하며
 * 앵커 항목의 상대적 순서가 틀어질 수 있어 마지막에 한 번 더 바로잡는다.
 */
function stabilizeAnchors(items: ScheduleItem[], isFirstDay: boolean, isLastDay: boolean): ScheduleItem[] {
  const result = [...items];

  if (isFirstDay) {
    const index = result.findIndex(isAirportItem);
    if (index > 0) {
      const [anchor] = result.splice(index, 1);
      result.unshift(anchor);
    }
  }

  const lastIndexFinder = isLastDay ? isAirportItem : isHotelReturnItem;
  const lastIndex = result.findIndex(lastIndexFinder);
  if (lastIndex !== -1 && lastIndex !== result.length - 1) {
    const [anchor] = result.splice(lastIndex, 1);
    result.push(anchor);
  }

  return result;
}

/**
 * 3끼 규칙 대상 날짜에서 빠진 끼니를 실제 danangHiddenSpots 데이터로 채워 넣고,
 * Day 1/마지막 날의 시작·종료 앵커 순서가 깨지지 않도록 보정한다.
 */
export function ensureDailyMeals(
  days: DaySchedule[],
  arrivalTime: TimeOfDay,
  departureTime: TimeOfDay
): DaySchedule[] {
  const usedNames = new Set(
    days.flatMap((day) => day.items.filter((item) => item.category === "eat").map((item) => item.name))
  );
  const totalDays = days.length;

  return days.map((day) => {
    const isFirstDay = day.day === 1;
    const isLastDay = day.day === totalDays;

    const filled = fillDayMeals(day.items, day.day, totalDays, arrivalTime, departureTime, usedNames);
    filled.sort((a, b) => a.time.localeCompare(b.time));
    const stabilized = stabilizeAnchors(filled, isFirstDay, isLastDay);

    return { ...day, items: stabilized };
  });
}
