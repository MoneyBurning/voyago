# VOYAGO — Claude Code 최종 명령 프롬프트

---

## 📌 이 파일 사용법
Claude Code 터미널에서 실행 후,
아래 프롬프트를 Claude Code에 순서대로 붙여넣는다.

---

## STEP 1 — 프로젝트 생성

터미널에서 직접 실행:

```bash
npx create-next-app@latest voyago --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd voyago
npm install groq-sdk @supabase/supabase-js leaflet react-leaflet @types/leaflet lucide-react
```

---

## STEP 2 — Claude Code 첫 번째 프롬프트

```
나는 "VOYAGO"라는 AI 여행 설계 웹서비스를 만든다.

## 프로젝트 개요
- 사용자가 여행지·예산·취향을 입력하면 AI가 전체 여행 일정을 자동 설계
- 첫 번째 타깃 도시: 베트남 다낭
- 블로그 검색 없이 5초 만에 완성되는 여행 플래너

## 기술 스택
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Groq API (AI 일정 생성 — llama-3.3-70b-versatile 모델)
- Supabase (DB + 인증)
- Leaflet + OpenStreetMap (지도)
- Vercel (배포)

## 디자인 방향
- 색상: 딥네이비(#0D1117) 배경 + 골드(#C9933A) 포인트 + 화이트 텍스트
- 분위기: 프리미엄 여행 잡지 느낌 (어둡고 고급스럽게)
- 폰트: Playfair Display (제목) + Noto Sans KR (본문) + Space Mono (데이터)
- 배경: 세계지도 격자 + 위도선 + 도시 펄스 애니메이션

## 폴더 구조를 먼저 만들어줘

src/
├── app/
│   ├── page.tsx              (메인 홈 — 여행 입력 폼)
│   ├── result/page.tsx       (결과 페이지 — 일정/예산/맛집)
│   ├── api/
│   │   ├── generate/route.ts (Groq API — 일정 생성)
│   │   └── spots/route.ts    (Overpass API — 다낭 장소 데이터)
│   └── layout.tsx
├── components/
│   ├── Hero.tsx              (메인 히어로 섹션)
│   ├── SearchCard.tsx        (여행 입력 폼)
│   ├── LoadingScreen.tsx     (AI 생성 중 로딩)
│   ├── ResultHeader.tsx      (결과 상단 점수 배너)
│   ├── Timeline.tsx          (일정 타임라인)
│   ├── BudgetGrid.tsx        (예산 배분 차트)
│   ├── HiddenSpots.tsx       (숨은 로컬 맛집)
│   ├── MapView.tsx           (Leaflet 지도)
│   ├── Checklist.tsx         (준비물 체크리스트)
│   └── CityDots.tsx          (배경 도시 점 애니메이션)
├── lib/
│   ├── groq.ts               (Groq API 클라이언트)
│   ├── supabase.ts           (Supabase 클라이언트)
│   ├── overpass.ts           (OpenStreetMap 데이터)
│   └── budget.ts             (예산 계산 로직)
├── types/
│   └── travel.ts             (TypeScript 타입 정의)
└── data/
    └── danang.ts             (다낭 기본 DB 데이터)

위 폴더 구조대로 전체 파일을 생성해줘.
types/travel.ts 부터 시작해서 순서대로 만들어줘.
```

---

## STEP 3 — 타입 정의 프롬프트

```
types/travel.ts 파일에 아래 타입들을 정의해줘.

- TravelInput: 사용자 입력 (출발지, 여행지, 기간, 예산, 인원, 관심사 배열)
- TravelResult: AI 생성 결과 (일정, 예산, 맛집, 점수, 체크리스트)
- DaySchedule: 하루 일정 (day 번호, items 배열)
- ScheduleItem: 일정 항목 (시간, 장소명, 설명, 카테고리, 좌표, 뱃지타입)
- BudgetBreakdown: 예산 배분 (항공, 숙소, 식비, 교통, 쇼핑, 비상금)
- HiddenSpot: 숨은 맛집 (이름, 영문명, 위치, 설명, 현지인비율, 좌표, 카테고리)
- ChecklistItem: 준비물 (id, 텍스트, 완료여부, 카테고리)
- TravelScore: 여행 점수 (총점, 동선, 예산, 먹방, 사진, 만족도예측)

모든 타입은 export하고 JSDoc 주석도 달아줘.
```

---

## STEP 4 — 다낭 기본 데이터 프롬프트

