export function buildURL(params: Record<string, string> , ENDPOINT :string) {
  const u = new URL(ENDPOINT);
  const rawKey = process.env.OPEN_API_KEY!;
  const key = rawKey.includes("%") ? decodeURIComponent(rawKey) : rawKey; // 키는 decode
  u.searchParams.set("serviceKey", key);
  u.searchParams.set("MobileOS", "ETC");
  u.searchParams.set("MobileApp", "K-Spotter");
  u.searchParams.set("_type", "json");
  Object.entries(params).forEach(([k,v]) => u.searchParams.set(k, v));
  return u.toString();
}