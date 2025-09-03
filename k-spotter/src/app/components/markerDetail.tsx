"use client";
import { useEffect,  useState , useMemo } from "react";
import { category, Place } from "../../../type/type";

export default function MarkerDetail({
  item,
}: {
  item: {
    id: string
    title: string;
    lat: number; // 나중에 필요할수도 있으니 넣음 
    lng: number;
    category: category;
    // 대표이미지  
    thumb: string;
    contentTypeId? : number 

    // 상세이미지 

  };
}) {

  // ✅ “정체성 키”: 선택이 바뀔 때만 초기화되도록
  const itemKey = useMemo(
    () => item.id ?? `${item.title}|${item.lat}|${item.lng}`,
    [item.id, item.title, item.lat, item.lng]
  );

  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false) ;
  
    // ✅ 이미지 관련 상태만 로컬로
  const [thumb, setThumb] = useState<string | null>(item.thumb ?? null);  

  useEffect(()=> {
    setThumb(item.thumb ?? null);
    setError(false);
    setLoading(!!item.thumb);

  } ,[itemKey , item.thumb]) ; 

  // const map = new Map<number, string>();

  // map.set(2, "관광지");
  // map.set(14, "문화시설");
  // map.set(15, "축제공연행사");
  // map.set(25, "여행코스");
  // map.set(28, "레포츠");
  // map.set(32, "숙박");
  // map.set(38, "쇼핑");
  // map.set(39, "음식점"); // 쓸때 재랜더링 되니 컴포넌트 밖으로 빼기 



  return (
    <section
      className="p-2
        group overflow-hidden rounded-2xl bg-white/90 backdrop-blurring-1 ring-black/10 shadow-xl
      "
    >
      {/* 이미지 영역 */}
      <div className="relative aspect-[16/9] w-full bg-gray-100">
        {/* 실제 이미지 */}
        {thumb && !error ? (
          <img
            src={thumb}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          // 스켈레톤 / 에러 상태
          <div
            className={[
              "absolute inset-0 grid place-items-center text-xs text-gray-500",
              loading ? "animate-pulse bg-gray-200" : "bg-gray-100",
            ].join(" ")}
          >
            {error ? "이미지 불가" : "이미지 없음"}
          </div>
        )}

        {/* 하단 그라데이션(텍스트 가독성 ↑) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* 본문 */}
      <div className="p-4 sm:p-5">
        {/* 제목 + 카테고리 */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="flex-1 truncate text-2xl font-extrabold leading-tight tracking-tight text-gray-900">
            {item.title}
          </h2>
          <span
            className="
              shrink-0 rounded-full border border-amber-200 bg-amber-50
              px-2 py-1 text-xs font-medium text-amber-800
            "
            aria-label="카테고리"
          >
            {item.category}
          </span>
        </div>

        {/* 액션 버튼 */}
        <div className="mt-3 flex items-center gap-2">
          <a
            href={`https://map.kakao.com/link/to/${encodeURIComponent(
              item.title
            )},${item.lat},${item.lng}`}
            target="_blank"
            rel="noreferrer"
            className="
              inline-flex items-center justify-center gap-1
              rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white
              shadow-sm hover:bg-indigo-700 focus:outline-none
              focus-visible:ring-2 focus-visible:ring-indigo-500
            "
          >
            길찾기
          </a>

          <button
            type="button"
            className="
              inline-flex items-center justify-center gap-1
              rounded-lg border border-gray-300 bg-white px-3 py-2
              text-sm font-medium text-gray-700 hover:bg-gray-50
              focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400
            "
          >
            공유
          </button>

          <button
            type="button"
            className="
              inline-flex items-center justify-center gap-1
              rounded-lg border border-gray-300 bg-white px-3 py-2
              text-sm font-medium text-gray-700 hover:bg-gray-50
              focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400
            "
          >
            저장
          </button>
        </div>

        {/* 보조 메타(원한다면 활성화) */}
        {/* <div className="mt-3 text-sm text-gray-600">
          820m · 서울특별시 ○○구 ○○로 123
        </div> */}

        {error && (
          <div className="mt-3 text-xs text-red-600">이미지 불러오기 실패</div>
        )}
      </div>
    </section>
  );
}
