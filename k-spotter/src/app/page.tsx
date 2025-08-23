// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Place } from "../../type/type";
import MarkerDetail from "./components/markerDetail";
import { createRoot, Root } from "react-dom/client";

declare global {
  interface Window {
    kakao?: any;
  }
}

type CustomOverlayLike = {
  setMap(map: any | null): void;
  setPosition(pos: any): void;
  setContent(content: HTMLElement | string): void;
  setZIndex(z: number): void;
};

export default function Page() {
  const mapRef = useRef<HTMLDivElement>(null);

  // ✅ 중복 초기화/정리 핸들 보관
  const initializedRef = useRef(false);
  const cleanupRef = useRef<() => void>(() => {});
  const infoRoot = useRef<Root | null>(null);
  const overlayRef = useRef<CustomOverlayLike | null>(null);
  const [boundsText, setBoundsText] = useState<string>("");
  const idleId = useRef<number | null>(null);
  const [isDev, setIsDev] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const query =
      new URLSearchParams(window.location.search).get("dev") === "1";
    const fromStore = localStorage.getItem("devhud") === "1";
    return query || fromStore;
  });

  const onMapClick = () => {
    const ov = overlayRef.current;
    if (!ov) return;
    ov?.setMap(null);
    infoRoot.current?.unmount();
    ov?.setContent("");
    infoRoot.current = null;
  };
  
  useEffect(()=>{
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable);
      if (e.key === "Escape" && !typing) onMapClick();
      if (e.key.toLowerCase() === "d") {
        setIsDev(prev => {
          const next = !prev ; 
          localStorage.setItem("devhud" , next ? "1" : "0") ;
          return next; 
        })
      }
    };

    window.addEventListener("keydown" , onKey) ;
    return () => window.removeEventListener("keydown" , onKey) ;
  

  }, [])

  useEffect(() => {
    if (!mapRef.current) return;

    const init = () => {
      if (!window.kakao?.maps) return;
      if (initializedRef.current) return; // ✅ 중복 방지
      initializedRef.current = true;

      window.kakao.maps.load(async () => {
        if (!mapRef.current) return;

        const { kakao } = window;

        // 지도 생성
        const map = new kakao.maps.Map(mapRef.current, {
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 5,
        });

        // ✅ InfoWindow 1개만 재사용
        // const info = new kakao.maps.InfoWindow({ content: "" });

        let markers = [];
        const offHandlers: Array<() => void> = [];

        const onIdle = () => {
          if (idleId.current) {
            clearTimeout(idleId.current);
          }

          idleId.current = window.setTimeout(() => {
            const b = map.getBounds();
            const sw = b.getSouthWest();
            const ne = b.getNorthEast();
            const fmt = (n: number) => n.toFixed(5);
            console.log(
              `${fmt(sw.getLat())}, ${fmt(sw.getLng())} ~ ${fmt(
                ne.getLat()
              )}, ${fmt(ne.getLng())}`
            );
            setBoundsText(
              `${fmt(sw.getLat())}, ${fmt(sw.getLng())} ~ ${fmt(
                ne.getLat()
              )}, ${fmt(ne.getLng())}`
            );
          }, 250);
        };

        kakao.maps.event.addListener(map, "click", onMapClick);
        kakao.maps.event.addListener(map, "dragstart", onMapClick);
        kakao.maps.event.addListener(map, "zoom_changed", onMapClick);
        kakao.maps.event.addListener(map, "idle", onIdle);

        onIdle(); //한번 실행 

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
              category: item.category,
            });

            const handler = () => {
              //  이전 루트 정리
              if (infoRoot.current) {
                infoRoot.current.unmount();
                infoRoot.current = null;
              }

              const container = document.createElement("div");
              container.className = "marker-overlay"; // CSS용

              // 컨테이너 div 생성
              // React Root로 MarkerDetail 렌더
              infoRoot.current = createRoot(container);
              infoRoot.current.render(
                <MarkerDetail item={item} onClose={onMapClick} />
              );

              // 오버레이 생성
              if (!overlayRef.current) {
                overlayRef.current = new kakao.maps.CustomOverlay({
                  content: container,
                  position: marker.getPosition(),
                  xAnchor: 0.5,
                  yAnchor: 1,
                  zIndex: 3,
                  clickable: true, // 오버레이 위 UI 클릭이 지도에 먹히지 않도록
                });
              } else {
                overlayRef.current.setContent(container);
                overlayRef.current.setPosition(marker.getPosition());
                overlayRef.current.setZIndex(3);
              }

              overlayRef.current?.setMap(map);
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
          overlayRef.current?.setMap(null);
          overlayRef.current = null;
          infoRoot.current?.unmount();
          infoRoot.current = null;
          offHandlers.forEach((off) => off());
          markers.forEach((m) => m.setMap(null));
          initializedRef.current = false;
          kakao.maps.event.removeListener(map, "click", onMapClick);
          kakao.maps.event.removeListener(map, "dragstart", onMapClick);
          kakao.maps.event.removeListener(map, "zoom_changed", onMapClick);
          kakao.maps.event.removeListener(map, "idle", onIdle);
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

  return (
    <>
      <div ref={mapRef} className="w-full h-screen" />;
      {isDev && boundsText && (
        <div className="fixed bottom-2 right-2 rounded bg-black text-xs shadow px-2 py-1">
          {boundsText}
        </div>
      )}
    </>
  );
}
