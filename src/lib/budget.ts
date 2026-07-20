import { danangHotels, type HotelOption } from "@/data/danang";
import type {
  AlcoholBudgetItem,
  BudgetCalculation,
  BudgetStatus,
  EmergencyBudgetItem,
  EntranceBudgetItem,
  FlightBudgetItem,
  FoodBudgetItem,
  HotelBudgetItem,
  HotelRecommendation,
  HotelStyle,
  TransportBudgetItem,
  TravelBudget,
  TravelDuration,
} from "@/types/travel";

/**
 * 예산 계산 원칙: AI는 장소(호텔/맛집/일정)만 선택하고, 실제 금액은 전부 이 파일이
 * 결정론적으로 계산한다. Groq에게 budget 숫자를 만들게 하지 않는다.
 *
 * duration/budget/people/hotelStyle을 앱 전용 union 타입이 아닌 string으로 받는 이유는
 * 이 계산기가 향후 다른 도시/입력 형식에도 재사용 가능한 독립적인 유틸이 되도록 하기
 * 위함이다. 다만 내부적으로 danangHotels DB를 조회할 때는 앱이 실제로 사용하는 값
 * (TravelBudget/TravelDuration/HotelStyle 네이티브 포맷)이 들어온다고 가정한다.
 */

function manwon(won: number): number {
  return Math.round(won / 10000);
}

// ---------- 기간 파싱 ----------

/** "N박M일" 형식에서 박(N)을 추출 */
export function getNights(duration: string): number {
  const match = duration.match(/(\d+)박/);
  return match ? Number(match[1]) : 1;
}

/** "N박M일" 형식에서 일(M)을 추출. 일 표기가 없으면 박+1로 추정 */
export function getDays(duration: string): number {
  const match = duration.match(/(\d+)일/);
  if (match) return Number(match[1]);
  return getNights(duration) + 1;
}

// ---------- 인원수 파싱 ----------

/** '혼자'|'커플'|'친구2명'|'친구3명'|'친구4명'|'가족'|'부모님' 및 기존 '친구2~4명' 형식을 모두 처리 */
function getPeopleCount(people: string): number {
  if (people.includes("혼자")) return 1;
  if (people.includes("커플")) return 2;
  if (people.includes("가족")) return 3;
  if (people.includes("부모님")) return 3;
  if (people.includes("2명")) return 2;
  if (people.includes("3명")) return 3;
  if (people.includes("4명")) return 4;
  if (people.includes("친구")) return 3; // "친구2~4명" 같은 범위형 표기는 중간값으로 추정
  return 1;
}

// ---------- 예산 구간 파싱 ----------

/** "50" / "50만원" / "200+" / "200만원+" 등을 모두 만원 숫자로 환산 */
function parseBudgetManwon(budget: string): number {
  const digits = budget.match(/(\d+)/);
  const base = digits ? Number(digits[1]) : 100;
  return budget.includes("+") ? base + 50 : base;
}

// ---------- 호텔 ----------

/**
 * 숙소 스타일별 1박 요금 (원, 2026년 아고다/부킹닷컴 기준 flat rate).
 * danangHotels DB의 개별 호텔 pricePerNight는 가격 계산에 쓰지 않고,
 * 이름/위치/평점/예약링크 등 "정체성" 정보를 고를 때만 사용한다 —
 * HotelCard와 BudgetGrid가 항상 같은 금액을 보여주도록 가격은 이 표로 통일한다.
 */
const HOTEL_NIGHTLY_RATE_WON: Record<HotelStyle, number> = {
  budget: 25000,
  city: 80000,
  hoian: 120000,
  beach: 140000,
  poolvilla: 280000,
};

/**
 * 예산·숙소 스타일에 맞는 호텔을 DB에서 결정론적으로 선택.
 * 해당 예산 구간에 맞는 호텔이 없으면 같은 스타일 중 최저가로 대체.
 */
function selectHotelOption(hotelStyle: HotelStyle, budget: TravelBudget): HotelOption {
  const candidates = danangHotels.filter((hotel) => hotel.style === hotelStyle);
  const exactMatch = candidates.find((hotel) => hotel.budgetTiers.includes(budget));
  if (exactMatch) return exactMatch;
  return candidates.reduce((cheapest, hotel) =>
    hotel.pricePerNight < cheapest.pricePerNight ? hotel : cheapest
  );
}

