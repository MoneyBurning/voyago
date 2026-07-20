import { danangAttractions, danangRestaurants } from "@/data/danang";
import { stabilizeAnchors } from "@/lib/itinerary";
import type { DaySchedule, HotelStyle, ScheduleItem } from "@/types/travel";

/**
 * 시스템 프롬프트에 동선 규칙(호이안 전일 배정 / 숙소 스타일별 동선 / 이동거리 최적화)을
 * 넣어봤지만, 실제 호출에서 반복적으로 지켜지지 않는 것이 실측으로 확인됐다
 * (예: 호이안 관광지가 이틀에 걸쳐 쪼개짐, 바나힐과 정반대 방향 관광지가 같은 날에 묶임).
 * ensureDailyMeals와 같은 이유로, 재시도 대신 코드에서 결정론적으로 후보정한다.
 */

// 호이안 권역(고대마을/안방비치/투본강 등)은 다낭 시내보다 남쪽·동쪽 먼 곳에 몰려 있어
// 위도/경도 경계값으로 안정적으로 구분된다 (danang.ts의 실제 좌표 분포 기준).
const HOI_AN_LAT_MAX = 15.95;
const HOI_AN_LNG_MIN = 108.3;

function isHoiAnCoord(lat: number, lng: number): boolean {
  return lat <= HOI_AN_LAT_MAX && lng >= HOI_AN_LNG_MIN;
}

function isHoiAnSeeItem(item: ScheduleItem): boolean {
  return item.category === "see" && isHoiAnCoord(item.lat, item.lng);
}

function isBaNaHillsItem(item: ScheduleItem): boolean {
  return item.name.includes("바나힐");
}

function isBeachWalkItem(item: ScheduleItem): boolean {
  return item.name.includes("미케") || item.name.includes("논느억");
}

const MY_KHE_BEACH = danangAttractions.find((a) => a.nameEn === "My Khe Beach");

const HOI_AN_RESTAURANTS = danangRestaurants.filter((r) => isHoiAnCoord(r.lat, r.lng));

/** days[dayIdx]에서 predicate에 맞는 항목을 떼어내 반환 (원본은 그 항목들이 빠진 상태로 남음) */
function extractItems(days: DaySchedule[], dayIdx: number, predicate: (item: ScheduleItem) => boolean): ScheduleItem[] {
  const day = days[dayIdx];
  const extracted: ScheduleItem[] = [];
  const kept: ScheduleItem[] = [];
  for (const item of day.items) {
    if (predicate(item)) extracted.push(item);
    else kept.push(item);
  }
  day.items = kept;
  return extracted;
}

function appendItems(days: DaySchedule[], dayIdx: number, items: ScheduleItem[]): void {
  if (items.length === 0) return;
  days[dayIdx].items = [...days[dayIdx].items, ...items];
}

function countSee(days: DaySchedule[], dayIdx: number, predicate: (item: ScheduleItem) => boolean = () => true): number {
  return days[dayIdx].items.filter((i) => i.category === "see" && predicate(i)).length;
}

/**
 * 규칙 1 + 규칙 2(hoian) — 호이안 관광지를 하루로 몰아 배정한다.
 * hotelStyle이 "hoian"이면 Day 2 또는 Day 3 중 이미 호이안 항목이 있는 날을 우선 타겟으로 삼고,
 * 없으면 Day 2를 타겟으로 한다. 그 외 스타일은 이미 호이안 항목이 가장 많은 날을 타겟으로 한다.
 * 반환값은 최종적으로 호이안 항목을 모두 갖게 된 날의 인덱스 (없으면 -1).
 */
