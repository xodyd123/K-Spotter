import { z } from "zod";
import { SignJWT, jwtVerify } from "jose";

export const PrefsSchema = z.object({
  purposes: z.array(z.enum(["K_POP","DRAMA_FILM","FOOD","SIGHTSEEING"])).min(0).max(4),
  vibe: z.enum(["NIGHT","PHOTOGENIC","COZY","NATURE"]).optional(),
  ts: z.number(), // epoch ms
});
export type Prefs = z.infer<typeof PrefsSchema>;

const secret = new TextEncoder().encode(process.env.KSP_PREF_SECRET);

/** JWT 서명(쿠키에 넣을 compact JWS) */
export async function signPrefs(p: Prefs) {
  return await new SignJWT(p as any)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(secret);
}

/** JWT 검증 → Prefs | null */
export async function verifyPrefs(token: string | undefined | null): Promise<Prefs | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const parsed = PrefsSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
