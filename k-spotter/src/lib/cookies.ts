import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export const COOKIE_ANON = "anon_id";
export const COOKIE_PREF = "ksp_pref";

export async function getAnonId() {
  const cookie = await cookies();
  return cookie.get(COOKIE_ANON)?.value ?? null;
}

export async function ensureAnonId(maxAgeDays = 90) {
  const store = await cookies();
  let id = store.get(COOKIE_ANON)?.value;
  if (!id) {
    id = randomUUID();
    store.set({
      name: COOKIE_ANON,
      value: id,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: maxAgeDays * 24 * 60 * 60,
    });
  }
  return id;
}

/** 서버에서 httpOnly 서명쿠키 설정 */
export async function setPrefCookie(token: string, maxAgeDays = 90) {
  const cookie = await cookies();
  cookie.set({
    name: COOKIE_PREF,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: maxAgeDays * 24 * 60 * 60,
  });
}

export async function clearPrefCookie() {
  const cookie = await cookies();
  cookie.set({
    name: COOKIE_PREF,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
}
