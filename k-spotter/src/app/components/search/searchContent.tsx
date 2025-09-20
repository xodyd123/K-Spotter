import type { SearchItem } from "../../../../type/type";
import SearchDetail from "./searchDetail";

export default function SearchContent({
  searchKeyWord,
  inputs,
  onPick ,
}: {
  searchKeyWord: SearchItem[];
  inputs: string; 
  onPick : (itemName : string) => Promise<void>
}) {
  const q = inputs.trim();
  if (!q) return null;                // 입력 없으면 아무것도 렌더하지 않음

  if (searchKeyWord.length === 0) {
    return <div className="p-4 text-sm text-gray-600">검색 결과가 없습니다.</div>;
  }

  return (
    <ul className="p-2 text-black" role="listbox">

        
      {searchKeyWord.map((item) => (
        <li className = "border-b border-gray-200" key={`search-${item.name}`}>
          <SearchDetail searchKeyWord={item} onPick={onPick}/>
        </li>
      ))}
    </ul>
  );
}

