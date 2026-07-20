import Groq, { APIConnectionTimeoutError } from "groq-sdk";
import { danangAttractions, danangHiddenSpots } from "@/data/danang";
import { getNights, resolveHotel } from "@/lib/budget";
import type {
  ChecklistItem,
  HotelRecommendation,
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
4. 예산을 절대 초과하지 않음
5. 하루 걸음수 15,000보 이하로 설계
6. 사용자 관심사(interests)를 80% 이상 반영
7. 각 장소는 실제 존재하는 곳만 추천

## 호텔 규칙
- 사용자 메시지에 이미 확정된 숙소(name/nameEn/location/lat/lng/totalCost 등)가 주어지니, 응답의 hotel 필드에 그 값을 그대로 반환할 것 (다른 호텔 임의 생성 금지)
- budget.hotel 값은 사용자 메시지에 주어진 확정 숙박비(totalCost)와 동일해야 함
- 나머지 예산(총예산 - 숙박비)만으로 항공/식비/교통/쇼핑/비상금을 배분

## 일정 설계 규칙
- 확정된 숙소의 위치(lat/lng)를 기준으로 각 날짜의 동선을 최적화
- 숙소 스타일이 hoian이면 Day 1~2는 호이안 중심, Day 3 이후는 다낭 중심으로 설계
- 숙소 스타일이 beach이면 매일 아침 일정에 해변 산책을 포함

## 첫째 날(Day 1) 규칙 — arrivalTime 기준
- morning: 오전부터 풀 일정으로 설계
- afternoon: 오후 2시 이후부터 일정 시작, 체크인 후 저녁 일정만 포함
- evening: 저녁 도착이므로 숙소 근처 간단한 쌀국수 등 한 끼 식사만 포함

## 마지막 날 규칙 — departureTime 기준
- morning: 전날 밤 짐을 미리 싸두고, 당일은 새벽 이동만 포함 (별도 일정 없음)
- afternoon: 오전 체크아웃 후 반나절 일정 포함
- evening: 체크아웃 후 오전+점심을 포함한 풀 일정 가능

## 매일 일정에 반드시 포함할 것
- 아침식사 (07:00~08:00)
- 점심식사 (12:00~13:00)
- 저녁식사 (18:00~19:00)
- 각 일정 항목의 desc에 이동수단을 명시 (그랩/도보/오토바이택시 등)
- 공항↔숙소 이동 일정을 반드시 포함 (도착일, 출발일)

응답 JSON 형식:
{
  "score": { "total": 96, "route": 98, "budget": 97, "food": 100, "photo": 95, "satisfaction": 94 },
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
  "budget": { "flight": 35, "hotel": 28, "food": 18, "transport": 7, "shopping": 7, "emergency": 5 },
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
      "category": "맛집|카페|시장"
    }
  ],
  "hotel": {
    "name": "풀만 다낭 비치 리조트",
    "nameEn": "Pullman Danang Beach Resort",
    "style": "beach",
    "pricePerNight": 18,
    "totalCost": 72,
    "location": "미케비치 직접 연결",
    "features": ["비치 프론트", "인피니티풀", "조식 포함"],
    "lat": 16.0471,
    "lng": 108.2478,
    "rating": 4.5,
    "bookingUrl": "https://www.agoda.com/pullman-danang"
  }
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
- 예산: ${input.budget}만원
- 인원: ${input.people}
- 관심사: ${input.interests.join(", ") || "없음"}
- 다낭 도착 시간대: ${TIME_OF_DAY_LABEL[input.arrivalTime]}
- 귀국 출발 시간대: ${TIME_OF_DAY_LABEL[input.departureTime]}

## 확정된 숙소 (이 정보를 응답의 hotel 필드에 그대로 사용, 동선 설계의 기준점으로 사용)
- 이름: ${hotel.name} (${hotel.nameEn})
- 스타일: ${hotel.style}
- 위치: ${hotel.location} (좌표 ${hotel.lat},${hotel.lng})
- 1박 가격: ${hotel.pricePerNight}만원, 총 숙박비(${nights}박): ${hotel.totalCost}만원
- 특징: ${hotel.features.join(", ")}
- 평점: ${hotel.rating}
- 예약 링크: ${hotel.bookingUrl}

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

  const budget = parsed.budget as TravelResult["budget"];

  return {
    score: normalizeScore(parsed.score),
    days: (parsed.days as TravelResult["days"]) ?? [],
    // hotel과 마찬가지로 budget.hotel도 실제 계산값으로 덮어써 Groq의 산수 오차를 방지한다.
    budget: { ...budget, hotel: hotel.totalCost },
    hiddenSpots: (parsed.hiddenSpots as TravelResult["hiddenSpots"]) ?? [],
    checklist: normalizeChecklist(parsed.checklist),
    hotel,
  };
}
