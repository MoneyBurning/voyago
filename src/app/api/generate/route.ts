import { NextResponse } from "next/server";
import { generateTravelPlan } from "@/lib/groq";
import type { TravelInput } from "@/types/travel";

export const maxDuration = 30;

function isValidTravelInput(value: unknown): value is TravelInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;
  return (
    typeof input.departure === "string" &&
    typeof input.destination === "string" &&
    typeof input.duration === "string" &&
    typeof input.travelMonth === "number" &&
    input.travelMonth >= 1 &&
    input.travelMonth <= 12 &&
    typeof input.budget === "string" &&
    typeof input.people === "string" &&
    Array.isArray(input.interests) &&
    typeof input.arrivalTime === "string" &&
    typeof input.departureTime === "string" &&
    typeof input.hotelStyle === "string"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바른 JSON이 아닙니다." }, { status: 400 });
  }

  if (!isValidTravelInput(body)) {
    return NextResponse.json({ error: "필수 여행 조건이 누락되었습니다." }, { status: 400 });
  }

  try {
    const result = await generateTravelPlan(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/generate]", error);
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    const status = /시간.?초과|timeout/i.test(message) ? 504 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
