// app/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BBox,
  ca,
  LatLng,
  Pins,
  Place,
  PlaceM,
  SearchItem,
  selected,
  SheetView,
  toPlaceM,
} from "../../../type/type";
import SearchBar from "../components/search/searchBar";

import BottomSheet, { SheetHandle } from "../components/bottomSheet";
import {
  getViewportHeight,
  desiredVisiblePx,
  ensureMarkerAboveSheetSoft,
} from "../service/panWithOffset";
import { SheetProvider } from "../components/sheetProvider";
import { decideSheetOrPan } from "../service/decideSheetOrPan";
import { getSpotter } from "@/lib/mock/api/getSpotter";
import { GetKeywordSearch } from "../../lib/mock/api/getKeyword";
import { SearchImage } from "@/lib/mock/galley/searchImage";

import { useSelectedLoader } from "../../hooks/fetchImage";
import { waitMapIdle } from "@/utils/waitMapIdle";
import SearchContent from "../components/search/searchContent";
import { useQueryClient } from "@tanstack/react-query";
import { NearbyDetailPlace } from "@/lib/mock/api/getNearbyDetailPlace";
import { useSearchParams } from "next/navigation";

declare global {
  interface Window {
    kakao?: any;
  }
}

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

  const radiusCircleRef = useRef<any | null>(null);
  // const radiusLabelRef = useRef<any | null>(null);
  const [radiusM, setRadiusM] = useState(2000);

  const nearbyMarkersRef = useRef<any[]>([]);
  const nearbyAbortRef = useRef<AbortController | null>(null); // 컴포넌트 최상단
  const pinRef = useRef<Pins | null>(null);

  type SheetState = "closed" | "peek" | "half" | "full";
  const [sheet, setSheet] = useState<SheetState>("closed");
  const [sheetYOverride, setSheetYOverride] = useState<string | null>(null);
  const [inputs, setInputs] = useState("");
  const [mapCover, setMapCover] = useState<"off" | "on">("off");
  const [searchKeyWord, setSearch] = useState<SearchItem[]>([]);
  const [bottomView, setBottomView] = useState<SheetView>({ kind: "closed" });

  const { loadAndPatchSelected, cancel } = useSelectedLoader({
    getSpotter,
    GetKeywordSearch,
    SearchImage,
    setBottomView,
  });

  // 유틸: 현재 작업이 끝난 다음 마이크로태스크로 미루기
  const defer = (fn: () => void) => queueMicrotask(fn);

  const [autoQuery, setAutoQuery] = useState(false); // 처음엔 마커 안 그림

  const reqSeq = useRef(0);
  const clickRef = useRef(false);
  const sheetRef = useRef<SheetHandle>(null);
  const markerRef = useRef<kakao.maps.Marker | null>(null);
  const clustererRef = useRef<any | null>(null);

  // 러스터/이벤트 처리에서 마커만 받았을 때도 곧바로 원본 장소 정보에 접근하려고 만든, 깔끔하고 메모리 안전한 역참조 저장소
  const markerToPlace = useRef<WeakMap<any, Place>>(new WeakMap());
  const placeIdToMarkerRef = useRef<Map<number | string, kakao.maps.Marker>>(
    new Map()
  );
  const qc = useQueryClient();
  const sp = useSearchParams();

  const openSummary = (items: Place[]) => {
    setSheet("half");
    setBottomView({ kind: "summaryPlaces", items });
  };

  const openDetail = (item: PlaceM) => {
    setBottomView({ kind: "detailPlace", item });
    //setSheet('half');
  };

  const closeAll = () => {
    setSheet("closed");
    setBottomView({ kind: "closed" });
  };

  const onPickKeyWord = async (itemName: string) => {
    if (!map.current || !clustererRef.current) return;

    // 검색했다는 상태 등록
    setMapCover("off");

    setShowSpinner(true);

    try {
      // 키워드로 장소 조회 (엔드포인트는 사용중인 API에 맞춰주세요)
      const res = await fetch(
        `/api/searchPlaces?name=${encodeURIComponent(itemName)}&mode=points`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const places: Place[] = await res.json();

      openSummary(places);
      // 기존 클러스터 지우기
      clustererRef.current.clear();
      markersRef.current = [];
      placeIdToMarkerRef.current.clear();

      const { kakao } = window as any;
      const markers: any[] = [];
      const bounds = new kakao.maps.LatLngBounds();

      for (const p of places) {
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(p.lat, p.lng),
          image: pinRef.current?.[p.category as ca],
          title: p.title,
        });
        kakao.maps.event.addListener(marker, "click", () =>
          onSelectNearby({ kind: "place", data: p })
        );
        markers.push(marker);
        bounds.extend(marker.getPosition());

        markerToPlace.current.set(marker, p);
        // 양방향 저장
        placeIdToMarkerRef.current.set(p.id, marker);
      }

      // 클러스터에 등록
      clustererRef.current.addMarkers(markers);
      markersRef.current = markers;

      // 지도를 결과 범위로 맞춤 (idle에서 bbox fetch가 즉시 재호출되지 않도록 1회 막기)
      programmaticMoveCntRef.current += 1;
      if (!bounds.isEmpty()) map.current.setBounds(bounds);
      setFetchedMarker(true);
    } catch (e) {
      console.error(e);
      setLoadError("불러오기 실패");
    } finally {
      setShowSpinner(false);
    }
  };

  // 1) 클릭 시 포커싱 + 고정 확대
  const focusZoomTo = async (pos: kakao.maps.LatLng, targetLevel = 3) => {
    if (!map.current) return;
    const m = map.current;
    let cur = m.getLevel();

    // (선택) 먼저 중심을 pos로 맞춰두면 줌 동안 '정중앙'에 고정됨
    programmaticMoveCntRef.current += 1;
    m.panTo(pos);
    await waitMapIdle(m); // ← 부드럽게 중앙으로
    while (cur - targetLevel > 1) {
      // 2단계씩
      cur -= 2;
      programmaticMoveCntRef.current += 1;
      m.setLevel(cur, { anchor: pos, animate: { duration: 220 } });
      await waitMapIdle(m);
    }
    if (cur !== targetLevel) {
      programmaticMoveCntRef.current += 1;
      m.setLevel(targetLevel, { anchor: pos, animate: { duration: 220 } });
      await waitMapIdle(m);
    }
  };

  const onSelectNearby = useCallback(async (s: selected) => {
    if (clickRef.current) return;
    clickRef.current = true;
    try {
      await sheetRef.current?.close("closed");

      //   const t0 = performance.now();
      // await (sheetRef.current?.close('closed') ?? Promise.resolve());
      // console.log('closed after', performance.now() - t0, 'ms'); // 대략 트랜지션 시간만큼 걸림

      if (s.kind === "place") {
        openDetail(toPlaceM(s.data));
        loadAndPatchSelected(s.data); // 이미지를 불러올때 한번 더 상태를 변화
      } else {
        setBottomView({ kind: "detailPlace", item: toPlaceM(s.data) });
        // // 캐시에 업데이트  - 일단 주석
        //   캐시 업데이트로 인해 카테고리 클릭한 장소의 근처에 같은 카테고리 장소는 반영 안됨.
        // await qc.fetchQuery({
        //   queryKey : nearbyKey(s.data.id , Number(s.data.contentTypeId) ,2000) ,
        //   queryFn : async () => {
        //     const detail = await NearbyDetailPlace(s.data.id , s.data.contentTypeId) ;
        //     return {...toPlaceM(s.data) , ...detail }
        //   } ,
        //   staleTime: 5 * 60_000,
        // }

        // )

        const detail = await NearbyDetailPlace(s.data.id, s.data.contentTypeId);
        setBottomView({
          kind: "detailPlace",
          item: toPlaceM({ ...s.data, ...detail }), // ← 새 객체
        });
      }

      if (!map.current) return; // 안전 가드
      const m = map.current;

      // 2) pos 확정 (항상 LatLng가 되도록!  selectedMarker는 따로 호출)
      const pos =
        placeIdToMarkerRef.current.get(s.data.id)?.getPosition() ??
        new kakao.maps.LatLng(s.data.lat, s.data.lng);

      // 3) 선택 마커 생성/재부착 (사이드이펙트용, 반환값 사용 안 함)
      selectedMarker(pos, m);

      //openDetail(toPlaceM(s.data));
      // 오프셋 패닝

      await focusZoomTo(pos);
      const decision = decideSheetOrPan(map.current, pos, "half");

      const vh = getViewportHeight(map.current);
      const visiblePx = desiredVisiblePx(vh, "half");

      if (decision.panBy && decision.panBy > 0)
        programmaticMoveCntRef.current += 1;
      setSheetYOverride(decision.yOverride ?? null);

      ensureMarkerAboveSheetSoft(map.current, pos, visiblePx, {
        gap: 12,
        factor: 0.6,
        maxPan: 120,
        eps: 2,
      });

      programmaticMoveCntRef.current += 1;
      await waitMapIdle(map.current);

      // (D) 시트 다시 열림 애니 끝까지 대기
      await sheetRef.current?.open("half");
    } finally {
      clickRef.current = false;
    }
  }, []);

  const selectedMarker = (pos: kakao.maps.LatLng, map: kakao.maps.Map) => {
    if (!markerRef.current) {
      markerRef.current = new kakao.maps.Marker({ position: pos, map });
    } else {
      markerRef.current.setPosition(pos);
      if (!markerRef.current.getMap()) {
        // 필요할 때만
        markerRef.current.setMap(map); // 화면에 재부착
      }
    }
    return pos;
  };

  // // 선택 마커  함수 - 일단 주석
  // const ensureSelectedMarker = useCallback((lat: number, lng: number) => {
  //   const { kakao } = window as any;
  //   if (!map.current) return null;
  //   const pos = new kakao.maps.LatLng(lat, lng);

  //   if (!selectedMarkerRef.current) {
  //     selectedMarkerRef.current = new kakao.maps.Marker({
  //       position: pos,
  //       map: map.current,

  //       zIndex: 3,
  //     });

  //   } else {
  //     selectedMarkerRef.current.setPosition(pos);
  //     selectedMarkerRef.current.setMap(map.current);
  //   }
  //   return selectedMarkerRef.current;
  // }, []);

  const onCategoryClick = useCallback((cat: ca) => {
    setCategory((prev) => {
      const next = { ...prev, [cat]: !prev[cat] };
      const anyOn = Object.values(next).some(Boolean);
      setAutoQuery(anyOn); // ✅ 한 개라도 켜지면 이후부터 onIdle에서 페치
      return next;
    });
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
    const minLng = bb.sw[1],
      minLat = bb.sw[0];
    const maxLng = bb.ne[1],
      maxLat = bb.ne[0];
    return `${f(minLng)},${f(minLat)},${f(maxLng)},${f(maxLat)}`;
  }

  function clearRadiusRing() {
    radiusCircleRef.current?.setMap(null);
    radiusCircleRef.current = null;
  }

  // function drawRadiusRing(center: any, rM = radiusM) {
  //   const { kakao } = window as any;
  //   clearRadiusRing();

  //   // 링(원)
  //   const circle = new kakao.maps.Circle({
  //     center, // kakao.maps.LatLng
  //     radius: rM, // 미터
  //     strokeWeight: 2,
  //     strokeColor: "#6D28D9",
  //     strokeOpacity: 0.9,
  //     strokeStyle: "solid",
  //     fillColor: "#6D28D9",
  //     fillOpacity: 0.08,
  //     zIndex: 1,
  //   });
  //   circle.setMap(map.current);
  //   radiusCircleRef.current = circle;
  // }

  // function clearNearbyMarkers() {
  //   nearbyMarkersRef.current.forEach((m) => m.setMap(null));
  //   nearbyMarkersRef.current = [];
  //   nearbyAbortRef.current?.abort();
  //   nearbyAbortRef.current = null;
  // }

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

      // 카테고리 선택값
      Object.entries(userCategory)
        .filter(([, v]) => v)
        .forEach(([k]) => qs.append("category", k));

      // ⚠️ bboxToString은 반드시 minLng,minLat,maxLng,maxLat(경도→위도 순서)
      qs.append("bbox", bboxToString(bbox));
      qs.append("mode", "points"); // points 모드 강제
      // qs.append("limit", String(MAX_POINTS));   // 500개 제한

      const res = await fetch(`/api/places?${qs.toString()}`, {
        signal: ac.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const places: Place[] = await res.json();

      if (id !== reqSeq.current) return;

      clustererRef.current?.clear();
      markersRef.current = [];

      // 새 마커 + 클릭 핸들러
      const { kakao } = window as any;

      markersRef.current = places.map((item) => {
        const img = pinRef.current?.[item.category as ca] ?? undefined; // 카테고리별 아이콘
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(item.lat, item.lng),
          //map: map.current,
          title: item.title,
          image: img,
        });
        const handler = async () => {
          onSelectNearby({ kind: "place", data: item });
        };
        kakao.maps.event.addListener(marker, "click", handler);
        markerToPlace.current.set(marker, item); // 역참조 저장

        return marker;
      });

      lastFetchedBboxRef.current = bbox;

      setFetchedMarker(true);
      // ✅ 한 번에 클러스터러에 등록
      clustererRef.current?.addMarkers(markersRef.current);
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
    closeAll();
    setSheetYOverride(null);
    // clearRadiusRing();
    // clearNearbyMarkers();
  };

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
      // if (e.key.toLowerCase() === "d") {
      //   setIsDev((prev) => {
      //     const next = !prev;
      //     localStorage.setItem("devhud", next ? "1" : "0");
      //     return next;
      //   });
      // }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => () => cancel(), [cancel]); // 언마운트 시 진행중 요청취소

  useEffect(() => {
    if (!map.current) return;

    const id = window.setTimeout(() => {
      const param = new URLSearchParams();
      param.append("title", inputs);
      fetch(`/api/search?${param}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data: SearchItem[]) => {
          setSearch([...data]);
        })
        .catch((e) => console.error(e));
    }, 300);

    return () => clearTimeout(id);
  }, [inputs]);

  useEffect(() => {
    if (!map.current) return;
    if (!map.current || !autoQuery) return; // ✅ guard

    const cur = boxRef.current ?? readMapBBox(map.current);
    if (!cur) return;
    fetchPlacesForBBox(cur);
  }, [userCategory, autoQuery]);

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

        const lat = parseFloat(sp.get("lat") ?? "37.5665" );
        const lng = parseFloat(sp.get("lng") ?? "126.978");
        const title = sp.get("title") ?? "선택 위치";

        

  

        // 지도 생성
        map.current = new kakao.maps.Map(mapRef.current, {
          center: new kakao.maps.LatLng(lat, lng),
          level: 5,
        }); 

        if(lat && lng && title) {
          const marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(lat, lng),
            title: title,
          });
          // kakao.maps.event.addListener(marker, "click", () =>
          //   onSelectNearby({ kind: "place", data: p })
          // );
          marker.setMap(map.current); // ✅ 지도에 부착
        }



        // 2) (여기서 바로) 클러스터러 생성
        const Clusterer = (window.kakao.maps as any).MarkerClusterer;
        if (!Clusterer) {
          console.error("Clusterer library not loaded. Check SDK URL.");
          return;
        }
        clustererRef.current = new Clusterer({
          map: map.current,
          averageCenter: true,
          minLevel: 10,
          disableClickZoom: true,
        });

        map.current.setZoomable(true);
        map.current.setDraggable(true);

        // 진단용 컨트롤(버튼으로 확대/축소가 되면 입력(휠) 경로만 문제인 상태)
        const ctrl = new kakao.maps.ZoomControl();
        map.current.addControl(ctrl, kakao.maps.ControlPosition.RIGHT);

        allowAutoMoveUntilRef.current = Date.now() + 5000;

        const offHandlers: Array<() => void> = [];

        const onIdle = () => {
          boxRef.current = readMapBBox(map.current);

          if (programmaticMoveCntRef.current > 0) {
            // 프로그램이 지도 이동/줌을 실행한 직후 발생하는 idle(또는 연쇄 이벤트)를 무시하려는 목적
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
            if (!autoQuery) return; // ✅ 사용자 행동 전엔 가져오지 않기
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
          // 프로그램이 방금 지도 이동/줌을 일으킨 경우 → 시트 닫지 않음
          if (programmaticMoveCntRef.current > 0) {
            programmaticMoveCntRef.current = Math.max(
              0,
              programmaticMoveCntRef.current - 1
            );
            return;
          }

          userInteractedRef.current = true;
          onCloseSheet();
        };

        const onMapCanvasClick = () => {
          userInteractedRef.current = true;
          onCloseSheet();
          clearRadiusRing();
          //clearNearbyMarkers();
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
          clustererRef.current?.clear();
          clustererRef.current?.setMap(null);
          clustererRef.current = null;
          //clearNearbyMarkers();

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
    <div>
      {/* 🔹 검색창 컨테이너: relative + 높은 z-index */}
      <div className="pointer-events-none fixed left-1/2 top-4 -translate-x-1/2 z-40 w-[min(92%,720px)] px-2">
        <div className="pointer-events-auto">
          <SearchBar
            inputs={inputs}
            setInputs={setInputs}
            setMapCover={setMapCover}
            closeAll={closeAll}
            mapCover={mapCover}
          />

          {/* 🔽 드롭다운: 검색창 바로 아래. 배경은 여기(결과 패널)에만 존재 */}
          {mapCover === "on" && inputs.trim().length > 0 && (
            <div className="relative">
              <div className="absolute left-0 right-0 top-2 z-50 max-h-[55vh] overflow-y-auto">
                <SearchContent
                  searchKeyWord={searchKeyWord}
                  inputs={inputs}
                  onPick={onPickKeyWord}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* 🗺️ 지도 */}
      <div className="relative w-full h-screen">
        <div ref={mapRef} className="absolute inset-0" />

        {/* 🌫️ 지도 딤 오버레이: 배경 클릭 시 닫힘 */}
        <div
          className={[
            "absolute inset-0 z-30 transition-opacity duration-200",
            mapCover === "off"
              ? "opacity-0 pointer-events-none"
              : "opacity-100 pointer-events-none",
          ].join(" ")}
          aria-hidden={mapCover === "off"}
          onClick={() => setMapCover("off")}
        >
          {/* ⚠️ 흰 배경/블러 대신 가벼운 딤만 */}
          <div className="absolute inset-0 bg-white" />
        </div>

        {mapReady && showSpinner && (
          <div className="absolute top-4 right-4 z-20 text-xs px-2 py-1 rounded bg-black/80 text-white pointer-events-none">
            장소 불러오는 중…
          </div>
        )}
      </div>

      {isDev && boundsText && (
        <div className="fixed bottom-2 right-2 rounded bg-black text-xs shadow px-2 py-1 pointer-events-none">
          {boundsText}
        </div>
      )}

      <SheetProvider onclose={onCloseSheet}>
        <BottomSheet
          bottomView={bottomView}
          openDetail={openDetail}
          closeAll={closeAll}
          ref={sheetRef}
          sheet={sheet}
          setSheet={setSheet}
          yOverride={sheetYOverride}
          onSelectNearby={onSelectNearby}
        />
      </SheetProvider>
    </div>
  );
}
