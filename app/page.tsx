"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { useLanguage } from '../components/LanguageContext';
import { type Article } from '../lib/news-config';

export default function Home() {
  const { lang, t } = useLanguage();
  const [news, setNews] = useState<Article[]>([]);
  const [translated, setTranslated] = useState<Record<string, { title: string }>>({});
  const [loading, setLoading] = useState(true);

  // 1. Data Fetching
  useEffect(() => {
    // Top 10 articles
    const qLang = lang === 'ES' ? 'ES' : 'EN';
    fetch(`/api/news?language=${qLang}&limit=10`)
      .then(r => r.json())
      .then(data => {
        setNews(data.articles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lang]);

  // 2. Translation Logic (Headers) -> Only translate if language mismatch
  const translateHeaders = async (items: Article[]) => {
    const targetLang = lang.toLowerCase();
    const toTranslate = items.map((a, i) => ({ i, a })).filter(({ a }) => a.language !== targetLang);
    if (!toTranslate.length) return;

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: toTranslate.map(x => x.a.title), targetLang })
      });
      const { translations } = await res.json();
      const map: Record<string, { title: string }> = {};
      toTranslate.forEach(({ a }, idx) => { 
        if (translations?.[idx]) map[a.slug] = { title: translations[idx] }; 
      });
      setTranslated(prev => ({ ...prev, ...map }));
    } catch {}
  };

  useEffect(() => {
    if (news.length > 0) translateHeaders(news);
  }, [news, lang]);

  const latestNews = useMemo(() => news.slice(0, 3), [news]);
  const breakingNews = useMemo(() => news.find(a => a.is_breaking), [news]);
  // 4 most recent non-breaking articles
  const todayNews = useMemo(() => news.filter(a => !a.is_breaking).slice(0, 4), [news]);

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 60) return `${diff}h ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return 'Today';
  };

  return (
    <main className={styles.main}>
      {/* ─── Hero Section ─── */}
      <section className={styles.heroSection}>
        <div className={styles.heroOverlay} />
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>{t('home.hero.title')}</h1>
            <p className={styles.heroSubline}>{t('home.hero.subtitle')}</p>
            
            <div className={styles.ctaGroup}>
              <Link href="/events" className="btn-primary" style={{ padding: '20px 40px', fontSize: '18px' }}>
                {t('home.hero.cta_events')}
              </Link>
              <Link href="/map" className="btn-secondary" style={{ padding: '20px 40px', fontSize: '18px', background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.2)' }}>
                {t('home.hero.cta_beers')}
              </Link>
            </div>
          </div>
        </div>

        {/* Live Ticker */}
        <div className={styles.liveTickerContainer}>
          <div className={styles.liveBadge}>LIVE</div>
          <div className={styles.tickerTrack}>
            <div className={styles.tickerContent}>
              {latestNews.map((a, i) => (
                <span key={i} className={styles.tickerItem}>
                  {a.is_trending && <span style={{marginRight: '6px'}}>🔥</span>}
                  {translated[a.slug]?.title || a.title}
                </span>
              ))}
              {/* Duplicate for seamless loop */}
              {latestNews.map((a, i) => (
                <span key={`dup-${i}`} className={styles.tickerItem}>
                  {a.is_trending && <span style={{marginRight: '6px'}}>🔥</span>}
                  {translated[a.slug]?.title || a.title}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Breaking News Strip */}
      {breakingNews && (
        <Link href={`/news/${breakingNews.slug}`} className={styles.breakingStrip}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className={styles.breakingBadge}>BREAKING</span>
            <span className={styles.breakingHeadline}>
              {translated[breakingNews.slug]?.title || breakingNews.title}
            </span>
          </div>
        </Link>
      )}

      <div className="container" style={{ paddingTop: '80px' }}>
        {/* Feature Cards with Social Proof */}
        <section className={styles.featureGrid}>
          <Link href="/events" className="app-card" style={{ background: '#1A1A2E', border: '1px solid var(--glass-border)' }}>
            <div className={styles.cardContent}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>📅</div>
              <h3>The Pulse</h3>
              <p>Live events across BCN. Updated hourly.</p>
            </div>
          </Link>
          <Link href="/map" className="app-card" style={{ background: '#1A1A2E', border: '1px solid var(--glass-border)' }}>
            <div className={styles.cardContent}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🍺</div>
              <h3>The Beer Map</h3>
              <p>53+ bars mapped. Prices verified by locals.</p>
            </div>
          </Link>
          <Link href="/guide" className="app-card" style={{ background: '#1A1A2E', border: '1px solid var(--glass-border)' }}>
            <div className={styles.cardContent}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>📚</div>
              <h3>The Guide</h3>
              <p>NIE, housing, transport, banking. Step by step.</p>
            </div>
          </Link>
        </section>

        {/* BCN TODAY 2x2 Grid */}
        <section style={{ margin: '100px 0' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
             <h2 style={{ fontSize: '48px', margin: 0 }}>{t('home.bcn_today')}</h2>
             <Link href="/news" style={{ color: 'var(--primary-red)', fontWeight: 800, textDecoration: 'none', textTransform: 'uppercase', fontSize: '14px' }}>{t('home.more_news')}</Link>
          </header>
          
          <div className={styles.newsGrid}>
            {todayNews.length > 0 ? todayNews.map((a, i) => (
              <a key={i} href={`/news/${a.slug}`} className={styles.newsCard}>
                <span className={styles.topicBadge} style={{ background: a.is_breaking ? 'var(--primary-red)' : 'rgba(255,255,255,0.1)' }}>
                  {a.is_breaking ? 'BREAKING' : a.category}
                </span>
                <h3 className={styles.newsTitle}>
                  {a.is_trending && <span style={{marginRight: '6px'}}>🔥</span>}
                  {translated[a.slug]?.title || a.title}
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', fontSize: '12px', opacity: 0.5, fontWeight: 700 }}>
                   <span>{a.source_name}</span>
                   <span>{timeAgo(a.published_at)}</span>
                </div>
              </a>
            )) : (
              [1, 2, 3, 4].map(i => <div key={i} className={`${styles.newsCard} ${styles.skeleton}`} style={{ height: '220px' }}></div>)
            )}
          </div>
        </section>

        {/* Social Proof Stats */}
        <section className={styles.socialProofBar}>
           <div className={styles.stat}>Join 1,200+ subscribers</div>
           <div className={styles.statSeparator} />
           <div className={styles.stat}>53 bars mapped</div>
           <div className={styles.statSeparator} />
           <div className={styles.stat}>Updated daily</div>
        </section>

        {/* Sunday Briefing (CTA at bottom) */}
        <section className={styles.newsletterSection} style={{ textAlign: 'center', margin: '120px 0 160px' }}>
           <h1 style={{ fontSize: 'clamp(3rem, 10vw, 7rem)', lineHeight: 0.9, marginBottom: '16px' }}>{t('home.sunday_briefing')}</h1>
           <p style={{ fontSize: '1.5rem', opacity: 0.8, marginBottom: '40px' }}>{t('home.sunday_desc')}</p>
           
           <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', gap: '12px' }}>
             <input type="email" placeholder={t('home.news.placeholder')} style={{ flex: 1, background: '#1A1A2E', border: '1px solid var(--glass-border)', padding: '20px', borderRadius: '4px', color: '#fff', fontSize: '16px', fontWeight: 700 }} />
             <button className="btn-primary" style={{ padding: '0 32px' }}>{t('home.subscribe')}</button>
           </div>
           
           <p style={{ opacity: 0.5, marginTop: '20px', fontWeight: 700 }}>{t('home.join_count')}</p>
        </section>
      </div>
    </main>
  );
}
