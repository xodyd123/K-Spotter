import { cookies } from "next/headers";
import { COOKIE_PREF } from "@/lib/cookies";
import { verifyPrefs } from "@/lib/prefs";

import { redirect } from "next/navigation";
import PexelsGrid from "./PexelsGrid";


export default async function Page() { 
  const cookie = await cookies()
  const token = cookie.get(COOKIE_PREF)?.value ?? null;
  const prefs = await verifyPrefs(token);

  if (!prefs) {
    // 온보딩으로 이동
    redirect("/onboarding");
  }

  // 리턴 사용자 뷰 (예시)
  return (
    <main className="p-4">
       <PexelsGrid/> 
      {/* <UnsplashGrid/> */}
      
    </main>
  );
}