function consolidateHoiAn(days: DaySchedule[], hotelStyle: HotelStyle, baNaDayIdx: number): number {
  const counts = days.map((_, idx) => countSee(days, idx, (i) => isHoiAnCoord(i.lat, i.lng)));
  const totalMatches = counts.reduce((a, b) => a + b, 0);
  if (totalMatches === 0) return -1;

  let targetIdx = -1;
  if (hotelStyle === "hoian") {
    const preferred = [2, 3]
      .map((dayNum) => days.findIndex((d) => d.day === dayNum))
      .filter((idx) => idx !== -1);
    targetIdx = preferred.find((idx) => counts[idx] > 0) ?? preferred[0] ?? -1;
  }
  if (targetIdx === -1) {
    targetIdx = counts.indexOf(Math.max(...counts));
  }

  const moved: ScheduleItem[] = [];
  days.forEach((_, idx) => {
    if (idx === targetIdx) return;
    moved.push(...extractItems(days, idx, isHoiAnSeeItem));
  });
  appendItems(days, targetIdx, moved);

  // 타겟 날에 원래 섞여 있던 "다낭 시내" see 항목은 그대로 두면 순수 호이안 날이 되지
  // 않는다 — 떼어내서 다른(바나힐 날이 아닌) 날에 임시로 옮겨두면, 이후 단계인
  // bundleDaNangDowntown이 다낭 시내 항목들을 정식으로 하루에 재배치한다.
  const strayDowntown = extractItems(days, targetIdx, (i) => i.category === "see" && !isHoiAnCoord(i.lat, i.lng) && !isBaNaHillsItem(i));
  if (strayDowntown.length > 0) {
    const fallbackIdx = days.map((_, i) => i).find((i) => i !== targetIdx && i !== baNaDayIdx) ?? (targetIdx === 0 ? 1 : 0);
    appendItems(days, fallbackIdx, strayDowntown);
  }

  return targetIdx;
}

/**
 * hotelStyle이 "hoian"일 때, 호이안으로 넘어간 날에 다낭 시내 식당으로 저녁이 빠지는 것을
 * 막는다 — 그날의 "eat" 항목 중 호이안 권역이 아닌 것을 호이안 실존 식당으로 교체한다.
 */
function fixHoiAnDayMeals(days: DaySchedule[], hoiAnDayIdx: number): void {
  if (hoiAnDayIdx === -1 || HOI_AN_RESTAURANTS.length === 0) return;
  const day = days[hoiAnDayIdx];
  const usedNames = new Set(day.items.filter((i) => i.category === "eat").map((i) => i.name));

  let cursor = 0;
  day.items = day.items.map((item) => {
    if (item.category !== "eat" || isHoiAnCoord(item.lat, item.lng)) return item;

    let attempts = 0;
    while (usedNames.has(HOI_AN_RESTAURANTS[cursor % HOI_AN_RESTAURANTS.length].name) && attempts < HOI_AN_RESTAURANTS.length) {
      cursor++;
      attempts++;
    }
    const replacement = HOI_AN_RESTAURANTS[cursor % HOI_AN_RESTAURANTS.length];
    usedNames.add(replacement.name);
    cursor++;

    return {
      ...item,
      name: replacement.name,
      desc: `${replacement.signature} · ${replacement.priceRange} (호이안 숙박 동선상 호이안에서 마무리)`,
      lat: replacement.lat,
      lng: replacement.lng,
    };
  });
}

/**
 * 규칙 2(beach) / 규칙 3 — 바나힐은 하루 종일 걸리는 원거리 산행이라 다른 관광지와 묶으면
 * 동선이 크게 어긋난다. hotelStyle과 무관하게 항상 단독 배정으로 분리한다.
 * 반환값은 바나힐이 배정된 날의 인덱스 (없으면 -1).
 */
function isolateBaNaHills(days: DaySchedule[]): number {
  const idx = days.findIndex((d) => d.items.some(isBaNaHillsItem));
  if (idx === -1) return -1;

  const others = extractItems(days, idx, (i) => i.category === "see" && !isBaNaHillsItem(i));
  if (others.length === 0) return idx;

  const candidates = days.map((_, i) => i).filter((i) => i !== idx);
  if (candidates.length === 0) {
    // 옮길 다른 날이 없으면(초단기 일정) 그대로 되돌린다
    appendItems(days, idx, others);
    return idx;
  }
  candidates.sort((a, b) => countSee(days, a) - countSee(days, b));
  appendItems(days, candidates[0], others);
  return idx;
}

/**
 * 규칙 2(hoian) — 다낭 시내 관광지를 하루로 묶는다. 호이안 날/바나힐 날은 이미 각각의
 * 규칙으로 정리됐으므로 대상에서 제외하고, 나머지 날 중 다낭 시내 항목이 가장 많은 날을
 * 타겟으로 남은 날들의 다낭 시내 항목을 모두 옮긴다.
 */
