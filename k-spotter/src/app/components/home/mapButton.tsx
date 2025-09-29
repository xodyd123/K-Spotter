import MapIcon from "@/assets/icons/map.svg";
import Link from "next/link";
import clsx from "clsx";

export function MapButton({
  lat,
  lng,
  title,
}: {
  lat: number;
  lng: number;
  title: string;
}) {
  const href = {
    pathname: "/map",
    query: {
      lat:  33.3563 ,// lat.toFixed(6)  ,
      lng:  126.172 ,//lng.toFixed(6),
      title : "테스트"
    },
  };

  return (
    <div className="py-25 flex justify-end px-5">
    <Link
      href={href}
      aria-label="지도 열기"
      onClick={(e) => e.stopPropagation()}          
      className={clsx(
        "absolute top-3 right-3 z-20 inline-flex h-10 w-10 items-center justify-center",
        "rounded-2xl bg-black text-white shadow hover:bg-black/80",
        "focus:outline-none focus:ring-2 focus:ring-white/60",
        "pointer-events-auto",                          
     
      )}
    >
      <MapIcon className="h-5 w-5" aria-hidden="true" />
    </Link>
    </div>
  );
}
