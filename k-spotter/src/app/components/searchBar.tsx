// SearchBar.tsx
"use client";
import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";

export default function SearchBar() {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  return (
    // 맵 위 플로팅 레이어: 바깥은 이벤트 통과
    <div className="pointer-events-none fixed left-1/2 top-[max(env(safe-area-inset-top),2rem)] -translate-x-1/2 z-30 w-[min(92%,720px)] px-2">
      {/* 실제 바: 여기만 클릭 가능 */}
      <div
        className="pointer-events-auto rounded-2xl bg-white/80 backdrop-blur-md shadow-lg border border-white/60
                   focus-within:ring-2 focus-within:ring-black/60"
      >
        <div className="flex items-center gap-2 px-3 h-14">
          {/* 좌측 아이콘 자리 */}
        
          <SearchIcon
            className="h-5 w-5 text-gray-500 transition-transform duration-150 group-focus-within:scale-105"
            strokeWidth={2.75} // 1~2 사이로 굵기 조절
            aria-hidden
          />

          {/* 입력 */}
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="장소, 키워드 검색"
            className="flex-1 bg-transparent outline-none placeholder-gray-500 text-[15px] leading-none text-black"
            aria-label="검색어 입력"
          />

          {/* 지우기 버튼 */}
          {value && (
            <button
              type="button"
              onClick={() => setValue("")}
              className="shrink-0 h-8 w-8 grid place-items-center rounded-full hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60"
              aria-label="입력 지우기"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
