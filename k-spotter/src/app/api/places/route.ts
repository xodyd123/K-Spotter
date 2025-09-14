// app/api/places/route.ts  (예시: App Router)
import { NextRequest, NextResponse } from "next/server";
import { pool } from "../../../../lib/db"
import { BBoxArr } from "../../../../type/type";



export const runtime = "nodejs";

const parseBbox = (bboxStr: string | null): BBoxArr | null => {
  if (!bboxStr) return null;
  const parts = bboxStr.split(",").map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isFinite(n))) return null;
  return parts as BBoxArr;
};

// // 날짜변경선(±180°) 교차까지 안전한 포함 검사
// const pointInBbox = (bbox: BBoxArr, lat: number, lng: number): boolean => {
//   const [swLat, swLng, neLat, neLng] = bbox;

//   // 위도: 항상 min/max로 판정(혹시 순서가 뒤집혀 와도 안전)
//   const latMin = Math.min(swLat, neLat);
//   const latMax = Math.max(swLat, neLat);
//   const latOK = lat >= latMin && lat <= latMax;

//   // 경도: 일반 박스 vs 날짜변경선 교차 박스
//   const wraps = swLng > neLng; // 예: sw=170, ne=-170
//   const lngOK = wraps
//     ? (lng >= swLng || lng <= neLng)
//     : (lng >= swLng && lng <= neLng);

//   return latOK && lngOK;
// };

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  // 프런트에서 보내는 카테고리(Drama/Movie/MusicVideo) → DB의 media_type
  const cats = sp.getAll("category"); // 예: ?category=Drama&category=Movie
  const bbox = parseBbox(sp.get("bbox")); // "minLng,minLat,maxLng,maxLat"
  const limit = 200



  // 동적 WHERE 구성
  let where = "WHERE geom IS NOT NULL";
  const params: any[] = [];
  let i = 1;

  if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    where += ` AND geom && ST_MakeEnvelope($${i},$${i + 1},$${i + 2},$${i + 3},4326)`;
    params.push(minLng, minLat, maxLng, maxLat);
    i += 4;
  }

  if (cats.length > 0) {
    where += ` AND media_type = ANY($${i}::text[])`;
    params.push(cats);
    i += 1;
  }

  // if (!includeParking) {
  //   // 주차장/parking 류는 기본 숨김
  //   where += ` AND COALESCE(place_type,'') !~* '(주차|주차장|parking|car ?park)'`;
  // }

  const order = `ORDER BY updated_at DESC NULLS LAST, spot_id DESC`;
  const sql = `
    SELECT
      spot_id AS id,
      lat, lng,
      title, address,
      media_type AS category,      -- 프런트 타입에 맞춰 별칭
      place_type AS placeType , 
      place_detail AS placeDetail,
      open_hours   AS openHours,
      place_name As placeName,
      phone,
      closed_day AS closedDay 
      FROM public.spots
    ${where}
    ${order}
    LIMIT $${i};
  `;
  params.push(limit);

  try {
    const { rows } = await pool.query(sql, params);
 
    return NextResponse.json(rows);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}