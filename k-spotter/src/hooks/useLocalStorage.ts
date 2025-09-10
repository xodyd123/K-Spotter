"use client"

import { useCallback, useEffect, useState } from "react"


export const KS_FAVS_KEY = 'ks:favs:v1';

type FavoriteItem = {
    id: string;           // 문자열로 통일
    title: string;
    lat: number;
    lng: number;
    thumb?: string | null;
}

function readMapFromStorage(): Record<string, FavoriteItem> {
    
  
    try {
      const raw = window.localStorage.getItem(KS_FAVS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      // 파싱/접근 실패 → 안전한 기본값으로 폴백
      return {};
    }
  }

  function writeMapToStorage(map: Record<string, FavoriteItem>) {

    
    try { window.localStorage.setItem(KS_FAVS_KEY, JSON.stringify(map)); }
    catch {/* 용량/권한 이슈는 조용히 무시(개발시에만 warn 가능) */}
  }

  function latestEqual(a: Record<string , FavoriteItem> , b: Record<string , FavoriteItem>){
    const ak = Object.keys(a) , bk = Object.keys(b)
    if(ak.length !== bk.length) return false ; 

    for(const k of ak){
        const va = a[k] , vb = b[k] ; 
        if(!vb) return false ;
        if (va.id !== vb.id || va.title !== vb.title || va.lat !== vb.lat || va.lng !== vb.lng || va.thumb !== vb.thumb) {
            return false;
          }

    }
    
    return true ; 
  }


export function useFavorites(){

    const [map , setMap] = useState<Record<string , FavoriteItem>>(()=>readMapFromStorage())

 
     useEffect(()=>{
  
        const onStorage = (e: StorageEvent) => {
            if(e.key === KS_FAVS_KEY){
                const next = readMapFromStorage();
                setMap(prev => latestEqual(prev, next) ? prev : next);
            }
        }
       window.addEventListener("storage" ,  onStorage) ;
       return () => window.removeEventListener("storage" , onStorage) ;
     },[])

     const add = useCallback((item : FavoriteItem) =>{
        setMap(prev =>{
            if(prev[item.id]) return prev ;

            const next = { ...prev, [item.id]: item };
            writeMapToStorage(next);
            return next;

        })
      } ,[] )

      const remove = useCallback((id : string)  => {
        setMap(prev => {
            if(!prev[id]) return prev; 
            const { [id] : _,  ...next} = prev  
            writeMapToStorage(next) ; 
            return next ;
        })
    } ,[])

      const toggle = useCallback((item : FavoriteItem) =>{
        setMap(prev => {
            const next = prev[item.id] ? (()=> {const {[item.id] : _, ...rest} = prev ; return rest })()
            : {...prev , [item.id] : item} ;
            writeMapToStorage(next) ;
            return next ;
        })
      },[])
      
      const isFavorite = useCallback(((id : string) => !!map[id] ),[map])

    


    return {map , add ,remove ,toggle ,isFavorite , favorites : Object.values(map)} ;
   

}