import { JSX } from "react";
import { ca} from "../../../../type/type"
import { memo } from "react";
import {
    TvIcon,
    FilmIcon,
    MusicalNoteIcon,
  } from "@heroicons/react/24/outline";

const ICONS : Record<ca , (props : any) => JSX.Element> = {
    Drama: TvIcon,
    Movie: FilmIcon,
    MusicVideo: MusicalNoteIcon,
}

type Props = {
    category : ca; 
    selected : boolean ;
    loading? : boolean ; 
    onToggle : (category : ca) => void ; 
    className? : string ; 

}
function Card({ category, selected, loading, onToggle, className = "" }: Props){
    const Icon =  ICONS[category] 

    return (
        <button
        type="button"
        disabled={loading}
        onClick={() => onToggle(category)}
        aria-pressed={selected}
        className={[
          "px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors inline-flex items-center gap-1.5",
          selected
            ? "bg-black text-white border-black shadow-sm"
            : "bg-white/70 text-gray-800 border-gray-300 hover:bg-gray-100",
          loading ? "opacity-60 cursor-not-allowed" : "",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60",
          className,
        ].join(" ")}
      >
        <Icon className={selected ? "h-5 w-5" : "h-5 w-5 text-gray-700"} aria-hidden />
        {category === "MusicVideo" ? "뮤직비디오" : category === "Movie" ? "영화" : "드라마"}
      </button>
    )

}

export const CategoryCard = memo(Card);