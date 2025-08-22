"use client";
import { useEffect, useState } from "react";
import { category } from "../../../type/type";

export default function MarkerDetail({
  item,
  onClose,
}: {
  item: { title: string; lat: number; lng: number; category: category };
  onClose: () => void;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
      const ac = new AbortController();
    (async () => {
      try {
        const r = await fetch(
          `/api/images?keyword=${encodeURIComponent(item.title)}`,
          { signal: ac.signal }
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        console.log(j);
        const raw = j?.response?.body?.items?.item;

        const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
        setImgUrl(items[0]?.galWebImageUrl ?? null);
      } catch (e) {
        if ((e as any).name !== "AbortError") setError(e);
      }
    })();
    return () => ac.abort();
  }, [item.title]);

  return (
    <div className="w-[260px] overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
      <div className="flex gap-3 p-3">
        {imgUrl && (
          <img
            src={imgUrl}
            alt=""
            className="h-28 w-28 shrink-0 rounded-lg object-cover pointer-events-none select-none"
          />
        )}

        <div className="flex min-w-0 flex-col">
          <div className="truncate text-sm font-semibold text-gray-900">
            {item.title}
          </div>
          <div className="text-xs text-gray-600">{item.category}</div>

          <div className="mt-2 flex items-center gap-2">
            <a
              href={`https://map.kakao.com/link/to/${encodeURIComponent(
                item.title
              )},${item.lat},${item.lng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
            >
              길찾기
            </a>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              aria-label="닫기"
            >
              닫기
            </button>
          </div>

          {error && (
            <div className="mt-2 text-xs text-red-600">
              이미지 불러오기 실패
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
