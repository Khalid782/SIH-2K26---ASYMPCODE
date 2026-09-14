import React, { useEffect, useState } from 'react';
import { RefreshCw, ExternalLink, Newspaper } from 'lucide-react';
interface NewsItem { id: string; title: string; url: string; publishedAt: string; source: string }
export default function FeedIngestionView({ onReview }: { onReview: (text: string) => void }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [updated, setUpdated] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setBusy(true);
    setError('');
    fetch('/api/news', { signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'News unavailable');
      if (active) { setItems(data.items); setUpdated(data.fetchedAt); setError(data.error || ''); }
    }).catch((e) => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(false); });
    const interval = setInterval(() => setRefresh((n) => n + 1), 300000);
    return () => { active = false; controller.abort(); clearInterval(interval); };
  }, [refresh]);
  return <section className="max-w-4xl mx-auto space-y-4">
    <header className="flex items-center justify-between gap-3">
      <div><h2 className="font-semibold flex items-center gap-2"><Newspaper size={18} />Hyderabad news</h2>
        <p className="text-xs text-mute mt-1">Google News RSS | Last 7 days | Unverified headlines</p></div>
      <button title="Refresh news" aria-label="Refresh news" disabled={busy} onClick={() => setRefresh((n) => n + 1)} className="p-2 border rounded"><RefreshCw size={16} className={busy ? 'animate-spin' : ''} /></button>
    </header>
    {updated && <p className="text-xs">Fetched {new Date(updated).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>}
    <p className="text-xs">Review reports before mapping. Headlines may describe forecasts or past events; they do not verify a hazard.</p>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {busy && <p role="status">Loading headlines...</p>}
    {!busy && !error && !items.length && <p>No matching recent Hyderabad headlines.</p>}
    <div className="divide-y divide-gray-200">
      {items.map((item) => <article key={item.id} className="py-4 space-y-2">
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm inline-flex items-start gap-2">{item.title}<ExternalLink size={14} className="shrink-0 mt-1" /></a>
        <p className="text-xs text-mute">{item.source} | {new Date(item.publishedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        <button className="text-xs border rounded px-3 py-1.5" onClick={() => onReview('Unverified news headline, published ' + item.publishedAt + ': ' + item.title + '\nSource: ' + item.url)}>Review in AI triage</button>
      </article>)}
    </div>
  </section>;
}
