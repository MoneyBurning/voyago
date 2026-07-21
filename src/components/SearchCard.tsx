"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "./LoadingScreen";
import { isHotelStyleAvailable } from "@/lib/budget";
import {
  DESTINATION_STATUS,
  type DepartureCity,
  type Destination,
  type HotelStyle,
  type Interest,
  type TimeOfDay,
  type TravelBudget,
  type TravelDuration,
  type TravelInput,
  type TravelMonth,
  type TravelPeople,
} from "@/types/travel";

const DEPARTURE_OPTIONS: DepartureCity[] = ["서울", "부산", "대구", "광주", "청주", "제주"];

const DURATION_OPTIONS: TravelDuration[] = ["3박4일", "4박5일", "5박6일", "6박7일"];

const PEAK_MONTHS = new Set([1, 7, 8]);
const SHOULDER_MONTHS = new Set([5, 6, 9, 10]);

/** 항공권 성수기 안내를 함께 보여주기 위한 월 옵션 라벨 (lib/budget.ts의 성수기 판별 기준과 동일) */
function getMonthLabel(month: number): string {
  if (PEAK_MONTHS.has(month)) return `${month}월 (성수기)`;
  if (SHOULDER_MONTHS.has(month)) return `${month}월 (준성수기)`;
  return `${month}월 (비수기)`;
}

const MONTH_OPTIONS: TravelMonth[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const BUDGET_OPTIONS: { value: TravelBudget; label: string }[] = [
  { value: "50", label: "50만원" },
  { value: "100", label: "100만원" },
  { value: "150", label: "150만원" },
  { value: "200", label: "200만원" },
  { value: "200+", label: "200만원+" },
];

const PEOPLE_OPTIONS: TravelPeople[] = ["혼자", "커플", "친구2~4명", "가족", "부모님"];

const INTEREST_OPTIONS: Interest[] = [
  "먹방",
  "야경",
  "해변",
  "사진",
  "쇼핑",
  "힐링",
  "역사",
  "액티비티",
  "술",
  "카페",
  "바나힐",
  "호이안",
];

const ARRIVAL_TIME_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: "morning", label: "오전 도착 (06:00~11:59)" },
  { value: "afternoon", label: "오후 도착 (12:00~17:59)" },
  { value: "evening", label: "저녁 도착 (18:00~23:59)" },
];

const DEPARTURE_TIME_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: "morning", label: "오전 출발 (06:00~11:59)" },
  { value: "afternoon", label: "오후 출발 (12:00~17:59)" },
  { value: "evening", label: "저녁 출발 (18:00~23:59)" },
];

const HOTEL_STYLE_OPTIONS: { value: HotelStyle; label: string }[] = [
  { value: "beach", label: "🏖 미케비치 리조트 (해변 바로 앞)" },
  { value: "city", label: "🏙 다낭 시내 호텔 (한시장/용다리)" },
  { value: "hoian", label: "🏮 호이안 올드타운 숙소" },
  { value: "budget", label: "💰 가성비 호텔 (3성급)" },
  { value: "poolvilla", label: "🌊 럭셔리 풀빌라" },
];

const selectClass =
  "rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none";

