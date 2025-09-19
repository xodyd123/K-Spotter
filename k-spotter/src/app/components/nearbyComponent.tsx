"use client";
import NearbyDetail from "../../app/components/nearbyDetail"
import type { NearbyPlace, selected } from "../../../type/type";




export default function NearbyComponent({ value ,  onSelectNearby}: { value: NearbyPlace[] ; onSelectNearby :  (s : selected) => void }) { 

 
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
