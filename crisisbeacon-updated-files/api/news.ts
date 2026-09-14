import type { Request, Response } from 'express';
import Parser from 'rss-parser';
import { createHash } from 'node:crypto';

const url = 'https://news.google.com/rss/search?' + new URLSearchParams({
  q: 'Hyderabad (flood OR waterlogging OR rescue OR collapse OR "heavy rain" OR fire) when:7d',
  hl: 'en-IN', gl: 'IN', ceid: 'IN:en',
});
export interface NewsItem { id: string; title: string; url: string; publishedAt: string; source: string }
let cache: { fetchedAt: string; items: NewsItem[] } | undefined;
let pending: Promise<typeof cache> | undefined;

export async function parseNews(xml: string, now = Date.now()): Promise<NewsItem[]> {
  const feed = await new Parser().parseString(xml);
  const seen = new Set<string>();
  return feed.items.flatMap((item) => {
    const title = item.title?.trim() || '';
    const date = Date.parse(item.isoDate || item.pubDate || '');
    const link = item.link || '';
    if (!/\b(hyderabad|secunderabad)\b/i.test(title) ||
        !/flood|waterlog|rescue|collaps|heavy rain|fire|storm/i.test(title) ||
        !Number.isFinite(date) || now - date > 7 * 86400000 || date > now + 3600000) return [];
    let parsed: URL;
    try { parsed = new URL(link); } catch { return []; }
    if (parsed.protocol !== 'https:') return [];
    const key = title.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ id: createHash('sha256').update(key).digest('hex').slice(0, 24),
      title, url: link, publishedAt: new Date(date).toISOString(),
      source: title.includes(' - ') ? title.split(' - ').at(-1)! : 'Google News RSS' }];
  }).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 30);
}

async function refresh() {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error('News provider unavailable');
  const xml = await response.text();
  if (xml.length > 2_000_000) throw new Error('Feed exceeds size limit');
  cache = { fetchedAt: new Date().toISOString(), items: await parseNews(xml) };
  return cache;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Use GET' });
  }
  try {
    if (!cache || Date.now() - Date.parse(cache.fetchedAt) > 300000) {
      pending ??= refresh().finally(() => { pending = undefined; });
      await pending;
    }
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    return res.json({ ...cache, stale: false });
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    if (cache) return res.json({ ...cache, stale: true, error: 'Refresh unavailable; showing cached headlines.' });
    return res.status(503).json({ items: [], error: 'Hyderabad news is temporarily unavailable. Try again shortly.' });
  }
}
