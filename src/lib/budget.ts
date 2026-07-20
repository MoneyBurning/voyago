import { danangHotels, type HotelOption } from "@/data/danang";
import type { HotelRecommendation, HotelStyle, TravelBudget, TravelDuration } from "@/types/travel";

/** "3박4일" 형식의 문자열에서 숙박 일수(박수)를 추출 */
export function getNights(duration: TravelDuration): number {
  const match = duration.match(/^(\d+)박/);
  return match ? Number(match[1]) : 1;
}

/**
 * 예산·숙소 스타일에 맞는 호텔을 DB에서 결정론적으로 선택.
 * 해당 예산 구간에 맞는 호텔이 없으면 같은 스타일 중 최저가로 대체.
 */
function selectHotelOption(hotelStyle: HotelStyle, budget: TravelBudget): HotelOption {
  const candidates = danangHotels.filter((hotel) => hotel.style === hotelStyle);
  const exactMatch = candidates.find((hotel) => hotel.budgetTiers.includes(budget));
  if (exactMatch) return exactMatch;
  return candidates.reduce((cheapest, hotel) =>
    hotel.pricePerNight < cheapest.pricePerNight ? hotel : cheapest
  );
}

/**
 * 해당 예산 구간에 이 숙소 스타일의 실제 호텔이 있는지 확인 (fallback 제외, 정확히 매칭되는 경우만 true).
 * SearchCard에서 예산과 맞지 않는 숙소 스타일을 미리 막는 데 사용 — 총 숙박비가
 * 전체 예산을 초과하는 조합(예: 풀빌라 + 50만원)이 아예 선택되지 않도록 한다.
 */
export function isHotelStyleAvailable(hotelStyle: HotelStyle, budget: TravelBudget): boolean {
  return danangHotels.some((hotel) => hotel.style === hotelStyle && hotel.budgetTiers.includes(budget));
}

/** 예산·숙소 스타일·기간을 바탕으로 확정 숙소(총 숙박비 포함)를 계산 */
export function resolveHotel(
  hotelStyle: HotelStyle,
  budget: TravelBudget,
  duration: TravelDuration
): HotelRecommendation {
  const option = selectHotelOption(hotelStyle, budget);
  const nights = getNights(duration);
  return {
    name: option.name,
    nameEn: option.nameEn,
    style: option.style,
    pricePerNight: option.pricePerNight,
    totalCost: option.pricePerNight * nights,
    location: option.location,
    features: option.features,
    lat: option.lat,
    lng: option.lng,
    rating: option.rating,
    bookingUrl: option.bookingUrl,
  };
}
