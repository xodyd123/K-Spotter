// app/api/places/route.ts  (예시: App Router)
import { NextRequest, NextResponse } from "next/server";
import { mockPlaces } from "../../../lib/mock/mockData"; 

type BBoxArr = [number, number, number, number]; // [swLat, swLng, neLat, neLng]

const parseBbox = (bboxStr: string | null): BBoxArr | null => {
  if (!bboxStr) return null;
  const parts = bboxStr.split(",").map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isFinite(n))) return null;
  return parts as BBoxArr;
};

// 날짜변경선(±180°) 교차까지 안전한 포함 검사
const pointInBbox = (bbox: BBoxArr, lat: number, lng: number): boolean => {
  const [swLat, swLng, neLat, neLng] = bbox;

  // 위도: 항상 min/max로 판정(혹시 순서가 뒤집혀 와도 안전)
  const latMin = Math.min(swLat, neLat);
  const latMax = Math.max(swLat, neLat);
  const latOK = lat >= latMin && lat <= latMax;

  // 경도: 일반 박스 vs 날짜변경선 교차 박스
  const wraps = swLng > neLng; // 예: sw=170, ne=-170
  const lngOK = wraps
    ? (lng >= swLng || lng <= neLng)
    : (lng >= swLng && lng <= neLng);

  return latOK && lngOK;
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  // 카테고리는 여러 번 올 수 있음: ?category=Drama&category=Movie
  const cats = sp.getAll("category"); // string[]

  // bbox 파싱(없거나 잘못되면 null)
  const bbox = parseBbox(sp.get("bbox"));

  // 1) 기본 후보
  let list = mockPlaces;

  // 2) 카테고리 필터 (선택됨이 있을 때만)
  if (cats.length > 0) {
    const catSet = new Set(cats);
    list = list.filter(p => 
         catSet.has(p.category));
   // 문자열이 같아야 함
    // 필요시 대소문자 통일: catSet.has(p.category.toLowerCase())
  }

  // 3) BBox 필터 (bbox가 유효할 때만)
  if (bbox) {
    
    list = list.filter(p => pointInBbox(bbox, p.lat, p.lng));
  }

  return NextResponse.json(list);
}
