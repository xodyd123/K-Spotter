// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 외부 이미지 허용 목록
    remotePatterns: [
      { protocol: "http",  hostname: "tong.visitkorea.or.kr", pathname: "/**" },
      { protocol: "https", hostname: "cdn.visitkorea.or.kr",  pathname: "/**" },
      // 필요하면 추가
      { protocol: "https", hostname: "korean.visitkorea.or.kr", pathname: "/**" },
      { protocol: "https", hostname: "api.visitkorea.or.kr",    pathname: "/**" },
    ],
  },
};

export default nextConfig;
