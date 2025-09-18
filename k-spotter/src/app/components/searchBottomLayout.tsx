// SearchBottomLayout.tsx
"use client";

import type { NearbyPlace, Place, selected } from "../../../type/type";
import SearchResult from "./searchResult";

export default function SearchBottomLayout({ items ,onSelectNearby }: { items: Place[] ,  onSelectNearby : (s : selected) => Promise<void>}) {
  if (!items?.length) {
    return (
      <div className="px-4 py-8 text-center text-sm text-gray-500">
        검색 결과가 없습니다.
      </div>
    );
  }

  return (
    <div className="px-3 pb-2">
      <ul
        role="listbox"
        className="overflow-hidden rounded-xl border border-gray-100 bg-white divide-y divide-gray-100"
      >
        {items.map((item) => (
          <li key={`place-${item.id}`}>
            <SearchResult item={item} onSelectNearby={onSelectNearby}/>
          </li>
        ))}
      </ul>
    </div>
  );
}