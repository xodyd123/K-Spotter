// app/api/pexels/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs"; // (선택) Edge 사용 시도중이면 Node로 고정

const BASE = "https://api.pexels.com";

async function fetchJSON(url: string, headers: Record<string,string>) {
  const r = await fetch(url, { headers, next: { revalidate: 1800 } });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(`Pexels ${r.status} ${r.statusText} :: ${text.slice(0,200)}`);
  }
  try { return JSON.parse(text); } catch {
    throw new Error(`Pexels JSON parse error :: ${text.slice(0,200)}`);
  }
}

const FALLBACKS: Record<string,string[]> = {
  "대한민국": ["South Korea","Korea","Seoul skyline"],
  "한국": ["South Korea","Seoul"],
  "서울": ["Seoul","Namsan tower","Han river night"],
  "부산": ["Busan","Gwangan bridge","Haeundae beach"],
  "제주": ["Jeju island","Seongsan Ilchulbong","Jeju coast"],
};

export async function GET(req: Request) {
  if (!process.env.PEXELS_KEY) {
    return NextResponse.json({ error: "PEXELS_KEY missing in .env.local" }, { status: 500 });
  }
  const HDRS = { Authorization: process.env.PEXELS_KEY! };

  const sp = new URL(req.url).searchParams;
  const q = sp.get("q") ?? "seoul skyline night";
  const type = (sp.get("type") ?? "photo") as "photo"|"video"|"all";
  const page = Number(sp.get("page") ?? "1");
  const per  = Number(sp.get("per_page") ?? "30");
  const orientation = sp.get("orientation") ?? "landscape";
  const locale = sp.get("locale") ?? "en-US";

  async function queryOnce(query: string) {
    const debug: any = { query, photo: {}, video: {} };
    let items: any[] = [];
    let photoHasMore = false, videoHasMore = false;

    if (type === "photo" || type === "all") {
      const url = `${BASE}/v1/search?query=${encodeURIComponent(query)}&per_page=${per}&page=${page}&orientation=${orientation}&locale=${locale}`;
      const j = await fetchJSON(url, HDRS);
      debug.photo.total = j.total_results;
      debug.photo.len = j.photos?.length ?? 0;
      debug.photo.hasNext = Boolean(j.next_page);
      items.push(...(j.photos ?? []).map((p: any) => ({
        id: String(p.id), type: "image" as const,
        src: p.src?.large2x ?? p.src?.large ?? p.src?.landscape ?? p.src?.original,
        thumb: p.src?.medium ?? p.src?.small ?? p.src?.tiny ?? p.src?.large,
        w: p.width, h: p.height,
        author: { name: p.photographer, url: p.photographer_url },
        pexelsUrl: p.url, alt: p.alt, avg: p.avg_color,
      })));
      photoHasMore = debug.photo.hasNext || ((j.photos?.length ?? 0) === per);
    }

    if (type === "video" || type === "all") {
      // orientation 제거 (영상 쿼리)
      const url = `${BASE}/videos/search?query=${encodeURIComponent(query)}&per_page=${per}&page=${page}`;
      const j = await fetchJSON(url, HDRS);
      debug.video.total = j.total_results;
      debug.video.len = j.videos?.length ?? 0;
      debug.video.hasNext = Boolean(j.next_page);
      items.push(...(j.videos ?? []).map((v: any) => {
        const files = (v.video_files ?? [])
          .filter((f: any) => f.file_type === "video/mp4")
          .sort((a: any, b: any) => (a.width ?? 0) - (b.width ?? 0));
        const best = files.find((f: any) => (f.width ?? 0) <= 1280) ?? files[0];
        const thumb = v.video_pictures?.[0]?.picture ?? v.image ?? "";
        return {
          id: String(v.id), type: "video" as const,
          src: best?.link ?? "", thumb,
          w: best?.width ?? v.width ?? 1280, h: best?.height ?? 720,
          author: { name: v.user?.name ?? "Pexels", url: v.user?.url ?? "https://www.pexels.com" },
          pexelsUrl: v.url, duration: v.duration,
        };
      }));
      videoHasMore = debug.video.hasNext || ((j.videos?.length ?? 0) === per);
    }

    return { items, hasMore: (type==="photo"?photoHasMore:type==="video"?videoHasMore:(photoHasMore||videoHasMore)), debug };
  }

  try {
    // 1차: 원 쿼리
    let { items, hasMore, debug } = await queryOnce(q);

    // 2차: 한글이면 영문 폴백
    if (items.length === 0 && /[가-힣]/.test(q)) {
      for (const cand of (FALLBACKS[q] ?? ["South Korea","Seoul","Busan","Jeju island"])) {
        const r = await queryOnce(cand);
        debug.fallbackTried = (debug.fallbackTried ?? []).concat(cand);
        if (r.items.length) { items = r.items; hasMore = r.hasMore; debug.usedFallback = cand; break; }
      }
    }
    console.log(items); 
    return NextResponse.json({ items, nextPage: hasMore ? page + 1 : undefined, debug });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 502 });
  }
}
