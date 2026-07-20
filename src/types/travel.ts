/** 출발 도시 */
export type DepartureCity = "서울" | "부산" | "대구" | "광주" | "청주" | "제주";

/** 여행지 (첫 타깃: 다낭) */
export type Destination = "다낭" | "방콕" | "발리" | "오사카" | "도쿄" | "싱가포르";

/** 여행지별 서비스 지원 여부 (다낭만 활성화, 나머지는 준비중) — SearchCard와 지원 도시 뱃지가 공유 */
export const DESTINATION_STATUS: { value: Destination; enabled: boolean }[] = [
  { value: "다낭", enabled: true },
  { value: "방콕", enabled: false },
  { value: "발리", enabled: false },
  { value: "오사카", enabled: false },
  { value: "도쿄", enabled: false },
  { value: "싱가포르", enabled: false },
];

/** 여행 기간 */
export type TravelDuration = "3박4일" | "4박5일" | "5박6일" | "6박7일";

/** 예산 구간 (만원 단위, 200만원 초과는 "200+") */
export type TravelBudget = "50" | "100" | "150" | "200" | "200+";

/** 동행 인원 구성 */
export type TravelPeople = "혼자" | "커플" | "친구2~4명" | "가족" | "부모님";

/** 관심사 태그 */
export type Interest =
  | "먹방"
  | "야경"
  | "해변"
  | "사진"
  | "쇼핑"
  | "힐링"
  | "역사"
  | "액티비티"
  | "술"
  | "카페";

/** 하루 중 시간대 (다낭 도착/귀국 출발 시간대에 사용) */
export type TimeOfDay = "morning" | "afternoon" | "evening";

/** 숙소 스타일 */
export type HotelStyle = "beach" | "city" | "hoian" | "budget" | "poolvilla";

/** 사용자가 입력하는 여행 조건 (출발지, 여행지, 기간, 예산, 인원, 관심사, 도착/출발 시간대, 숙소 스타일) */
export interface TravelInput {
  departure: DepartureCity;
  destination: Destination;
  duration: TravelDuration;
  budget: TravelBudget;
  people: TravelPeople;
  interests: Interest[];
  arrivalTime: TimeOfDay;
  departureTime: TimeOfDay;
  hotelStyle: HotelStyle;
}

/** 일정 항목의 성격 구분 */
export type ScheduleCategory = "eat" | "see" | "move" | "rest";

/** 일정 항목에 표시되는 뱃지 종류 */
export type ScheduleBadge = "식사" | "관광" | "이동" | "휴식" | "추천";

/** 하루 일정 안의 단일 항목 (시간, 장소명, 설명, 카테고리, 좌표, 뱃지) */
export interface ScheduleItem {
  time: string;
  name: string;
  desc: string;
  category: ScheduleCategory;
  badge: ScheduleBadge;
  lat: number;
  lng: number;
}

/** 하루 단위 일정 (day 번호, items 배열) */
export interface DaySchedule {
  day: number;
  items: ScheduleItem[];
}

/** 예산 카테고리별 배분 (항공, 숙소, 식비, 교통, 쇼핑, 비상금) */
export interface BudgetBreakdown {
  flight: number;
  hotel: number;
  food: number;
  transport: number;
  shopping: number;
  emergency: number;
}

/** 현지인 비율이 높은 숨은 맛집/장소 */
export interface HiddenSpot {
  name: string;
  nameEn: string;
  location: string;
  desc: string;
  localRatio: number;
  lat: number;
  lng: number;
  category: "맛집" | "카페" | "시장";
}

/** 여행 준비물 체크리스트 항목 */
export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  category: string;
}

/** AI가 추천한 숙소 1곳 */
export interface HotelRecommendation {
  /** 호텔명 (한글) */
  name: string;
  /** 호텔명 (영문) */
  nameEn: string;
  style: HotelStyle;
  /** 1박 가격 (만원 단위) */
  pricePerNight: number;
  /** 전체 숙박비 (만원 단위) */
  totalCost: number;
  location: string;
  /** 특징 (3개) */
  features: string[];
  lat: number;
  lng: number;
  rating: number;
  /** Agoda 또는 Booking.com 예약 링크 */
  bookingUrl: string;
}

/** AI가 산출한 여행 점수 (총점, 동선, 예산, 먹방, 사진, 만족도예측) */
export interface TravelScore {
  total: number;
  route: number;
  budget: number;
  food: number;
  photo: number;
  satisfaction: number;
}

/** AI가 생성한 전체 여행 설계 결과 (일정, 예산, 맛집, 점수, 체크리스트, 숙소) */
export interface TravelResult {
  score: TravelScore;
  days: DaySchedule[];
  budget: BudgetBreakdown;
  hiddenSpots: HiddenSpot[];
  checklist: ChecklistItem[];
  hotel: HotelRecommendation;
}