/**
 * 해당 예산 구간에 이 숙소 스타일의 실제 호텔이 있는지 확인 (fallback 제외, 정확히 매칭되는 경우만 true).
 * SearchCard에서 예산과 맞지 않는 숙소 스타일을 미리 막는 데 사용 — 총 숙박비가
 * 전체 예산을 초과하는 조합(예: 풀빌라 + 50만원)이 아예 선택되지 않도록 한다.
 */
export function isHotelStyleAvailable(hotelStyle: HotelStyle, budget: TravelBudget): boolean {
  return danangHotels.some((hotel) => hotel.style === hotelStyle && hotel.budgetTiers.includes(budget));
}

/**
 * 예산·숙소 스타일·기간을 바탕으로 확정 숙소(총 숙박비 포함)를 계산.
 * 이름/위치/평점/예약링크는 danangHotels DB에서 고르되, 1박 가격은 DB의
 * pricePerNight를 무시하고 HOTEL_NIGHTLY_RATE_WON(스타일별 flat rate)만 사용한다.
 */
export function resolveHotel(
  hotelStyle: HotelStyle,
  budget: TravelBudget,
  duration: TravelDuration
): HotelRecommendation {
  const option = selectHotelOption(hotelStyle, budget);
  const nights = getNights(duration);
  const pricePerNight = manwon(HOTEL_NIGHTLY_RATE_WON[hotelStyle]);
  return {
    name: option.name,
    nameEn: option.nameEn,
    style: option.style,
    pricePerNight,
    totalCost: pricePerNight * nights,
    location: option.location,
    features: option.features,
    lat: option.lat,
    lng: option.lng,
    rating: option.rating,
    bookingUrl: option.bookingUrl,
  };
}

function calculateHotelItem(hotel: HotelRecommendation, nights: number): HotelBudgetItem {
  return {
    total: hotel.totalCost,
    perNight: hotel.pricePerNight,
    nights,
    note: `${hotel.name} ${nights}박 기준 (2026년 아고다)`,
  };
}

// ---------- 항공권 (인천↔다낭 왕복, 이코노미, 2026년 기준) ----------

type FlightSeason = "peak" | "shoulder" | "off";

const PEAK_MONTHS = [1, 7, 8];
const SHOULDER_MONTHS = [5, 6, 9, 10];

const FLIGHT_PRICE_WON: Record<FlightSeason, number> = {
  peak: 450000,
  shoulder: 330000,
  off: 250000,
};

const FLIGHT_SEASON_LABEL: Record<FlightSeason, string> = {
  peak: "성수기",
  shoulder: "준성수기",
  off: "비수기",
};

function getFlightSeason(travelMonth: number): FlightSeason {
  if (PEAK_MONTHS.includes(travelMonth)) return "peak";
  if (SHOULDER_MONTHS.includes(travelMonth)) return "shoulder";
  return "off";
}

function calculateFlightItem(travelMonth: number, headcount: number): FlightBudgetItem {
  const season = getFlightSeason(travelMonth);
  const perPersonWon = FLIGHT_PRICE_WON[season];
  return {
    total: manwon(perPersonWon * headcount),
    perPerson: manwon(perPersonWon),
    note: `인천↔다낭 왕복 이코노미 ${FLIGHT_SEASON_LABEL[season]} 기준 (2026년 스카이스캐너)`,
  };
}

// ---------- 식비 (2026년 트립스토어/현지 기준) ----------

interface MealPrice {
  min: number;
  avg: number;
  max: number;
}

/** 식사 타입별 1인 1끼 가격 (원) */
const MEAL_PRICES: Record<"local" | "tourist" | "seafood", MealPrice> = {
  local: { min: 3000, avg: 8000, max: 15000 }, // 로컬 맛집 (쌀국수/분짜/반쎄오)
  tourist: { min: 10000, avg: 13000, max: 20000 }, // 관광지 식당 (에어컨 레스토랑)
  seafood: { min: 25000, avg: 40000, max: 60000 }, // 해산물 식당 (미케비치)
};

/** 카페/음료 1잔 평균 가격 (원, 코코넛커피 기준) */
const CAFE_PRICE_WON = 3500;

interface MealMix {
  local: number;
  tourist: number;
  seafood: number;
}

