'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { category } from '../../../type/type';
import { useFavorites } from '@/hooks/useLocalStorage';

export default function MarkerDetail({ item }: {
  item: {
    id: string;
    title: string;
    lat: number;
    lng: number;
    category: category;
    thumb?: string | null;
    contentTypeId?: number;
  };
}) {
 
  const [thumb, setThumb] = useState<string | null>(item.thumb ?? null);
  const [loading, setLoading] = useState<boolean>(!!item.thumb);
  const [error, setError] = useState<boolean>(false);


  const { toggle, isFavorite } = useFavorites();
  const fav = isFavorite(item.id);

  const onToggle = useCallback(() => {
    toggle({
      id: item.id,
      title: item.title,
      lat: item.lat,
      lng: item.lng,
      thumb: item.thumb ?? null,
    });
  }, [item.id , item.title , item.lat , item.lng , item.thumb] );

  // 아이템 바뀔 때만 이미지 상태 초기화
  useEffect(() => {
  


    setThumb(item.thumb ?? null);
    setError(false);
    setLoading(!!item.thumb);


  }, [item.id, item.thumb]);

  return (
    <section className="p-2 group overflow-hidden rounded-2xl bg-white/90 backdrop-blurring-1 ring-black/10 shadow-xl">
      {/* 이미지 */}
      <div className="relative aspect-[16/9] w-full bg-gray-100">
        {thumb && !error ? (
          <img
            key={`image-${item.id}`}               // 키로 교체 렌더 유도
            src={thumb}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
            loading="lazy"
            onLoad={() => {
              // 최신 요청인지 확인
              setLoading(false);
            }}
            onError={() => {
              setLoading(false);
              setError(true);
              setThumb(null);
            }}
          />
        ) : (
          <div
            className={[
              'absolute inset-0 grid place-items-center text-xs text-gray-500',
              loading ? 'animate-pulse bg-gray-200' : 'bg-gray-100',
            ].join(' ')}
          >
            {error ? '이미지 불가' : '이미지 없음'}
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* 본문 */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="flex-1 truncate text-2xl font-extrabold leading-tight tracking-tight text-gray-900">
            {item.title}
          </h2>
          <span
            className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800"
            aria-label="카테고리"
          >
            {item.category}
          </span>
        </div>

        {/* 액션 */}
        <div className="mt-3 flex items-center gap-2">
          <a
            href={`https://map.kakao.com/link/to/${encodeURIComponent(item.title)},${item.lat},${item.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            길찾기
          </a>

          <button
            type="button"
            onClick={onToggle}
            aria-pressed={fav}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            title={fav ? '즐겨찾기 해제' : '즐겨찾기 저장'}
          >
            {fav ? '♥ 저장됨' : '♡ 저장'}
          </button>
        </div>

        {error && <div className="mt-3 text-xs text-red-600">이미지 불러오기 실패</div>}
      </div>
    </section>
  );
}
