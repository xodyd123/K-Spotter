// ./service/panWithOffset.ts
import { GAP_PX, HALF_FRAC, PEEK_PX, SHEET_FRAC, Snap } from "../../../type/type";

// ===== 공통 유틸 =====
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number) => Math.round(n);
export const SHEET_DVH = "92dvh";
export const maxVisiblePx = (vh: number) => round(vh * SHEET_FRAC);

// ✅ 지도 컨테이너 실제 높이 얻기 (폴백 포함)
export function getViewportHeight(map: any): number {
    try {
      if (map && typeof map.getNode === "function") {
        const el = map.getNode();
        if (el && el.clientHeight) return el.clientHeight;
      }
    } catch {}
    return window.innerHeight;
  }

// ===== 스냅/시트 높이 계산 =====
export function desiredVisiblePx(vh: number, snap: Snap) {
  const maxV = maxVisiblePx(vh);
  if (snap === "peek") return clamp(PEEK_PX, 0, maxV);
  if (snap === "half") return clamp(round(vh * HALF_FRAC), 0, maxV);
  if (snap === "full") return maxV;
  return 0; // closed
}

export function allowedVisiblePx(vh: number, markerY: number, gap = GAP_PX) {
  const y = clamp(markerY, 0, vh);          // 화면 밖 클릭 보정
  const bottomGap = vh - y;                  // 마커 아래 여유
  return clamp(bottomGap - gap, 0, maxVisiblePx(vh));
}

// 시트를 더 보여줘야 하는 양(부족분) — 부족할 때만 양수
export function extraVisibleToReachMarker(vh: number, markerY: number, gap = GAP_PX) {
  const allowed = allowedVisiblePx(vh, markerY, gap);
  return (visible: number) => clamp(allowed - visible, 0, maxVisiblePx(vh));
}

// 현재 겹쳐 가리는 양(= 지도 패닝 필요량) — 겹칠 때만 양수
export function overlapBySheet(vh: number, visible: number, markerY: number, gap = GAP_PX) {
    console.log("overlapBySheet")
  const allowed = allowedVisiblePx(vh, markerY, gap);
  return clamp(visible - allowed, 0, maxVisiblePx(vh));
}

// 과거 이름 호환: 패닝 필요량 계산자
export const panOffsetForMarker = overlapBySheet;

export function panWithOffset(
    map: any,
    pos: any /* kakao.maps.LatLng */,
    offsetYpx: number,
    offsetXpx = 0
  ) {
    const proj = map.getProjection();
    const pt = proj.containerPointFromCoords(pos);
    // ✅ +offsetY : 지도를 "아래로" 패닝 → 마커는 화면에서 "위로"
    const shifted = new window.kakao.maps.Point(pt.x + offsetXpx, pt.y + offsetYpx);
    const newCenter = proj.coordsFromContainerPoint(shifted);
    map.panTo(newCenter);
  }
  
  // 정확히 겹침만큼 패닝
  export function ensureMarkerAboveSheet(
    map: any,
    pos: any /* kakao.maps.LatLng */,
    visiblePx: number,
    gap = 12,
    eps = 1
  ) {
    const vh = getViewportHeight(map);           // ✅ 변경
    const proj = map.getProjection();
    const pt = proj.containerPointFromCoords(pos);
  
    const bottomGap = vh - pt.y;
    const overlap = visiblePx - (bottomGap - gap);
    const panBy = Math.max(0, Math.round(overlap));
  
    if (panBy > eps) panWithOffset(map, pos, panBy);
  }
  
  // 부드럽게(축소/상한) 패닝 — 필요하면 사용
  export function ensureMarkerAboveSheetSoft(
    map: any,
    pos: any /* kakao.maps.LatLng */,
    visiblePx: number,
    opts?: { gap?: number; factor?: number; maxPan?: number; eps?: number }
  ) {
    const { gap = 12, factor = 0.65, maxPan = 140, eps = 2 } = opts || {};
    const vh = getViewportHeight(map);
    const proj = map.getProjection();
    const pt = proj.containerPointFromCoords(pos);
  
    const bottomGap = vh - pt.y;
    const overlap = visiblePx - (bottomGap - gap);
  
    let panBy = Math.max(0, Math.round(overlap * factor));
    panBy = Math.min(panBy, maxPan);
    if (panBy > eps) panWithOffset(map, pos, panBy);
  }