"use client";
import Image from "next/image";
import { useState } from "react";

type Media = {
  type: "image" | "video";
  src: string;
  thumb?: string | null;
  alt?: string;
  author?: { name?: string };
};

export function MediaCard({ m, showBadge = false }: { m: Media; showBadge?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const alt = m.alt || (m.type === "image" ? "Pexels image" : "Pexels video");

  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm
                 transition hover:shadow-lg hover:border-black/10"
    >
      {/* 기존보다 약간 더 크게 보이는 비율 */}
      <div className="relative aspect-[8/7] bg-neutral-100">
        {/* 로딩 스켈레톤 */}
        {!loaded && <div className="absolute inset-0 animate-pulse bg-neutral-200" aria-hidden />}

        {m.type === "image" ? (
          <Image
            src={m.thumb || m.src}
            alt={alt}
            fill
            className={`object-cover transition-transform duration-300
                        group-hover:scale-[1.03] ${loaded ? "opacity-100" : "opacity-0"}`}
            sizes="(min-width:1024px) 480px, (min-width:640px) 50vw, 100vw"
            onLoadingComplete={() => setLoaded(true)}
          />
        ) : (
          <video
            src={m.src}
            poster={m.thumb || undefined}
            className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300
                        group-hover:scale-[1.03] ${loaded ? "opacity-100" : "opacity-0"}`}
            muted
            loop
            playsInline
            autoPlay
            onCanPlayThrough={() => setLoaded(true)}
          />
        )}

        {/* 타입 배지(원하면 showBadge={false}로 숨김) */}
        {showBadge && (
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1
                           text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur">
            {m.type}
          </span>
        )}
      </div>
    </article>
  );
}
