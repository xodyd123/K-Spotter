import { useInfiniteQuery } from "@tanstack/react-query";
import { Photo } from "../../type/type";


  
type Resp = { items: Photo[]; cursor: string | null; hasMore: boolean };
const PAGE = 24;

export function useBalancedFeed() {
    // 핵심: select 제거, 제네릭 과하게 지정하지 말고 추론에 맡겨도 됨
    return useInfiniteQuery({
      queryKey: ["photos-balanced"] as const,
      initialPageParam: null as string | null,
      queryFn: async ({ pageParam, signal }) => {
        const params = new URLSearchParams({ pageSize: String(PAGE) });
        if (pageParam != null) params.set("cursor", pageParam);
        const r = await fetch(`/api/photos/balanced?${params}`, { signal });
        if (!r.ok) throw new Error("fetch failed");
        return (await r.json()) as Resp;
      },
      getNextPageParam: (last, _pages, lastParam) =>
        !last.hasMore || !last.cursor || last.cursor === lastParam
          ? undefined
          : last.cursor,
      refetchOnWindowFocus: false,
    });
  }
// 사용 시(무한 스크롤 트리거)
// if (hasNextPage && !isFetchingNextPage) fetchNextPage();
// hasNextPage가 false면 fetchNextPage() 호출해도 queryFn은 실행되지 않습니다.