```
data/danang.ts 파일에 다낭 기본 데이터를 만들어줘.

포함할 내용:
1. 숨은 로컬 맛집 10곳 (현지인 비율 85% 이상인 곳만)
   - 반미 Phượng (호이안)
   - 분보후에 55 (한시장 골목)
   - 미꽝 1A
   - 껌가 바부이 (호이안)
   - 바인쎄오 식당 (다낭 로컬)
   - 등 실제 존재하는 곳으로 채워줘

2. 주요 관광지 15곳
   - 좌표(lat, lng) 포함
   - 추천 방문 시간대
   - 평균 체류시간
   - 사진점수, 혼잡도, 입장료

3. 예산 테이블 (50/100/150/200만원별)
   - 항공, 숙소, 식비, 교통, 쇼핑, 비상금 배분

4. 다낭 기본 정보
   - 환율 (1만동 = 약 560원)
   - 날씨 (건기: 1~8월 / 우기: 9~12월)
   - 콘센트 타입
   - 추천 eSIM
   - 비자 정보 (한국인 무비자 45일)
   - 치안 정보

TypeScript로 작성하고 모두 export해줘.
```

---

## STEP 5 — Groq API 연동 프롬프트

```
lib/groq.ts 와 app/api/generate/route.ts 를 만들어줘.

## Groq 설정
- 모델: llama-3.3-70b-versatile
- API Key: 환경변수 GROQ_API_KEY 사용

## route.ts 에서 할 일
POST 요청을 받아서:
1. TravelInput을 받음
2. 아래 시스템 프롬프트로 Groq에 요청
3. JSON으로 파싱해서 TravelResult 반환

## 시스템 프롬프트 (이걸 그대로 써줘)

---
당신은 베트남 다낭 전문 AI 여행 설계사입니다.
다음 규칙을 반드시 지켜주세요:

1. 응답은 반드시 JSON만 출력 (마크다운 금지, 설명 금지)
2. 관광지 추천 시 동선 효율을 최우선으로 고려
3. 식사는 현지인 맛집 위주로 추천 (유명 관광지 식당 지양)
4. 예산을 절대 초과하지 않음
5. 하루 걸음수 15,000보 이하로 설계
6. 사용자 관심사(interests)를 80% 이상 반영
7. 각 장소는 실제 존재하는 곳만 추천

응답 JSON 형식:
{
  "score": { "total": 96, "route": 98, "budget": 97, "food": 100, "satisfaction": 94 },
  "days": [
    {
      "day": 1,
      "items": [
        {
          "time": "09:00",
          "name": "장소명",
          "desc": "설명 (2줄 이내)",
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
  ]
}
---

에러 처리도 포함하고, 응답 타임아웃은 30초로 설정해줘.
```

---

## STEP 6 — 메인 페이지 프롬프트

```
app/page.tsx 와 components/Hero.tsx, components/SearchCard.tsx 를 만들어줘.

## 디자인 스펙
배경: #0D1117 (딥네이비)
포인트: #C9933A (골드)
보조: #E8B96A (라이트골드)
텍스트: #FFFFFF
서브텍스트: #6B8A96

## Hero.tsx
- 전체 화면(100vh)
- 배경: CSS로 세계지도 격자 (60px grid, 골드 6% 투명도)
- 위도선: SVG ellipse로 표현
- 도시 점: 6개 (다낭, 방콕, 발리, 오사카, 도쿄, 싱가포르)
  각 점은 pulse 애니메이션 + ripple 효과
- 제목: "여행을 설계하다, 블로그 없이" (Playfair Display)
- 서브: "출발지·예산·취향만 말하면 — 동선, 숨은 맛집, 예산까지 5초 완성"
- 하단 통계: 검증 맛집 1,240+ / 만족도 98% / 일정 완성 5초

## SearchCard.tsx
반드시 포함:
- 출발 도시 select (서울/부산/대구/광주/청주/제주)
- 여행지 select (다낭 활성화, 나머지 disabled "준비중")
- 기간 select (3박4일/4박5일/5박6일/6박7일)
- 예산 select (50/100/150/200/200만원+)
- 인원 select (혼자/커플/친구2~4명/가족/부모님)
- 관심사 태그 (먹방/야경/해변/사진/쇼핑/힐링/역사/액티비티/술/카페)
  클릭하면 active 토글
- "AI 여행 설계하기" 버튼

버튼 클릭 시:
1. 출발지 미선택이면 alert
2. /api/generate 에 POST
3. 로딩 화면 표시
4. 결과를 sessionStorage에 저장
5. /result 로 이동

글래스모피즘 카드 스타일로 만들어줘.
```

---

## STEP 7 — 결과 페이지 프롬프트

