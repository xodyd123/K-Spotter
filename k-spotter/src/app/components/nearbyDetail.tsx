"use client";
import Image from "next/image";
import { NearbyPlace } from "../../../type/type";


type NearbyDetailProps = {
  placeName: string;
  thumb?: string | null;
  address?: string; // 원하면 숨겨도 됨
  distanceText?: string; // "350m", "1.2km" 등
  onSelect ? : (p: NearbyPlace) => void 
  
};

export default function NearbyDetail({
  placeName,
  thumb,
  address,
  distanceText,
  onSelect
 
}: NearbyDetailProps) {
  // 칩 정의
 
  return (
    <> 

<button                     // ✅ 카드 전체를 버튼화(접근성/포커스/클릭 영역 확장)
      type="button"
      onClick={onSelect}
      className="w-full text-left group rounded-2xl border bg-white/90 p-3 ring-1 ring-black/5 shadow-sm"
    >
      <div className="flex gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
          {thumb ? (
            <Image src={thumb} alt={placeName} fill sizes="96px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="grid h-full w-full place-content-center text-xs text-gray-500">이미지 없음</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h4 className="flex-1 truncate text-[15px] font-semibold text-gray-900">{placeName}</h4>
            {distanceText && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">{distanceText}</span>
            )}
          </div>
          {address && <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-gray-600">{address}</p>}
        </div>
      </div>
    </button>
    </>
  );
}
