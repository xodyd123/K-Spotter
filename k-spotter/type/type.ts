export interface Place {
    id: string
    lat: number
    lng: number
    title: string
    imageUrl: string
    category: category
  
}

export enum category{

    DRAMA = "Drama" ,

    MOVIE = "Movie" , 
    
    MUSIC = "MusicVideo"

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


