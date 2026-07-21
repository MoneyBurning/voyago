import type { Metadata } from "next";
import ResultView from "./ResultView";

interface ResultPageProps {
  searchParams: Promise<{ destination?: string; duration?: string; score?: string }>;
}

const DEFAULT_OG_TITLE = "여행 계획 완성 — VOYAGO";
const DEFAULT_OG_DESCRIPTION = "출발지·예산·취향만 말하면 동선, 숨은 맛집, 예산까지 5초 완성";

/**
 * 결과 화면 자체(ResultView)는 sessionStorage 기반 클라이언트 컴포넌트라 SNS
 * 크롤러가 그 내용을 볼 수 없다. 공유 시 보여줄 og:title/description은
 * SearchCard가 /result로 이동할 때 함께 실어 보내는 destination/duration/score
 * 쿼리스트링으로 이 서버 컴포넌트가 만든다. 쿼리스트링이 없으면(직접 URL 접근 등)
 * 기본 문구로 대체한다.
 */
export async function generateMetadata({ searchParams }: ResultPageProps): Promise<Metadata> {
  const { destination, duration, score } = await searchParams;

  if (!destination || !duration || !score) {
    return { title: DEFAULT_OG_TITLE, description: DEFAULT_OG_DESCRIPTION };
  }

  const title = `${destination} ${duration} 여행 계획 — 총 ${score}점`;

  return {
    title,
    description: DEFAULT_OG_DESCRIPTION,
    openGraph: { title, description: DEFAULT_OG_DESCRIPTION },
    twitter: { title, description: DEFAULT_OG_DESCRIPTION },
  };
}

export default function ResultPage() {
  return <ResultView />;
}
