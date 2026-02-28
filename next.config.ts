import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  // Turbopack 설정 (dev 모드에서 빈 설정으로 webpack config 충돌 방지)
  turbopack: {},
};

export default withPWA(nextConfig);