/** 여행 조건 입력 폼 (글래스모피즘 카드) */
export default function SearchCard() {
  const router = useRouter();
  const [departure, setDeparture] = useState<DepartureCity | "">("");
  const [destination, setDestination] = useState<Destination>("다낭");
  const [duration, setDuration] = useState<TravelDuration>("4박5일");
  const [travelMonth, setTravelMonth] = useState<TravelMonth>((new Date().getMonth() + 1) as TravelMonth);
  const [budget, setBudget] = useState<TravelBudget>("100");
  const [people, setPeople] = useState<TravelPeople>("혼자");
  const [interests, setInterests] = useState<Interest[]>([]);
  const [arrivalTime, setArrivalTime] = useState<TimeOfDay>("morning");
  const [departureTime, setDepartureTime] = useState<TimeOfDay>("evening");
  const [hotelStyle, setHotelStyle] = useState<HotelStyle>("city");
  const [loading, setLoading] = useState(false);

  function toggleInterest(interest: Interest) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((item) => item !== interest) : [...prev, interest]
    );
  }

  async function handleSubmit() {
    if (!departure) {
      alert("출발 도시를 선택해주세요.");
      return;
    }

    const input: TravelInput = {
      departure,
      destination,
      duration,
      travelMonth,
      budget,
      people,
      interests,
      arrivalTime,
      departureTime,
      hotelStyle,
    };

    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "여행 일정 생성에 실패했습니다.");
      }

      const result = await response.json();
      sessionStorage.setItem("voyago_result", JSON.stringify(result));
      sessionStorage.setItem("voyago_input", JSON.stringify(input));
      // SNS 공유 시 크롤러가 볼 og:title(app/result/page.tsx의 generateMetadata)을
      // 위해 실제 콘텐츠(sessionStorage)와 별개로 요약값을 쿼리스트링에도 실어 보낸다.
      const shareParams = new URLSearchParams({
        destination: input.destination,
        duration: input.duration,
        score: String(result.score.total),
      });
      router.push(`/result?${shareParams.toString()}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "여행 일정 생성에 실패했습니다.");
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm text-subtext">
          출발 도시
          <select
            value={departure}
            onChange={(e) => setDeparture(e.target.value as DepartureCity)}
            className={selectClass}
          >
            <option value="" disabled>
              선택
            </option>
            {DEPARTURE_OPTIONS.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-subtext">
          여행지
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value as Destination)}
            className={selectClass}
          >
            {DESTINATION_STATUS.map((option) => (
              <option key={option.value} value={option.value} disabled={!option.enabled}>
                {option.value}
                {option.enabled ? "" : " (준비중)"}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-subtext">
          기간
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value as TravelDuration)}
            className={selectClass}
          >
            {DURATION_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-subtext">
          출발 월
          <select
            value={travelMonth}
            onChange={(e) => setTravelMonth(Number(e.target.value) as TravelMonth)}
            className={selectClass}
          >
            {MONTH_OPTIONS.map((month) => (
              <option key={month} value={month}>
                {getMonthLabel(month)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-subtext">
          예산
          <select
            value={budget}
            onChange={(e) => {
              const nextBudget = e.target.value as TravelBudget;
              setBudget(nextBudget);
              if (!isHotelStyleAvailable(hotelStyle, nextBudget)) {
                setHotelStyle("city");
              }
            }}
            className={selectClass}
          >
            {BUDGET_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-subtext">
          인원
          <select
            value={people}
            onChange={(e) => setPeople(e.target.value as TravelPeople)}
            className={selectClass}
          >
            {PEOPLE_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-subtext">
          다낭 도착 시간대
          <select
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value as TimeOfDay)}
            className={selectClass}
          >
            {ARRIVAL_TIME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-subtext">
          귀국 출발 시간대
          <select
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value as TimeOfDay)}
            className={selectClass}
          >
            {DEPARTURE_TIME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-subtext">
          숙소 스타일
          <select
            value={hotelStyle}
            onChange={(e) => setHotelStyle(e.target.value as HotelStyle)}
            className={selectClass}
          >
            {HOTEL_STYLE_OPTIONS.map((option) => {
              const available = isHotelStyleAvailable(option.value, budget);
              return (
                <option key={option.value} value={option.value} disabled={!available}>
                  {option.label}
                  {available ? "" : " (이 예산에서 이용 불가)"}
                </option>
              );
            })}
          </select>
        </label>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm text-subtext">관심사</p>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const active = interests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-gold bg-gold/20 text-gold"
                    : "border-white/15 text-subtext hover:border-gold/40 hover:text-white"
                }`}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="mt-8 w-full rounded-full bg-gold py-3 text-center font-semibold text-background transition-opacity hover:opacity-90"
      >
        AI 여행 설계하기
      </button>
    </div>
  );
}
