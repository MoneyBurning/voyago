import { danangAttractions, danangBars, danangCafes, danangHiddenSpots, danangRestaurants } from "@/data/danang";
import type { DaySchedule, HotelRecommendation, Interest, ScheduleItem, TimeOfDay } from "@/types/travel";

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
 *
 * 도착일(Day 1) — 아침식사는 다낭 도착 전이므로 항상 제외:
 * - morning(~12시 도착): 점심 이후 관광 가능 → 점심/저녁 포함
 * - afternoon(12~18시 도착): 저녁 일정만 → 점심 제외, 저녁만 포함
 * - evening(18시~ 도착): 공항 이동+체크인만 → 점심/저녁 모두 제외
 *
 * 출발일(마지막 날) — 공항 이동과 겹치는 저녁식사는 항상 제외:
 * - morning(~12시 출발): 아침 식사 후 바로 공항 이동 → 점심 제외, 아침만 포함
 * - afternoon(12~18시 출발): 오전 관광 후 점심까지 → 아침/점심 포함
 * - evening(18시~ 출발): 풀 일정 → 아침/점심 포함
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
    if (slotLabel === "점심식사" && arrivalTime !== "morning") return false;
    if (slotLabel === "저녁식사" && arrivalTime === "evening") return false;
  }

  if (isLastDay) {
    if (slotLabel === "저녁식사") return false;
    if (slotLabel === "점심식사" && departureTime === "morning") return false;
  }

  return true;
}

export function isAirportItem(item: ScheduleItem): boolean {
  return item.name.includes("공항") || item.desc.includes("공항");
}

/** 인천국제공항 (departure 도시가 서울이 아니어도, 이 앱의 "공항" 항목이 인천을 지칭하는 경우의 좌표) */
const INCHEON_AIRPORT_COORD = { lat: 37.4602, lng: 126.4407 };
/** 다낭 국제공항 — 이 앱의 "공항" 항목은 대부분 이쪽(도착/출발 모두 다낭에서 일어남) */
const DANANG_AIRPORT_COORD = { lat: 16.0544, lng: 108.2022 };

/**
 * AI가 "공항" 항목의 lat/lng을 부정확하게(또는 임의로) 채워 넣는 경우가 관측되어,
 * 실제 공항 좌표로 결정론적으로 덮어쓴다. desc/name에 "인천"이 언급된 항목만
 * 인천공항 좌표를 쓰고, 그 외 모든 공항 항목(이 앱의 절대다수)은 다낭국제공항
 * 좌표를 쓴다 — 이 앱의 일정은 전부 다낭 현지에서 벌어지는 이동이기 때문이다.
 */
export function applyAirportCoords(days: DaySchedule[]): DaySchedule[] {
  return days.map((day) => ({
    ...day,
    items: day.items.map((item) => {
      if (!isAirportItem(item)) return item;
      const isIncheon = item.name.includes("인천") || item.desc.includes("인천");
      const coord = isIncheon ? INCHEON_AIRPORT_COORD : DANANG_AIRPORT_COORD;
      return { ...item, lat: coord.lat, lng: coord.lng };
    }),
  }));
}

