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
  | "카페"
  | "바나힐"
  | "호이안";

/** 하루 중 시간대 (다낭 도착/귀국 출발 시간대에 사용) */
export type TimeOfDay = "morning" | "afternoon" | "evening";

/** 숙소 스타일 */
export type HotelStyle = "beach" | "city" | "hoian" | "budget" | "poolvilla";

/** 출발 월 (1~12) — 항공권 성수기 판별에 사용 */
export type TravelMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** 사용자가 입력하는 여행 조건 (출발지, 여행지, 기간, 출발 월, 예산, 인원, 관심사, 도착/출발 시간대, 숙소 스타일) */
export interface TravelInput {
  departure: DepartureCity;
  destination: Destination;
  duration: TravelDuration;
  travelMonth: TravelMonth;
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

/** 항공권 예산 항목 */
export interface FlightBudgetItem {
  /** 총액 (만원) */
  total: number;
  /** 1인당 (만원) */
  perPerson: number;
  note: string;
}

/** 숙소 예산 항목 */
export interface HotelBudgetItem {
  /** 총액 (만원) */
  total: number;
  /** 1박 가격 (만원) */
  perNight: number;
  nights: number;
  note: string;
}

/** 식비 예산 항목 */
export interface FoodBudgetItem {
  /** 총액 (만원) */
  total: number;
  /** 전체 인원 1일치 (만원) */
  perDay: number;
  /** 1인 전체 기간 (만원) */
  perPerson: number;
  /** 최소 예상 (만원) */
  min: number;
  /** 최대 예상 (만원) */
  max: number;
  note: string;
}

/** 교통비(그랩) 예산 항목 */
export interface TransportBudgetItem {
  /** 총액 (만원) */
  total: number;
  /** 1인당 (만원) */
  perPerson: number;
  note: string;
  tip: string;
}

/** 음주비 예산 항목 */
export interface AlcoholBudgetItem {
  /** 총액 (만원) */
  total: number;
  /** interests에 술/펍이 포함되어 반영되었는지 여부 */
  included: boolean;
  note: string;
}

/** 입장료 예산 항목 */
export interface EntranceBudgetItem {
  /** 총액 (만원) */
  total: number;
  /** 포함된 입장료 항목 이름 목록 */
  items: string[];
  note: string;
}

/** 비상금 예산 항목 */
export interface EmergencyBudgetItem {
  /** 총액 (만원) */
  total: number;
  rate: string;
}

/** 사용자가 선택한 예산 구간 대비 실제 계산된 총 지출 상태 */
export type BudgetStatus = "ok" | "over" | "under";

/** 코드에서 100% 결정론적으로 계산하는 전체 예산 (AI는 장소만 선택, 금액은 계산하지 않음) */
export interface BudgetCalculation {
  flight: FlightBudgetItem;
  hotel: HotelBudgetItem;
  food: FoodBudgetItem;
  transport: TransportBudgetItem;
  alcohol: AlcoholBudgetItem;
  entrance: EntranceBudgetItem;
  emergency: EmergencyBudgetItem;
  /** 전체 총액 (만원) */
  total: number;
  /** 1인당 총액 (만원) */
  perPerson: number;
  /** 사용자가 선택한 예산 구간 대비 상태 */
  budgetStatus: BudgetStatus;
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

/** 결과에 포함되는 숨은 맛집 — 기본 정보 + AI의 추천 이유/예상 대기시간/평균 가격 */
export interface RecommendedSpot extends HiddenSpot {
  /** AI가 이 장소를 추천한 이유 (예: "오늘 동선에서 가장 가까운 로컬 맛집") */
  reason: string;
  /** 예상 대기시간 (예: "15~20분") */
  waitTime: string;
  /** 평균 가격 (만원 단위, 1인 기준) */
  avgPrice: number;
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

/** 결과 페이지 상단에 표시되는 "AI가 분석했습니다" 카드 내용 */
export interface AIAnalysis {
  /** 관심사 비율 분석 텍스트 (예: "먹방 43% / 야경 31% / 쇼핑 26%") */
  analysis: string;
  /** AI 한줄평 */
  aiComment: string;
  /** 이 일정을 짠 핵심 이유 (4개) */
  reasons: string[];
}

/** AI가 생성한 전체 여행 설계 결과 (일정, 예산, 맛집, 점수, 체크리스트, 숙소, AI 분석) */
export interface TravelResult {
  score: TravelScore;
  days: DaySchedule[];
  budget: BudgetCalculation;
  hiddenSpots: RecommendedSpot[];
  checklist: ChecklistItem[];
  hotel: HotelRecommendation;
  aiAnalysis: AIAnalysis;
}
