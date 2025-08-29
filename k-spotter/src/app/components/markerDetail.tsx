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
  const [loading , setLoading] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false);


  useEffect(() => {
      const ac = new AbortController();
      setLoading(true) ;
      setError(false);      // 기존 에러 상태 리셋
      setImgUrl(null);      // 이전 이미지 숨기고 스켈레톤 노출
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
        console.log(items[2]?.galWebImageUrl);
       
        setImgUrl(items[3]?.galWebImageUrl);
       
      } catch (e) {
        
        if ((e as any).name !== "AbortError") setError(true);
      }
    })();
    return () => ac.abort();
  }, [item.title]);

  return (
    <div className="w-[260px] overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
      <div className="flex gap-3 p-3">
        {imgUrl && !error ?(

          <img
            src={imgUrl}
            alt={item.title}
            onLoad={() => setLoading(false)}
            onError={() => { setError(true); setLoading(false); }}
            className="h-28 w-28 shrink-0 rounded-lg object-cover pointer-events-none select-none"
          />
        ) : (
          <div className="h-28 w-28 rounded-lg bg-gray-200 grid place-items-center text-xs text-gray-500">{
            error ? `이미지 불가` : `이미지 없음`
          } </div>
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
