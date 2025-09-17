"use client";
import { useCallback, useRef } from "react";
import {  Place,  SheetView } from "../../type/type";

type PhotoItem = {
  galWebImageUrl?: string; // 실제 타입에 맞게 보강
};

type Deps = {
  getSpotter: (i: {
    lat: number;
    lng: number;
    radius: number;
    contenTypeId: number;
    signal : AbortSignal
  }) => Promise<any[]>;
  GetKeywordSearch: (a: { keyword: string  ; signal : AbortSignal}) => Promise<Place[]>;
  SearchImage: (a: { title: string ; signal : AbortSignal }) => Promise<PhotoItem[]>;
  setBottomView: React.Dispatch<React.SetStateAction<SheetView>>
};

export function useSelectedLoader({ getSpotter, GetKeywordSearch, SearchImage,  setBottomView }: Deps) {
   
    const lastClickSeq = useRef(0);
    const abortRef = useRef<AbortController | null>(null);
  
    // 1) 캡처 없음 → [] 가능 (혹은 훅 밖 순수 함수로 빼기)
    const withTimeout = useCallback(<T,>(p: Promise<T>, ms = 6000) => {
      const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));
      return Promise.race([p, timeout]) as Promise<T>;
    }, []);
  
    // 2) 캡처 있음 → 개별 의존성 나열
    const loadAndPatchSelected = useCallback(async (item: Place) => {
      const seq = ++lastClickSeq.current;
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
  
      const [s, k, i] = await Promise.allSettled([
        withTimeout(getSpotter({ lat: item.lat, lng: item.lng, radius: 1200,  contenTypeId: 12, signal: ac.signal })),
        withTimeout(GetKeywordSearch({ keyword: item.placeName, signal: ac.signal })),
        withTimeout(SearchImage({ title: item.placeName, signal: ac.signal })),
      ]);

      console.log(s , k , i); 
  
      if (seq !== lastClickSeq.current) return;
  
      const imgs: PhotoItem[] = i.status === "fulfilled" ? (i.value ?? []) : [];
      const thumb = imgs[0]?.galWebImageUrl ?? null;
      setBottomView(prev => (prev.kind =="detailPlace" && prev.item.id === item.id ? { ...prev, item : {...prev.item , thumb}  } : prev));
    }, [getSpotter, GetKeywordSearch, SearchImage, setBottomView, withTimeout]);
  
    const cancel = useCallback(() => abortRef.current?.abort(), []);
  
    return { loadAndPatchSelected, cancel };
  }
  