"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { useFavorites } from "@/hooks/useLocalStorage";
import { DetailPlace, Home, NearbyPlace, Place } from "../../../type/type";
import HomeComponent from "./homeContnet";
import { getNearbyPlaces } from "@/lib/mock/apitour/getNearbyPlaces";
import { useQueryClient } from "@tanstack/react-query";
import NearbyComponent from "./nearbyComponent";

type Content =
  | { type: "Home"; data: Home }
  | { type: "NearbyPlace"; data: NearbyPlace[] }
  | { type: "DetailPlace"; data: DetailPlace }
  | null;

type NearbyAPIResult = { items: NearbyPlace[]; count: number };

export default function MarkerDetail({ item }: { item: Place }) {
  const [thumb, setThumb] = useState<string | null>(item.thumb ?? null);
  const [loading, setLoading] = useState<boolean>(!!item.thumb);
  const [error, setError] = useState<boolean>(false);

  const { toggle, isFavorite } = useFavorites();
  const fav = isFavorite(item.id);

  const home = {
    placename: item.placename,
    openHours: item.openhours,
    closedday: item.closedday,
    phone: item.phone,
    placetype: item.placetype,
    address: item.address,
  };

  const [content, setContent] = useState<Content>({ type: "Home", data: home });

  const qc = useQueryClient();

  const nearbyKey = (id: string) =>
    ["nearby", id, 2000, "food,cafe,attraction"] as const;

  const fetchNearby = (p: Place) => () =>
    getNearbyPlaces({
      lat: p.lat,
      lng: p.lng,
      id: p.id,
      radius: 2000,
      cats: ["food", "cafe", "attraction"],
      sort: "reco",
    }); // Promise<NearbyAPIResult>

  const adaptNearby = (arr: NearbyPlace[]): NearbyPlace[] => {
    return arr.map((n) => ({
      addr: n.addr,
      title: n.title,
      lat: n.lat,
      lng: n.lng,
      thumb: n.thumb,
      category: n.category,
      id: n.id,
    }));
  };

  // 1) onClick: async + 타입 명시 + data-tab 사용
  const onTabClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const tab = e.currentTarget.dataset.tab as
      | "Home"
      | "NearbyPlace"
      | "DetailPlace";

    if (tab === "Home") {
      setContent({ type: "Home", data: home });
      return;
    }

    if (tab === "NearbyPlace") {
      const key = nearbyKey(item.id);

      // 1) 캐시에 있으면 즉시 UI 업데이트
      const cached = qc.getQueryData<NearbyAPIResult>(key);
      if (cached) {
        const data = adaptNearby(cached.items);
        setContent({ type: "NearbyPlace", data });

        // 백그라운드 최신화(선택)
        qc.invalidateQueries({ queryKey: key, exact: true });
        return;
      }

      // 2) 캐시에 없으면 가져오기(히트면 재요청 안 함)
      try {
        const res = await qc.ensureQueryData<NearbyAPIResult>({
          queryKey: key,
          queryFn: fetchNearby(item),
          staleTime: 5 * 60 * 1000, // 5분
        });
        setContent({ type: "NearbyPlace", data: res.items });
      } catch (e) {
        // 에러뷰
      }
    }
    // (참고) DetailPlace 탭 클릭 시 동작은 아직 미구현
  }; // ← onTabClick 닫힘

  const onToggle = useCallback(() => {
    toggle({
      id: item.id,
      title: item.title,
      lat: item.lat,
      lng: item.lng,
      thumb: item.thumb ?? null,
    });
  }, [toggle, item.id, item.title, item.lat, item.lng, item.thumb]);

  useEffect(() => {
    setThumb(item.thumb ?? null);
    setError(false);
    setLoading(!!item.thumb);
  }, [item.id, item.thumb]);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        `${item.placename || item.title}\n${item.address}\n(${item.lat}, ${item.lng})`
      );
      alert("주소가 복사되었습니다.");
    } catch {
      alert("복사에 실패했어요.");
    }
  }, [item.address, item.lat, item.lng, item.placeName, item.title]);

  const onShare = useCallback(async () => {
    const text = `${item.placeName || item.title} • ${item.address}`;
    const url = `https://map.kakao.com/link/to/${encodeURIComponent(
      item.title
    )},${item.lat},${item.lng}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert("링크가 복사되었습니다.");
    }
  }, [item.address, item.lat, item.lng, item.placename, item.title]);

  const categoryPill = useMemo(() => {
    const tone: Record<string, string> = {
      Drama: "bg-violet-100 text-violet-800 ring-violet-200",
      Movie: "bg-rose-100 text-rose-800 ring-rose-200",
      MusicVideo: "bg-emerald-100 text-emerald-800 ring-emerald-200",
      Other: "bg-slate-100 text-slate-800 ring-slate-200",
    };
    const base = tone[item.category] ?? tone.Other;
    return `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ${base}`;
  }, [item.category]);

  return (
    // 시맨틱을 위해 DOM 순서는 본문 → 이미지(아래). 시각적으로도 아래에 보이도록 flex-col
    <section className="group flex flex-col overflow-hidden">
      {/* 본문 */}
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="mb-3 flex items-start gap-3">
          <h2 className="flex-1 truncate pr-2 text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight text-gray-900">
            {item.placename}
          </h2>

          <button
            type="button"
            onClick={onToggle}
            aria-pressed={fav}
            className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow ring-1 ring-black/10 hover:bg-gray-50"
            title={fav ? "즐겨찾기 해제" : "즐겨찾기 저장"}
          >
            {fav ? "♥ 저장됨" : "♡ 저장"}
          </button>
        </div>

        <div className="mt-1.5 flex items-start gap-3">
          <span className={categoryPill} aria-label="카테고리">
            {item.category}
          </span>
          <span className="flex-1 text-[15px] leading-6 text-gray-700 line-clamp-2">
            {item.title}
          </span>
        </div>

        <p className="mt-2 text-[15px] leading-6 text-gray-700 line-clamp-2">
          {item.placetype}
        </p>

        {/* 액션 */}
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`https://map.kakao.com/link/to/${encodeURIComponent(
              item.title
            )},${item.lat},${item.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            🧭 길찾기
          </a>

          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            📋 주소복사
          </button>

          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            🔗 공유
          </button>

          {item.contentTypeId ? (
            <span className="ml-auto self-center rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700">
              typeId: {item.contentTypeId}
            </span>
          ) : null}
        </div>

        {error && (
          <div className="mt-3 text-xs text-red-600" aria-live="polite">
            이미지 불러오기 실패
          </div>
        )}
      </div>

      {/* 이미지: 맨 아래 배치, 좌우 패딩 */}
      <div className="px-4 sm:px-6">
        {/* ← 여기서 좌우 패딩 조절 */}
        <div className="relative h-[280px] sm:h-[300px] overflow-hidden rounded-2xl">
          {thumb && !error ? (
            <Image
              src={thumb ?? ""}
              alt={item.title}
              fill
              sizes="100vw"
              className="object-cover"
              onLoadingComplete={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
                setThumb(null);
              }}
            />
          ) : (
            <div
              className={[
                "absolute inset-0 grid place-items-center text-sm text-gray-500",
                loading ? "animate-pulse bg-gray-200" : "bg-gray-100",
              ].join(" ")}
            >
              {error ? "이미지 불가" : "이미지 없음"}
            </div>
          )}
        </div>

        {/* 탭 */}
        <div className="text-black flex p-5 items-center justify-between">
          <button onClick={onTabClick} data-tab="Home">
            홈
          </button>
          <button onClick={onTabClick} data-tab="NearbyPlace">
            주변
          </button>
          <button onClick={onTabClick} data-tab="DetailPlace">
            정보
          </button>
        </div>

        {content && content.type === "Home" && (
          <HomeComponent value={content.data} />
        )}
        {content && content.type === "NearbyPlace" && (
          <NearbyComponent value={content.data} />
        )}
      </div>
    </section>
  );
}
