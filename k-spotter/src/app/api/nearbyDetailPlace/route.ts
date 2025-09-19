// src/app/api/nearbyDetailPlace/route.ts
import { NextRequest, NextResponse } from "next/server";
const BASE = "https://apis.data.go.kr/B551011/KorService2";

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
  if (!item) {
    return NextResponse.json({ error: "No detail item" }, { status: 404 });
  }

  // ✅ 카테고리별 키 fallback(음식점 39 외도 어느 정도 견딤)
  const pick = ( ...cands: Array<string | undefined> ) =>
    cands.find(v => v !== undefined && v !== null && String(v).trim() !== "") ?? "";

  const openHours =
    contentTypeId === "39"
      ? pick(item.opentimefood, item.opentime, item.usetime)
      : pick(item.usetime, item.opentime);

  const closedDay =
    contentTypeId === "39"
      ? pick(item.restdatefood, item.restdate)
      : pick(item.restdate);

  const phone =
    contentTypeId === "39"
      ? pick(item.infocenterfood, item.infocenter, item.tel)
      : pick(item.infocenter, item.tel);

  return NextResponse.json({ openHours, closedDay, phone });
}
