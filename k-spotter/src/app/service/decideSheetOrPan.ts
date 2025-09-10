import { SHEET_FRAC, Snap } from "../../../type/type";
// panOffsetForMarker는 "겹침(=패닝 필요량)"을 리턴하도록 구현되어 있어야 합니다.
import {
  desiredVisiblePx,
  extraVisibleToReachMarker,
  panOffsetForMarker, // (= overlap)
  ensureMarkerAboveSheet
} from "./panWithOffset";

type Decision = { yOverride?: string; panBy?: number };  

export function decideSheetOrPan( // 마커 가리는 기능 
  map: any,
  pos: kakao.maps.LatLng,
  snap: Snap
): Decision {
  if (snap === "closed") return {}; // 닫힘이면 아무것도 안 함

  const vh = window.innerHeight;
  const proj = map.getProjection();
  const pt = proj.containerPointFromCoords(pos); // 화면 좌표 (x, y)

 

  const vis0 = desiredVisiblePx(vh, snap);                // 현재 스냅에서 보이는 시트 높이(px)
  const needMore = extraVisibleToReachMarker(vh, pt.y)(vis0); // 마커 바로 아래까지 올리려면 '얼마나 더' 보여야 하는지
  const panNeed  = panOffsetForMarker(vh, vis0, pt.y);     // 지금 시트가 마커를 '얼마나 가리고 있는지' (= 패닝 필요량)
  
  
  if (panNeed > 0) {
    ensureMarkerAboveSheet(map, pos, panNeed); // 아래로 패닝 → 마커는 위로 보임
   
  
   
  }
  
  // 그 외엔 지도만 살짝 패닝(아래로 내리기 → 마커는 화면상 위로 보임)
  return { panBy: panNeed };
}
