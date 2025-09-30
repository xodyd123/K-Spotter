"use client";

import { useBalancedFeed } from "@/hooks/useBalancedFeed";
import { useEffect,  useRef, useState } from "react";
import { Card, SkeletonCard } from "./ categoryBadge";
import { GetKeywordSearch } from "@/lib/mock/api/getKeyword";
import { Photo } from "type/type";
import { PhotoViewer } from "@/app/components/home/photoViewer";

// import Card, SkeletonCard ...

export default function BalancedFeedUI() {
  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useBalancedFeed();

  const [selected, setSelected] = useState<Photo | null>(null); 

  // 1) items: 함수가 아니라 배열로!
  const items =  (data?.pages ?? []).flatMap((p) => p.items) ;

  const onSearchClick =  (title : string) =>  GetKeywordSearch({keyword : title}) ; 

  // 2) IntersectionObserver: useEffect는 한 번만
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  
   // 무한스크롤 센티넬
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="mx-auto max-w-7xl px-3 py-6">

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          데이터 로드 중 오류가 발생했어요.{" "}
          <button className="underline" onClick={() => refetch()}>
            다시 시도
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <Card key={p.cid} p={p} setSelected={setSelected} onSearchClick ={onSearchClick }  onOpen = {() => {
            setSelected(p)}}/>
        ))}
        {isLoading &&
          Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={`skel-${i}`} />
          ))}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        {hasNextPage ? (
          <button
            onClick={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
              
            }}
            disabled={isFetchingNextPage}
            className="rounded-full border bg-white px-4 py-2 text-sm shadow hover:shadow-md disabled:opacity-60"
          >
            {isFetchingNextPage ? "로딩 중…" : "더 보기"}
          </button>
        ) : (
          <div className="text-sm text-gray-500">마지막 페이지입니다</div>
        )}

        {/* 스크롤 트리거용 센티넬 */}
        <div ref={sentinelRef} className="h-8 w-full" />
      </div>

      {selected && (
        <PhotoViewer
         photo = {selected} 
         onClose = {() => setSelected(null)}/> // 닫기 
      )}
    </div>
  );
}