export function isHotelReturnItem(item: ScheduleItem): boolean {
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
export function stabilizeAnchors(items: ScheduleItem[], isFirstDay: boolean, isLastDay: boolean): ScheduleItem[] {
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

/**
 * interests에 "술"/"카페"가 포함되면 그 취향이 시스템 프롬프트 지시만으로는 매일
 * 일관되게 반영되지 않는 것이 관측되어, ensureDailyMeals/enforceRouteRules와 동일한
 * 방식으로 enforceRouteRules 이후(동선/호이안 배정이 확정된 뒤)에 코드에서
 * 결정론적으로 야간 펍·바 일정과 카페 브레이크 일정을 채워 넣는다.
 */

// routing.ts의 호이안 권역 판별 기준과 동일 (동일 파일을 import하면 순환 참조가 생겨 상수만 복제)
const HOI_AN_LAT_MAX = 15.95;
const HOI_AN_LNG_MIN = 108.3;

function isHoiAnCoord(lat: number, lng: number): boolean {
  return lat <= HOI_AN_LAT_MAX && lng >= HOI_AN_LNG_MIN;
}

const NIGHTLIFE_INSERT_TIME = "21:30";

/** 마지막 날(공항 이동과 겹침)과, 저녁 도착이라 일정 자체가 없는 Day 1은 야간 일정에서 제외 */
function isNightlifeDayRequired(dayNumber: number, totalDays: number, arrivalTime: TimeOfDay): boolean {
  const isFirstDay = dayNumber === 1;
  const isLastDay = dayNumber === totalDays;

  if (isLastDay) return false;
  if (isFirstDay && arrivalTime === "evening") return false;

  return true;
}

/**
 * interests에 "술"이 포함되면 매일 저녁 21:00~23:00 사이에 실존 펍/바 일정을 1개 추가한다.
 * 그날의 관광지가 호이안 권역이면 호이안 바를, 아니면 다낭 바를 배정한다.
 */
export function ensureNightlifeStops(
  days: DaySchedule[],
  interests: Interest[],
  arrivalTime: TimeOfDay
): DaySchedule[] {
  if (!interests.includes("술") || danangBars.length === 0) return days;

  const totalDays = days.length;
  const usedNames = new Set(days.flatMap((day) => day.items.map((item) => item.name)));
  const daNangPool = danangBars.filter((bar) => bar.area === "다낭");
  const hoiAnPool = danangBars.filter((bar) => bar.area === "호이안");

  return days.map((day) => {
    if (!isNightlifeDayRequired(day.day, totalDays, arrivalTime)) return day;
    if (day.items.some((item) => danangBars.some((bar) => bar.name === item.name))) return day;

    const isHoiAnDay = day.items.some((item) => item.category === "see" && isHoiAnCoord(item.lat, item.lng));
    const pool = isHoiAnDay && hoiAnPool.length > 0 ? hoiAnPool : daNangPool;
    if (pool.length === 0) return day;

    const bar = pool.find((b) => !usedNames.has(b.name)) ?? pool[0];
    usedNames.add(bar.name);

    const newItem: ScheduleItem = {
      time: NIGHTLIFE_INSERT_TIME,
      name: bar.name,
      desc: `${bar.highlight} · ${bar.priceRange}, 그랩 이동`,
      category: "eat",
      badge: "추천",
      lat: bar.lat,
      lng: bar.lng,
    };

    const merged = [...day.items, newItem].sort((a, b) => a.time.localeCompare(b.time));
    return { ...day, items: stabilizeAnchors(merged, day.day === 1, day.day === totalDays) };
  });
}

/**
 * AI가 생성한 desc는 "다낭의 대표적인 ~" 같은 상투적 문구를 반복하는 경우가 관측되어,
 * 실존 장소 DB(관광지/식당/카페/바)에 이름이 정확히 매칭되는 항목은 desc를 DB의
 * 고유 설명으로 덮어써 균일한 품질을 보장한다. 호텔 이동/공항 이동처럼 실존 장소
 * DB에 없는 move/rest 항목은 매칭되지 않으므로 원래 desc를 그대로 둔다.
 */
function buildDbDescriptionMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const attraction of danangAttractions) {
    map.set(
      attraction.name,
      `${attraction.highlight} (체류 약 ${attraction.stayDuration}분 추천, ${attraction.recommendedTime})`
    );
  }
  for (const restaurant of danangRestaurants) {
    map.set(restaurant.name, `${restaurant.signature} · ${restaurant.priceRange} · 현지인비율 ${restaurant.localRatio}%`);
  }
  for (const cafe of danangCafes) {
    map.set(cafe.name, `${cafe.highlight} · ${cafe.priceRange}`);
  }
  for (const bar of danangBars) {
    map.set(bar.name, `${bar.highlight} · ${bar.priceRange}`);
  }
  return map;
}

/**
 * 실존 장소 DB와 이름이 매칭되는 일정 항목의 desc를 DB 고유 설명으로 교체한다.
 * ensureDailyMeals/ensureCafeBreaks/ensureNightlifeStops가 이후 단계에서 추가하는
 * 항목은 이미 DB 필드 기반의 desc를 직접 구성하므로, 그 항목들과 중복 처리되지
 * 않도록 이 함수는 AI 원본 응답(rawDays)에 대해 가장 먼저 적용한다.
 */
export function applyDbDescriptions(days: DaySchedule[]): DaySchedule[] {
  const descMap = buildDbDescriptionMap();

  return days.map((day) => ({
    ...day,
    items: day.items.map((item) => {
      const dbDesc = descMap.get(item.name);
      if (!dbDesc) return item;
      return { ...item, desc: dbDesc };
    }),
  }));
}

const CAFE_MORNING_TIME = "10:30";
const CAFE_AFTERNOON_TIME = "15:30";
/** 카페 브레이크 삽입 시각 앞뒤 이 범위(분) 안에 이미 다른 일정이 있으면 그 시각은 건너뛴다 */
const CAFE_CONFLICT_WINDOW_MIN = 60;

