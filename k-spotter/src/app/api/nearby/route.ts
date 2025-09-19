import { NextRequest, NextResponse } from "next/server";
import { category, NearbyPlace, TourItem } from "../../../../type/type";

const ENDPOINT = "https://apis.data.go.kr/B551011/KorService2/locationBasedList2";

function buildURL(params: Record<string, string>) {


  const u = new URL(ENDPOINT);
 
  const rawKey = process.env.OPEN_API_KEY;
  if (!rawKey) {
    // 환경변수 문제를 바로 드러내기
    throw new Error("[TourAPI] Missing env: TOURAPI_KEY. Check .env.local and restart dev server.");
  }
  // 키에 %가 이미 들어있는(=인코딩된) 경우만 decode
  const key = rawKey.includes("%") ? decodeURIComponent(rawKey) : rawKey;

  u.searchParams.set("serviceKey", key);
  u.searchParams.set("MobileOS", "ETC");
  u.searchParams.set("MobileApp", "K-Spotter");
  u.searchParams.set("_type", "json");
   
  Object.entries(params).forEach(([k, v]) => {

    u.searchParams.set(k, v)
  
  });
  
  return u.toString();
}

// TourAPI 응답 → 배열 보정
function normalizeItems(j: any) {
  
  const raw = j?.response?.body?.items?.item;


  return Array.isArray(raw) ? raw : raw ? [raw] : [];
}


export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  
  // ✅ 클라이언트가 lat/lng로 보내면 올바르게 매핑
  const lat = sp.get("lat") ?? sp.get("mapY"); // 위도
  const lng = sp.get("lng") ?? sp.get("mapX"); // 경도
  if (!lat || !lng) {
    return NextResponse.json({ items: [], count: 0, error: "lat/lng required" }, { status: 400 });
  }

  const mapX = lng; // ✅ 경도 → mapX
  const mapY = lat; // ✅ 위도 → mapY

  const radius = sp.get("radius") ?? "2000";
  const numOfRows = sp.get("numOfRows") ?? "20";
  const pageNo = sp.get("pageNo") ?? "1";
  const arrange = sp.get("arrange") ?? "E";

  // ✅ 다중 contentTypeId 수신(반복 & 쉼표 둘 다 지원)
  let ids = sp.getAll("contentTypeId");
  if (ids.length === 0) {
  
    const raw = sp.get("contentTypeId");
    if (raw) ids = raw.split(",").map(s => s.trim()).filter(Boolean);
  }
  if (ids.length === 0) {
    // 기본값: 음식(39) + 관광지(12) 등 필요에 맞게 조정
    ids = ["12", "14"];
  }

  // 타입별 호출(병렬)
  const call = async (ctid: string) => {
    
    const url = buildURL({ mapX, mapY, radius, pageNo, numOfRows, arrange, contentTypeId: ctid });
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`TourAPI ${ctid} HTTP ${r.status}`);
    const j = await r.json(); // 필요 시 text() 분기 + XML 에러 파싱 로직 넣을 수 있음
    
    return normalizeItems(j) as TourItem[];
  };

  const settled = await Promise.allSettled(ids.map(call));

const merged: TourItem[] = [];
for (const s of settled) {
  if (s.status === "fulfilled") merged.push(...s.value);
  else console.error("[nearby] call failed:", s.reason); // ★ 실패 로그
}

  // ✅ contentid 기준 중복 제거 (없으면 좌표+제목)
  const uniqMap = new Map<string, TourItem>();
  for (const it of merged) {
    const key =
      (it.contentid != null ? String(it.contentid) : undefined) ??
      `${it.mapx}-${it.mapy}-${it.title}`;
    if (!uniqMap.has(key)) uniqMap.set(key, it);
  }
  const uniq = Array.from(uniqMap.values());


 
  
  // Place 매핑 (lat=mapy, lng=mapx 주의)
  const items: NearbyPlace[] = uniq
  .filter(it => it.mapx != null && it.mapy != null)
  .map((it) => {

    return {
      id: String(it.contentid ) ,
      lat: Number(it.mapy),   // 위도
      lng: Number(it.mapx),   // 경도
      addr: it.addr1 ?? '' , 
      thumb: it.firstimage ?? '' ,
      category: category.OTHER,
      placeName : it.title ,
      source : "nearby" , 
      contentTypeId : it.contenttypeid
    } 
  });
  
  const limit = Number(sp.get("limit") ?? 100);
  
  const sliced = items.slice(0, limit); 

 

  return NextResponse.json({ items: sliced, count: sliced.length });
}