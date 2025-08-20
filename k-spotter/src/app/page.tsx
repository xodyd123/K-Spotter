// app/page.tsx
"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    kakao?: any;
  }
}

export default function Page() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const init = () => {
     // if (!window.kakao?.maps) return;

      // autoload=false → 반드시 load 콜백 안에서 초기화
      window.kakao.maps.load(() => {
        if (!mapRef.current) return;

        const { kakao } = window;

        // 지도 생성 (서울 시청 근처)
        const map = new kakao.maps.Map(mapRef.current, {
          center: new kakao.maps.LatLng(37.5665, 126.9780),
          level: 5,
        });

        // 마커 (예: 길상사)
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(37.5955, 127.0048),
          map,
          title: "길상사(도깨비 Ep.01)",
        });

        const info = new kakao.maps.InfoWindow({
          content: '<div style="padding:6px 10px;">길상사 (도깨비)</div>',
        });

        kakao.maps.event.addListener(marker, "click", () => {
          info.open(map, marker);
        });
      });
    };

    // 1) 이미 SDK가 준비된 경우 즉시 초기화
    if (window.kakao?.maps) {
      init();
    }

    // 2) 아직이면, 로드 이벤트를 기다렸다가 초기화
    const onLoaded = () => init();
    window.addEventListener("kakao:loaded", onLoaded);

    return () => {
      window.removeEventListener("kakao:loaded", onLoaded);
    };
  }, []);

  // ✅ Tailwind 대신 확실히 보이도록 inline 스타일도 함께 지정
  return (
    <div
      ref={mapRef}
      className="w-full h-screen"
      style={{ width: "100%", height: "100vh" }}
    />
  );
}