/** interests 기반 식사 타입 믹스 — 먹방 > 힐링 > 기본 순으로 우선 적용 */
function getMealMix(interests: string[]): MealMix {
  if (interests.includes("먹방")) return { local: 0.4, tourist: 0.4, seafood: 0.2 };
  if (interests.includes("힐링")) return { local: 0.6, tourist: 0.4, seafood: 0 };
  return { local: 0.5, tourist: 0.5, seafood: 0 };
}

/** 믹스 비율대로 하루 3끼 + 카페 1잔을 배분했을 때 1인 1일 식비 (원) */
function dailyFoodPerPersonWon(mix: MealMix, priceKey: keyof MealPrice): number {
  const perMealAvg =
    mix.local * MEAL_PRICES.local[priceKey] +
    mix.tourist * MEAL_PRICES.tourist[priceKey] +
    mix.seafood * MEAL_PRICES.seafood[priceKey];
  return perMealAvg * 3 + CAFE_PRICE_WON;
}

function calculateFoodItem(interests: string[], days: number, headcount: number): FoodBudgetItem {
  const mix = getMealMix(interests);

  const avgPerPersonPerDayWon = dailyFoodPerPersonWon(mix, "avg");
  const minWon = dailyFoodPerPersonWon(mix, "min") * days * headcount;
  const maxWon = dailyFoodPerPersonWon(mix, "max") * days * headcount;
  const totalWon = avgPerPersonPerDayWon * days * headcount;

  return {
    total: manwon(totalWon),
    perDay: manwon(avgPerPersonPerDayWon * headcount), // 전체 인원 1일치
    perPerson: manwon(avgPerPersonPerDayWon * days), // 1인 전체 기간
    min: manwon(minWon),
    max: manwon(maxWon),
    note: "로컬 평균 8,000원 / 관광지 평균 13,000원 기준 (2026년 트립스토어)",
  };
}

// ---------- 교통비 (그랩, 2026년 구간별 실제 요금) ----------

/** 숙소 스타일별 공항 왕복 요금 (원, 인원 분담 계수 적용 전) */
const AIRPORT_ROUNDTRIP_WON: Record<HotelStyle, number> = {
  beach: 10000,
  city: 8000,
  hoian: 100000, // 공항왕복 50,000 + 다낭↔호이안 왕복 50,000
  budget: 8000, // city와 동일
  poolvilla: 10000, // beach와 동일
};

/** 숙소 스타일별 1일 시내 이동 요금 (원, 인원 분담 계수 적용 전) */
const DAILY_LOCAL_WON: Record<HotelStyle, number> = {
  beach: 6000,
  city: 5000,
  hoian: 4000,
  budget: 5000,
  poolvilla: 6000,
};

/** 바나힐 방문 시 편도 추가 요금 (원). 그랩보다 프라이빗카 권장 구간 */
const BANA_HILLS_ADDON_WON = 18000;

/** 그랩 합승 기준 인원 분담 계수 (3인부터는 그랩X 필요, 4인 이상은 차량 2대) */
function getGrabShareFactor(headcount: number): number {
  if (headcount <= 2) return 1.0;
  if (headcount === 3) return 1.5;
  return 2.0;
}

function calculateTransportItem(
  hotelStyle: HotelStyle,
  days: number,
  headcount: number,
  hasBanaHills: boolean
): TransportBudgetItem {
  let baseWon = AIRPORT_ROUNDTRIP_WON[hotelStyle] + DAILY_LOCAL_WON[hotelStyle] * days;
  if (hasBanaHills) baseWon += BANA_HILLS_ADDON_WON;

  const totalWon = baseWon * getGrabShareFactor(headcount);

  return {
    total: manwon(totalWon),
    perPerson: manwon(totalWon / headcount),
    note: hasBanaHills
      ? "그랩 기준, 바나힐 프라이빗카 추가 (2026년 DanangPick/트립스토어)"
      : "그랩 기준 (2026년 DanangPick/트립스토어)",
    tip: "카카오T 앱으로 그랩(Grab) 호출 가능 — 한국 카드 등록 후 현지에서 바로 이용",
  };
}

// ---------- 음주비 ----------

const ALCOHOL_PER_PERSON_PER_DAY_WON = 25000;

