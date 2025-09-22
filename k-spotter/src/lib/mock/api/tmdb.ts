export async function tmdbDetailByTitle(title: string, opt?: { signal?: AbortSignal }) {
    const url = '/api/title/detail?' + new URLSearchParams({ q: title, type: 'tv' });
    const res = await fetch(url, { signal: opt?.signal, cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  } 