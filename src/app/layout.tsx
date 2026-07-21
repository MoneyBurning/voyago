import type { Metadata } from "next";
import { Noto_Sans_KR, Playfair_Display, Space_Mono } from "next/font/google";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-kr",
  weight: ["400", "500", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const OG_TITLE = "VOYAGO — AI 여행 설계";
const OG_DESCRIPTION = "출발지·예산·취향만 말하면 동선, 숨은 맛집, 예산까지 5초 완성";

// 배포 도메인이 정해지면 NEXT_PUBLIC_SITE_URL을 설정해야 OG 이미지 등 상대경로가
// 절대 URL로 정상 변환된다 (미설정 시 로컬 개발 기준으로 폴백).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "VOYAGO — 여행을 설계하다, 블로그 없이",
  description:
    "출발지·예산·취향만 말하면 AI가 동선·숨은 맛집·예산까지 5초 만에 여행 일정을 설계합니다.",
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: "VOYAGO",
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${playfairDisplay.variable} ${notoSansKR.variable} ${spaceMono.variable} h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
