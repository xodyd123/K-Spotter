"use client";
import { useEffect, useState } from "react";
import { category } from "../../../type/type";

export default function MarkerDetail({
  item,
}: {
  item: { title: string; lat: number; lng: number; category: category };
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(false);
    setImgUrl(null);

    (async () => {
      try {
        const r = await fetch(
          `/api/images?keyword=${encodeURIComponent(item.title)}`,
          { signal: ac.signal }
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        const raw = j?.response?.body?.items?.item;
        const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
        setImgUrl(items[3]?.galWebImageUrl ?? null);
      } catch (e: any) {
        if (e.name !== "AbortError") setError(true);
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [item.title]);

  return (
    <section
      className="p-2
        group overflow-hidden rounded-2xl bg-white/90 backdrop-blurring-1 ring-black/10 shadow-xl
      "
    >
      {/* 이미지 영역 */}
      <div className="relative aspect-[16/9] w-full bg-gray-100">
        {/* 실제 이미지 */}
        {imgUrl && !error ? (
          <img
            src={imgUrl}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          // 스켈레톤 / 에러 상태
          <div
            className={[
              "absolute inset-0 grid place-items-center text-xs text-gray-500",
              loading ? "animate-pulse bg-gray-200" : "bg-gray-100",
            ].join(" ")}
          >
            {error ? "이미지 불가" : "이미지 없음"}
          </div>
        )}

        {/* 하단 그라데이션(텍스트 가독성 ↑) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* 본문 */}
      <div className="p-4 sm:p-5">
        {/* 제목 + 카테고리 */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="flex-1 truncate text-2xl font-extrabold leading-tight tracking-tight text-gray-900">
            {item.title}
          </h2>
          <span
            className="
              shrink-0 rounded-full border border-amber-200 bg-amber-50
              px-2 py-1 text-xs font-medium text-amber-800
            "
            aria-label="카테고리"
          >
            {item.category}
          </span>
        </div>

        {/* 액션 버튼 */}
        <div className="mt-3 flex items-center gap-2">
          <a
            href={`https://map.kakao.com/link/to/${encodeURIComponent(
              item.title
            )},${item.lat},${item.lng}`}
            target="_blank"
            rel="noreferrer"
            className="
              inline-flex items-center justify-center gap-1
              rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white
              shadow-sm hover:bg-indigo-700 focus:outline-none
              focus-visible:ring-2 focus-visible:ring-indigo-500
            "
          >
            길찾기
          </a>

          <button
            type="button"
            className="
              inline-flex items-center justify-center gap-1
              rounded-lg border border-gray-300 bg-white px-3 py-2
              text-sm font-medium text-gray-700 hover:bg-gray-50
              focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400
            "
          >
            공유
          </button>

          <button
            type="button"
            className="
              inline-flex items-center justify-center gap-1
              rounded-lg border border-gray-300 bg-white px-3 py-2
              text-sm font-medium text-gray-700 hover:bg-gray-50
              focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400
            "
          >
            저장
          </button>
        </div>

        {/* 보조 메타(원한다면 활성화) */}
        {/* <div className="mt-3 text-sm text-gray-600">
          820m · 서울특별시 ○○구 ○○로 123
        </div> */}

        {error && (
          <div className="mt-3 text-xs text-red-600">이미지 불러오기 실패</div>
        )}
      </div>
    </section>
  );
}
