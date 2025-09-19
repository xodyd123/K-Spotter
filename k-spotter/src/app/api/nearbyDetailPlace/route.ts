// src/app/api/nearbyDetailPlace/route.ts
import { NextRequest, NextResponse } from "next/server";
const BASE = "https://apis.data.go.kr/B551011/KorService2";

// typeId별 접미사 사전 (필요한 것만 우선)
const SUFFIX: Record<string, string> = {
    "12": "",          // 관광지
    "14": "culture",   // 문화시설
    "28": "leports",   // 레포츠
    "38": "shopping",  // 쇼핑
    "39": "food",      // 음식점
    "32": "lodging",   // 숙박 (필요 시)
    // ...필요하면 추가
  };

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const contentTypeId = sp.get("contentTypeId");
  const contentId     = sp.get("placeId");
  const rawKey        = process.env.OPEN_API_KEY;

  if (!rawKey) throw new Error("[TourAPI] Missing env: OPEN_API_KEY");
  if (!contentTypeId || !contentId) {
    return NextResponse.json({ error: "contentTypeId & placeId required" }, { status: 400 });
  }

  const key = rawKey.includes("%") ? decodeURIComponent(rawKey) : rawKey;

  // detailIntro2: 카테고리별 상세 필드(음식점: opentimefood 등)
  const url = new URL(`${BASE}/detailIntro2`);
  url.searchParams.set("serviceKey", key);
  url.searchParams.set("MobileOS", "ETC");
  url.searchParams.set("MobileApp", "K-Spotter");
  url.searchParams.set("_type", "json");
  url.searchParams.set("contentTypeId", contentTypeId);
  url.searchParams.set("contentId", contentId);
  // (선택) 확실히 1건만: url.searchParams.set("numOfRows", "1"); url.searchParams.set("pageNo","1");

  const res = await fetch(url.toString(), { cache: "no-store" });

  // ❗ XML/HTML 방어
  const text = await res.text();
  if (!res.ok || text.trim().startsWith("<")) {
    return NextResponse.json(
      { error: "Upstream error", sample: text.slice(0, 180) },
      { status: 502 }
    );
  }

  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 502 });
  }

  // resultCode 체크(선택)
  const code = json?.response?.header?.resultCode;
  if (code && code !== "0000") {
    return NextResponse.json({ error: `API error ${code}` }, { status: 502 });
  }

  // ✅ item 추출(단일/배열 모두 처리)
  const rawItem = json?.response?.body?.items?.item;
  const item = Array.isArray(rawItem) ? rawItem[0] : rawItem;
  console.log("item" , item) ;
  if (!item) {
    return NextResponse.json({ error: "No detail item" }, { status: 404 });
  }

  // ✅ 카테고리별 키 fallback(음식점 39 외도 어느 정도 견딤)
  const pick = ( ...cands: Array<string | undefined> ) =>
    cands.find(v => v !== undefined && v !== null && String(v).trim() !== "") ?? "";
// 주어진 base키들에 대해, 접미사 버전 → 일반키 순으로 탐색
const pickWithSuffix = (obj: any, suffix: string, bases: string[]) => {
    const keys = [
      ...bases.map(b => suffix ? `${b}${suffix}` : b),
      ...bases, // fallback: 일반키도 시도
    ];
    return pick(...keys.map(k => obj?.[k]));
  };
  
  const suffix = SUFFIX[contentTypeId] ?? "";
  const openHours = pickWithSuffix(item, suffix, ["opentime", "usetime"]);
  const closedDay = pickWithSuffix(item, suffix, ["restdate"]);
  const phone     = pickWithSuffix(item, suffix, ["infocenter", "tel"]);
  
  return NextResponse.json({ openHours, closedDay, phone });
}
