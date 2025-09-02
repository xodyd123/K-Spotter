
import { NextRequest, NextResponse } from "next/server";

const BASE = "https://apis.data.go.kr/B551011/PhotoGalleryService1/gallerySearchList1";
const SERVICE_KEY = process.env.OPEN_API_KEY!; // .env.local

export async function GET(req: NextRequest) {
  
    const keyword = req.nextUrl.searchParams.get("keyword") ?? "";
    const pageNo = req.nextUrl.searchParams.get("pageNo") ?? "1";
    const numOfRows = req.nextUrl.searchParams.get("numOfRows") ?? "10";
    const arrange = req.nextUrl.searchParams.get("arrange") ?? ""; // A/B/C

  

    if (!SERVICE_KEY) {
      return NextResponse.json({ error: "Missing service key" }, { status: 500 });
    }

    const params = new URLSearchParams({
      MobileOS: "ETC",
      MobileApp: "K-Spotter",
      _type: "json",
      pageNo,
      numOfRows,
    });
    if (keyword) params.set("keyword", keyword);
    if (arrange) params.set("arrange", arrange);

    // serviceKey는 재인코딩 방지: 직접 붙인다
    const url = `${BASE}?serviceKey=${SERVICE_KEY}&${params.toString()}`;


    const upstream = await fetch(url, { cache: "no-store" });
    const j = await upstream.json();
    const raw = j?.response?.body?.items?.item;
    const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
  

  
    return NextResponse.json(items);
  
}
