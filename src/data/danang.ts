import type { BudgetBreakdown, HiddenSpot, HotelStyle, TravelBudget } from "@/types/travel";

/** 다낭 숨은 로컬 맛집·카페 (실제 검색으로 수집한 검증 데이터) */
export const danangHiddenSpots: HiddenSpot[] = [
  {
    name: "바 두엉",
    nameEn: "Bà Dưỡng",
    location: "다낭 시내 골목 안쪽",
    desc: "가마솥 팬에 바삭하게 부친 반쎄오. 새우·돼지고기·숙주 속재료. 현지인 줄서는 골목 숨은 맛집",
    localRatio: 92,
    lat: 16.0544,
    lng: 108.2022,
    category: "맛집",
  },
  {
    name: "퍼 홍",
    nameEn: "Phở Hồng",
    location: "노보텔 근처 한강변 골목",
    desc: "다낭 4대천왕 쌀국수. 맑고 깊은 소고기 육수. 55,000동(약 3,000원). 해장용으로 최고",
    localRatio: 88,
    lat: 16.0678,
    lng: 108.2234,
    category: "맛집",
  },
  {
    name: "Nha Go",
    nameEn: "Nha Go",
    location: "한시장 근처",
    desc: "분짜·모닝글로리·넴루이. 나무 외관의 현지 가정식 전문점. 관광객보다 현지인 비율 높음",
    localRatio: 85,
    lat: 16.0612,
    lng: 108.2198,
    category: "맛집",
  },
  {
    name: "바 베",
    nameEn: "Bà Bé",
    location: "103 Phan Thanh, Thanh Khe",
    desc: "반베오·반남·반보틀록 세트. 각 떡마다 전용 소스. 현지인 간식 명소",
    localRatio: 90,
    lat: 16.0489,
    lng: 108.1923,
    category: "맛집",
  },
  {
    name: "꺼우몽 양고기 구이",
    nameEn: "Cầu Mống",
    location: "100 Hoang Van Thu, Hai Chau",
    desc: "다낭 특산 양고기 구이. 직접 썰어주는 퍼포먼스. 특제 멸치젓 소스와 신선한 채소 필수",
    localRatio: 87,
    lat: 16.0521,
    lng: 108.2087,
    category: "맛집",
  },
  {
    name: "분맘 넴",
    nameEn: "Bún Mắm Nêm",
    location: "다낭 시내",
    desc: "강한 냄새 없는 은은한 향. 삶은 고기·바삭 돼지고기·잭프룻·생채소 조합. 현지인 단골 맛집",
    localRatio: 91,
    lat: 16.0601,
    lng: 108.2145,
    category: "맛집",
  },
  {
    name: "Nam House Café",
    nameEn: "Nam House Café",
    location: "다낭 시내",
    desc: "1990년대 베트남 가정집 콘셉트. 빈티지 타일·패턴 인테리어. 에그커피·솔티커피 시그니처",
    localRatio: 83,
    lat: 16.0558,
    lng: 108.2201,
    category: "카페",
  },
  {
    name: "Cà Phê Muối",
    nameEn: "Cà Phê Muối",
    location: "다낭 시내",
    desc: "베트남 솔트커피 원조. 진한 핀 커피에 부드러운 소금크림 토핑. 현지인도 일부러 찾아오는 곳",
    localRatio: 80,
    lat: 16.0623,
    lng: 108.2189,
    category: "카페",
  },
  {
    name: "XLIII Factory Coffee Roaster",
    nameEn: "XLIII Factory Coffee Roaster",
    location: "다낭 시내",
    desc: "싱글오리진 스페셜티 원두 전문. 유리벽 오픈형 로스터리. 바리스타 브루잉 퍼포먼스 볼 수 있음",
    localRatio: 78,
    lat: 16.0634,
    lng: 108.2167,
    category: "카페",
  },
  {
    name: "Nối Cà Phê",
    nameEn: "Nối Cà Phê",
    location: "다낭 시내",
    desc: "진짜 로컬 커피 경험. 관광객 거의 없는 현지인 전용 분위기. 전통 방식 베트남 드립커피",
    localRatio: 86,
    lat: 16.0589,
    lng: 108.2213,
    category: "카페",
  },
  {
    name: "보이 카페",
    nameEn: "Vội Café",
    location: "다낭 외곽 한적한 골목",
    desc: "이름은 '서두름'이지만 가장 느긋한 분위기. 연유커피 맛집. 현지인만 아는 숨은 보석",
    localRatio: 89,
    lat: 16.0512,
    lng: 108.2034,
    category: "카페",
  },
  {
    name: "Nóc Rooftop Café",
    nameEn: "Nóc Rooftop Café",
    location: "다낭 시내 옥상",
    desc: "다낭 공항 활주로 뷰 루프탑. 비행기 이착륙 보며 마시는 커피. 목재 가구·따뜻한 조명",
    localRatio: 75,
    lat: 16.0445,
    lng: 108.1998,
    category: "카페",
  },
];

