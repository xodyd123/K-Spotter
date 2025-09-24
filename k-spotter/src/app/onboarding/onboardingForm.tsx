"use client";

import { useState, useTransition, useRef } from "react";
import { savePrefsAction } from "../actions/savePrefs";

const PURPOSES = [
  { value: "K_POP", label: "K-pop" },
  { value: "DRAMA_FILM", label: "K-drama & Film" },
  { value: "FOOD", label: "K-food" },
  { value: "SIGHTSEEING", label: "K-Sightseeing" },
];

export default function OnboardingForm() {
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggle = (val: string) => {
    setSelected((prev) => {
      const has = prev.includes(val);
      if (has) return prev.filter((v) => v !== val);
      return [...prev, val];
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
      {/* 선택값을 폼으로 보내기 위한 hidden inputs */}
      {selected.map((v) => (
        <input key={v} type="hidden" name="purpose" value={v} />
      ))}

      <fieldset className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {PURPOSES.map((p) => {
            const active = selected.includes(p.value);

            return (
              <button
                key={p.value}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(p.value)}
                className={[
                  "rounded-full px-4 py-2 text-sm border transition",
                  active
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-gray-300 hover:bg-gray-100",
                ].join(" ")}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        aria-label="Continue to step 2 of 2"
        className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-black text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/35 disabled:opacity-60"
      >
        {pending ? (
          "Saving…"
        ) : (
          <>
            <span className="font-medium">Next</span>
            <span aria-hidden className="ml-2 text-xs opacity-70">
              Step 1 of 2
            </span>
            {/* <span className="sr-only">Step 1 of 2</span>  // 화면 숨김 텍스트로 대체도 가능 */}
          </>
        )}
      </button>
    </form>
  );
}
