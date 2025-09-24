import { cookies } from "next/headers";
import { COOKIE_PREF } from "@/lib/cookies";
import { verifyPrefs } from "@/lib/prefs";
import Link from "next/link";
import { redirect } from "next/navigation";

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
      <h1 className="text-xl font-semibold mb-3">Welcome back 👋</h1>
      <p className="text-sm text-gray-600 mb-4">
        purposes: {prefs.purposes.join(", ")} / vibe: {prefs.vibe ?? "-"}
      </p>

      <div className="space-x-2">
        <Link href="/(tabs)/explore" className="underline">Explore</Link>
        <Link href="/map" className="underline">Map</Link>
      </div>
    </main>
  );
}
