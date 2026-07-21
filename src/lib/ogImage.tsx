import { ImageResponse } from "next/og";

/** SNS 공유 이미지 표준 크기 (Open Graph/Twitter 권장 1200x630) */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_CONTENT_TYPE = "image/png";

/**
 * 실제 다낭 사진 에셋 대신, 브랜드 톤(다크 네이비 배경 + 다낭 노을을 연상시키는
 * 골드 그라디언트)으로 1200x630 공유 이미지를 코드로 생성한다. app/globals.css의
 * --background(#0d1117)/--gold(#c9933a) 브랜드 컬러와 동일하게 맞춘다.
 */
export function renderOgImage(title: string, subtitle: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d1117",
          backgroundImage: "radial-gradient(circle at 50% 115%, #c9933a 0%, #7a4a1f 30%, #0d1117 64%)",
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", fontSize: 108, fontWeight: 700, letterSpacing: -2, color: "#f5d38a" }}>
          VOYAGO
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 40,
            fontWeight: 600,
            color: "#f0f0f0",
            textAlign: "center",
            maxWidth: 940,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 24,
            color: "#9aa4b2",
            textAlign: "center",
            maxWidth: 880,
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    OG_IMAGE_SIZE
  );
}
