"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TOPIC_ORDER, TOPIC_META, type Article } from '../../lib/news-config';
import { useLanguage } from '../../components/LanguageContext';

type FilterType = 'All' | typeof TOPIC_ORDER[number];

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 60000);
  
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) {
    const hours = Math.floor(diff / 60);
    const date = new Date(dateStr);
    return `Today ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  if (diff < 2880) return 'Yesterday';
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function NewsPage() {
  const { lang, t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [translated, setTranslated] = useState<Record<string, { title: string; description: string }>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  useEffect(() => {
    fetch('/api/news')
      .then(r => r.json())
      .then(data => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const translateArticles = useCallback(async (arts: Article[]) => {
    const targetLang = lang.toLowerCase();
    
    // Find articles that need translation (titles and descriptions)
    const items = arts.map((a, i) => ({ i, a })).filter(({ a }) => {
      const source = a.lang.toLowerCase();
      return source !== targetLang;
    });

    if (!items.length) return;

    const chunkSize = 15;
    const map: Record<string, { title: string; description: string }> = {};
    
    for (let c = 0; c < items.length; c += chunkSize) {
      const chunk = items.slice(c, c + chunkSize);
      try {
        const [tR, dR] = await Promise.all([
          fetch('/api/translate', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ texts: chunk.map(x => x.a.title), targetLang }) 
          }),
          fetch('/api/translate', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ texts: chunk.map(x => x.a.description), targetLang }) 
          }),
        ]);
        const { translations: tt } = await tR.json();
        const { translations: td } = await dR.json();
        chunk.forEach(({ a }, idx) => { 
          if (tt?.[idx]) map[a.link] = { title: tt[idx], description: td?.[idx] || '' }; 
        });
      } catch (e) { console.error('Translation error:', e); }
    }
    setTranslated(prev => ({ ...prev, ...map }));
  }, [lang]);

  useEffect(() => {
    if (articles.length > 0) translateArticles(articles);
  }, [articles, translateArticles]);

  // Strict filtering: Only show articles that are either in the selected language OR have been translated
  const finalArticles = useMemo(() => {
    const base = activeFilter === 'All' ? articles : articles.filter(a => a.topic === activeFilter);
    return base;
  }, [articles, activeFilter]);

  const breakingNews = finalArticles.find(a => a.breaking);
  const feedArticles = finalArticles.filter(a => a.link !== breakingNews?.link);

  return (
    <div style={{ paddingTop: '64px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Bar Categories - Fix Pill Styling as requested */}
      <div className="no-scrollbar" style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '16px var(--app-margin) 16px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: '64px', zIndex: 10 }}>
        {['All', ...TOPIC_ORDER].map(f => (
          <button 
            key={f} 
            onClick={() => setActiveFilter(f as FilterType)}
            className="chip"
            style={{
              padding: '10px 24px',
              borderRadius: '24px',
              background: activeFilter === f ? 'var(--primary-red)' : '#1A1A2E',
              color: '#fff',
              border: activeFilter === f ? '1px solid var(--primary-red)' : '1px solid var(--glass-border)',
              fontWeight: 800,
              fontSize: '13px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: 'all 0.2s'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <main className="container" style={{ padding: '40px var(--app-margin) 100px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '32px' }}>
            {[1,2,3,4,5,6].map(i => <div key={i} className="app-card" style={{ height: '350px', opacity: 0.1, background: '#1A1A2E' }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '32px' }}>
            {breakingNews && (
              <div style={{ gridColumn: '1 / -1' }}>
                <ArticleCard 
                  article={breakingNews} 
                  isHero 
                  translated={translated[breakingNews.link]} 
                />
              </div>
            )}

            {feedArticles.map((a, i) => (
              <ArticleCard 
                key={a.link + i} 
                article={a} 
                translated={translated[a.link]} 
              />
            ))}
            
            {finalArticles.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🗞️</span>
                <h3>No articles found for this category.</h3>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ArticleCard({ article, translated, isHero }: { article: Article; translated?: { title: string; description: string }; isHero?: boolean }) {
  const title = translated?.title || article.title;
  const desc = translated?.description || article.description;
  const [imgErr, setImgErr] = useState(false);
  
  const isToday = new Date(article.pubDate).toDateString() === new Date().toDateString();

  return (
    <a href={article.link} target="_blank" rel="noopener noreferrer" className="app-card animate-slide-up" style={{ 
      textDecoration: 'none', 
      display: 'flex', 
      flexDirection: isHero ? 'row' : 'column',
      gap: 0,
      overflow: 'hidden',
      height: '100%',
      minHeight: isHero ? '400px' : 'auto',
      border: '1px solid var(--glass-border)',
      background: '#1A1A2E'
    }}>
      <div style={{ 
        width: isHero ? '50%' : '100%', 
        height: isHero ? 'auto' : '220px', 
        position: 'relative',
        background: '#000' 
      }}>
        {!imgErr && article.image ? (
          <img 
            src={article.image} 
            alt="" 
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', opacity: 0.1 }}>📰</div>
        )}
        
        {/* Badges Container */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px' }}>
          {article.breaking ? (
            <span style={{ background: '#E63946', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>BREAKING</span>
          ) : isToday && (
            <span style={{ background: '#E63946', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>TODAY</span>
          )}
          <span style={{ background: TOPIC_META[article.topic]?.color || '#333', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {article.topic}
          </span>
        </div>

        {/* Source Language Badge */}
        <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '1px 6px', borderRadius: '2px', fontSize: '10px', fontWeight: 800 }}>
          {article.lang}
        </div>
      </div>

      <div style={{ padding: '32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ 
          fontSize: isHero ? '32px' : '22px', 
          marginBottom: '16px', 
          lineHeight: '1.2', 
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 900,
          textTransform: 'uppercase'
        }}>
          {title}
        </h3>
        <p style={{ opacity: 0.7, fontSize: '15px', marginBottom: '24px', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: isHero ? 5 : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {desc}
        </p>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {article.favicon && <img src={article.favicon} alt="" width={16} height={16} />}
            <span style={{ fontSize: '13px', fontWeight: 700, opacity: 0.8 }}>{article.source}</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, opacity: 0.4 }}>{timeAgo(article.pubDate)}</span>
        </div>
      </div>
    </a>
  );
}