/** 공항 이동만 있고 일정 자체가 없는 날(저녁 도착 Day 1 / 새벽 출발 마지막 날)은 카페 브레이크도 생략 */
function isCafeDayRequired(
  dayNumber: number,
  totalDays: number,
  arrivalTime: TimeOfDay,
  departureTime: TimeOfDay
): boolean {
  const isFirstDay = dayNumber === 1;
  const isLastDay = dayNumber === totalDays;

  if (isFirstDay && arrivalTime === "evening") return false;
  if (isLastDay && departureTime === "morning") return false;

  return true;
}

function hasTimeConflict(items: ScheduleItem[], time: string): boolean {
  const target = timeToMinutes(time);
  return items.some((item) => Math.abs(timeToMinutes(item.time) - target) < CAFE_CONFLICT_WINDOW_MIN);
}

/**
 * interests에 "카페"가 포함되면 매일 오전 또는 오후에 실존 카페 브레이크 일정을 1개 추가한다.
 * 오후(15:30) 슬롯을 우선 시도하고, 이미 다른 일정과 겹치면 오전(10:30) 슬롯으로 대체하며,
 * 둘 다 겹치는 빡빡한 날은 삽입을 건너뛴다.
 */
export function ensureCafeBreaks(
  days: DaySchedule[],
  interests: Interest[],
  arrivalTime: TimeOfDay,
  departureTime: TimeOfDay
): DaySchedule[] {
  if (!interests.includes("카페") || danangCafes.length === 0) return days;

  const totalDays = days.length;
  const usedNames = new Set(days.flatMap((day) => day.items.map((item) => item.name)));

  return days.map((day) => {
    if (!isCafeDayRequired(day.day, totalDays, arrivalTime, departureTime)) return day;
    if (day.items.some((item) => danangCafes.some((cafe) => cafe.name === item.name))) return day;

    const insertTime = hasTimeConflict(day.items, CAFE_AFTERNOON_TIME) ? CAFE_MORNING_TIME : CAFE_AFTERNOON_TIME;
    if (hasTimeConflict(day.items, insertTime)) return day;

    const cafe = danangCafes.find((c) => !usedNames.has(c.name)) ?? danangCafes[0];
    usedNames.add(cafe.name);

    const newItem: ScheduleItem = {
      time: insertTime,
      name: cafe.name,
      desc: `${cafe.highlight} · ${cafe.priceRange}, 카페 브레이크`,
      category: "eat",
      badge: "추천",
      lat: cafe.lat,
      lng: cafe.lng,
    };

    const merged = [...day.items, newItem].sort((a, b) => a.time.localeCompare(b.time));
    return { ...day, items: stabilizeAnchors(merged, day.day === 1, day.day === totalDays) };
  });
}

/**
 * 실측 결과에서 반복 관측된 일정 버그(앵커 시각 충돌/역순, 이름 오탈자, Day 1
 * 체크인 누락 등)는 ensureDailyMeals/enforceRouteRules/ensureNightlifeStops 등
 * 개별 단계가 각자 최선을 다해도 마지막에 종합적으로 한 번 더 강제하지 않으면
 * 재발한다. 이 함수는 전체 파이프라인의 마지막 단계로, 프롬프트 지시에 기대지
 * 않고 아래 불변식을 100% 코드로 강제한다:
 *
 * - 앵커 위치: 첫 항목(Day 1은 공항 도착 / 그 외는 호텔에서 출발), 마지막 항목
 *   (마지막 날은 공항 이동 / Day 1은 호텔 체크인 / 그 외는 호텔로 복귀)은 항상
 *   그 자리에 고정하고, 나머지 항목은 그 사이에 시간순으로 배치한다.
 * - 비-Day1의 "호텔에서 출발"은 항상 08:00으로 고정한다.
 * - 앵커와 일반 항목, 일반 항목끼리 모두 최소 30분 간격을 강제한다(동시각 금지).
 *   마지막 앵커(호텔 복귀/공항 이동)의 시각이 마지막 일반 항목보다 이르면
 *   그 뒤로 밀어 순서가 항상 시간순과 위치 모두 일치하도록 만든다.
 * - 앵커가 통째로 누락된 경우(Day 1 체크인, 중간 날 호텔 복귀, 마지막 날 공항
 *   이동) 실제 숙소/공항 좌표로 새 항목을 만들어 채운다.
 * - "-vespa 투어"처럼 선행 기호/영문이 섞인 이름을 정리한다.
 */

/** 앵커·일반 항목 사이 최소 간격 (분) — 동일 시각/과밀 배치 금지 */
const MIN_ITEM_GAP_MIN = 30;
/** 비-Day1 날짜의 "호텔에서 출발" 앵커 고정 시각 */
const HOTEL_DEPARTURE_TIME = "08:00";

