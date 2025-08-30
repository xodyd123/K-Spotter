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

