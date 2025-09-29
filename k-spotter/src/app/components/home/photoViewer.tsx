// components/PhotoViewer.client.tsx
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
          title: top.title ,
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

  return (
    <div
      className="fixed inset-0 z-[9999] isolate bg-black backdrop-blur-sm flex"
      onClick={() => window.history.back()}
    >
      {/* stop bubble */}
      <div
        className="bg-amber-200 relative rounded-2xl h-[80%] w-[100%] max-w-[100%]  overflow-hidden  my-4 mx-4 flex flex-col justify-end"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 원본비율 이미지: Next/Image */}
        <Image
          className=" object-top object-contain"
          src={photo.url}
          alt={photo.title}
          fill
          // 화면 폭에 따라 적절 사이즈 힌트
            sizes="90vw"
          // contain으로 레터박스

          // 라이트박스라 우선 로드 권장
          priority
          // 필요시 blurDataURL 넣을 수 있음
          // placeholder="blur"
          // blurDataURL="data:image/png;base64,...."
        />

        {/* info bar */}
        <div className="absolute left-0 right-0 -bottom-12 sm:bottom-3 sm:left-3 sm:right-auto sm:static">
          <div className="mt-3 rounded-xl bg-black/60 text-white backdrop-blur px-3 py-2 text-sm max-w-xl">
            <div className="font-semibold truncate">
              {place?.title || photo.title}
            </div>
            <div className="text-white/80 truncate">
              {busy
                ? "장소 정보를 불러오는 중…"
                : place?.addr1 || photo.region || "지역 정보 없음"}
            </div>
          </div>
        </div>

        {/* actions */}
        <div className="absolute top-5 flex gap-2 ">
          <button
            onClick={() => window.history.back()}
            aria-label="닫기"
            className="absolute top-3 left-3 inline-flex h-10 w-10 items-center justify-center
             rounded-2xl bg-black text-white shadow transition
             hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/60"
          >
            <svg
              
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor" // 버튼의 text-white를 따라 흰색으로 표시
              strokeWidth="2"
            >
              <path
                d="M15 18l-6-6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          
        </div>
       {place && <MapButton lat ={place.lat} lng ={place.lng } title={place.title}/> }
     
    
     
      </div>
    
    </div>
  );
}
