-- VOYAGO Supabase schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Replaces the earlier travel_results/hidden_spots schema with a normalized
-- cities/places/travel_results structure that can hold any city, not just Da Nang.

create extension if not exists pgcrypto;
-- places(city_id, tags) 복합 GIN 인덱스에 uuid 컬럼(city_id)을 포함시키기 위해 필요
create extension if not exists btree_gin;

-- 테이블 1: cities (서비스 지원 도시)
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name_ko text not null,
  name_en text not null,
  country text not null,
  currency text not null,
  -- 현지 통화 1만 단위당 원화 환율 (예: 1만동 ≈ 560원 → 560)
  exchange_rate numeric,
  visa_info text,
  best_season text,
  status text not null default 'coming_soon' check (status in ('active', 'coming_soon')),
  lat double precision not null,
  lng double precision not null,
  -- 콘센트 타입, 추천 eSIM, 치안 정보 등 구조화하지 않은 부가 정보
  meta jsonb not null default '{}'::jsonb
);

comment on column public.cities.exchange_rate is '현지 통화 1만 단위당 원화 환율 (예: 1만동 ≈ 560원 → 560)';

-- 테이블 2: places (맛집·카페·관광지·호텔을 type으로 구분해 통합 관리)
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  type text not null check (type in ('restaurant', 'cafe', 'attraction', 'hotel')),
  name_ko text not null,
  name_en text,
  description text,
  address text,
  lat double precision not null,
  lng double precision not null,
  image_url text,
  -- 장소 유형별 점수 (예: 맛집/카페 { "localRatio": 92 }, 관광지 { "photoScore": 88, "congestion": "보통" }, 호텔 { "rating": 4.5 })
  scores jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  -- 만원 단위 (식사 1인 가격, 입장료, 호텔 1박 가격 등). 무료/정보없음은 0
  price integer,
  open_hours text,
  -- type = 'hotel'일 때만 사용 (beach | city | hoian | budget | poolvilla)
  hotel_style text check (hotel_style is null or hotel_style in ('beach', 'city', 'hoian', 'budget', 'poolvilla')),
  hotel_stars numeric,
  booking_url text,
  -- 데이터 출처 메모 (예: "실제 검색으로 수집한 검증 데이터")
  source text,
  is_active boolean not null default true,
  verified_at timestamptz,
  updated_at timestamptz not null default now(),
  notes text
);

comment on column public.places.price is '만원 단위 (식사 1인 가격, 입장료, 호텔 1박 가격 등). 무료/정보없음은 0';
comment on column public.places.scores is '장소 유형별 점수 jsonb. 맛집/카페: {"localRatio": number}, 관광지: {"photoScore": number, "congestion": string}, 호텔: {"rating": number}';

-- 테이블 3: travel_results (AI가 생성한 여행 일정 결과)
create table if not exists public.travel_results (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  city_id uuid references public.cities(id) on delete set null,
  input_json jsonb not null,
  result_json jsonb not null,
  share_token text not null unique default replace(gen_random_uuid()::text, '-', '')
);

-- 인덱스
create index if not exists places_city_type_idx
  on public.places (city_id, type);

create index if not exists places_city_tags_gin_idx
  on public.places using gin (city_id, tags);

create index if not exists places_scores_gin_idx
  on public.places using gin (scores);

-- RLS: 읽기는 전체 허용, 쓰기는 인증 필요
alter table public.cities enable row level security;
alter table public.places enable row level security;
alter table public.travel_results enable row level security;

create policy "cities_select_all"
  on public.cities for select
  using (true);

create policy "cities_insert_auth"
  on public.cities for insert
  with check (auth.role() = 'authenticated');

create policy "cities_update_auth"
  on public.cities for update
  using (auth.role() = 'authenticated');

create policy "cities_delete_auth"
  on public.cities for delete
  using (auth.role() = 'authenticated');

create policy "places_select_all"
  on public.places for select
  using (true);

create policy "places_insert_auth"
  on public.places for insert
  with check (auth.role() = 'authenticated');

create policy "places_update_auth"
  on public.places for update
  using (auth.role() = 'authenticated');

create policy "places_delete_auth"
  on public.places for delete
  using (auth.role() = 'authenticated');

create policy "travel_results_select_all"
  on public.travel_results for select
  using (true);

create policy "travel_results_insert_auth"
  on public.travel_results for insert
  with check (auth.role() = 'authenticated');

create policy "travel_results_update_auth"
  on public.travel_results for update
  using (auth.role() = 'authenticated');

create policy "travel_results_delete_auth"
  on public.travel_results for delete
  using (auth.role() = 'authenticated');
