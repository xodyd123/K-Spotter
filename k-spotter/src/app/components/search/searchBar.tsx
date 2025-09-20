// app/components/searchBar.tsx
"use client";

import { Search as SearchIcon } from "lucide-react";
import { Dispatch, SetStateAction, useRef } from "react";

type SearchProps = {
  inputs: string;
  setInputs: Dispatch<SetStateAction<string>>;
  setMapCover: Dispatch<SetStateAction<"off" | "on">>;
  mapCover: "off" | "on";
  closeAll : () => void   
};

export default function SearchBar({
  inputs,
  setInputs,
  setMapCover,
  mapCover, 
  closeAll

}: SearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onCancelToggle = () => {
    setInputs("");
    setMapCover("off");
    inputRef.current?.blur(); // 모바일 키보드 닫기
  };

  const onClose = () => {
    setMapCover("on") 
    closeAll() ; 
  }

  return (
    // 🔸 포지셔닝/레이어는 부모에서! 여기선 일반 플렉스만
    <div className="pointer-events-auto flex items-center gap-2 py-2 ">
      <div className="relative flex-1">
        {/* 아이콘: input 안쪽에 겹치기 */}
        <SearchIcon
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
          strokeWidth={2}
          aria-hidden
        />
        <input
          ref={inputRef}
          id="q"
          value={inputs}
          onChange={(e) => setInputs(e.target.value)}
          onFocus={onClose}
          placeholder="장소, 키워드 검색"
          className="w-full h-12 sm:h-14 pl-10 pr-4 rounded-full
                     bg-white/85 backdrop-blur-xl shadow-lg
                     border border-white/60 ring-1 ring-black/5
                     focus:outline-none focus:ring-2 focus:ring-black/60
                     placeholder-gray-500 text-sm sm:text-base text-black
                     transition"
          aria-label="검색어 입력"
        />
      </div>

      {mapCover === "on" && (
        <button
          type="button"
          onClick={onCancelToggle}
          className="h-12 sm:h-14 px-4 rounded-full text-sm sm:text-base font-medium
                     text-gray-800 bg-white/90 border border-black/10 shadow
                     hover:bg-white active:scale-[.98]
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60 transition"
        >
          취소
        </button>
      )}
    </div>
  );
}
