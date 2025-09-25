// hooks/useUnsplashFeed.ts
import { useInfiniteQuery, InfiniteData } from "@tanstack/react-query";

type UItem = {
  id: string; type: "image";
  src: string; thumb?: string; alt?: string;
  author?: { name?: string; profile?: string };
  creditHref?: string;
  download_location?: string;
  intent: "sea"|"night"|"heritage"|"mountain"|"other";
};
type UPage = { items: UItem[]; nextPage?: number };

export function useUnsplashFeed(params: { intent: UItem["intent"]; q?: string }) {
  return useInfiniteQuery<UPage, Error, InfiniteData<UPage, number>, [string, typeof params], number>({
    queryKey: ["unsplash", params],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const u = new URL("/api/unsplash", location.origin);
      u.searchParams.set("intent", params.intent);
      if (params.q) u.searchParams.set("q", params.q);
      u.searchParams.set("page", String(pageParam));
      u.searchParams.set("per_page", "30");
      const r = await fetch(u.toString(), { cache: "no-store" });
      if (!r.ok) throw new Error("Unsplash fetch failed");
      return r.json();
    },
    getNextPageParam: (last) => last.nextPage,
    staleTime: 300_000,
  });
}