```
app/result/page.tsx 와 관련 컴포넌트들을 만들어줘.

## 구성 순서
1. ResultHeader — 점수 배너 (총점 크게, 통계 나열)
2. 일정 탭 (Day1~Day4) + Timeline 컴포넌트
3. BudgetGrid — 예산 배분 (6개 카테고리, 바 애니메이션)
4. HiddenSpots — 숨은 맛집 그리드 (2열, 현지인% 뱃지)
5. MapView — Leaflet 지도 (동선 표시)
6. Checklist — 클릭하면 완료 처리

## Timeline.tsx
- 세로 타임라인 (왼쪽 골드 선)
- 각 항목: 시간 | 장소명 | 설명 | 카테고리 뱃지
- 뱃지 색상: 식사(골드) | 관광(블루) | 이동(그레이) | 추천(레드)
- 항목 등장 시 fadeIn 애니메이션

## MapView.tsx
- dynamic import (SSR 비활성화 필수)
- OpenStreetMap 타일
- 일정 장소들 마커 표시 (골드 색상)
- 마커 클릭 시 장소명 팝업
- 동선을 polyline으로 연결

## BudgetGrid.tsx
- 6개 카드 (항공/숙소/식비/교통/쇼핑/비상금)
- 각 카드에 금액 + 진행 바
- 페이지 로드 시 바 채워지는 애니메이션

sessionStorage에서 TravelResult 읽어서 렌더링.
데이터 없으면 홈으로 redirect.
```

---

## STEP 8 — 환경변수 설정 프롬프트

```
.env.local 파일 템플릿과 Supabase 초기 설정을 만들어줘.

## .env.local
GROQ_API_KEY=여기에_groq_api_key_입력
NEXT_PUBLIC_SUPABASE_URL=여기에_supabase_url_입력
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_supabase_anon_key_입력

## Supabase 테이블 SQL도 작성해줘

테이블 1: travel_results
- id (uuid, primary key)
- created_at (timestamp)
- departure (text) — 출발 도시
- destination (text) — 여행지
- duration (text) — 기간
- budget (text) — 예산
- people (text) — 인원
- interests (text[]) — 관심사 배열
- result_json (jsonb) — AI 생성 결과 전체
- share_token (text, unique) — 공유 링크용 토큰

테이블 2: hidden_spots
- id (uuid, primary key)
- city (text) — 도시 (danang, bangkok 등)
- name (text)
- name_en (text)
- location (text)
- description (text)
- local_ratio (integer) — 현지인 비율
- lat (float)
- lng (float)
- category (text)
- verified_at (timestamp) — 마지막 검증일
- trust_score (integer) — 신뢰도 점수

RLS 정책도 설정해줘 (읽기는 전체 허용, 쓰기는 인증 필요).
```

---

## STEP 9 — 배포 프롬프트

```
Vercel 배포를 위한 설정 파일들을 만들어줘.

1. vercel.json — 기본 설정
2. next.config.ts — 이미지 도메인, 환경변수 설정
3. README.md — 프로젝트 설명 + 로컬 실행 방법

그리고 배포 전 체크리스트도 알려줘:
- GROQ_API_KEY Vercel 환경변수 등록
- Supabase URL/KEY Vercel 등록
- 빌드 에러 확인
- Leaflet SSR 에러 확인
```

---

## STEP 10 — 막히면 쓰는 에러 해결 프롬프트

### Leaflet SSR 에러 발생 시
```
MapView 컴포넌트에서 "window is not defined" 에러가 난다.
dynamic import와 ssr:false 로 고쳐줘.
컴포넌트 파일 전체 다시 작성해줘.
```

### Groq 응답 파싱 에러 시
```
Groq API 응답이 JSON이 아닌 텍스트로 올 때가 있다.
응답에서 JSON 부분만 추출하는 파서를 만들어줘.
```json 코드블록 안에 있을 수도 있고 순수 JSON일 수도 있다.
두 경우 모두 처리해줘.
```

### Tailwind 클래스 안 먹힐 때
```
Tailwind CSS 클래스가 적용이 안 된다.
tailwind.config.ts 의 content 배열을 확인하고
src 디렉토리 경로가 포함되어 있는지 확인해줘.
```

---

## 📋 전체 개발 순서 요약

| 순서 | 작업 | 예상 시간 |
|------|------|-----------|
| 1 | 프로젝트 생성 + 패키지 설치 | 10분 |
| 2 | 폴더 구조 생성 | 5분 |
| 3 | 타입 정의 | 10분 |
| 4 | 다낭 기본 데이터 | 30분 |
| 5 | Groq API 연동 | 20분 |
| 6 | 메인 페이지 | 40분 |
| 7 | 결과 페이지 | 60분 |
| 8 | 환경변수 + Supabase | 20분 |
| 9 | 배포 | 15분 |
| **합계** | | **~3시간** |

---

## ⚠️ 주의사항

1. **Groq API Key** 먼저 발급받아야 함 → https://console.groq.com
2. **Supabase** 프로젝트 먼저 생성 → https://supabase.com
3. **MapView는 반드시 dynamic import** — SSR:false 없으면 에러
4. **각 STEP은 하나씩** — 한꺼번에 붙여넣지 말고 순서대로
5. 에러 나면 에러 메시지 전체를 Claude Code에 붙여넣기

---

*VOYAGO — AI Travel OS*
*다낭 → 방콕 → 발리 → 세계*
