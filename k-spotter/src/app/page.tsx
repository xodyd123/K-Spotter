// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Place } from "../../type/type";
import MarkerDetail from "./components/markerDetail";
import { createRoot, Root } from "react-dom/client";
import CategoryCheckList from "./components/categoryCheck";

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

  //  중복 초기화/정리 핸들 보관
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

  const [userCategory, setCategory] = useState({
    Drama: false,
    Movie: false,
    MusicVideo: false,
  });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sdkReady , setSdkReady] = useState(false) ; 
  const [showSpinner , setShowSpinner] = useState(false) ;
  const delayT = useRef<number|null> (null) ; 

  const categories = ["Drama", "Movie", "MusicVideo"] as const;

  type ca = "Drama" | "Movie" | "MusicVideo";
  const map = useRef<any>(null);

  const markersRef = useRef<any>([]);

  // 유틸: 현재 작업이 끝난 다음 마이크로태스크로 미루기
  const defer = (fn: () => void) => queueMicrotask(fn);

  const reqSeq = useRef(0);

  function closeOverlay() {
    // 1) 지도에서 먼저 떼기(동기 OK)
    overlayRef.current?.setMap(null);
    overlayRef.current = null;

    // 2) React 서브 루트는 "지연 언마운트"
    const root = infoRoot.current;
    infoRoot.current = null;
    if (root) defer(() => root.unmount());
  }

  const onMapClick = () => {
    const ov = overlayRef.current;
    if (!ov) return;
    ov?.setMap(null);
    infoRoot.current?.unmount();
    ov?.setContent("");
    infoRoot.current = null;
  };

  const selectAll = () => {
    setCategory({ Drama: true, Movie: true, MusicVideo: true });
  };

  const clearAll = () =>
    setCategory({ Drama: false, Movie: false, MusicVideo: false });

  const clearDelay = () => {
    if(delayT.current){
      clearTimeout(delayT.current) ; 
      delayT.current = null ; 
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable);
      if (e.key === "Escape" && !typing) onMapClick();
      if (e.key.toLowerCase() === "d") {
        setIsDev((prev) => {
          const next = !prev;
          localStorage.setItem("devhud", next ? "1" : "0");
          return next;
        });
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!map.current) return;
    const { kakao } = window;

    const offHandlers: Array<() => void> = [];

    closeOverlay();
    markersRef.current.forEach((item) => item.setMap(null));
    markersRef.current = [];
 
    const id = ++reqSeq.current;
    const ac = new AbortController();

    // 요청시작 
    setLoading(true);
    setLoadError(null);
    setShowSpinner(false);  // 새요청을 시작할때 스피너 초기화 
    clearDelay() ; 
    delayT.current = window.setTimeout(() => setShowSpinner(true) , 300) ; 


    const func = async () => {
      try {
        const param = new URLSearchParams();
   
        Object.entries(userCategory)
          .filter(([_, v]) => v)
          .forEach(([k]) => param.append("category", k));
        const res = await fetch(`/api/places?${param.toString()}`, {
          signal: ac.signal,
        });

        const places: Place[] = await res.json();

        if (!mapRef.current) return; // 언마운트 방어

        if (id !== reqSeq.current) return; // <- 오래된 응답 무시

        markersRef.current = places.map((item) => {
          const marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(item.lat, item.lng),
            map: map.current,
            title: item.title,
          });

          const handler = () => {
            //  이전 루트 정리
            if (infoRoot.current) {
              closeOverlay();
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

            overlayRef.current?.setMap(map.current);
          };

          kakao.maps.event.addListener(marker, "click", handler);

          offHandlers.push(() =>
            kakao.maps.event.removeListener(marker, "click", handler)
          );

          return marker;
        });

        // (선택) 전체 보이게 맞추기
        if (markersRef.current.length > 1) {
          const bounds = new kakao.maps.LatLngBounds();
          markersRef.current.forEach((m) => bounds.extend(m.getPosition()));
          map.current.setBounds(bounds);
        }
      } catch (e: any) {
        if (e.name !== "AbortError") setLoadError("불러오기 실패");
      } finally {
        if (id === reqSeq.current) setLoading(false);
        clearDelay();
        setShowSpinner(false);
      }
    };

    func();

    return () => {
      ac.abort();
      offHandlers.forEach((off) => off());
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      closeOverlay();
      setShowSpinner(false);
      clearDelay();  
    };
  }, [userCategory]);

  const onCategoryClick = (item: ca) => {
    setCategory((prev) => ({ ...prev, [item]: !prev[item] }));
  };

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
        map.current = new kakao.maps.Map(mapRef.current, {
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 5,
        });

        // ✅ InfoWindow 1개만 재사용
        // const info = new kakao.maps.InfoWindow({ content: "" });

        const offHandlers: Array<() => void> = [];

        const onIdle = () => {
          if (idleId.current) {
            clearTimeout(idleId.current);
          }

          idleId.current = window.setTimeout(() => {
            const b = map.current.getBounds();
            const sw = b.getSouthWest();
            const ne = b.getNorthEast();
            const fmt = (n: number) => n.toFixed(5);

            setBoundsText(
              `${fmt(sw.getLat())}, ${fmt(sw.getLng())} ~ ${fmt(
                ne.getLat()
              )}, ${fmt(ne.getLng())}`
            );
          }, 250);
        };

        kakao.maps.event.addListener(map.current, "click", onMapClick);
        kakao.maps.event.addListener(map.current, "dragstart", onMapClick);
        kakao.maps.event.addListener(map.current, "zoom_changed", onMapClick);
        kakao.maps.event.addListener(map.current, "idle", onIdle);

        onIdle(); //한번 실행

        try {
          const res = await fetch("/api/places");
          const places: Place[] = await res.json();

          if (!mapRef.current) return; // 언마운트 방어

          // ✅ 마커마다 개별 리스너 등록
          markersRef.current = places.map((item) => {
            const marker = new kakao.maps.Marker({
              position: new kakao.maps.LatLng(item.lat, item.lng),
              map: map.current,
              title: item.title,
              category: item.category,
            });

            const handler = () => {
              //  이전 루트 정리
              if (infoRoot.current) {
                closeOverlay();
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

              overlayRef.current?.setMap(map.current);
            };

            kakao.maps.event.addListener(marker, "click", handler);

            offHandlers.push(() =>
              kakao.maps.event.removeListener(marker, "click", handler)
            );

            return marker;
          });

          // (선택) 전체 보이게 맞추기
          if (markersRef.current.length > 1) {
            const bounds = new kakao.maps.LatLngBounds();
            markersRef.current.forEach((m) => bounds.extend(m.getPosition()));
            map.current.setBounds(bounds);
          }
        } catch (e) {
          console.error("Failed to load places", e);
        }

        // ✅ 정리 루틴 등록
        cleanupRef.current = () => {
          closeOverlay();
          infoRoot.current = null;
          offHandlers.forEach((off) => off());
          markersRef.current.forEach((m) => m.setMap(null));
          initializedRef.current = false;
          kakao.maps.event.removeListener(map.current, "click", onMapClick);
          kakao.maps.event.removeListener(map.current, "dragstart", onMapClick);
          kakao.maps.event.removeListener(
            map.current,
            "zoom_changed",
            onMapClick
          );
          kakao.maps.event.removeListener(map.current, "idle", onIdle);
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
    <div>
      <div
        className="fixed left-1/2 top-[max(env(safe-area-inset-top),0.5rem)] -translate-x-1/2 z-20
             w-[min(92%,720px)] px-2"
      >
        <div
          className="rounded-2xl bg-white/80 backdrop-blur-md shadow-lg border border-white/60
                  px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar"
        >
          {/* 추가: 전체/초기화 칩 */}
          <button
            onClick={selectAll}
            className="px-3 py-1.5 rounded-full text-sm border bg-white/70 hover:bg-gray-100
                 text-gray-800 border-gray-300 transition-colors"
          >
            전체 선택
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1.5 rounded-full text-sm border bg-white/70 hover:bg-gray-100
                 text-gray-800 border-gray-300 transition-colors"
          >
            초기화
          </button>

          {/* 기존 카테고리 칩들 */}
          <div className="flex gap-1.5">
            {categories.map((item, idx) => {
              const on = userCategory[item];
              return (
                <button
                  key={`category-${idx}`}
                  disabled={loading}
                  onClick={() => onCategoryClick(item)}
                  aria-pressed={on}
                  className={[
                    "px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors",
                    on
                      ? "bg-black text-white border-black shadow-sm"
                      : "bg-white/70 text-gray-800 border-gray-300 hover:bg-gray-100",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60",
                  ].join(" ")}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <div className="ml-auto">
            {showSpinner && (
              <span className="text-xs text-black">불러오는 중…</span>
            )}
          </div>
          {!loading && !loadError && markersRef.current.length === 0 && (
            <div className="text-xs px-2 py-1 rounded bg-black border">
              이 범위에는 결과가 없어요
            </div>
          )}
          {loadError && (
            <div className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200">
              {loadError}
            </div>
          )}
        </div>
      </div>
      <div ref={mapRef} className="w-full h-screen" />

      {isDev && boundsText && (
        <div className="fixed bottom-2 right-2 rounded bg-black text-xs shadow px-2 py-1">
          {boundsText}
        </div>
      )}
    </div>
  );
}