function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, minutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function isHotelDepartureItem(item: ScheduleItem): boolean {
  return item.category === "move" && (item.name.includes("출발") || item.desc.includes("호텔에서"));
}

function isHotelCheckinItem(item: ScheduleItem): boolean {
  return item.name.includes("체크인") || item.desc.includes("체크인");
}

/** 알려진 영문/기호 섞임 오류를 정리 (예: "-vespa 투어" → "베스파 투어") */
const NAME_TRANSLITERATION_FIXES: [RegExp, string][] = [[/vespa/gi, "베스파"]];

function sanitizeItemName(name: string): string {
  let cleaned = name.replace(/^[\s\-•·*]+/, "").trim();
  for (const [pattern, replacement] of NAME_TRANSLITERATION_FIXES) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  return cleaned;
}

type AnchorSeed = Pick<HotelRecommendation, "name" | "lat" | "lng">;

/** 파이프라인 마지막 단계 — 위 docblock의 불변식을 하루치 items에 적용한다. */
function normalizeDaySchedule(
  rawItems: ScheduleItem[],
  isFirstDay: boolean,
  isLastDay: boolean,
  hotel: AnchorSeed
): ScheduleItem[] {
  const items = rawItems.map((item) => ({ ...item, name: sanitizeItemName(item.name) }));

  const frontFinder = isFirstDay ? isAirportItem : isHotelDepartureItem;
  const backFinder = isLastDay ? isAirportItem : isFirstDay ? isHotelCheckinItem : isHotelReturnItem;

  const frontAnchor = items.find(frontFinder) ?? null;
  let backAnchor = items.find((item) => item !== frontAnchor && backFinder(item)) ?? null;

  if (!isFirstDay && frontAnchor) {
    frontAnchor.time = HOTEL_DEPARTURE_TIME;
  }

  const middleItems = items.filter((item) => item !== frontAnchor && item !== backAnchor);
  middleItems.sort((a, b) => a.time.localeCompare(b.time));

  let cursor = frontAnchor ? timeToMinutes(frontAnchor.time) + MIN_ITEM_GAP_MIN : -Infinity;
  for (const item of middleItems) {
    if (cursor !== -Infinity && timeToMinutes(item.time) < cursor) {
      item.time = minutesToTime(cursor);
    }
    cursor = timeToMinutes(item.time) + MIN_ITEM_GAP_MIN;
  }

  if (backAnchor) {
    if (cursor !== -Infinity && timeToMinutes(backAnchor.time) < cursor) {
      backAnchor.time = minutesToTime(cursor);
    }
  } else {
    const fallbackMinutes = cursor === -Infinity ? timeToMinutes(isLastDay ? "11:00" : "20:00") : cursor;
    if (isFirstDay && !isLastDay) {
      backAnchor = {
        time: minutesToTime(fallbackMinutes),
        name: "호텔 체크인",
        desc: `${hotel.name} 체크인, 프론트에서 여권 제시 후 객실 배정`,
        category: "rest",
        badge: "휴식",
        lat: hotel.lat,
        lng: hotel.lng,
      };
    } else if (isLastDay) {
      backAnchor = {
        time: minutesToTime(fallbackMinutes),
        name: "다낭국제공항으로 이동",
        desc: "호텔에서 그랩으로 공항 이동, 출국 수속",
        category: "move",
        badge: "이동",
        lat: DANANG_AIRPORT_COORD.lat,
        lng: DANANG_AIRPORT_COORD.lng,
      };
    } else {
      backAnchor = {
        time: minutesToTime(fallbackMinutes),
        name: "호텔로 복귀",
        desc: `${hotel.name}로 이동, 하루 일정 마무리`,
        category: "rest",
        badge: "휴식",
        lat: hotel.lat,
        lng: hotel.lng,
      };
    }
  }

  return [...(frontAnchor ? [frontAnchor] : []), ...middleItems, backAnchor];
}

/**
 * enforceScheduleInvariants — 전체 파이프라인의 마지막 단계로 호출한다. 프롬프트나
 * 이전 단계가 무엇을 했든 상관없이, 매 요청마다 시간 정렬/간격/앵커 위치/누락
 * 앵커/이름 오탈자를 100% 결정론적으로 재보정한다.
 */
export function enforceScheduleInvariants(days: DaySchedule[], hotel: AnchorSeed): DaySchedule[] {
  const totalDays = days.length;
  return days.map((day) => ({
    ...day,
    items: normalizeDaySchedule(day.items, day.day === 1, day.day === totalDays, hotel),
  }));
}
