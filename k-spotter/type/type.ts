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

