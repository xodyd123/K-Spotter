"use client";

import { useEffect, useRef } from "react";
// ⬇️ Unsplash 훅으로 교체 (앞서 드린 useUnsplashFeed 사용)
import { useUnsplashFeed } from "../hooks/useUnsplashFeed";
import { MediaCard } from "../app/mediaCard";

export default function UnsplashGrid() {
  // intent로 무드 지정(예: 'sea' | 'night' | 'heritage' | 'mountain' | 'other')
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useUnsplashFeed({ intent: "night" });

  const items = data?.pages.flatMap((p: any) => p.items) ?? [];

  // 무한 스크롤 sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          fetchNextPage();
        }
      },
      { rootMargin: "600px 0px" } // 여유 스크롤
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <main className="mx-auto grid max-w-6xl grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((m: any) => (
        <div key={m.id} className="relative">
          <MediaCard m={m} />
          {/* ⬇️ Unsplash는 크레딧 표기가 요구됩니다. (작가명 링크) */}
     
        </div>
      ))}

      {/* 무한 스크롤 트리거 */}
      <div ref={sentinelRef} className="col-span-full h-10" />

      {/* 수동 로드 버튼(백업) */}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="col-span-full rounded border px-3 py-2"
        >
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      )}
    </main>
  );
}
