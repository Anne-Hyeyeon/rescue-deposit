import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "절대지켜 - 다가구 전세사기 배당금 계산기";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0a2618 0%, #18181b 50%, #09090b 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Accent circle decoration */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(77, 124, 111, 0.15)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(77, 124, 111, 0.1)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: "#fafafa",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              textAlign: "center",
              display: "flex",
            }}
          >
            절대지켜
          </div>
          <div
            style={{
              width: 60,
              height: 3,
              background: "#4d7c6f",
              borderRadius: 2,
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 34,
              color: "#6dc9a0",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              textAlign: "center",
              display: "flex",
            }}
          >
            전세사기 배당금 계산기 · 배당 시뮬레이터
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#a1a1aa",
              textAlign: "center",
              display: "flex",
            }}
          >
            보증금, 다시 되찾을 때까지.
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#71717a",
              textAlign: "center",
              display: "flex",
            }}
          >
            다가구 전세사기 피해자가 직접 만든 사이트입니다
          </div>
        </div>

        {/* Bottom badge */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 20px",
            borderRadius: 100,
            border: "1px solid rgba(77, 124, 111, 0.3)",
            background: "rgba(77, 124, 111, 0.1)",
          }}
        >
          <div style={{ fontSize: 16, color: "#6dc9a0", display: "flex" }}>
            rescue-deposit.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