function bundleDaNangDowntown(days: DaySchedule[], excludeIdxs: number[]): void {
  // "see"(관광지) 항목만 대상으로 한다 — eat/move/rest까지 걸리면 식사·앵커가
  // 엉뚱한 날로 흩어지는 버그가 생긴다.
  const isDowntownSee = (item: ScheduleItem) =>
    item.category === "see" && !isHoiAnCoord(item.lat, item.lng) && !isBaNaHillsItem(item);
  const eligible = days.map((_, idx) => idx).filter((idx) => !excludeIdxs.includes(idx));
  if (eligible.length <= 1) return;

  const counts = eligible.map((idx) => countSee(days, idx, isDowntownSee));
  const totalMatches = counts.reduce((a, b) => a + b, 0);
  if (totalMatches === 0) return;
  const daysWithMatches = counts.filter((c) => c > 0).length;
  if (daysWithMatches <= 1) return;

  const targetIdx = eligible[counts.indexOf(Math.max(...counts))];
  const moved: ScheduleItem[] = [];
  eligible.forEach((idx) => {
    if (idx === targetIdx) return;
    moved.push(...extractItems(days, idx, isDowntownSee));
  });
  appendItems(days, targetIdx, moved);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, minutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * 규칙 2(beach) — 매일 아침 일정에 미케/논느억비치 도보 방문을 포함한다.
 * 첫날·마지막날과 바나힐 전용일, 이미 호이안으로 이동한 날은 제외한다.
 */
function ensureDailyBeachWalk(days: DaySchedule[], excludeIdxs: number[]): void {
  if (!MY_KHE_BEACH) return;
  const totalDays = days.length;

  days.forEach((day, idx) => {
    if (idx === 0 || day.day === totalDays) return; // 도착일/출발일은 일정이 빡빡해 제외
    if (excludeIdxs.includes(idx)) return;
    if (day.items.some(isBeachWalkItem)) return;

    // "호텔에서 출발" 항목(move)보다 항상 뒤에 오도록 시간을 잡는다 — 그래야
    // 정렬 후에도 "첫 항목은 호텔에서 출발" 규칙이 깨지지 않는다.
    const hotelStart = day.items.find((i) => i.category === "move");
    const walkTime = hotelStart ? minutesToTime(timeToMinutes(hotelStart.time) + 15) : "07:30";

    const walkItem: ScheduleItem = {
      time: walkTime,
      name: MY_KHE_BEACH.name,
      desc: "숙소에서 도보 이동, 아침 해변 산책",
      category: "see",
      badge: "관광",
      lat: MY_KHE_BEACH.lat,
      lng: MY_KHE_BEACH.lng,
    };
    day.items = [...day.items, walkItem];
  });
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function avgPairwiseDistance(items: ScheduleItem[]): number {
  if (items.length < 2) return 0;
  let sum = 0;
  let pairs = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      sum += haversineKm(items[i], items[j]);
      pairs++;
    }
  }
  return sum / pairs;
}

/**
 * 규칙 3 — 나머지 일반 다낭 시내 관광지들 사이에서, 같은 날에 지나치게 멀리 떨어진
 * 두 곳이 묶여 있으면 다른 날의 항목과 맞바꿔 두 날의 평균 이동거리를 함께 줄인다.
 * 호이안/바나힐은 이미 별도 규칙으로 처리했으므로 이 최적화 대상에서 제외한다.
 * 완전탐색 TSP가 아닌, 개선되는 경우에만 적용하는 국소 스왑을 최대 2패스 수행한다.
 */
