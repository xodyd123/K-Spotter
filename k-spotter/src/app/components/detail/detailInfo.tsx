"use client";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import type { ShowDetail, WatchProvider } from "../../../../type/type";

// Detail page section pill
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium shadow-sm">
      {children}
    </span>
  );
}

// Provider chip with logo + name
function ProviderChip({ p }: { p: WatchProvider }) {
  return (
    <a
      className="group inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:shadow transition"
      title={p.provider_name}
      href="#"
      onClick={(e) => e.preventDefault()}
    >
      {p.logo_path ? (
        <img
          src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
          alt={p.provider_name}
          className="h-5 w-5 rounded"
          loading="lazy"
        />
      ) : (
        <div className="h-5 w-5 rounded bg-gray-200" />
      )}
      <span className="whitespace-nowrap">{p.provider_name}</span>
    </a>
  );
}

export default function DetailInfo({ datailData }: { datailData: ShowDetail }) {
  const d = datailData; // keep user's prop name
  const [open, setOpen] = useState(false);

  const providers = useMemo(() => d.watch?.flatrate ?? [], [d.watch]);
  const stills = d.stills ?? [];
  const cast = d.cast ?? [];

  return (
    <section className="mx-auto w-full max-w-3xl p-4 md:p-6">
      {/* Card */}
      <div className="rounded-2xl border bg-white/80 backdrop-blur shadow-sm md:shadow-md overflow-hidden">
        {/* Cover: first still if any */}
        {stills[0] ? (
          <div className="relative aspect-[16/9] w-full bg-gray-100">
            <Image
              src={stills[0]}
              alt={`${d.title} cover`}
              fill
              className="absolute inset-0 object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        ) : (
          <div className="aspect-[16/9] w-full bg-gray-100" />
        )}

        {/* Body */}
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {d.title}
                <span className="ml-2 align-middle text-base font-semibold text-gray-500">{d.year}</span>
              </h1>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500">
                <Pill>TMDB #{d.id}</Pill>
                {providers.length > 0 && <Pill>시청 가능: {providers.length}곳</Pill>}
              </div>
            </div>

            {d.watch?.link && (
              <a
                href={d.watch.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-xl border px-4 font-medium hover:shadow transition"
              >
                시청하러 가기
              </a>
            )}
          </div>

          {/* Overview (collapsible) */}
          {d.overview && (
            <div className="relative mt-4">
              <p
                className={[
                  "text-[15px] leading-relaxed text-gray-700",
                  open ? "" : "line-clamp-3",
                ].join(" ")}
              >
                {d.overview}
              </p>
              <button
                type="button"
                className="mt-2 text-sm font-medium text-gray-700 hover:underline"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? "간략히" : "더보기"}
              </button>
            </div>
          )}

          {/* Providers */}
          {providers.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold text-gray-600">시청 제공</h2>
              <div className="flex flex-wrap gap-2">
                {providers.map((p) => (
                  <ProviderChip key={p.provider_id} p={p} />)
                )}
              </div>
            </div>
          )}

          {/* Stills carousel (scrollable row) */}
          {stills.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold text-gray-600">스틸컷</h2>
              <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {stills.map((src, i) => (
  <div
    key={src + i}
    className="relative h-36 w-64 shrink-0 overflow-hidden rounded-xl border"
  >
    <Image
      src={src}
      alt={`${d.title} still ${i + 1}`}
      fill
      className="object-cover"
      sizes="256px"
      priority={false}
    />
  </div>
))}
              </div>
            </div>
          )}

          {/* Cast grid */}
          {cast.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold text-gray-600">출연</h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {cast.map((c, idx) => (
                  <li key={`${c.name}-${idx}`} className="rounded-xl border p-3 hover:shadow-sm transition">
                    <div className="font-medium">{c.name}</div>
                    <div className="mt-1 text-sm text-gray-600">{c.role}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
