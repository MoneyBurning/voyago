import Groq, { APIConnectionTimeoutError } from "groq-sdk";
import { danangAttractions, danangHiddenSpots } from "@/data/danang";
import { calculateBudget, getNights, resolveHotel } from "@/lib/budget";
import { ensureDailyMeals } from "@/lib/itinerary";
import type {
  AIAnalysis,
  ChecklistItem,
  HotelRecommendation,
  RecommendedSpot,
  TimeOfDay,
  TravelInput,
  TravelResult,
  TravelScore,
} from "@/types/travel";

const MODEL = "llama-3.3-70b-versatile";
const REQUEST_TIMEOUT_MS = 30_000;

let client: Groq | null = null;

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  if (!client) {
    client = new Groq({ apiKey });
  }
  return client;
}

const SYSTEM_PROMPT = `당신은 베트남 다낭 전문 AI 여행 설계사입니다.
다음 규칙을 반드시 지켜주세요:

1. 응답은 반드시 JSON만 출력 (마크다운 금지, 설명 금지)
2. 관광지 추천 시 동선 효율을 최우선으로 고려
3. 식사는 현지인 맛집 위주로 추천 (유명 관광지 식당 지양)
4. 사용자가 선택한 예산 구간(만원)에 맞는 "체감 등급"의 장소 위주로 선택 (예: 낮은 예산 구간이면 무료/저가 활동과 로컬 식당 위주, 높은 예산 구간이면 프라이빗 투어·고급 다이닝 포함 가능) — 단, 금액 계산은 당신의 역할이 아님 (아래 참고)
5. 하루 걸음수 15,000보 이하로 설계
6. 사용자 관심사(interests)를 80% 이상 반영
7. 각 장소는 실제 존재하는 곳만 추천

## 중요: 금액은 절대 계산하지 않는다
- 당신의 역할은 장소(호텔/맛집/일정)를 "선택"하는 것뿐이다. 항공권/숙박비/식비/교통비 등 모든 금액은 서버 코드가 실제 2026년 시세 데이터로 별도 계산한다.
- 응답 JSON에 budget, price, cost, 금액 관련 필드를 절대 포함하지 말 것.
- 사용자 메시지에 이미 확정된 숙소가 주어지니, 그 숙소의 위치를 동선 설계의 기준점으로만 사용할 것 (숙소 정보를 응답에 다시 포함할 필요 없음)

## 일정 설계 규칙
- 확정된 숙소의 위치(lat/lng)를 기준으로 각 날짜의 동선을 최적화
- 숙소 스타일이 hoian이면 Day 1~2는 호이안 중심, Day 3 이후는 다낭 중심으로 설계
- 숙소 스타일이 beach이면 매일 아침 일정에 해변 산책을 포함

## 하루 시작/종료 규칙
- Day 1을 제외한 모든 날의 첫 항목은 "호텔에서 출발" (category: move, badge: 이동)로 시작할 것
- 마지막 날을 제외한 모든 날의 마지막 항목은 "호텔로 복귀" (category: rest, badge: 휴식)로 끝낼 것
- 관광지나 식당으로 하루를 시작하거나 끝내지 말 것 — 반드시 숙소가 각 날짜의 시작/종료 기준점
- Day 1의 시작(공항 도착)과 마지막 날의 끝(공항 출발)은 아래 "첫째 날 규칙"/"마지막 날 규칙"을 그대로 따를 것

## 첫째 날(Day 1) 규칙 — arrivalTime 기준
- morning: 오전부터 풀 일정으로 설계
- afternoon: 오후 2시 이후부터 일정 시작, 체크인 후 저녁 일정만 포함
- evening: 저녁 도착이므로 숙소 근처 간단한 쌀국수 등 한 끼 식사만 포함

## 마지막 날 규칙 — departureTime 기준
- morning: 전날 밤 짐을 미리 싸두고, 당일은 새벽 이동만 포함 (별도 일정 없음)
- afternoon: 오전 체크아웃 후 반나절 일정 포함
- evening: 체크아웃 후 오전+점심을 포함한 풀 일정 가능

## 매일 일정에 반드시 포함할 것
- 아침식사 (07:00~09:00 사이)
- 점심식사 (12:00~13:00 사이)
- 저녁식사 (19:00~21:00 사이)
- 각 일정 항목의 desc에 이동수단을 명시 (그랩/도보/오토바이택시 등)
- 공항↔숙소 이동 일정을 반드시 포함 (도착일, 출발일)
- 위 3끼는 Day 1(저녁 도착 시 한 끼만 허용)과 마지막 날(새벽 출발 시 일정 없음 허용)을 제외한 모든 날에 아침/점심/저녁 3끼가 빠짐없이 포함되어야 한다. 최종 JSON을 출력하기 전에 해당하는 모든 날짜에 3끼가 다 있는지 스스로 검토할 것 — 하나라도 빠져 있으면 그 상태로 응답하지 말고 빠진 끼니를 채워 완성한 뒤에 출력할 것

## AI 분석 규칙 (결과 페이지 상단 "AI가 분석했습니다" 카드에 사용됨)
- analysis: 사용자가 선택한 관심사(interests)에 실제로 얼마나 비중을 두어 설계했는지 백분율로 분석한 한 줄 텍스트. 반드시 "관심사 N% / 관심사 N% / 관심사 N%" 형식 사용 (예: "먹방 43% / 야경 31% / 쇼핑 26%"), 백분율 합은 100에 가깝게
- aiComment: 이 일정을 설계한 접근 방식을 한 문장으로 요약 (예: "이동거리를 최소화하고 현지인 맛집 위주로 동선을 짰습니다.")
- reasons: 이 일정의 핵심 설계 포인트를 짧은 구(4개)로 나열 (예: ["이동거리 최소화", "현지인 맛집 위주", "숙소 위치 기반 동선", "예산 내 최적 배분"])

## 맛집 추천 이유 규칙
- hiddenSpots 각 항목에 다음을 추가:
  - reason: 오늘 일정 중 왜 이 장소를 추천했는지 (동선상 근접성, 시간대 등 구체적 이유)
  - waitTime: 예상 대기시간 (예: "15~20분", 현지인비율이 높을수록 대기시간도 김)
  - avgPrice: 1인 평균 가격 (만원 단위 숫자)

응답 JSON 형식:
{
  "score": { "total": 96, "route": 98, "budget": 97, "food": 100, "photo": 95, "satisfaction": 94 },
  "aiAnalysis": {
    "analysis": "먹방 43% / 야경 31% / 쇼핑 26%",
    "aiComment": "이동거리를 최소화하고 현지인 맛집 위주로 동선을 짰습니다.",
    "reasons": ["이동거리 최소화", "현지인 맛집 위주", "숙소 위치 기반 동선", "예산 내 최적 배분"]
  },
  "days": [
    {
      "day": 1,
      "items": [
        {
          "time": "09:00",
          "name": "장소명",
          "desc": "설명 (2줄 이내, 이동수단 포함)",
          "category": "eat|see|move|rest",
          "badge": "식사|관광|이동|휴식|추천",
          "lat": 16.0544,
          "lng": 108.2022
        }
      ]
    }
  ],
  "checklist": ["여권", "eSIM", "환전", "여행자보험", "선크림", "모기기피제"],
  "hiddenSpots": [
    {
      "name": "한글 이름",
      "nameEn": "영문 이름",
      "location": "위치 설명",
      "desc": "설명",
      "localRatio": 92,
      "lat": 16.0,
      "lng": 108.2,
      "category": "맛집|카페|시장",
      "reason": "오늘 동선에서 가장 가까운 로컬 맛집",
      "waitTime": "15~20분",
      "avgPrice": 3
    }
  ]
}`;

