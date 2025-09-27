// hooks/usePexelsFeed.ts
import { useInfiniteQuery, type InfiniteData, type UseInfiniteQueryResult } from "@tanstack/react-query";

export type PexelsPage = { items: any[]; nextPage?: number };

export function usePexelsFeed(params: {
  q: string;
  type?: "photo" | "video" | "all";
  orientation?: string;
  locale?: string;
}): UseInfiniteQueryResult<InfiniteData<PexelsPage, number>, Error> {
  return useInfiniteQuery<
    PexelsPage,                                // TQueryFnData: "각 페이지"의 형태
    Error,                                     // TError
    InfiniteData<PexelsPage, number>,          // TData: 최종 data 형태(= InfiniteData)
    [string, typeof params],                   // TQueryKey
    number                                     // TPageParam
  >({
    queryKey: ["pexels", params],
    initialPageParam: 1,                       // v5에서 필수!
    queryFn: async ({ pageParam }) => {
      const qs = new URLSearchParams({
        q: params.q,
        type: params.type ?? "photo",
        orientation: params.orientation ?? "landscape",
        locale: params.locale ?? "ko-KR",
        page: String(pageParam),
        per_page: "30",
      });
      const res = await fetch(`/api/pexels?${qs.toString()}`);
      if (!res.ok) throw new Error("Pexels fetch failed");
      return (await res.json()) as PexelsPage; // { items, nextPage }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage, // 마지막이면 undefined
    staleTime: 300_000,
  });
}
