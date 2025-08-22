"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Page() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `/api/images?keyword=${encodeURIComponent("코엑스")}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        console.log(json?.response?.body?.items?.item?.[0]?.galWebImageUrl);       // 여기서 로그
        setData(json);
      } catch (e) {
        if ((e as any).name !== "AbortError") setError(e);
      }
    })();
    return () => controller.abort();
  }, []);


  if (error) return <div>에러가 발생했습니다.</div>;
  if (!data) return <div>로딩...</div>;
  const first = data?.response?.body?.items?.item?.[0];

  

  return (<div>
    <Image src={first.galWebImageUrl}
     alt={first.galTitle || "사진"}
   width={800}
  height={450} />
  </div>)
}
