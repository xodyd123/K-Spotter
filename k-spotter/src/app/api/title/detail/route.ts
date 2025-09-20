// /app/api/title/detail/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q') ?? '';
  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 });

  const token = process.env.TMDB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Missing TMDB_TOKEN' }, { status: 500 });
  }
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  // 1) 검색
  const searchUrl = `https://api.themoviedb.org/3/search/tv?` +
    new URLSearchParams({ query: q, language: 'ko-KR', include_adult: 'false' });
  const sRes = await fetch(searchUrl, { headers, cache: 'no-store' });
  const sText = await sRes.text();
  if (!sRes.ok) {
    return NextResponse.json(
      { where: 'search', status: sRes.status, body: sText.slice(0, 400), url: searchUrl },
      { status: 502 }
    );
  }
  const s = JSON.parse(sText);
  const tv = Array.isArray(s.results) && s.results[0];
  if (!tv) {
    // (선택) 영어 폴백 한 번 더
    const s2Res = await fetch(
      `https://api.themoviedb.org/3/search/tv?` +
      new URLSearchParams({ query: q, language: 'en-US', include_adult: 'false' }),
      { headers, cache: 'no-store' }
    );
    const s2 = await s2Res.json();
    if (!Array.isArray(s2.results) || s2.results.length === 0) {
      return NextResponse.json({ results: [] }); // 정말 없음
    }
    s.results = s2.results;
  }

  // 2) 상세
  const detailUrl = `https://api.themoviedb.org/3/tv/${(s.results[0] as any).id}?` +
    new URLSearchParams({
      language: 'ko-KR',
      append_to_response: 'credits,images,watch/providers',
      include_image_language: 'ko,null',
      region: 'KR',
    });

  const dRes = await fetch(detailUrl, { headers, cache: 'no-store' });
  const dText = await dRes.text();
  if (!dRes.ok) {
    return NextResponse.json(
      { where: 'detail', status: dRes.status, body: dText.slice(0, 400), url: detailUrl },
      { status: 502 }
    );
  }
  const d = JSON.parse(dText);

  const cast = (d.credits?.cast ?? []).slice(0, 5).map((c: any) => ({ name: c.name, role: c.character }));
  const stills = (d.images?.backdrops ?? []).slice(0, 3).map((b: any) => `https://image.tmdb.org/t/p/w1280${b.file_path}`);
  const providersKR = d['watch/providers']?.results?.KR ?? null;

  return NextResponse.json({
    id: d.id,
    title: d.name,
    overview: d.overview,
    year: (d.first_air_date || '').slice(0, 4),
    cast,
    stills,
    watch: {
      link: providersKR?.link || null,
      flatrate: providersKR?.flatrate || [],
    },
  });
}
