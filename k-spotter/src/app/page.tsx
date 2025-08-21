// app/page.tsx
"use client";

import { useEffect, useRef } from "react";
import { Place } from "../../type/type";

declare global {
  interface Window {
    kakao?: any;
  }
}

export default function Page() {
  const mapRef = useRef<HTMLDivElement>(null);

  // ✅ 중복 초기화/정리 핸들 보관
  const initializedRef = useRef(false);
  const cleanupRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!mapRef.current) return;

    const init = () => {
      if (!window.kakao?.maps) return;
      if (initializedRef.current) return;          // ✅ 중복 방지
      initializedRef.current = true;

      window.kakao.maps.load(async () => {
        if (!mapRef.current) return;

        const { kakao } = window;

        // 지도 생성
        const map = new kakao.maps.Map(mapRef.current, {
          center: new kakao.maps.LatLng(37.5665, 126.9780),
          level: 5,
        });

        // ✅ InfoWindow 1개만 재사용
        const info = new kakao.maps.InfoWindow({ content: "" });

        let markers = [];
        const offHandlers: Array<() => void> = [];

        try {
          const res = await fetch("/api/places");
          const places: Place[] = await res.json();

          if (!mapRef.current) return; // 언마운트 방어

          // ✅ 마커마다 개별 리스너 등록
          markers = places.map((item) => {
            const marker = new kakao.maps.Marker({
              position: new kakao.maps.LatLng(item.lat, item.lng),
              map,
              title: item.title,
            });

            const handler = () => {
              info.setContent(
                `<div style="padding:6px 10px;">${item.title}</div>`
              );
              info.open(map, marker);
            };

            kakao.maps.event.addListener(marker, "click", handler);
            offHandlers.push(() =>
              kakao.maps.event.removeListener(marker, "click", handler)
            );

            return marker;
          });

          // (선택) 전체 보이게 맞추기
          if (markers.length > 1) {
            const bounds = new kakao.maps.LatLngBounds();
            markers.forEach((m) => bounds.extend(m.getPosition()));
            map.setBounds(bounds);
          }
        } catch (e) {
          console.error("Failed to load places", e);
        }

        // ✅ 정리 루틴 등록
        cleanupRef.current = () => {
          info.close();
          offHandlers.forEach((off) => off());
          markers.forEach((m) => m.setMap(null));
          initializedRef.current = false;
        };
      });
    };

    // 1) 이미 SDK가 준비된 경우 즉시 초기화
    if (window.kakao?.maps) init();

    // 2) 커스텀 로드 이벤트 대기(사용 중이라면)
    const onLoaded = () => init();
    window.addEventListener("kakao:loaded", onLoaded);

    return () => {
      window.removeEventListener("kakao:loaded", onLoaded);
      cleanupRef.current?.(); // ✅ 누수 방지
    };
  }, []);

  return <div ref={mapRef} className="w-full h-screen" />;
}
