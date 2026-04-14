"use client";
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { TOPIC_META, type Article } from '../lib/news-config';
import { useLanguage } from './LanguageContext';

const PRIORITY_TOPICS = new Set(['Barcelona', 'Catalunya', 'Culture & Events']);
const ENGLISH_SOURCES = ['BBC News', 'NYT World', 'CNN', 'The Local Spain'];

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function NewsPreview() {
  const { lang } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [translated, setTranslated] = useState<Record<number, { title: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news')
      .then(r => r.json())
      .then(data => {
        const all: Article[] = data.articles || [];
        const priority = all.filter(a => PRIORITY_TOPICS.has(a.topic));
        const breaking = all.filter(a => a.breaking && !PRIORITY_TOPICS.has(a.topic));
        setArticles([...priority, ...breaking].slice(0, 3));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const translateArticles = useCallback(async (arts: Article[]) => {
    const targetLang = lang.toLowerCase();
    
    const items = arts.map((a, i) => ({ i, a })).filter(({ a }) => {
      const sourceLang = a.lang?.toLowerCase();
      return sourceLang !== targetLang;
    });

    if (!items.length) return;

    try {
      const tR = await fetch('/api/translate', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ texts: items.map(x => x.a.title), targetLang }) 
      });
      const { translations: tt } = await tR.json();
      const map: Record<number, { title: string }> = {};
      items.forEach(({ i }, idx) => { map[i] = { title: tt[idx] }; });
      setTranslated(map);
    } catch { /*noop*/ }
  }, [lang]);

  useEffect(() => {
    if (articles.length > 0) translateArticles(articles);
  }, [lang, articles, translateArticles]);

  return (
    <div className="container" style={{ paddingBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '12px', borderBottom: '2px solid var(--primary-red)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0, color: 'var(--heading-color)', textTransform: 'uppercase' }}>
            {lang === 'EN' ? 'Top News' : lang === 'ES' ? 'Noticias' : 'Notícies'}
          </h2>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase' }}>{lang === 'EN' ? 'Live' : lang === 'ES' ? 'Vivo' : 'Viu'}</span>
        </div>
        <Link href="/news" style={{ fontSize: '0.9rem', color: 'var(--primary-red)', fontWeight: 800, textDecoration: 'none', textTransform: 'uppercase' }}>
          {lang === 'EN' ? 'All news →' : lang === 'ES' ? 'Todas →' : 'Totes →'}
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {[1,2,3].map(i => <div key={i} style={{ height: '200px', borderRadius: '0', background: 'var(--bg-secondary)', opacity: 0.4, border: '1px solid var(--glass-border)' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {articles.map((a, i) => {
            const meta = TOPIC_META[a.topic];
            const title = translated[i]?.title || a.title;
            return (
              <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" className="glass-panel"
                style={{ padding: '0', textDecoration: 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-secondary)', borderRadius: 0, border: '1px solid var(--glass-border)' }}>
                {a.image && (
                  <div style={{ height: '180px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    <img src={a.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', background: meta?.color || 'var(--primary-red)', padding: '4px 12px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {a.topic}
                      </span>
                    </div>
                  </div>
                )}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {a.favicon && <img src={a.favicon} alt="" width={14} height={14} style={{ borderRadius: '2px' }} />}
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', opacity: 0.6 }}>{a.source}</span>
                      {a.breaking && <span style={{ fontSize: '0.65rem', background: '#dc2626', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontWeight: 800 }}>BREAKING</span>}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', opacity: 0.4 }}>{timeAgo(a.pubDate)}</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)', lineHeight: 1.4 }}>{title}</h3>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
