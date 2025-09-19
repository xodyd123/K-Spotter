"use client";
import Image from "next/image";
import { NearbyPlace, selected } from "../../../type/type";



export default function NearbyDetail({
  place,
  onSelectNearby
 
}: {place : NearbyPlace , onSelectNearby  :  (s : selected) => void }) {

  
  return (
    <> 
      <button onClick={() =>onSelectNearby({kind : "nearby" , data : place}) }>

     
      <div className="flex gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
          {place.thumb ? (
            <Image src={place.thumb} alt={"주변 장소"} fill sizes="96px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="grid h-full w-full place-content-center text-xs text-gray-500">이미지 없음</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h4 className="flex-1 truncate text-[15px] font-semibold text-gray-900">{place.placeName}</h4>
            {/* {distanceText && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">{distanceText}</span>
            )} */}
          </div>
          {place.addr && <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-gray-600">{place.addr}</p>}
        </div>
      </div>
      </button>
    
    </>
  );
}
