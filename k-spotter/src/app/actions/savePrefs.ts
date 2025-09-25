"use server";

import { PrefsSchema, signPrefs } from "@/lib/prefs";
import { ensureAnonId, setPrefCookie } from "@/lib/cookies";
import { redirect } from "next/navigation";

export async function savePrefsAction(formData: FormData) {
  // 폼 → 객체 

  const purposes = formData.getAll("purpose") as string[];
  console.log(purposes); 
  const vibe = formData.get("vibe") as string | null;

  const data = {
    purposes,
    vibe: vibe || undefined,
    ts: Date.now(),
  };

  const parsed = PrefsSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid preferences");
  }

  // 익명 ID 보장(최초 방문자라면 생성)
  ensureAnonId();

  // 서명 → httpOnly 쿠키 저장
  const token = await signPrefs(parsed.data);
  setPrefCookie(token); 

  // (옵션) DB에 anon_id 기준으로 기록해두면 쿠키 4KB 제한 우회/통계 OK

  redirect("/"); // 저장 뒤 홈으로
}
