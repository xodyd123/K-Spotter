// app/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BBox, ca, LatLng, Pins, Place } from "../../type/type";
import SearchBar from "./components/searchBar";
import CategoryRow from "./components/categoryRow";
import { getNearbyPlaces } from "@/lib/mock/apitour/getNearbyPlaces";
import BottomSheet from "./components/bottomSheet";
import { getViewportHeight, desiredVisiblePx  , ensureMarkerAboveSheetSoft} from "./service/panWithOffset";
import { SheetProvider } from "./components/sheetProvider";
import { decideSheetOrPan } from "./service/decideSheetOrPan";


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
  const markersRef = useRef<any[]>([]);
  const userInteractedRef = useRef<boolean>(false);
  const allowAutoMoveUntilRef = useRef<number>(0); // 초기 자동이동 허용 시간창(ms)
  const programmaticMoveCntRef = useRef<number>(0);
  const boxRef = useRef<BBox | null>(null);
  const lastFetchedBboxRef = useRef<BBox | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [fetchedMarker, setFetchedMarker] = useState(false);
  const [markerCount, setMarkerCount] = useState<number | null>(null);

  const radiusCircleRef = useRef<any | null>(null);
  // const radiusLabelRef = useRef<any | null>(null);
  const [radiusM, setRadiusM] = useState(2000);
  
  const nearbyMarkersRef = useRef<any[]>([]);
  const nearbyAbortRef = useRef<AbortController | null>(null);// 컴포넌트 최상단
  const pinRef = useRef<Pins | null>(null); 

  type SheetState =  "closed" | "peek" | "half" | "full" ;
  const [sheet , setSheet] = useState<SheetState>("closed") ;
  const [selected , setSelected] = useState<Place|null>(null) ; 
  const [sheetYOverride , setSheetYOverride] = useState<string|null>(null);

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

  function clearRadiusRing() {
    radiusCircleRef.current?.setMap(null);
    radiusCircleRef.current = null;
  }

  function drawRadiusRing(center: any, rM = radiusM) {
    const { kakao } = window as any;
    clearRadiusRing();

    // 링(원)
    const circle = new kakao.maps.Circle({
      center, // kakao.maps.LatLng
      radius: rM, // 미터
      strokeWeight: 2,
      strokeColor: "#6D28D9",
      strokeOpacity: 0.9,
      strokeStyle: "solid",
      fillColor: "#6D28D9",
      fillOpacity: 0.08,
      zIndex: 1,
    });
    circle.setMap(map.current);
    radiusCircleRef.current = circle;

  }

  function clearNearbyMarkers() {
    nearbyMarkersRef.current.forEach((m) => m.setMap(null));
    nearbyMarkersRef.current = [];
    nearbyAbortRef.current?.abort();
    nearbyAbortRef.current = null;
  }
  
  function onMarkerClick(item: Place, marker: any) {
    setSelected(item);
    setSheet("half"); // 의미상 half로 열되, 가리면 보정
  
    const pos = marker.getPosition();
      // 시트가 현재 보이는 높이(px)
  const vh = getViewportHeight(map.current);
  const visiblePx = desiredVisiblePx(vh, "half");
  
    // 하이브리드 결정
    const decision = decideSheetOrPan(map.current, pos, "half");
    
  // 3) 패닝 적용(있으면) — 둘 중 택1
  if (decision.panBy && decision.panBy > 0) {
    programmaticMoveCntRef.current += 1;

   

 
  }
    
   
  
    if (decision.yOverride) {
      setSheetYOverride(decision.yOverride); // BottomSheet에 yOverride props로 전달
      
    } else {
      setSheetYOverride(null);
    }
  

   
 
   programmaticMoveCntRef.current += 1;     // 자동 이동 플래그

  // 부드럽게 이동(추천)
  ensureMarkerAboveSheetSoft(map.current, pos, visiblePx, {
    gap: 12, factor: 0.6, maxPan: 120, eps: 2
  });

  
    // 기존 반경 링/근처마커 로직
    clearRadiusRing(); 
    drawRadiusRing(pos, radiusM);
    clearNearbyMarkers(); 
    renderNearbyMarkers({ lat: item.lat, lng: item.lng }, radiusM);
  }
  

  async function renderNearbyMarkers(
    center: { lat: number; lng: number },
    radius = radiusM
  ) {
    const { kakao } = window as any;

    // 취소 준비
    nearbyAbortRef.current?.abort();
    const ac = new AbortController();
    nearbyAbortRef.current = ac;

    try {
      const result = await getNearbyPlaces({
        lat: center.lat,
        lng: center.lng,
        radius,
        cats: ["food", "cafe", "attraction"],
        sort: "reco",
      });

      const { items, count } = result;
      // 결과로 마커 생성
      const markers = items.map((it: any) => {
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(it.lat, it.lng),
          map: map.current,
          title: it.title,
          zIndex: 2,
        });
        return marker;
      });
      nearbyMarkersRef.current = markers;
    } catch (e: any) {
      if (e.name !== "AbortError") console.error("nearby load failed", e);
    }
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
      Object.entries(userCategory)
        .filter(([, v]) => v)
        .forEach(([k]) => qs.append("category", k));
      qs.append("bbox", bboxToString(bbox));

      const res = await fetch(`/api/places?${qs.toString()}`, {
        signal: ac.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const places: Place[] = Array.isArray(payload) ? payload : payload.items;

      if (id !== reqSeq.current) return;


      markersRef.current.forEach((m: any) => m.setMap(null));

      markersRef.current = [];

      // 새 마커 + 클릭 핸들러
      const { kakao } = window as any;

      markersRef.current = places.map((item) => {
        const img =
        pinRef.current?.[item.category as ca] ?? undefined; // 카테고리별 아이콘
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(item.lat, item.lng),
          map: map.current,
          title: item.title,
          image: img, // 👈 중요: 실제로 여기 넣어야 보입니다
        });

        const handler = async () => {
          onMarkerClick(item , marker) ;

         
        };
        kakao.maps.event.addListener(marker, "click", handler);
        return marker;
      });

     
      lastFetchedBboxRef.current = bbox;
      setMarkerCount(places.length);
      setFetchedMarker(true);
    } catch (e: any) {
      console.log(e);
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
 

  const onCloseSheet = () => {
    setSheet("closed");
    setSelected(null);
    setSheetYOverride(null);  
    // clearRadiusRing();
    // clearNearbyMarkers();

  }

  const clearDelay = () => {
    if (delayT.current) {
      clearTimeout(delayT.current);
      delayT.current = null;
    }
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
      if (e.key === "Escape" && !typing) onCloseSheet();
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

        const mk = (src: string, w = 28, h = 38) =>
          new kakao.maps.MarkerImage(src, new kakao.maps.Size(w, h), {
            offset: new kakao.maps.Point(w / 2, h),
          });

        // 지도 생성
        map.current = new kakao.maps.Map(mapRef.current, {
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 5,
        });

        const PIN = {
          Movie: mk("/pins/movie.svg"),
          Drama: mk("/pins/drama.svg"),
          MusicVideo: mk("/pins/music.svg"),
          selected: mk("/pins/selected.svg", 30, 42),
        };
        pinRef.current = PIN;

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
          onCloseSheet(); //기존 동작 유지
        };

        const onZoomChanged = () => {
          // 우리가 움직이는 중이 아니면 사용자 줌으로 간주
          if (programmaticMoveCntRef.current === 0) {
            userInteractedRef.current = true;
          }

          onCloseSheet();
        };

        const onMapCanvasClick = () => {
          userInteractedRef.current = true;
          onCloseSheet();
          clearRadiusRing();
          clearNearbyMarkers();
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
        // ✅ 정리 루틴 등록
        cleanupRef.current = () => {
          // closeOverlay();
          infoRoot.current = null;
          offHandlers.forEach((off) => off());
          markersRef.current.forEach((m) => m.setMap(null));
          initializedRef.current = false;
          clearNearbyMarkers();

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
        <div ref={mapRef} className="absolute inset-0" />{" "}
        {/* 처음 지도 로딩 창 스켈레톤 */}
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
        <SheetProvider onclose={onCloseSheet}>
        <BottomSheet  selected={selected} snap={sheet}  yOverride={sheetYOverride}/>
        </SheetProvider>
     
    </div>
  );
}
