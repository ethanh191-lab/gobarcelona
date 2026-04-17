"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TOPIC_META, type Article } from '../lib/news-config';
import { useLanguage } from './LanguageContext';

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function NewsPreview() {
  const { lang } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qLang = lang === 'ES' ? 'ES' : 'EN';
    fetch(`/api/news?limit=3&language=${qLang}`)
      .then(r => r.json())
      .then(data => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lang]);

  return (
    <div className="container" style={{ paddingBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '12px', borderBottom: '2px solid var(--primary-red)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: 'var(--heading-color)', textTransform: 'uppercase' }}>
            {lang === 'EN' ? 'Top News' : lang === 'ES' ? 'Noticias' : 'Notícies'}
          </h2>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase' }}>LIVE</span>
        </div>
        <Link href="/news" style={{ fontSize: '0.9rem', color: 'var(--primary-red)', fontWeight: 800, textDecoration: 'none', textTransform: 'uppercase' }}>
          {lang === 'EN' ? 'All news →' : lang === 'ES' ? 'Todas →' : 'Totes →'}
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {[1,2,3].map(i => <div key={i} style={{ height: '200px', background: 'var(--bg-secondary)', opacity: 0.4 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {articles.map((a) => {
            const meta = TOPIC_META[a.category];
            return (
              <a key={a.id} href={`/news/${a.slug}`} className="glass-panel"
                style={{ overflow: 'hidden', padding: 0, textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                {a.image_url && (
                  <div style={{ height: '180px', position: 'relative' }}>
                    <img src={a.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', background: meta?.color || '#E63946', padding: '4px 12px', borderRadius: '4px' }}>
                        {a.category}
                      </span>
                    </div>
                  </div>
                )}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.source_name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', opacity: 0.4 }}>{timeAgo(a.published_at)}</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--heading-color)', lineHeight: 1.4 }}>
                    {a.title}
                  </h3>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