function calculateAlcoholItem(interests: string[], days: number, headcount: number): AlcoholBudgetItem {
  const included = interests.includes("술") || interests.includes("펍");
  if (!included) {
    return { total: 0, included: false, note: "선택한 관심사에 음주가 포함되지 않음" };
  }
  const totalWon = ALCOHOL_PER_PERSON_PER_DAY_WON * headcount * days;
  return {
    total: manwon(totalWon),
    included: true,
    note: "비어호이(2,500원)+333맥주(3,500원)+펍 칵테일(12,000원) 등 1인 1일 평균 기준",
  };
}

// ---------- 입장료 ----------

interface EntranceFee {
  label: string;
  perPersonWon: number;
  applies: (interests: string[], hotelStyle: string) => boolean;
}

const ENTRANCE_FEES: EntranceFee[] = [
  {
    label: "바나힐",
    perPersonWon: 105000,
    applies: (interests) => interests.includes("바나힐"),
  },
  {
    label: "호이안 올드타운 야간권",
    perPersonWon: 6000,
    applies: (interests, hotelStyle) => hotelStyle === "hoian" || interests.includes("호이안"),
  },
  {
    label: "참파박물관",
    perPersonWon: 4000,
    applies: (interests) => interests.includes("역사"),
  },
  {
    label: "마블마운틴",
    perPersonWon: 2500,
    applies: (interests) => interests.includes("역사") || interests.includes("사진"),
  },
];

function calculateEntranceItem(interests: string[], hotelStyle: string, headcount: number): EntranceBudgetItem {
  const applied = ENTRANCE_FEES.filter((fee) => fee.applies(interests, hotelStyle));
  const totalWon = applied.reduce((sum, fee) => sum + fee.perPersonWon, 0) * headcount;

  return {
    total: manwon(totalWon),
    items: applied.map((fee) => fee.label),
    note:
      applied.length > 0
        ? `${applied.map((fee) => fee.label).join(", ")} 입장료 포함 (2026년 현지 기준)`
        : "선택한 관심사에 해당하는 입장료 없음",
  };
}

// ---------- 비상금 ----------

function calculateEmergencyItem(subtotalManwon: number): EmergencyBudgetItem {
  return { total: Math.round(subtotalManwon * 0.1), rate: "10%" };
}

// ---------- 전체 계산 ----------

export interface CalculateBudgetInput {
  departure: string;
  people: string;
  duration: string;
  budget: string;
  interests: string[];
  hotelStyle: string;
  /** 1~12 */
  travelMonth: number;
}

/**
 * 예산을 100% 결정론적으로 계산한다. AI(Groq)는 이 계산에 관여하지 않으며,
 * 장소(호텔/맛집/일정)만 선택한다.
 */
export function calculateBudget(input: CalculateBudgetInput): BudgetCalculation {
  const headcount = getPeopleCount(input.people);
  const nights = getNights(input.duration);
  const days = getDays(input.duration);
  const hasBanaHills = input.interests.includes("바나힐");

  // 숙소는 실제 예약 가능한 호텔(danangHotels DB) 기준 — HotelCard에 표시되는
  // 숙소와 항상 같은 금액이 나오도록, 이 파일 안에서 별도 고정단가표를 쓰지 않는다.
  const hotel = resolveHotel(
    input.hotelStyle as HotelStyle,
    input.budget as TravelBudget,
    input.duration as TravelDuration
  );

  const flight = calculateFlightItem(input.travelMonth, headcount);
  const hotelItem = calculateHotelItem(hotel, nights);
  const food = calculateFoodItem(input.interests, days, headcount);
  const transport = calculateTransportItem(input.hotelStyle as HotelStyle, days, headcount, hasBanaHills);
  const alcohol = calculateAlcoholItem(input.interests, days, headcount);
  const entrance = calculateEntranceItem(input.interests, input.hotelStyle, headcount);

  const subtotal =
    flight.total + hotelItem.total + food.total + transport.total + alcohol.total + entrance.total;
  const emergency = calculateEmergencyItem(subtotal);

  const total = subtotal + emergency.total;
  const perPerson = Math.round(total / headcount);

  const requestedBudget = parseBudgetManwon(input.budget);
  let budgetStatus: BudgetStatus = "ok";
  if (total > requestedBudget) budgetStatus = "over";
  else if (total < requestedBudget * 0.7) budgetStatus = "under";

  return { flight, hotel: hotelItem, food, transport, alcohol, entrance, emergency, total, perPerson, budgetStatus };
}