function optimizeDailyAdjacency(days: DaySchedule[], specialIdxs: number[]): void {
  // 호이안/바나힐/해변 산책 항목은 각각의 전용 규칙으로 이미 배치가 끝났으므로
  // 여기서 다시 다른 날로 스왑되면(특히 해변 산책 항목이 이미 배치된 날로 중복 유입되면)
  // 앞선 규칙의 결과가 깨진다 — 일반 스왑 대상에서 제외한다.
  const isGeneric = (item: ScheduleItem) =>
    item.category === "see" && !isHoiAnCoord(item.lat, item.lng) && !isBaNaHillsItem(item) && !isBeachWalkItem(item);
  const eligibleIdxs = days.map((_, idx) => idx).filter((idx) => !specialIdxs.includes(idx));
  if (eligibleIdxs.length < 2) return;

  const IMPROVEMENT_THRESHOLD_KM = 2;

  for (let pass = 0; pass < 2; pass++) {
    let improved = false;

    for (let a = 0; a < eligibleIdxs.length; a++) {
      for (let b = a + 1; b < eligibleIdxs.length; b++) {
        const dayAIdx = eligibleIdxs[a];
        const dayBIdx = eligibleIdxs[b];
        const itemsA = days[dayAIdx].items.filter(isGeneric);
        const itemsB = days[dayBIdx].items.filter(isGeneric);
        if (itemsA.length === 0 || itemsB.length === 0) continue;

        const baseScore = avgPairwiseDistance(itemsA) + avgPairwiseDistance(itemsB);

        let bestSwap: { i: number; j: number; gain: number } | null = null;
        for (let i = 0; i < itemsA.length; i++) {
          for (let j = 0; j < itemsB.length; j++) {
            const trialA = itemsA.map((it, k) => (k === i ? itemsB[j] : it));
            const trialB = itemsB.map((it, k) => (k === j ? itemsA[i] : it));
            const trialScore = avgPairwiseDistance(trialA) + avgPairwiseDistance(trialB);
            const gain = baseScore - trialScore;
            if (gain > IMPROVEMENT_THRESHOLD_KM && (!bestSwap || gain > bestSwap.gain)) {
              bestSwap = { i, j, gain };
            }
          }
        }

        if (bestSwap) {
          const itemA = itemsA[bestSwap.i];
          const itemB = itemsB[bestSwap.j];
          days[dayAIdx].items = days[dayAIdx].items.map((it) => (it === itemA ? itemB : it));
          days[dayBIdx].items = days[dayBIdx].items.map((it) => (it === itemB ? itemA : it));
          improved = true;
        }
      }
    }

    if (!improved) break;
  }
}

/** 하루 항목을 시간순 정렬 후, 앵커(호텔 출발/복귀, 공항) 위치를 다시 고정한다. */
function resortAndStabilize(days: DaySchedule[]): DaySchedule[] {
  const totalDays = days.length;
  return days.map((day) => {
    const sorted = [...day.items].sort((a, b) => a.time.localeCompare(b.time));
    const isFirstDay = day.day === 1;
    const isLastDay = day.day === totalDays;
    return { ...day, items: stabilizeAnchors(sorted, isFirstDay, isLastDay) };
  });
}

/**
 * groq.ts의 SYSTEM_PROMPT에 넣은 동선 규칙 3가지가 모델 호출마다 실제로 지켜지지는
 * 않는 것이 실측으로 확인되어, ensureDailyMeals와 동일한 방식으로 응답을 받은 뒤
 * 코드에서 결정론적으로 후보정한다. 앵커(호텔 출발/복귀, 공항) 자체는 옮기지 않고
 * "see"/"eat" 카테고리 항목만 재배치한다.
 */
export function enforceRouteRules(rawDays: DaySchedule[], hotelStyle: HotelStyle): DaySchedule[] {
  const days = rawDays.map((day) => ({ ...day, items: day.items.map((item) => ({ ...item })) }));

  // 규칙 2(beach)/규칙 3 — 바나힐 단독 배정은 숙소 스타일과 무관하게 항상 적용한다
  // (바나힐은 왕복 이동만 반나절 가까이 걸리는 원거리 산행이라 다른 곳과 묶으면
  // 동선이 어긋난다는 사실 자체는 숙소 위치와 무관하다).
  const baNaDayIdx = isolateBaNaHills(days);

  // 규칙 1 — 호이안 관광지를 하루로 몰아 배정 (규칙 2의 hoian Day2~3 선호도 포함)
  const hoiAnDayIdx = consolidateHoiAn(days, hotelStyle, baNaDayIdx);

  // 규칙 1 — 호이안 날에는 다낭 시내로 돌아가는 식사를 넣지 않는다 (hoian 숙소 한정)
  if (hotelStyle === "hoian") {
    fixHoiAnDayMeals(days, hoiAnDayIdx);
  }

  const specialIdxs = [hoiAnDayIdx, baNaDayIdx].filter((idx) => idx !== -1);

  // 규칙 2(hoian) — 다낭 시내 관광지를 하루로 묶는다
  if (hotelStyle === "hoian") {
    bundleDaNangDowntown(days, specialIdxs);
  }

  // 규칙 2(beach) — 매일 아침 해변 산책 포함
  if (hotelStyle === "beach") {
    ensureDailyBeachWalk(days, specialIdxs);
  }

  // 규칙 3 — 남은 일반 관광지들 사이의 이동 거리 최적화
  optimizeDailyAdjacency(days, specialIdxs);

  return resortAndStabilize(days);
}
