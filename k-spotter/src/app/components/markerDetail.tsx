"use client";
import { useEffect, useState } from "react";

export default function MarkerDetail({ item, onClose }:{
  item: { title: string; lat: number; lng: number };
  onClose: () => void;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const r = await fetch(`/api/images?keyword=${encodeURIComponent(item.title)}`, { signal: ac.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        console.log(j); 
        const raw = j?.response?.body?.items?.item;
        
        const items = Array.isArray(raw) ? raw : (raw ? [raw] : []);
        setImgUrl(items[0]?.galWebImageUrl ?? null);
      } catch (e) { if ((e as any).name !== "AbortError") setError(e); }
    })();
    return () => ac.abort();
  }, [item.title]);

  return (
    <div  style={{ width: 260, padding: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{item.title}</div>
      {imgUrl && (
        <img
          src={imgUrl}
          alt=""
          style={{ width: "100%", height: 120 , objectFit: "cover", borderRadius: 6 }}
        />
      )}
      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <a
          href={`https://map.kakao.com/link/to/${encodeURIComponent(item.title)},${item.lat},${item.lng}`}
          target="_blank"
          rel="noreferrer"
        >
          길찾기
        </a>
        <button onClick={onClose}>닫기</button>
      </div>
      {error && <div style={{ color: "crimson" }}>이미지 불러오기 실패</div>}
    </div>
  );
}