const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
  morning: "오전 (06:00~11:59)",
  afternoon: "오후 (12:00~17:59)",
  evening: "저녁 (18:00~23:59)",
};

function buildUserPrompt(input: TravelInput, hotel: HotelRecommendation, nights: number): string {
  const referenceSpots = danangHiddenSpots
    .map((spot) => `- ${spot.name}(${spot.nameEn}): ${spot.location}, 현지인비율 ${spot.localRatio}%, 좌표 ${spot.lat},${spot.lng}`)
    .join("\n");
  const referenceAttractions = danangAttractions
    .map((spot) => `- ${spot.name}(${spot.nameEn}): 좌표 ${spot.lat},${spot.lng}, 추천시간 ${spot.recommendedTime}, 체류 ${spot.avgDurationMin}분`)
    .join("\n");

  return `다음 조건에 맞는 여행 일정을 설계해줘.

- 출발지: ${input.departure}
- 여행지: ${input.destination}
- 기간: ${input.duration} (${nights}박)
- 예산 구간: ${input.budget}만원 (참고용 — 금액 계산은 하지 말고, 이 구간에 어울리는 체감 등급의 장소만 선택할 것)
- 인원: ${input.people}
- 관심사: ${input.interests.join(", ") || "없음"}
- 다낭 도착 시간대: ${TIME_OF_DAY_LABEL[input.arrivalTime]}
- 귀국 출발 시간대: ${TIME_OF_DAY_LABEL[input.departureTime]}

## 확정된 숙소 (동선 설계의 기준점으로만 사용, 응답에 다시 포함할 필요 없음)
- 이름: ${hotel.name} (${hotel.nameEn})
- 스타일: ${hotel.style}
- 위치: ${hotel.location} (좌표 ${hotel.lat},${hotel.lng})

## 참고용 실존 장소 목록 (가능하면 이 목록을 우선 활용하고, 부족하면 실제 존재하는 다른 장소를 추가로 추천해도 됨)

### 숨은 로컬 맛집
${referenceSpots}

### 주요 관광지
${referenceAttractions}`;
}

/**
 * 시스템 프롬프트의 JSON 예시는 score에 "photo"를 포함하지 않는 경우가 있어
 * 누락 시 0으로 채운다.
 */
