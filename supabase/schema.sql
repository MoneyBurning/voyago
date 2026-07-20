-- VOYAGO Supabase schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query).

create extension if not exists pgcrypto;

-- 테이블 1: travel_results (생성된 여행 일정 결과)
create table if not exists public.travel_results (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  departure text not null,
  destination text not null,
  duration text not null,
  budget text not null,
  people text not null,
  interests text[] not null default '{}',
  result_json jsonb not null,
  share_token text not null unique default replace(gen_random_uuid()::text, '-', '')
);

create index if not exists travel_results_share_token_idx
  on public.travel_results (share_token);

-- 테이블 2: hidden_spots (도시별 숨은 로컬 맛집/장소)
create table if not exists public.hidden_spots (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  name text not null,
  name_en text,
  location text,
  description text,
  local_ratio integer,
  lat double precision not null,
  lng double precision not null,
  category text,
  verified_at timestamptz,
  trust_score integer
);

create index if not exists hidden_spots_city_idx
  on public.hidden_spots (city);

-- RLS: 읽기는 전체 허용, 쓰기는 인증 필요
alter table public.travel_results enable row level security;
alter table public.hidden_spots enable row level security;

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

create policy "hidden_spots_select_all"
  on public.hidden_spots for select
  using (true);

create policy "hidden_spots_insert_auth"
  on public.hidden_spots for insert
  with check (auth.role() = 'authenticated');

create policy "hidden_spots_update_auth"
  on public.hidden_spots for update
  using (auth.role() = 'authenticated');

create policy "hidden_spots_delete_auth"
  on public.hidden_spots for delete
  using (auth.role() = 'authenticated');
