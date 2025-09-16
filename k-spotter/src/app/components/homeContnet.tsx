import { Home } from "../../../type/type";

export default function HomeComponent({value} : {value : Home}){
    
    const copy = async (text: string, label: string) => {
        try {
          await navigator.clipboard.writeText(text);
          alert(`${label}가 복사되었습니다.`);
        } catch {
          alert("복사에 실패했어요.");
        }
      };
   const {address , openHours , phone , closedDay} = value ; 

   return (
    <section className="mt-2 rounded-2xl border bg-white/90 p-4 sm:p-5 ring-1 ring-black/5">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">기본 정보</h3>

      <dl className="divide-y divide-gray-100">
        {/* 주소 */}
        <div className="flex items-start gap-3 py-3">
          <span className="mt-1 text-lg">📍</span>
          <div className="flex-1">
            <dt className="text-xs font-medium text-gray-500">주소</dt>
            <dd className="text-[15px] leading-6 text-gray-900">
              {address || <span className="text-gray-400">정보 없음</span>}
            </dd>
          </div>
          {address && (
            <button
              className="shrink-0 rounded-md border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
              onClick={() => copy(address, "주소")}
            >
              복사
            </button>
          )}
        </div>

        {/* 영업시간 */}
        <div className="flex items-start gap-3 py-3">
          <span className="mt-1 text-lg">⏰</span>
          <div className="flex-1">
            <dt className="text-xs font-medium text-gray-500">영업시간</dt>
            <dd className="text-[15px] leading-6 text-gray-900">
              {openHours || <span className="text-gray-400">정보 없음</span>}
            </dd>
          </div>
        </div>

        {/* 전화 */}
        <div className="flex items-start gap-3 py-3">
          <span className="mt-1 text-lg">☎️</span>
          <div className="flex-1">
            <dt className="text-xs font-medium text-gray-500">전화</dt>
            <dd className="text-[15px] leading-6 text-gray-900">
              {phone ? (
                <a className="underline decoration-gray-300 underline-offset-4" href={`tel:${phone}`}>
                  {phone}
                </a>
              ) : (
                <span className="text-gray-400">정보 없음</span>
              )}
            </dd>
          </div>
          {phone && (
            <button
              className="shrink-0 rounded-md border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
              onClick={() => copy(phone, "전화번호")}
            >
              복사
            </button>
          )}
        </div>

        {/* 휴무일 */}
        <div className="flex items-start gap-3 py-3">
          <span className="mt-1 text-lg">🚫</span>
          <div className="flex-1">
            <dt className="text-xs font-medium text-gray-500">휴무일</dt>
            <dd className="text-[15px] leading-6">
              {closedDay ? (
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-[12px] font-medium text-gray-700">
                  {closedDay}
                </span>
              ) : (
                <span className="text-gray-400">정보 없음</span>
              )}
            </dd>
          </div>
        </div>
      </dl>
    </section>
  );
}