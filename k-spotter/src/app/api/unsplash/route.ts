// app/api/unsplash/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";

const QUERY_BY_INTENT = {
    sea:      "대한민국 바다 해변 coast seaside",
    night:    "대한민국 도시 야경 night skyline",
    heritage: "대한민국 유적지 궁궐 사찰 palace temple heritage",
    mountain: "대한민국 산 정상 능선 mountain peak ridge trail",
    other:    "대한민국 도시 거리 market street",
} as const;

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q        = sp.get("q") || "";
  const intent   = (sp.get("intent") as keyof typeof QUERY_BY_INTENT) || "other";
  const page     = Number(sp.get("page") ?? "1");
  const perPage  = Number(sp.get("per_page") ?? "30");
  const orient   = sp.get("orientation") ?? "landscape"; // landscape|portrait|squarish

  const query = q || QUERY_BY_INTENT[intent];
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("orientation", orient);
  url.searchParams.set("order_by", "relevant");
  url.searchParams.set("content_filter", "high");

  const ak = process.env.UNSPLASH_ACCESS_KEY;
  if (!ak) return NextResponse.json({ error: "UNSPLASH_ACCESS_KEY missing" }, { status: 500 });

  const r = await fetch(url, {
    headers: { Authorization: `Client-ID ${ak}`, "Accept-Version": "v1" },
    next: { revalidate: 1800 }, // 30분 캐시(상황에 맞게)
  });
  if (!r.ok) {
    const t = await r.text();
    return NextResponse.json({ error: `Unsplash ${r.status}: ${t.slice(0,200)}` }, { status: 502 });
  }

  const j = await r.json();
  const results = j.results ?? [];
  const items = results.map((p: any) => ({
    id: p.id,
    type: "image" as const,
    src: p.urls?.regular,              // 반드시 Unsplash 제공 URL 사용(핫링크)
    thumb: p.urls?.small,
    width: p.width, height: p.height,
    alt: p.alt_description || p.description || "",
    author: { name: p.user?.name, profile: p.user?.links?.html },
    creditHref: `${p.user?.links?.html}?utm_source=K-Spotter&utm_medium=referral`,
    download_location: p.links?.download_location, // “사용” 시 트래킹
    unsplash_link: p.links?.html,
    intent,
  }));

  const total = j.total ?? 0;
  const hasMore = page * perPage < total;
  console.log("items" , items);
  return NextResponse.json({ items, nextPage: hasMore ? page + 1 : undefined });
}
