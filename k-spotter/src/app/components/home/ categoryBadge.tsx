
import { Dispatch, SetStateAction } from "react";
import { Photo } from "../../../../type/type";


export function SkeletonCard() {
    return (
      <div className="animate-pulse overflow-hidden rounded-2xl border bg-white">
        <div className="aspect-[4/3] bg-gray-200" />
      </div>
    );
  }

  import Image from "next/image";
  

  export function Card({
    p,
    onOpen,
    onSearchClick ,
    setSelected 
  }: {
    p: Photo;
    onOpen: () => void;
    onSearchClick  : (title: string) => Promise<any> ;
    setSelected : Dispatch<SetStateAction<Photo | null>>
  }) {

    const clickToggle =  async () => {
        onOpen();
        setSelected(p) 
        const result = await onSearchClick(p.title) ; 
        const newP = {...p , lat : result.lat , lng :result.lng }
        setSelected(newP) ; 
      

    }

    return (
      <article className="group overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div
          onClick={clickToggle}
          className="relative aspect-[4/3] bg-gray-100 overflow-hidden cursor-zoom-in"
        >
          <Image
            src={p.url}
            alt={p.title}
            fill
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.5]"
            // 화면 그리드에 맞춰 적당한 사이즈 힌트 (필요 시 조정)
            sizes="(max-width: 640px) 50vw, (max-width:1024px) 33vw, 25vw"
            // placeholder="blur" blurDataURL="data:image/png;base64,..."  // 원하면 블러 플레이스홀더
          />
        </div>
      </article>
    );
  }
  