/** 관광지 정보 */
export interface Attraction {
  /** 장소명 (한글) */
  name: string;
  /** 장소명 (영문) */
  nameEn: string;
  lat: number;
  lng: number;
  /** 추천 방문 시간대 */
  recommendedTime: string;
  /** 평균 체류시간 (분) */
  avgDurationMin: number;
  /** 사진 점수 (0~100) */
  photoScore: number;
  /** 혼잡도 */
  congestion: "낮음" | "보통" | "높음";
  /** 입장료 (VND, 무료인 경우 "무료") */
  admissionFee: string;
}

/** 다낭/호이안 주요 관광지 15곳 */
export const danangAttractions: Attraction[] = [
  {
    name: "미케 비치",
    nameEn: "My Khe Beach",
    lat: 16.0620,
    lng: 108.2470,
    recommendedTime: "일출 직후 또는 오후 4시 이후",
    avgDurationMin: 120,
    photoScore: 88,
    congestion: "보통",
    admissionFee: "무료",
  },
  {
    name: "오행산 (마블마운틴)",
    nameEn: "Marble Mountains",
    lat: 16.0022,
    lng: 108.2632,
    recommendedTime: "오전 8~10시 (더위 피하기)",
    avgDurationMin: 150,
    photoScore: 82,
    congestion: "보통",
    admissionFee: "40,000동 (엘리베이터 별도 15,000동)",
  },
  {
    name: "바나힐 (골든브릿지)",
    nameEn: "Ba Na Hills",
    lat: 15.9977,
    lng: 107.9877,
    recommendedTime: "오전 일찍 (케이블카 대기 최소화)",
    avgDurationMin: 360,
    photoScore: 95,
    congestion: "높음",
    admissionFee: "약 850,000동 (케이블카 왕복 포함)",
  },
  {
    name: "용다리 (드래곤 브릿지)",
    nameEn: "Dragon Bridge",
    lat: 16.0610,
    lng: 108.2277,
    recommendedTime: "토·일요일 밤 21:00 (불쇼)",
    avgDurationMin: 40,
    photoScore: 90,
    congestion: "높음",
    admissionFee: "무료",
  },
  {
    name: "호이안 고대마을",
    nameEn: "Hoi An Ancient Town",
    lat: 15.8801,
    lng: 108.3380,
    recommendedTime: "늦은 오후~일몰",
    avgDurationMin: 180,
    photoScore: 97,
    congestion: "높음",
    admissionFee: "120,000동 (헤리티지 입장권, 유적 다수 포함)",
  },
  {
    name: "한시장",
    nameEn: "Han Market",
    lat: 16.0678,
    lng: 108.2226,
    recommendedTime: "오전",
    avgDurationMin: 60,
    photoScore: 70,
    congestion: "보통",
    admissionFee: "무료",
  },
  {
    name: "린응사",
    nameEn: "Linh Ung Pagoda",
    lat: 16.1010,
    lng: 108.2839,
    recommendedTime: "오전",
    avgDurationMin: 90,
    photoScore: 85,
    congestion: "보통",
    admissionFee: "무료",
  },
  {
    name: "선짜반도",
    nameEn: "Son Tra Peninsula",
    lat: 16.1170,
    lng: 108.2870,
    recommendedTime: "오전~정오",
    avgDurationMin: 150,
    photoScore: 89,
    congestion: "낮음",
    admissionFee: "무료",
  },
  {
    name: "안방 비치",
    nameEn: "An Bang Beach",
    lat: 15.9184,
    lng: 108.3494,
    recommendedTime: "일몰 시간대",
    avgDurationMin: 120,
    photoScore: 91,
    congestion: "낮음",
    admissionFee: "무료",
  },
  {
    name: "참 조각 박물관",
    nameEn: "Museum of Cham Sculpture",
    lat: 16.0585,
    lng: 108.2231,
    recommendedTime: "오전~낮",
    avgDurationMin: 60,
    photoScore: 65,
    congestion: "낮음",
    admissionFee: "60,000동",
  },
  {
    name: "다낭 대성당 (핑크 성당)",
    nameEn: "Da Nang Cathedral",
    lat: 16.0678,
    lng: 108.2213,
    recommendedTime: "오전",
    avgDurationMin: 30,
    photoScore: 80,
    congestion: "보통",
    admissionFee: "무료 (외관)",
  },
  {
    name: "껀 시장",
    nameEn: "Con Market",
    lat: 16.0705,
    lng: 108.2143,
    recommendedTime: "오전~오후",
    avgDurationMin: 60,
    photoScore: 68,
    congestion: "보통",
    admissionFee: "무료",
  },
  {
    name: "호이안 야시장",
    nameEn: "Hoi An Night Market",
    lat: 15.8767,
    lng: 108.3290,
    recommendedTime: "저녁 18~21시",
    avgDurationMin: 90,
    photoScore: 93,
    congestion: "높음",
    admissionFee: "무료",
  },
  {
    name: "투본강 크루즈",
    nameEn: "Thu Bon River Cruise",
    lat: 15.8794,
    lng: 108.3320,
    recommendedTime: "일몰 직후 (등불 감상)",
    avgDurationMin: 45,
    photoScore: 94,
    congestion: "보통",
    admissionFee: "약 150,000동 (바구니배 기준)",
  },
  {
    name: "하이반 고개",
    nameEn: "Hai Van Pass",
    lat: 16.2113,
    lng: 108.1256,
    recommendedTime: "오전 (안개 적음)",
    avgDurationMin: 90,
    photoScore: 96,
    congestion: "낮음",
    admissionFee: "무료",
  },
];

