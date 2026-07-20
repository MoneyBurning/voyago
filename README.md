# VOYAGO — AI Travel OS

블로그 검색 없이, 출발지·예산·취향만 입력하면 AI가 전체 여행 일정을 5초 만에 설계하는 여행 플래너입니다. 첫 번째 타깃 도시는 **베트남 다낭**입니다.

## 기술 스택

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Groq API** (`llama-3.3-70b-versatile`) — AI 일정 생성
- **Supabase** — DB + 인증
- **Leaflet + OpenStreetMap** — 동선 지도
- **Vercel** — 배포

## 로컬 실행 방법

1. 의존성 설치

   ```bash
   npm install
   ```

2. 환경변수 설정

   `.env.local` 파일을 프로젝트 루트에 생성하고 아래 값을 채워주세요.

   ```bash
   GROQ_API_KEY=여기에_그록_API_키
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_supabase_publishable_키
   ```

   - Groq API 키: https://console.groq.com
   - Supabase URL / anon(publishable) 키: Supabase 프로젝트 → Settings → API

3. (최초 1회) Supabase 테이블 생성

   `supabase/schema.sql`의 내용을 Supabase 프로젝트의 SQL Editor에 붙여넣고 실행합니다. `travel_results`, `hidden_spots` 두 테이블과 RLS 정책이 생성됩니다.

4. 개발 서버 실행

   ```bash
   npm run dev
   ```

   [http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx              # 메인 홈 — 여행 입력 폼
│   ├── result/page.tsx       # 결과 페이지 — 일정/예산/맛집/지도
│   └── api/
│       ├── generate/route.ts # Groq API — 일정 생성
│       └── spots/route.ts    # Overpass API — 장소 데이터 (예정)
├── components/                # Hero, SearchCard, Timeline, MapView 등
├── lib/                        # groq.ts, supabase.ts, overpass.ts, budget.ts
├── types/travel.ts             # 공용 타입 정의
└── data/danang.ts              # 다낭 기본 데이터 (숨은 맛집/관광지/예산표)
```

## 배포 (Vercel)

1. Vercel 프로젝트를 생성하고 이 저장소를 연결합니다.
2. Project Settings → Environment Variables 에 아래 값을 등록합니다.
   - `GROQ_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `npm run build` 로 빌드 에러가 없는지 로컬에서 먼저 확인합니다.
4. `MapView.tsx`(Leaflet)는 `next/dynamic` + `ssr: false` 로 이미 감싸져 있으므로 별도 조치가 필요 없지만, 배포 후 `/result` 페이지에서 지도가 정상 렌더링되는지 확인하세요.
