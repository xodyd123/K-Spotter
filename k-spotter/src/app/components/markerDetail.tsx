'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useFavorites } from '@/hooks/useLocalStorage';

type Item = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  category: string;
  address: string;
  place_name: string;
  thumb?: string | null;
  contentTypeId?: number;
};

export default function MarkerDetail({ item }: { item: Item }) {
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
  }, [toggle, item.id, item.title, item.lat, item.lng, item.thumb]);

  useEffect(() => {
    setThumb(item.thumb ?? null);
    setError(false);
    setLoading(!!item.thumb);
  }, [item.id, item.thumb]);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        `${item.place_name || item.title}\n${item.address}\n(${item.lat}, ${item.lng})`
      );
      alert('주소가 복사되었습니다.');
    } catch {
      alert('복사에 실패했어요.');
    }
  }, [item.address, item.lat, item.lng, item.place_name, item.title]);

  const onShare = useCallback(async () => {
    const text = `${item.place_name || item.title} • ${item.address}`;
    const url = `https://map.kakao.com/link/to/${encodeURIComponent(
      item.title
    )},${item.lat},${item.lng}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다.');
    }
  }, [item.address, item.lat, item.lng, item.place_name, item.title]);

  const categoryPill = useMemo(() => {
    const tone: Record<string, string> = {
      Drama: 'bg-violet-100 text-violet-800 ring-violet-200',
      Movie: 'bg-rose-100 text-rose-800 ring-rose-200',
      MusicVideo: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
      Other: 'bg-slate-100 text-slate-800 ring-slate-200',
    };
    const base = tone[item.category] ?? tone.Other;
    return `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ${base}`;
  }, [item.category]);

  return (
    // 시맨틱을 위해 DOM 순서는 본문 → 이미지(아래). 시각적으로도 아래에 보이도록 flex-col
    <section className="group flex flex-col overflow-hidden rounded-2xl border bg-white/90 shadow-sm ring-1 ring-black/5 backdrop-blur">
      {/* 본문 */}
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="mb-3 flex items-start gap-3">
          <h2 className="flex-1 truncate pr-2 text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight text-gray-900">
            {item.place_name}
          </h2>

          <button
            type="button"
            onClick={onToggle}
            aria-pressed={fav}
            className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow ring-1 ring-black/10 hover:bg-gray-50"
            title={fav ? '즐겨찾기 해제' : '즐겨찾기 저장'}
          >
            {fav ? '♥ 저장됨' : '♡ 저장'}
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
          {item.address}
        </p>

        {/* 액션 */}
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`https://map.kakao.com/link/to/${encodeURIComponent(item.title)},${item.lat},${item.lng}`}
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

      {/* 이미지: 맨 아래 배치 (relative + fill) */}
      {/* 이미지: 맨 아래 배치, 좌우 패딩 */}
<div className="px-4 sm:px-6">            {/* ← 여기서 좌우 패딩 조절 */}
  <div className="relative h-[280px] sm:h-[300px] overflow-hidden rounded-2xl">
    {thumb && !error ? (
      <Image
        src={thumb}
        alt={item.title}
        fill
        sizes="100vw"
        className="object-cover"        // 둥근 모서리는 바깥 div에서 처리
        onLoadingComplete={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); setThumb(null); }}
      />
    ) : (
      <div className={[
        'absolute inset-0 grid place-items-center text-sm text-gray-500',
        loading ? 'animate-pulse bg-gray-200' : 'bg-gray-100',
      ].join(' ')}
      >
        {error ? '이미지 불가' : '이미지 없음'}
      </div>
    )}
  </div>
</div>

    </section>
  );
}
