// searchResult.tsx
"use client";

import type { Place, selected } from "../../../type/type";
import { MapPin } from "lucide-react";

type Props = {
  item: Place;
  onSelectNearby : (s : selected) => Promise<void>

};

export default function SearchResult({ item , onSelectNearby }: Props) {
    // 나중에 시간 되면 가상 스크롤 도입?
  const { placeName, placeDetail, placeType, address} = item;

 
  return (
    <button
      type="button"
      onClick={() => onSelectNearby({kind : "place" , data : item}) }
      className="w-full text-left px-4 py-3 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      aria-label={`${placeName}${placeType ? `, ${placeType}` : ""}${address ? `, ${address}` : ""}`}
    >
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
          <MapPin className="h-4 w-4 text-gray-600" aria-hidden />
        </span>

        {/* 텍스트 영역 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="truncate text-sm font-medium text-gray-900">
              {placeName}
            </h3>
            {placeType && (
              <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-700">
                {placeType}
              </span>
            )}
          </div>

          {placeDetail && (
            <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">
              {placeDetail}
            </p>
          )}
          {/* {address && (
            <p className="mt-0.5 text-xs text-gray-500 truncate">{address}</p>
          )}  일단 주석 */}  
        </div>

    
      </div>
    </button>
  );
}
