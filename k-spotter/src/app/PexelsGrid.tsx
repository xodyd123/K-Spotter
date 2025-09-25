"use client";
import { usePexelsFeed } from "../hooks/usePexelsFeed(";
import { MediaCard } from "../app/mediaCard";

export default function PexelsGrid() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePexelsFeed({ q: "Korea seaside beach coast", type: "all" });

  const items = data?.pages.flatMap((p: any) => p.items) ?? [];

  console.log("items" , items) ;

  return (
    <main className="mx-auto grid max-w-6xl grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((m: any) => <MediaCard key={`${m.type}-${m.id}`} m={m} />)}
      {/* IntersectionObserver로 바닥 감지 후 fetchNextPage 호출하면 무한 스크롤 완성 */}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="col-span-full rounded border px-3 py-2">
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      )}
    </main>
  );
}