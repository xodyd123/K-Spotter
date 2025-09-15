export interface Place  {
    id: string
    lat: number
    lng: number
    title: string
    imageUrl?: string
    thumb : string | null
    contentTypeId? : number 
    category?: string 
    address : string 
    placename : string 
    placetype : string ;
    placedetail : string ; 
    openhours : string ; 
    closedday : string ; 
    phone : string ;
}

export type NearbyPlace = {
    addr : string ;
    id : string ; 
    lat : number ; 
    lng : number ;  
    title : string ; 
    category? :string ; 
    thumb : string ;  
}   
export type PlaceM = {
    id: string;
    lat: number;
    lng: number;
    title: string;
    category?: string;
    thumb: string | null;        // ← 통일
    address?: string;            // Nearby.addr → 여기로 매핑
    placename?: string;
    placetype?: string;
    openhours?: string;
    closedday?: string;
    phone?: string;
    contentTypeId?: number;
    source: 'place' | 'nearby';  // ← 반드시 리터럴 유니온
  };
  
  export function toPlaceM(x: Place | NearbyPlace): PlaceM {
    if ('address' in x) {
      // Place
      return {
        id: x.id, lat: x.lat, lng: x.lng, title: x.title,
        category: x.category,
        thumb: x.thumb ?? null,
        address: x.address,
        placename: x.placename,
        placetype: x.placetype,
        openhours: x.openhours,
        closedday: x.closedday,
        phone: x.phone,
        contentTypeId: x.contentTypeId,
        source: 'place' as const,   // ★ 리터럴로 고정
      };
    }
    // NearbyPlace
    return {
      id: x.id, lat: x.lat, lng: x.lng, title: x.title,
      category: x.category,
      thumb: x.thumb ?? null,
      address: x.addr,              // ★ addr → address로 통일
      source: 'nearby' as const,    // ★ 리터럴로 고정
    };
  }

export type TourItem = {
    contentid?: string | number;      // ✅ 고유 ID (dedupe/Place.id에 사용)
    contenttypeid?: string | number;  // ✅ 유형 (Place.contentTypeId에 매핑)
    mapx?: string | number;           // 경도
    mapy?: string | number;           // 위도
    title: string;
    addr1?: string;
    firstimage?: string;
  };

 
  export type Home = {
    address : string | undefined;
    openHours : string | undefined;
    closedday : string | undefined;
    phone : string | undefined; 
  }


export type DetailPlace = { // 임시 
    contnent : string 
} 
  



export enum category{

    DRAMA = "Drama" ,

    MOVIE = "Movie" , 
    
    MUSIC = "MusicVideo"  , 
 
   OTHER = "Other"


}


export type ca =  "Drama" | "Movie" | "MusicVideo";

export type LatLng = [lat: number, lng: number];
export type BBox = { sw: LatLng; ne: LatLng };

export type Pins = Record<ca , kakao.maps.MarkerImage> & {
    selected : kakao.maps.MarkerImage
}

export type Snap = "closed"|"peek"|"half"|"full"; 

// 시트/스냅 설정
export const SHEET_FRAC = 0.92;   // 92dvh
export const HALF_FRAC  = 0.55;   // 55dvh
export const PEEK_PX    = 80;     // 80px
export const GAP_PX     = 12;     // 시트 상단과 마커 사이 최소 여백

export type SearchItem = {
    name : string ; 
    category : string ; 
    total : string  ; 

}


