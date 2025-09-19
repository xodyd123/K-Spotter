'use client';
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNearbyPlaces } from '@/lib/mock/apitour/getNearbyPlaces';
import type {  NearbyPlace, PlaceM } from "../../../k-spotter/type/type"

export type CatId = 'all' | '12' | '14' | '38' | '39';

const CTYPE_ID : Record<CatId , number|null> = {
    all: null, '12': 12, '14': 14, '38': 38, '39': 39,
}

const nearbyKey = (id: string, ctype: number | null, radius = 2000) => ['nearby', id, radius, ctype ?? 'all'] as const;
   


type NearbyAPIResult = { items: NearbyPlace[]; count: number }; // 실제 API에 맞게 조정 

export function useNearbyPlace(item : PlaceM){
    
    const [cat, setCat] = useState<CatId>('39');
    const qc = useQueryClient() ; 

    const ctype  = CTYPE_ID [cat] as number; 
    const key = () => nearbyKey(item.id , ctype); 

    // 데이터 패칭 
    const {data , isLoading , isFetching , error} = useQuery({
        queryKey : key() ,
        queryFn: () =>
            getNearbyPlaces({
              lat: item.lat,
              lng: item.lng,
              id: item.id,
              radius: 2000,
              cats: ['food', 'cafe', 'attraction'],
              sort: 'reco',
              contentTypeId: [ctype] 
            }),
          staleTime: 5 * 60_000,
          select: (res: NearbyAPIResult) => {
            return res.items
          }, // ← NearbyPlace[]만 돌려주게

    })

     // 칩 프리페치(호버/터치 시)
  const prefetch = useCallback(
    (next: CatId) => {
  
      const nextCtype = CTYPE_ID[next] as number
      return qc.prefetchQuery({
        queryKey: nearbyKey(item.id, nextCtype),
        queryFn: () =>
          getNearbyPlaces({
            lat: item.lat,
            lng: item.lng,
            id: item.id,
            radius: 2000,
            cats: ['food', 'cafe', 'attraction'],
            sort: 'reco',
            contentTypeId: [nextCtype],
          }),
        staleTime: 5 * 60_000,
      });
    },
    [item.id, item.lat, item.lng, qc]
  );

  return {
    cat, setCat,
    data: data ?? [],           // NearbyPlace[]
    isLoading, isFetching, error,
    prefetch,
    key,                        // 필요 시 접근
  };

}