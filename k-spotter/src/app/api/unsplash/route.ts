// app/api/unsplash/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";

const QUERY_BY_INTENT = {
  hanok:   "대한민국 한옥 한옥마을 전통 건축",
  nature:  "대한민국 바다 해변 산 국립공원 계곡 폭포",
  city:    "대한민국 도시 스카이라인 타워 브리지 전망대 야경",
  culture: "대한민국 전통시장 야시장 문화의거리 벽화 박물관 미술관 공연 축제",
} as const;

const norm = (s = "") =>
  s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const intent   = (sp.get("intent") as keyof typeof QUERY_BY_INTENT) || "city";
  const q        =  sp.get("q") || QUERY_BY_INTENT[intent];
  console.log("q" ,q); 
  const page     = Number(sp.get("page") ?? "1");
  const perPage  = Number(sp.get("per_page") ?? "24");
  const orient   = sp.get("orientation") ?? "landscape";
  const ak       = process.env.UNSPLASH_ACCESS_KEY!;
  const includeTags = sp.get("include_tags") === "1";
  const mustTags = (sp.get("must_tags") || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  const onlyWithTags = includeTags || mustTags.length > 0;
  const tagsLimit = Math.min(
    Number(sp.get("tags_limit") ?? String(perPage)),
    perPage
  );

  // 1) 검색
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", q);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("orientation", orient);
  url.searchParams.set("order_by", "relevant");
  url.searchParams.set("content_filter", "high");

  const r = await fetch(url, {
    headers: { Authorization: `Client-ID ${ak}`, "Accept-Version": "v1" },
    next: { revalidate: 1800 },
  });
  

  if (!r.ok) {
    const t = await r.text();
    return NextResponse.json({ error: `Unsplash ${r.status}: ${t.slice(0,200)}` }, { status: 502 });
  }
  const j = await r.json();
  let items = (j.results ?? []).map((p: any) => ({
    id: p.id,
    type: "image" as const,
    src: p.urls?.regular,
    thumb: p.urls?.small,
    width: p.width,
    height: p.height,
    alt: p.alt_description || p.description || "",
    author: { name: p.user?.name, profile: p.user?.links?.html },
    creditHref: `${p.user?.links?.html}?utm_source=K-Spotter&utm_medium=referral`,
    download_location: p.links?.download_location,
    link: p.links?.html,
    tags: [] as string[], // ← 여기 채워줄 예정
  }));

  // 2) (선택) 태그 보강: 상단 N개에 대해 /photos/:id 호출
  if (onlyWithTags && items.length > 0) {
    const details = await Promise.all(
      items.slice(0, tagsLimit).map(async it => {
        const r2 = await fetch(`https://api.unsplash.com/photos/${it.id}`, {
          headers: { Authorization: `Client-ID ${ak}`, "Accept-Version": "v1" },
          next: { revalidate: 1800 },
        });
        if (!r2.ok) return { id: it.id, tags: [] as string[] };
        const d = await r2.json();
        const tags = (d.tags || d.tags_preview || [])
          .map((t: any) => t?.title)
          .filter(Boolean);
        return { id: it.id, tags };
      })
    );
    const tagMap = new Map(details.map(d => [d.id, d.tags]));
    items = items.map(it => ({ ...it, tags: tagMap.get(it.id) || [] }));
  }

  // 3) 필터: mustTags가 있으면 그 단어가 태그에 하나라도 있어야 통과
  if (mustTags.length > 0) {
    const must = new Set(mustTags.map(norm));
    items = items.filter(it => 
         Array.isArray(it.tags) &&
         it.tags.some((t: string) => must.has(norm(t)))

    );
  }

  // 4) 태그가 전혀 없는 항목 제거 (원하면)
  if (onlyWithTags && mustTags.length === 0) {
    items = items.filter(it => Array.isArray(it.tags) && it.tags.length > 0);
  }

  const total = j.total ?? 0;
  const hasMore = page * perPage < total;
 
  return NextResponse.json({ items, nextPage: hasMore ? page + 1 : undefined });
}
