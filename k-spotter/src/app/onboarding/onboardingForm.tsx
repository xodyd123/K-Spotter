"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { savePrefsAction } from "../actions/savePrefs";

const PURPOSES = [
  {
    value: "K_POP",
    label: "K-pop",
    img: "/onboarding/kpop.jpg",
    alt: "Purple light sticks glowing at a K-pop concert",
  },
  {
    value: "DRAMA_FILM",
    label: "K-drama & Film",
    img: "/onboarding/kdrama-film.jpg",
    alt: "Film set with clapperboard and cinema lights",
  },
  {
    value: "FOOD",
    label: "K-food",
    img: "/onboarding/kfood.jpg",
    alt: "Korean dishes and banchan on a wooden table",
  },
  {
    value: "SIGHTSEEING",
    label: "K-Sightseeing",
    img: "/onboarding/ksightseeing.jpg",
    alt: "Lotte World Tower night skyline over the Han River",
  },
];

export default function OnboardingForm() {
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggle = (val: string) => {
    setSelected(prev => {
      const has = prev.includes(val);
      const next = has ? prev.filter(v => v !== val) : [...prev, val];
      if (error && next.length > 0) setError(null);
      return next;
    });
  };

  const check = (fd: FormData) => {
    const purposes = fd.getAll("purpose") as string[];
    if (purposes.length === 0) {
      setError("Please select at least one option.");
      return;
    }
    setError(null);
    start(() => savePrefsAction(fd));
  };

  return (
    <form action={(fd: FormData) => check(fd)} className="space-y-4">
      {error && (
        <p
          id="purpose-error"
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {/* 선택값 전달용 hidden inputs */}
      {selected.map(v => (
        <input key={v} type="hidden" name="purpose" value={v} />
      ))}

      <fieldset
        aria-invalid={!!error}
        aria-describedby={error ? "purpose-error" : undefined}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PURPOSES.map(p => {
            const active = selected.includes(p.value);
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => toggle(p.value)}
                aria-pressed={active}
                aria-label={`${p.label}${active ? " selected" : ""}`}
                className={[
                  "relative overflow-hidden rounded-xl border text-left outline-none transition",
                  active
                    ? "ring-2 ring-black border-transparent"
                    : "border-neutral-300 hover:border-neutral-400",
                  "focus-visible:ring-2 focus-visible:ring-black/40",
                ].join(" ")}
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src={p.img}
                    alt={p.alt}
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover"
                    priority
                  />
                  {/* 어둡게 + 선택 오버레이 */}
                  <div
                    className={[
                      "absolute inset-0 transition",
                      active ? "bg-black/25" : "bg-black/0 hover:bg-black/10",
                    ].join(" ")}
                  />
                  {active && (
                    <span className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-black shadow ring-2 ring-black">
                      ✓
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 w-full bg-gradient-to-t from-black/60 to-transparent px-3 py-2 text-sm font-medium text-white">
                    {p.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        aria-label="Show spots"
        className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-black text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/35 disabled:opacity-60"
      >
        {pending ? "Saving…" : (
          <>
            <span className="font-medium">Show spots</span>
          </>
        )}
      </button>
    </form>
  );
}
