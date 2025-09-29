"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { GetKeywordSearch } from "@/lib/mock/api/getKeyword";
import { MapButton } from "./mapButton";

type Photo = {
  cid: string;
  title: string;
  url: string;
  category: any;
  region?: string | null;
};
type Place = { title: string; lat: number; lng: number; addr1: string };

export function PhotoViewer({
  photo,
  onClose,
}: {
  photo: Photo;
  onClose: () => void;
}) {
  const [place, setPlace] = useState<Place | null>(null);
  const [busy, setBusy] = useState(false);
  const [dim, setDim] = useState<{ w: number; h: number } | null>(null);

  // body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // fetch place once on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setBusy(true);
        const rows = await GetKeywordSearch({ keyword: photo.title });
        const top = rows?.[0];
        if (!alive) return;
        setPlace({
          title: top.title,
          lat: top.mapy,
          lng: top.mapx,
          addr1: top?.addr1,
        });
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [photo.title]);

  // back button closes
  useEffect(() => {
    window.history.pushState({ viewer: true }, "");
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [onClose]);

  const wrapperStyle: React.CSSProperties = {
    width: "min(90vw, 1200px)", // 최대 폭 제한
    aspectRatio: dim ? `${dim.w} / ${dim.h}` : "16 / 9", // 로드 전 임시 비율 → 깜빡임 방지
  };

  return (
    <div
      className="fixed inset-0 z-[9999] isolate backdrop-blur-sm
                 flex flex-col p-5 bg-black/80 "
      onClick={() => window.history.back()} // 배경 클릭 시 닫기
      aria-modal="true"
      role="dialog"
    >
      {/* stop bubble */}
      <div
        className="relative  rounded-2xl overflow-hidden "
        style={wrapperStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 원본비율 이미지: Next/Image (fill + contain) */}
        <Image
          src={photo.url}
          alt={photo.title}
          fill
          className="object-contain object-top"
          sizes="(max-width: 640px) 90vw, 90vw"
          priority
          onLoadingComplete={(img) => {
            // natural 크기로 비율 계산 → wrapper의 aspect-ratio 동기화
            setDim({ w: img.naturalWidth, h: img.naturalHeight });
          }}
        />

        {/* 닫기 버튼 (좌상단) */}
        <button
          onClick={() => window.history.back()}
          aria-label="닫기"
          className="absolute top-3 left-3 inline-flex h-10 w-10 items-center justify-center
                     rounded-2xl bg-black text-white shadow transition
                     hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/60 z-20"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              d="M15 18l-6-6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="flex justify-between py-2">
        <div className="rounded-xl bg-black/60 text-white backdrop-blur px-3 py-2 text-sm max-w-xl">
          <div className="font-semibold truncate">
            {place?.title || photo.title}
          </div>
          <div className="text-white/80 truncate">
            {busy
              ? "장소 정보를 불러오는 중…"
              : place?.addr1 || photo.region || "지역 정보 없음"}
          </div>
        </div>
        <MapButton lat={123.4} lng={12.34} title={"테스트"} className="" />
      </div>
    </div>
  );
}
