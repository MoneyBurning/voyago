import { OG_IMAGE_CONTENT_TYPE, OG_IMAGE_SIZE, renderOgImage } from "@/lib/ogImage";

export const alt = "VOYAGO — AI 여행 설계";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return renderOgImage("AI 여행 설계", "출발지·예산·취향만 말하면 동선, 숨은 맛집, 예산까지 5초 완성");
}
