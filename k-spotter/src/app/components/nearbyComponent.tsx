// app/components/nearbyComponent.tsx
"use client";
import NearbyDetail from "../../app/components/nearbyDetail"
import type { NearbyPlace } from "../../../type/type";
import { SetStateAction, useEffect } from "react";
import { SheetState } from "./bottomSheet";


function formatDist(d?: number | null) {

  if (d == null) return undefined;
  const n = typeof d === "string" ? parseFloat(d) : d;
  return n < 1000 ? `${Math.round(n)}m` : `${(n / 1000).toFixed(1)}km`; // 거리 계산 
}


export default function NearbyComponent({ value ,  onSelectNearby}: { value: NearbyPlace[] ; onSelectNearby :  (n: NearbyPlace) => void }) { 

 
  if (!value?.length) {
    return (
      <div className="mt-2 rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
        주변 장소가 없어요.
      </div>
    );
  }

  return (

      <ul className="mt-2 grid gap-3">
        {value.map(p => (
          <li key={p.id}>
            <NearbyDetail
               place = {p}
              // distanceText={formatDist((p as any).dist)}
              onSelectNearby = {onSelectNearby}
            />
          </li>
        ))}
      </ul>
   
    
  );
}
