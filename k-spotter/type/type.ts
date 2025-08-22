export interface Place {
    id: string
    lat: number
    lng: number
    title: string
    imageUrl: string
    category: category
  
}

export enum category{

    DRAMA = "드라마 촬영지" ,

    MOVIE = "영화 촬영지" , 
    
    MUSIC = "뮤직비디오 촬영지"

}

