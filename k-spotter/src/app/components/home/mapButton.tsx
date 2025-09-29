import MapIcon from "@/assets/icons/map.svg";
import Link from "next/link";
import clsx from "clsx";

export function MapButton({
  lat,
  lng,
  title,
  className,
}: {
  lat: number;
  lng: number;
  title: string;
  className?: string;
}) {
  const href = {
    pathname: "/map",
    query: {
      lat:  33.3563 ,// lat.toFixed(6)  ,
      lng:  126.172 ,//lng.toFixed(6),
      title : "테스트" ,
      
    },
  };

  return (
    <Link
      href={href}
      aria-label="지도 열기"
      onClick={(e) => e.stopPropagation()} // 배경 onClick 차단
      className={[
        "inline-flex h-10 w-10 items-center justify-center",
        "rounded-2xl  text-white shadow transition",
        
        "hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/60",
        "pointer-events-auto",
        className ?? "",
      ].join(" ")}
    >
      <MapIcon className="h-10 w-10" aria-hidden="true" />
    </Link>
  );
}