/** 호텔 DB의 원본 항목 (예산 구간별 총 숙박비는 lib/budget.ts에서 박수를 곱해 계산) */
export interface HotelOption {
  /** 호텔명 (한글) */
  name: string;
  /** 호텔명 (영문) */
  nameEn: string;
  style: HotelStyle;
  /** 이 호텔이 적합한 예산 구간 (여러 구간에 걸칠 수 있음) */
  budgetTiers: TravelBudget[];
  /** 1박 가격 (만원 단위) */
  pricePerNight: number;
  location: string;
  /** 특징 (3개) */
  features: string[];
  lat: number;
  lng: number;
  rating: number;
  /** Agoda 또는 Booking.com 예약 링크 */
  bookingUrl: string;
}

/** 다낭/호이안 숙소 DB — 스타일 × 예산 구간별 추천 호텔 */
export const danangHotels: HotelOption[] = [
  // beach
  {
    name: "스텔라 마리스 리조트",
    nameEn: "Stella Maris Resort",
    style: "beach",
    budgetTiers: ["50"],
    pricePerNight: 8,
    location: "미케비치 도보 5분",
    features: ["해변 도보권", "야외 수영장", "조식 포함"],
    lat: 16.0505,
    lng: 108.2475,
    rating: 4.3,
    bookingUrl: "https://www.agoda.com/stella-maris-resort-danang",
  },
  {
    name: "풀만 다낭 비치 리조트",
    nameEn: "Pullman Danang Beach Resort",
    style: "beach",
    budgetTiers: ["100"],
    pricePerNight: 18,
    location: "미케비치 직접 연결",
    features: ["비치 프론트", "인피니티풀", "조식 포함"],
    lat: 16.0471,
    lng: 108.2478,
    rating: 4.5,
    bookingUrl: "https://www.agoda.com/pullman-danang",
  },
  {
    name: "하얏트 리젠시 다낭",
    nameEn: "Hyatt Regency Danang",
    style: "beach",
    budgetTiers: ["150"],
    pricePerNight: 28,
    location: "논느억비치",
    features: ["프라이빗 비치", "수영장 3곳", "패밀리 스위트"],
    lat: 16.0028,
    lng: 108.2612,
    rating: 4.6,
    bookingUrl: "https://www.agoda.com/hyatt-regency-danang",
  },
  {
    name: "인터컨티넨탈 다낭 선 페닌슐라",
    nameEn: "InterContinental Danang Sun Peninsula",
    style: "beach",
    budgetTiers: ["200", "200+"],
    pricePerNight: 45,
    location: "선짜반도 프라이빗 코브",
    features: ["프라이빗 반도", "미쉐린 셰프 다이닝", "케이블카 전용 접근"],
    lat: 16.1197,
    lng: 108.2977,
    rating: 4.8,
    bookingUrl: "https://www.agoda.com/intercontinental-danang-sun-peninsula",
  },
  // city
  {
    name: "무엉타잉 럭셔리 다낭",
    nameEn: "Mường Thanh Luxury Danang",
    style: "city",
    budgetTiers: ["50"],
    pricePerNight: 7,
    location: "다낭 시내, 한강 인근",
    features: ["한강뷰 객실 선택", "루프탑 수영장", "시내 접근성"],
    lat: 16.0575,
    lng: 108.2445,
    rating: 4.0,
    bookingUrl: "https://www.agoda.com/muong-thanh-luxury-danang",
  },
  {
    name: "노보텔 다낭 프리미어 한리버",
    nameEn: "Novotel Danang Premier Han River",
    style: "city",
    budgetTiers: ["100"],
    pricePerNight: 15,
    location: "한강변, 바흐당 거리",
    features: ["한강 전망", "루프탑 바", "다낭 최고층 호텔"],
    lat: 16.0678,
    lng: 108.2246,
    rating: 4.4,
    bookingUrl: "https://www.agoda.com/novotel-danang-premier-han-river",
  },
  {
    name: "힐튼 다낭",
    nameEn: "Hilton Danang",
    style: "city",
    budgetTiers: ["150"],
    pricePerNight: 22,
    location: "한강변, 한시장 도보권",
    features: ["강변 위치", "인피니티풀", "한시장 도보 10분"],
    lat: 16.0696,
    lng: 108.2237,
    rating: 4.5,
    bookingUrl: "https://www.agoda.com/hilton-danang",
  },
  {
    name: "그랜드 머큐어 다낭",
    nameEn: "Grand Mercure Danang",
    style: "city",
    budgetTiers: ["200", "200+"],
    pricePerNight: 32,
    location: "한강변 프리미엄 지구",
    features: ["프리미엄 스위트", "리버뷰 인피니티풀", "고급 다이닝"],
    lat: 16.0658,
    lng: 108.2264,
    rating: 4.6,
    bookingUrl: "https://www.agoda.com/grand-mercure-danang",
  },
  // hoian
  {
    name: "호이안 트레일스 리조트",
    nameEn: "Hoi An Trails Resort",
    style: "hoian",
    budgetTiers: ["50"],
    pricePerNight: 9,
    location: "호이안 근교, 논밭 지대",
    features: ["논뷰 객실", "무료 자전거 대여", "조식 포함"],
    lat: 15.8965,
    lng: 108.3120,
    rating: 4.2,
    bookingUrl: "https://www.agoda.com/hoi-an-trails-resort",
  },
  {
    name: "아난타라 호이안 리조트",
    nameEn: "Anantara Hoi An Resort",
    style: "hoian",
    budgetTiers: ["100"],
    pricePerNight: 20,
    location: "투본강변, 호이안 올드타운 도보 5분",
    features: ["투본강변", "올드타운 도보권", "프렌치 콜로니얼 양식"],
    lat: 15.8790,
    lng: 108.3360,
    rating: 4.6,
    bookingUrl: "https://www.agoda.com/anantara-hoi-an-resort",
  },
  {
    name: "포시즌스 리조트 더 남하이",
    nameEn: "Four Seasons Resort The Nam Hai",
    style: "hoian",
    budgetTiers: ["150", "200", "200+"],
    pricePerNight: 55,
    location: "호이안 인근 비치프론트",
    features: ["프라이빗 풀빌라", "비치프론트", "5성급 럭셔리"],
    lat: 15.9330,
    lng: 108.3480,
    rating: 4.9,
    bookingUrl: "https://www.agoda.com/four-seasons-resort-the-nam-hai",
  },
  // budget (모든 예산 구간에 적용)
  {
    name: "시실리아 호텔",
    nameEn: "Cicilia Hotel",
    style: "budget",
    budgetTiers: ["50", "100", "150", "200", "200+"],
    pricePerNight: 4,
    location: "다낭 시내 중심",
    features: ["시내 중심", "가성비", "청결한 객실"],
    lat: 16.0625,
    lng: 108.2210,
    rating: 4.3,
    bookingUrl: "https://www.agoda.com/cicilia-hotel-danang",
  },
  {
    name: "골드 호텔",
    nameEn: "Gold Hotel",
    style: "budget",
    budgetTiers: ["50", "100", "150", "200", "200+"],
    pricePerNight: 5,
    location: "미케비치 도보권",
    features: ["해변 도보권", "친절한 스탭", "가성비 조식"],
    lat: 16.0552,
    lng: 108.2451,
    rating: 4.1,
    bookingUrl: "https://www.agoda.com/gold-hotel-danang",
  },
  // poolvilla
  {
    name: "퓨전 마이아 다낭",
    nameEn: "Fusion Maia Danang",
    style: "poolvilla",
    budgetTiers: ["150"],
    pricePerNight: 38,
    location: "비치프론트, 다낭 시내 북쪽",
    features: ["전객실 프라이빗 풀", "올인클루시브 스파", "비치프론트 빌라"],
    lat: 16.0730,
    lng: 108.2520,
    rating: 4.7,
    bookingUrl: "https://www.agoda.com/fusion-maia-danang",
  },
  {
    name: "나만 리트리트",
    nameEn: "Naman Retreat",
    style: "poolvilla",
    budgetTiers: ["200", "200+"],
    pricePerNight: 55,
    location: "쯔엉사 거리, 비치프론트",
    features: ["전객실 풀빌라", "대나무 건축", "미쉐린급 다이닝"],
    lat: 16.0192,
    lng: 108.2570,
    rating: 4.8,
    bookingUrl: "https://www.agoda.com/naman-retreat-danang",
  },
];

