import { Photo } from "../../../../type/type";




export function SkeletonCard() {
    return (
      <div className="animate-pulse overflow-hidden rounded-2xl border bg-white">
        <div className="aspect-[4/3] bg-gray-200" />
        <div className="p-3 space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="h-3 w-1/2 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }



export function Card({ p }: { p: Photo }) {
    return (
      <article className="group overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.url} alt={p.title} className="h-full w-full object-cover group-hover:scale-[1.02] transition" />
        </div>

      </article>
    );
  }