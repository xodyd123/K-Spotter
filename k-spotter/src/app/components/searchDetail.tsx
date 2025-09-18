import type { SearchItem } from "../../../type/type";
import { Clapperboard, Film, User } from "lucide-react";

type Props = {
  searchKeyWord: SearchItem;
  query?: string;
  onPick : (itemName : string) => Promise<void>
};

const CATEGORY: Record<string, { label: string; Icon: any; badgeCls: string }> = {
  artist: { label: "아티스트",   Icon: User,         badgeCls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  drama:  { label: "드라마",     Icon: Film,         badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  movie:  { label: "영화",       Icon: Clapperboard, badgeCls: "bg-rose-50 text-rose-700 border-rose-200" },
  mv:     { label: "뮤직비디오", Icon: Clapperboard, badgeCls: "bg-amber-50 text-amber-700 border-amber-200" },
};

function highlight(text: string, q?: string) {
  if (!q) return text;
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${safe})`, "ig");
  return text.split(re).map((part, i) =>
    re.test(part) ? (
      <mark key={i} className="bg-yellow-200/60 rounded px-0.5">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function SearchDetail({ searchKeyWord, query  , onPick }: Props) {
  const { name, total, category } = searchKeyWord;
  const cat = CATEGORY[category?.toLowerCase?.()] ?? {
    label: category ?? "기타",
    Icon: User,
    badgeCls: "bg-gray-100 text-gray-700 border-gray-200",
  };
  const { Icon, label, badgeCls } = cat;

  return (
    <button 
      onClick={() => onPick(name)}
      type="button"
      className="w-full px-3 py-2 rounded-lg hover:bg-gray-50 focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-black/50 text-left"
    
      aria-label={`${name}, ${label}, 연관 장소 ${total}곳`}
    >
      <div className="flex items-center gap-3">
        {/* 👉 아이콘: 이름 왼쪽 */}
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-700">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span
          className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap ${badgeCls}`}
          title={label}
        >
          {label}
        </span>

        {/* 이름 */}
        <span className="min-w-0 flex-1 truncate text-[15px] text-gray-900">
          {highlight(name, query)}
        </span>

        {/* 카테고리 배지(아이콘 제거) */}


        {/* 개수 칩 */}
        <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold
                         bg-black/80 text-white tabular-nums whitespace-nowrap">
          {total}곳
        </span>
      </div>
    </button>
  );
}

