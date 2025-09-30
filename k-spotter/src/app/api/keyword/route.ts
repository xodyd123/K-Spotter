import { buildURL } from "@/app/service/buildUrl";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const ENDPOINT = "https://apis.data.go.kr/B551011/KorService2/searchKeyword2";

const FIXTURE_DIR = path.join(process.cwd(), "fixtures/tourapi");
const FIXTURE_FILES = [
  "coast_with_coords.json",
  "heritage_with_coords.json",
  "mountain_with_coords.json",
  "urban_with_coords.json",
];

async function loadFixtureItems() {
  const all = [];
 
  for (const f of FIXTURE_FILES) {
    try {
      const txt = await fs.readFile(path.join(FIXTURE_DIR, f), "utf8");
      
      
      const arr = JSON.parse(txt);
     
      all.push(...arr);
    } catch {

     
      // 파일 없거나 JSON 오류는 무시하고 계속
    }
  }
  return all;
}

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("keyword") ?? "";
//   const useMock = process.env.MOCK_TOURAPI === "1";

//   // 1) 목 모드 : 로컬 JSON에서 검색
//   if (useMock) {
    
//     const itmes = await loadFixtureItems(); 
//     const q = (keyword ?? "").trim();
//     const filtered = 
//       itmes.filter((it: any) => (it?.title ?? "").includes(q)) // ← norm 제거
//       .slice(0, 20)
//       .map((it: any, idx: number) => ({
//         contentid: String(it.cid ?? idx + 1),
//         contenttypeid: 12,
//         title: it.title,
//         addr1: it.region ?? null,
//         mapx: it.lng ?? null, // 경도
//         mapy: it.lat ?? null, // 위도
//         firstimage: it.url ?? null,
//       }));
  
//     return NextResponse.json(filtered, { status: 200 });
//   }  


     const results = [];
    // 2) Kakao Local (관광명소 AT4)
    if ( process.env.KAKAO_REST_KEY) {
        try {
          const u = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
          u.searchParams.set("query", keyword);
          u.searchParams.set("category_group_code", "AT4"); // 관광명소
          // u.searchParams.set("x", "126.978"); u.searchParams.set("y", "37.5665"); u.searchParams.set("radius", "20000"); // 필요 시 중심/반경 제한
    
          const r = await fetch(u.toString(), {
            headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_KEY}` },
          });
          const raw = await r.json();
          for (const d of raw?.documents ?? []) {
            const lat = Number(d.y), lng = Number(d.x);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
            results.push({
              id: d.id,
              title: d.place_name,
              lat, lng,
              addr: d.road_address_name || d.address_name || null,
              image: null, // Kakao Local은 이미지 없음
              source: "kakao",
            });
          }
        } catch (e) {
            console.error(e.getMeessage()) ;
         }
         
      }
      console.log("result" , results) ;
      return NextResponse.json(results); 


     

  const url = buildURL(
    {
      contentTypeId: "12",
      numOfRows: "20",
      pageNo: "1",
      arrange: "C",
      keyword,
    },
    ENDPOINT
  );

  const r = await fetch(url, { cache: "no-store" });
  const raw = await r.json();

  const result = raw.response?.body?.items?.item;
  const items = Array.isArray(result) ? result : result ? [result] : [];

  console.log("items", items);
  return NextResponse.json(items);
}
