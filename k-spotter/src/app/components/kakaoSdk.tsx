// components/KakaoSDK.tsx
"use client";

import Script from "next/script";


export default function KakaoSDK() {


  return (
    <Script
    id="kakao-sdk"
    strategy="afterInteractive"
    src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&autoload=false&libraries=services,clusterer`}
    onLoad={() => {
      window.dispatchEvent(new Event("kakao:loaded"));
    }}
  />
  );
}