function normalizeScore(raw: unknown): TravelScore {
  const score = (raw ?? {}) as Partial<TravelScore>;
  return {
    total: score.total ?? 0,
    route: score.route ?? 0,
    budget: score.budget ?? 0,
    food: score.food ?? 0,
    photo: score.photo ?? 0,
    satisfaction: score.satisfaction ?? 0,
  };
}

/**
 * 시스템 프롬프트의 JSON 예시는 checklist를 문자열 배열로 반환하지만
 * types/travel.ts의 ChecklistItem[]과 맞추기 위해 정규화한다.
 */
function normalizeChecklist(raw: unknown): ChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry, index) => {
    if (typeof entry === "string") {
      return { id: `checklist-${index}`, text: entry, done: false, category: "준비물" };
    }
    const item = entry as Partial<ChecklistItem>;
    return {
      id: item.id ?? `checklist-${index}`,
      text: item.text ?? "",
      done: item.done ?? false,
      category: item.category ?? "준비물",
    };
  });
}

/** aiAnalysis 필드가 누락되거나 형식이 어긋나도 화면이 깨지지 않도록 기본값으로 채운다. */
function normalizeAIAnalysis(raw: unknown): AIAnalysis {
  const analysis = (raw ?? {}) as Partial<AIAnalysis>;
  return {
    analysis: analysis.analysis ?? "",
    aiComment: analysis.aiComment ?? "",
    reasons: Array.isArray(analysis.reasons) ? analysis.reasons.slice(0, 4) : [],
  };
}

/** hiddenSpots 각 항목의 reason/waitTime/avgPrice 누락을 기본값으로 채운다. */
function normalizeRecommendedSpots(raw: unknown): RecommendedSpot[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const spot = entry as Partial<RecommendedSpot>;
    return {
      name: spot.name ?? "",
      nameEn: spot.nameEn ?? "",
      location: spot.location ?? "",
      desc: spot.desc ?? "",
      localRatio: spot.localRatio ?? 0,
      lat: spot.lat ?? 0,
      lng: spot.lng ?? 0,
      category: spot.category ?? "맛집",
      reason: spot.reason ?? "",
      waitTime: spot.waitTime ?? "정보 없음",
      avgPrice: spot.avgPrice ?? 0,
    };
  });
}

/** Groq 응답 텍스트에서 JSON 부분만 추출 (마크다운 코드블록 유무 모두 처리) */
function extractJsonPayload(content: string): string {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : content;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Groq 응답에서 JSON을 찾을 수 없습니다.");
  }
  return candidate.slice(start, end + 1).trim();
}

/** TravelInput을 받아 Groq API로 여행 일정을 생성하고 TravelResult로 파싱해 반환 */
export async function generateTravelPlan(input: TravelInput): Promise<TravelResult> {
  const groq = getClient();

  // 숙소는 DB에서 결정론적으로 확정한다 (이름/좌표/가격/예약링크가 실제 데이터와
  // 어긋나면 안 되므로, Groq의 자유 생성에 맡기지 않고 서버에서 계산해 프롬프트에 못박는다).
  const nights = getNights(input.duration);
  const hotel = resolveHotel(input.hotelStyle, input.budget, input.duration);

  let content: string | null | undefined;
  try {
    const completion = await groq.chat.completions.create(
      {
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input, hotel, nights) },
        ],
        temperature: 0.6,
        response_format: { type: "json_object" },
      },
      { timeout: REQUEST_TIMEOUT_MS }
    );
    content = completion.choices[0]?.message?.content;
  } catch (error) {
    if (error instanceof APIConnectionTimeoutError) {
      throw new Error("Groq 응답 시간이 초과되었습니다 (30초).");
    }
    throw error;
  }

  if (!content) {
    throw new Error("Groq 응답이 비어 있습니다.");
  }

  const jsonPayload = extractJsonPayload(content);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonPayload) as Record<string, unknown>;
  } catch {
    throw new Error("Groq 응답을 JSON으로 파싱하는 데 실패했습니다.");
  }

  const rawDays = (parsed.days as TravelResult["days"]) ?? [];
  // 시스템 프롬프트의 "하루 3끼 필수" 지시만으로는 실제로 지켜지지 않는 경우가 관측되어,
  // 빠진 끼니를 코드에서 결정론적으로 채워 넣는다 (재시도 대신 보정).
  const days = ensureDailyMeals(rawDays, input.arrivalTime, input.departureTime);

  // 예산은 Groq가 아니라 이 함수가 전적으로 계산한다 (AI는 장소만 선택).
  const budget = calculateBudget({
    departure: input.departure,
    people: input.people,
    duration: input.duration,
    budget: input.budget,
    interests: input.interests,
    hotelStyle: input.hotelStyle,
    travelMonth: input.travelMonth,
  });

  return {
    score: normalizeScore(parsed.score),
    days,
    budget,
    hiddenSpots: normalizeRecommendedSpots(parsed.hiddenSpots),
    checklist: normalizeChecklist(parsed.checklist),
    hotel,
    aiAnalysis: normalizeAIAnalysis(parsed.aiAnalysis),
  };
}