/** 예산 구간별 배분표 (단위: 만원). 항공 35% · 숙소 28% · 식비 18% · 교통 7% · 쇼핑 7% · 비상금 5% 비율 적용 */
export const danangBudgetTable: Record<TravelBudget, BudgetBreakdown> = {
  "50": { flight: 18, hotel: 14, food: 9, transport: 4, shopping: 3, emergency: 2 },
  "100": { flight: 35, hotel: 28, food: 18, transport: 7, shopping: 7, emergency: 5 },
  "150": { flight: 53, hotel: 42, food: 27, transport: 11, shopping: 10, emergency: 7 },
  "200": { flight: 70, hotel: 56, food: 36, transport: 14, shopping: 14, emergency: 10 },
  "200+": { flight: 90, hotel: 70, food: 45, transport: 18, shopping: 18, emergency: 12 },
};

/** 다낭 여행 기본 정보 */
export const danangInfo = {
  /** 환율 (1만동 ≈ 560원, 변동 가능) */
  exchangeRate: "1만동(VND) ≈ 약 560원 (환율 변동 있으니 출국 전 확인 필수)",
  weather: {
    dry: "건기: 1월~8월 (맑고 더움, 여행 최적기)",
    rainy: "우기: 9월~12월 (스콜성 비, 태풍 가능성 있음)",
  },
  /** 콘센트 타입 (베트남은 220V, A/C타입 겸용 콘센트가 일반적) */
  plugType: "A/C타입 겸용, 220V (한국 전자제품은 별도 어댑터 불필요한 경우多, 멀티어댑터 권장)",
  /** 추천 eSIM */
  recommendedESim: "베트남 전용 eSIM (Airalo, KKday·Klook 판매 베트남 eSIM 등 도착 즉시 개통형 추천)",
  visa: "한국 여권 기준 무비자 45일 체류 가능 (관광 목적)",
  safety: "치안은 대체로 양호하나 소매치기·오토바이 날치기 주의. 야간 단독 골목 이동, 렌트 오토바이 음주운전은 피할 것.",
};
