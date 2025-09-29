// next.config.ts
import type { NextConfig } from "next";

// next.config.js
/** @type {import('next').NextConfig} */ 
const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(), // ✅ path/__dirname 불필요

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
 
  images: {
    // 외부 이미지 허용 목록
    remotePatterns: [
      { protocol: "http",  hostname: "tong.visitkorea.or.kr", pathname: "/**" },
      { protocol: "https", hostname: "cdn.visitkorea.or.kr",  pathname: "/**" },
      // 필요하면 추가
      { protocol: "https", hostname: "korean.visitkorea.or.kr", pathname: "/**" },
      { protocol: "https", hostname: "api.visitkorea.or.kr",    pathname: "/**" },
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: "https", hostname: "images.unsplash.com" },
      {
        protocol: "https",
        hostname: "conlab.visitkorea.or.kr",
        pathname: "/api/depot/public/depot-flow/query/download-image/**",
      },
   
      
    ],
  },
};

export default nextConfig;
