// app/page.tsx
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { BBox, ca, LatLng, Place } from "../../type/type";
import MarkerDetail from "./components/markerDetail";
import { createRoot, Root } from "react-dom/client";
import SearchBar from "./components/searchBar";
import CategoryRow from "./components/categoryRow";

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

  const [userCategory, setCategory] = useState<Record<ca, boolean>>({
    Drama: false,
    Movie: false,
    MusicVideo: false,
  });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const delayT = useRef<number | null>(null);

  const map = useRef<any>(null);
  const markersRef = useRef<any>([]);
  const userInteractedRef = useRef<boolean>(false);
  const didInitialFitRef = useRef<boolean>(false); // 초기 1회 fitBounds 허용 스위치
  const allowAutoMoveUntilRef = useRef<number>(0); // 초기 자동이동 허용 시간창(ms)
  const programmaticMoveCntRef = useRef<number>(0);
  const boxRef = useRef<BBox | null>(null);
  const lastFetchedBboxRef = useRef<BBox | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  
  const [fetchedMarker, setFetchedMarker] = useState(false);
  const [markerCount, setMarkerCount] = useState<number | null>(null); 

  const radiusCircleRef = useRef<any|null>(null);
  const radiusLabelRef  = useRef<any|null>(null);
  const [radiusM, setRadiusM] = useState(2000);
 

  // 유틸: 현재 작업이 끝난 다음 마이크로태스크로 미루기
  const defer = (fn: () => void) => queueMicrotask(fn);

  const reqSeq = useRef(0);

  const onCategoryClick = useCallback((cat: ca) => {
    setCategory((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  const DEBOUNCE_MS = 300;
  const EPS_CENTER_DEG = 0.0005; // 중심 이동 임계
  const EPS_AREA_RATIO = 0.02; // 면적 변화 임계 (2%)

  function readMapBBox(m: any): BBox {
    const b = m.getBounds();
    const sw = b.getSouthWest();
    const ne = b.getNorthEast();
    return { sw: [sw.getLat(), sw.getLng()], ne: [ne.getLat(), ne.getLng()] };
  }

  function bboxToString(bb: BBox): string {
    const f = (n: number) => n.toFixed(6);
    return `${f(bb.sw[0])},${f(bb.sw[1])},${f(bb.ne[0])},${f(bb.ne[1])}`;
  }

  function closeOverlay() {
    // 1) 지도에서 먼저 떼기(동기 OK)
    overlayRef.current?.setMap(null);
    overlayRef.current = null;

    // 2) React 서브 루트는 "지연 언마운트"
    const root = infoRoot.current;
    infoRoot.current = null;
    if (root) defer(() => root.unmount());
  }

  function clearRadiusRing() {
    radiusCircleRef.current?.setMap(null);
    radiusCircleRef.current = null;

  }

  function drawRadiusRing(center: any, rM = radiusM) {
    const { kakao } = window as any;
    clearRadiusRing();
  
    // 링(원)
    const circle = new kakao.maps.Circle({
      center,               // kakao.maps.LatLng
      radius: rM,           // 미터
      strokeWeight: 2,
      strokeColor: '#6D28D9',
      strokeOpacity: 0.9,
      strokeStyle: 'solid',
      fillColor: '#6D28D9',
      fillOpacity: 0.08,
      zIndex: 1,
    });
    circle.setMap(map.current);
    radiusCircleRef.current = circle;
  
    // // 라벨(옵션)
    // const el = document.createElement('div');
    // el.className = 'rounded-full bg-black/70 text-white text-[11px] px-2 py-1 shadow';
    // el.textContent = `반경 ${rM} m`;
    // const label = new kakao.maps.CustomOverlay({
    //   content: el,
    //   position: center,
    //   xAnchor: -0.05, yAnchor: 1.4, zIndex: 2,
    // });
    // label.setMap(map.current);
    // radiusLabelRef.current = label;
  }

  async function fetchPlacesForBBox(bbox: BBox) {
    const id = ++reqSeq.current;
  
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
  
    setLoading(true);
    setLoadError(null);
    clearDelay();
    const myDelayId = window.setTimeout(() => setShowSpinner(true), 300);
    delayT.current = myDelayId;
  
    try {
      const qs = new URLSearchParams();
      Object.entries(userCategory).filter(([, v]) => v).forEach(([k]) => qs.append("category", k));
      qs.append("bbox", bboxToString(bbox));
  
      const res = await fetch(`/api/places?${qs.toString()}`, { signal: ac.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const places: Place[] = Array.isArray(payload) ? payload : payload.items;
  
      if (id !== reqSeq.current) return;
  
      // 기존 마커 정리
      closeOverlay();
      markersRef.current.forEach((m: any) => m.setMap(null));
      markersRef.current = [];
  
      // 새 마커 + 클릭 핸들러
      const { kakao } = window as any;
      markersRef.current = places.map((item) => {
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(item.lat, item.lng),
          map: map.current,
          title: item.title,
        });
  
        const handler = () => {
          if (infoRoot.current) {
            closeOverlay();
            infoRoot.current = null;
          }
          const container = document.createElement("div");
          container.className = "marker-overlay";
          infoRoot.current = createRoot(container);
          infoRoot.current.render(<MarkerDetail item={item} onClose={onMapClick} />);
  
          if (!overlayRef.current) {
            overlayRef.current = new kakao.maps.CustomOverlay({
              content: container,
              position: marker.getPosition(),
              xAnchor: 0.5,
              yAnchor: 1,
              zIndex: 3,
              clickable: true,
            });
          } else {
            overlayRef.current.setContent(container);
            overlayRef.current.setPosition(marker.getPosition());
            overlayRef.current.setZIndex(3);
          }
          overlayRef.current?.setMap(map.current);
          const pos = marker.getPosition();
        
          clearRadiusRing();                 // 이전 링 지우기 (ref 사용)
          drawRadiusRing(pos, radiusM);   

          


        };
  
        kakao.maps.event.addListener(marker, "click", handler);
        return marker;
      });
  
      // ✅ 상태 갱신
      lastFetchedBboxRef.current = bbox;
      setMarkerCount(places.length);
      setFetchedMarker(true);
    } catch (e: any) {
      if (e.name !== "AbortError") setLoadError("불러오기 실패");
    } finally {
      if (id === reqSeq.current) {
        setLoading(false);
        if (delayT.current === myDelayId) {
          clearTimeout(myDelayId);
          delayT.current = null;
          setShowSpinner(false);
        }
      }
    }
  }
  

  const onMapClick = () => {
    const ov = overlayRef.current;
    if (!ov) return;
    ov?.setMap(null);
    infoRoot.current?.unmount();
    ov?.setContent("");
    infoRoot.current = null;
  };

  const clearDelay = () => {
    if (delayT.current) {
      clearTimeout(delayT.current);
      delayT.current = null;
    }
  };

  const allowAutoMove = () => {
    return (
      !userInteractedRef.current && Date.now() <= allowAutoMoveUntilRef.current
    );
  };

  // 한 번만 fitBounds 실행
  const fitBoundsOnce = (bounds: any) => {
    if (didInitialFitRef.current || !allowAutoMove()) return false;
    programmaticMoveCntRef.current += 1;
    map.current.setBounds(bounds);
    didInitialFitRef.current = true; // ✅ 여기서 true로 바꿈 (한 번만 허용)
    return true;
  };

  const bboxMeaningfullyChanged = (a: BBox | null, b: BBox | null): boolean => {
    if (!a || !b) return true;
    // 중심 이동
    const aC: LatLng = [(a.sw[0] + a.ne[0]) / 2, (a.sw[1] + a.ne[1]) / 2];
    const bC: LatLng = [(b.sw[0] + b.ne[0]) / 2, (b.sw[1] + b.ne[1]) / 2];
    const dLat = Math.abs(aC[0] - bC[0]);
    const dLng = Math.abs(aC[1] - bC[1]);
    if (dLat > EPS_CENTER_DEG || dLng > EPS_CENTER_DEG) return true;

    // 면적 변화
    const aArea = (a.ne[0] - a.sw[0]) * (a.ne[1] - a.sw[1]);
    const bArea = (b.ne[0] - b.sw[0]) * (b.ne[1] - b.sw[1]);
    if (bArea === 0) return true;
    const diffRatio = Math.abs(aArea - bArea) / bArea;
    return diffRatio > EPS_AREA_RATIO;
  };

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
      
    const cur = boxRef.current ?? readMapBBox(map.current);
    if (!cur) return;
    fetchPlacesForBBox(cur);   
    

  }, [userCategory]);

  useEffect(() => {
    if (!mapRef.current) return;

  
    const init = () => {
      if (!window.kakao?.maps) return;
      if (initializedRef.current) return; // ✅ 중복 방지
      initializedRef.current = true;
      const handleTilesLoaded = () => {
        setMapReady(true);
        kakao.maps.event.removeListener(
          map.current,
          "tilesloaded",
          handleTilesLoaded
        );
      };



      window.kakao.maps.load(async () => {
        if (!mapRef.current) return;

        const { kakao } = window;

        // 지도 생성
        map.current = new kakao.maps.Map(mapRef.current, {
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 5,
        });

        allowAutoMoveUntilRef.current = Date.now() + 5000;

        const offHandlers: Array<() => void> = [];

        const onIdle = () => {
          boxRef.current = readMapBBox(map.current);

          if (programmaticMoveCntRef.current > 0) {
            // 이게 없으면 사용자가 직접 줌을 했을때 확대 x
            programmaticMoveCntRef.current = Math.max(
              0,
              programmaticMoveCntRef.current - 1
            );
            return;
          }
          if (idleId.current) {
            clearTimeout(idleId.current);
            idleId.current = null;
          }

          idleId.current = window.setTimeout(() => {
           
            // if (!autoSearch) return; // ✅ 자동 모드가 아니면 요청 안 함
            
            const cur = boxRef.current; // ← 스냅샷
            if (!cur) return;
            if (!bboxMeaningfullyChanged(cur, lastFetchedBboxRef.current))
              
              return;

            fetchPlacesForBBox(cur);

            setBoundsText(bboxToString(cur));
          }, DEBOUNCE_MS);
        };

        const onDragStart = () => {
          userInteractedRef.current = true; // 사용자가 손댐
          onMapClick(); //기존 동작 유지
        };

        const onZoomChanged = () => {
          // 우리가 움직이는 중이 아니면 사용자 줌으로 간주
          if (programmaticMoveCntRef.current === 0) {
            userInteractedRef.current = true;
          }

          onMapClick();
        };

        const onMapCanvasClick = () => {
          userInteractedRef.current = true;
          onMapClick();
          clearRadiusRing();  
        };

        kakao.maps.event.addListener(map.current, "click", onMapCanvasClick);
        kakao.maps.event.addListener(map.current, "dragstart", onDragStart);
        kakao.maps.event.addListener(
          map.current,
          "zoom_changed",
          onZoomChanged
        );
        kakao.maps.event.addListener(map.current, "idle", onIdle);
        kakao.maps.event.addListener(
          map.current,
          "tilesloaded",
          handleTilesLoaded
        );

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
              const pos = marker.getPosition();
              clearRadiusRing();                 // 이전 링 지우기 (ref 사용)
              drawRadiusRing(pos, radiusM);      // 새 링 그리기
            
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
            // (교체)
            fitBoundsOnce(bounds); // 초기 1회/허용 창 내/미개입일 때만 실행, 그 외엔 조용히 무시
          }
        } catch (e) {
          console.error("Failed to load places", e);
        }
         setMarkerCount(markersRef.current.length) ;
         setFetchedMarker(true) ; 
        // ✅ 정리 루틴 등록
        cleanupRef.current = () => {
          closeOverlay();
          infoRoot.current = null;
          offHandlers.forEach((off) => off());
          markersRef.current.forEach((m) => m.setMap(null));
          initializedRef.current = false;

          kakao.maps.event.removeListener(
            map.current,
            "dragstart",
            onDragStart
          );
          kakao.maps.event.removeListener(
            map.current,
            "zoom_changed",
            onZoomChanged
          );
          kakao.maps.event.removeListener(map.current, "idle", onIdle);
          kakao.maps.event.removeListener(
            map.current,
            "click",
            onMapCanvasClick
          );

          kakao.maps.event.removeListener(
            map.current,
            "tilesloaded",
            handleTilesLoaded
          );

          if (idleId.current) {
            clearTimeout(idleId.current);
            idleId.current = null;
          }
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
    <div className="">
      <SearchBar />
      <div
        className="fixed left-1/2 bottom-[max(env(safe-area-inset-top),0.5rem)] -translate-x-1/2 z-20
             w-[min(92%,720px)] px-2"
      >
        <div
          className="rounded-2xl bg-white/80 backdrop-blur-md shadow-lg border border-white/60
                  px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar"
        >
          {/* 3) 여기서 CategoryRow “호출”(렌더링) */}
          <CategoryRow
            userCategory={userCategory}
            loading={loading}
            onCategoryClick={onCategoryClick}
          />
          <div className="ml-auto">
            {showSpinner && (
              <span className="text-xs text-black">불러오는 중…</span>
            )}
          </div>
          {!loading && !loadError && fetchedMarker && markerCount === 0 && (
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

      <div className="relative w-full h-screen">
        <div ref={mapRef} className="absolute inset-0" /> {/* 처음 지도 로딩 창 스켈레톤 */}

        {/* 처음 지도 타일 스켈레톤 */}
        {!mapReady && (
          <div
            className="absolute inset-0 z-30 bg-gray-100/60 backdrop-blur-sm"
            aria-hidden
          >
            <div
              className="absolute left-1/2 top-3 -translate-x-1/2 w-[min(92%,720px)] h-12 
                      rounded-2xl bg-white/70 animate-pulse"
            />
            <div className="absolute bottom-4 left-4 w-36 h-8 rounded bg-white/70 animate-pulse" />
          </div>
        )}

        {/* 데이터 로딩 상태(마커 fetch) */}
        {mapReady && showSpinner && (
          <div className="absolute top-4 right-4 z-30 text-xs px-2 py-1 rounded bg-black/80 text-white">
            장소 불러오는 중…
          </div>
        )}
      </div>


      {isDev && boundsText && (
        <div className="fixed bottom-2 right-2 rounded bg-black text-xs shadow px-2 py-1">
          {boundsText}
        </div>
      )}
    </div>
  );
}