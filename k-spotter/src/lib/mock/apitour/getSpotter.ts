import { Place } from "../../../../type/type";

export type SpotterParams = {
    lat: number;
    lng: number;
    radius: number;
    englishOnly?: boolean;
    sort?: "reco" | "distance";
    contentTypeId?: number;
    signal?: AbortSignal;
  };
  
  export async function getSpotter({
    lat, lng, radius, contentTypeId, signal
  }: SpotterParams) {
    const qs = new URLSearchParams();
    qs.set("lat", String(lat));
    qs.set("lng", String(lng));
    qs.set("radius", String(radius));
    // ✅ contentTypeId가 유효할 때만 붙이기 (undefined → "undefined" 방지)
    if (typeof contentTypeId === "number" && Number.isFinite(contentTypeId)) {
      qs.append("contentTypeId", String(contentTypeId));
    }
    // (선택) 서버에서 자르는 limit
    // qs.set("limit", "100");
  
    const res = await fetch(`/api/nearby?${qs.toString()}`, {
      signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`nearby ${res.status} ${await res.text()}`);
  
    const data = await res.json();
  
    // ✅ 서버 표준: { items, count } 또는 items 배열
    const items =
      Array.isArray(data) ? data
      : Array.isArray(data.items) ? data.items
      : data.items ? [data.items] : [];
  

  
    return items as Place[];
  }
  