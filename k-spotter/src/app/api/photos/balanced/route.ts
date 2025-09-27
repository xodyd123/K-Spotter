// app/api/photos/balanced/route.ts
import { NextRequest, NextResponse } from "next/server";

// ✅ JSON 정적 import (tsconfig.json에 "resolveJsonModule": true 필요)
import coastJson    from "@/app/api/data/v1/intent/coast.json";
import mountainJson from "@/app/api/data/v1/intent/mountain.json";
import heritageJson from "@/app/api/data/v1/intent/heritage.json";
import urbanJson    from "@/app/api/data/v1/intent/urban.json";

// (선택) Node 런타임 보장: Edge에서 Buffer 사용 시 오류
export const runtime = "nodejs";

type Photo = {
  cid: string;
  title: string;
  author?: string;
  url: string;
  category: "coast" | "mountain" | "heritage" | "urban";
  categoryLabel: string;
  region?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type Cursor = {
  coast: number;
  mountain: number;
  heritage: number;
  urban: number;
  seed: number;
};

// ✅ 슬러그/타입 선언
const SLUGS = ["coast", "mountain", "heritage", "urban"] as const;
type Slug = typeof SLUGS[number];

// ✅ 정적 버킷 구성 (타입 단언으로 Photo[] 명시)
const BUCKETS: Record<Slug, Photo[]> = {
  coast:    coastJson    as Photo[],
  mountain: mountainJson as Photo[],
  heritage: heritageJson as Photo[],
  urban:    urbanJson    as Photo[],
};

// ---- 커서 직렬화/역직렬화 ----
function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}
function decodeCursor(s: string | null): Cursor | null {
  if (!s) return null;
  try { return JSON.parse(Buffer.from(s, "base64url").toString("utf-8")) as Cursor; }
  catch { return null; }
}

// ---- 라운드-로빈 페이지 조립 ----
function buildBalancedPage(
  buckets: Record<Slug, Photo[]>,
  cursor: Cursor,
  pageSize: number
) {
  const idx: Record<Slug, number> = {
    coast: cursor.coast ?? 0,
    mountain: cursor.mountain ?? 0,
    heritage: cursor.heritage ?? 0,
    urban: cursor.urban ?? 0,
  };

  const result: Photo[] = [];
  const used = { coast: 0, mountain: 0, heritage: 0, urban: 0 };

  const pushFrom = (slug: Slug) => {
    const arr = buckets[slug];
    let i = idx[slug];
    if (i >= arr.length) return false;
    const seen = new Set(result.map(r => r.cid));
    while (i < arr.length && seen.has(arr[i].cid)) i++;
    if (i >= arr.length) { idx[slug] = i; return false; }
    result.push(arr[i]);
    used[slug]++;
    idx[slug] = i + 1;
    return true;
  };

  // A) 시드 4장
  for (const s of SLUGS) pushFrom(s);

  // B) 라운드-로빈
  let guard = 0;
  let ptr = (cursor.seed + result.length) % SLUGS.length;

  while (result.length < pageSize && guard < pageSize * 8) {
    const s = SLUGS[ptr % SLUGS.length];
    pushFrom(s);
    ptr++;
    guard++;

    if (guard % SLUGS.length === 0) {
      const couldAdd = SLUGS.some(slug => idx[slug] < buckets[slug].length);
      if (!couldAdd) break;
    }
  }

  const remainingPerBucket: Record<Slug, number> = {
    coast:    Math.max(0, buckets.coast.length    - idx.coast),
    mountain: Math.max(0, buckets.mountain.length - idx.mountain),
    heritage: Math.max(0, buckets.heritage.length - idx.heritage),
    urban:    Math.max(0, buckets.urban.length    - idx.urban),
  };
  const remaining =
    remainingPerBucket.coast +
    remainingPerBucket.mountain +
    remainingPerBucket.heritage +
    remainingPerBucket.urban;

  const exhausted = SLUGS.filter(s => idx[s] >= buckets[s].length);
  const isLastPage = remaining === 0 || result.length === 0;

  return {
    items: result,
    nextCursor: isLastPage ? null : ({ ...idx, seed: cursor.seed } as Cursor),
    hasMore: !isLastPage,
    used,
    meta: { remaining, remainingPerBucket, exhausted },
  };
}

// ---- 핸들러 ----
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pageSize = Math.max(4, Math.min(100, Number(url.searchParams.get("pageSize") ?? 24)));
  const curStr = url.searchParams.get("cursor");
  const nowSeed = Date.now();

  const cursor: Cursor =
    decodeCursor(curStr) ?? { coast: 0, mountain: 0, heritage: 0, urban: 0, seed: nowSeed };

  // ✅ 정적 버킷 그대로 사용 (readBucket/Promise.all 필요 없음)
  const { items, nextCursor, hasMore, used, meta } =
    buildBalancedPage(BUCKETS, cursor, pageSize);

  return NextResponse.json({
    items,
    cursor: nextCursor ? encodeCursor(nextCursor) : null, // 끝이면 null
    hasMore,
    stats: {
      pageSize,
      used,
      remaining: meta.remaining,
      remainingPerBucket: meta.remainingPerBucket,
      exhausted: meta.exhausted,
    },
  }, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
