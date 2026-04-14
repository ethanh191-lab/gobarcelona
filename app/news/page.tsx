"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TOPIC_ORDER, TOPIC_META, CATEGORY_IMAGES, type Article, type Topic } from '../../lib/news-config';
import { useLanguage } from '../../components/LanguageContext';
import styles from './news.module.css';

type FilterType = 'All' | Topic;

// ─── Time Formatting ───
function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 60000);

  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff} min ago`;
  if (diff < 120) return '1 hour ago';
  if (diff < 1440) {
    const hours = Math.floor(diff / 60);
    return `${hours} hours ago`;
  }
  if (diff < 2880) {
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `Yesterday at ${h}:${m}`;
  }
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function isBreaking(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime()) && (Date.now() - d.getTime()) < 30 * 60 * 1000;
}

function getLangFlag(lang: string): string {
  if (lang === 'EN') return '🇬🇧';
  if (lang === 'ES') return '🇪🇸';
  return '🌐';
}

function getArticleImage(article: Article): string {
  if (article.image && article.image.length > 10) return article.image;
  return CATEGORY_IMAGES[article.topic] || CATEGORY_IMAGES['Barcelona'];
}

// ─── Main Page ───
export default function NewsPage() {
  const { lang, t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [translated, setTranslated] = useState<Record<string, { title: string; description: string }>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const prevArticleCount = useRef(0);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      const arts = data.articles || [];
      setArticles(arts);
      if (loading) setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => { fetchArticles(); }, []);

  // Poll every 60s for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/news')
        .then(r => r.json())
        .then(data => {
          const arts = data.articles || [];
          setArticles(arts);
        })
        .catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Translation
  const translateArticles = useCallback(async (arts: Article[]) => {
    const targetLang = lang.toLowerCase();
    const items = arts.filter(a => a.lang.toLowerCase() !== targetLang).slice(0, 30);
    if (!items.length) return;

    const map: Record<string, { title: string; description: string }> = {};
    const chunk = items.slice(0, 15);
    try {
      const [tR, dR] = await Promise.all([
        fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: chunk.map(a => a.title), targetLang }),
        }),
        fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: chunk.map(a => a.description), targetLang }),
        }),
      ]);
      const { translations: tt } = await tR.json();
      const { translations: td } = await dR.json();
      chunk.forEach((a, idx) => {
        if (tt?.[idx]) map[a.link] = { title: tt[idx], description: td?.[idx] || '' };
      });
    } catch (e) { console.error('Translation error:', e); }
    setTranslated(prev => ({ ...prev, ...map }));
  }, [lang]);

  useEffect(() => {
    if (articles.length > 0) translateArticles(articles);
  }, [articles, translateArticles]);

  // Filtered + sorted articles
  const filteredArticles = useMemo(() => {
    let base = articles;
    if (activeFilter !== 'All') base = base.filter(a => a.topic === activeFilter);
    // Breaking always first
    return [...base].sort((a, b) => {
      const aBreak = a.breaking || isBreaking(a.pubDate);
      const bBreak = b.breaking || isBreaking(b.pubDate);
      if (aBreak && !bBreak) return -1;
      if (!aBreak && bBreak) return 1;
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });
  }, [articles, activeFilter]);

  const heroArticle = filteredArticles[0] || null;
  const gridArticles = filteredArticles.slice(1);

  // Sidebar: all articles sorted by time, breaking first
  const sidebarArticles = useMemo(() => {
    return [...articles].sort((a, b) => {
      const aBreak = a.breaking || isBreaking(a.pubDate);
      const bBreak = b.breaking || isBreaking(b.pubDate);
      if (aBreak && !bBreak) return -1;
      if (!aBreak && bBreak) return 1;
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    }).slice(0, 25);
  }, [articles]);

  const getTitle = (a: Article) => translated[a.link]?.title || a.title;
  const getDesc = (a: Article) => translated[a.link]?.description || a.description;

  return (
    <div className={styles.newsPage}>
      {/* ─── Tab Bar ─── */}
      <div className={styles.tabBar}>
        <div className={styles.tabScroll} ref={tabScrollRef}>
          {(['All', ...TOPIC_ORDER] as FilterType[]).map(f => (
            <button
              key={f}
              className={`${styles.tab} ${activeFilter === f ? styles.tabActive : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className={styles.contentGrid}>
        {/* LEFT: Main Feed */}
        <div className={styles.mainFeed}>
          {loading ? (
            <>
              <div className={`${styles.skeleton} ${styles.skeletonHero}`} />
              <div className={styles.articleGrid}>
                {[1,2,3,4].map(i => <div key={i} className={`${styles.skeleton} ${styles.skeletonCard}`} />)}
              </div>
            </>
          ) : (
            <>
              {/* Hero */}
              {heroArticle && (
                <HeroCard article={heroArticle} title={getTitle(heroArticle)} desc={getDesc(heroArticle)} />
              )}

              {/* Grid */}
              {gridArticles.length > 0 ? (
                <div className={styles.articleGrid}>
                  {gridArticles.map((a, i) => (
                    <ArticleCard key={a.link + i} article={a} title={getTitle(a)} desc={getDesc(a)} />
                  ))}
                </div>
              ) : !heroArticle && (
                <div className={styles.emptyState}>
                  <span>🗞️</span>
                  <h3>No articles found for this category.</h3>
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT: Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.latestPanel}>
            <div className={styles.latestHeader}>
              <div className={styles.latestTitle}>
                <span className={styles.liveDot} />
                Latest news
              </div>
              <button
                className={styles.latestSeeAll}
                onClick={() => setActiveFilter('All')}
              >
                See all →
              </button>
            </div>
            <div className={styles.latestList}>
              {loading ? (
                Array(8).fill(0).map((_, i) => <div key={i} className={`${styles.skeleton} ${styles.skeletonSidebar}`} />)
              ) : (
                sidebarArticles.map((a, i) => {
                  const isBrk = a.breaking || isBreaking(a.pubDate);
                  return (
                    <a
                      key={a.link + i}
                      href={a.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.latestItem} ${i < (articles.length - prevArticleCount.current) && i < 3 ? styles.fadeIn : ''}`}
                    >
                      <div className={styles.latestItemTime}>
                        <span>{timeAgo(a.pubDate)}</span>
                        {isBrk && (
                          <span className={styles.breakingBadge}>
                            <span className={styles.breakingDot} />
                            BREAKING
                          </span>
                        )}
                        <span
                          className={styles.categoryBadge}
                          style={{ background: TOPIC_META[a.topic]?.bg, color: TOPIC_META[a.topic]?.color }}
                        >
                          {a.topic}
                        </span>
                      </div>
                      <div className={styles.latestItemTitle}>{getTitle(a)}</div>
                    </a>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Hero Card ───
function HeroCard({ article, title, desc }: { article: Article; title: string; desc: string }) {
  const [imgErr, setImgErr] = useState(false);
  const imgSrc = getArticleImage(article);
  const isBrk = article.breaking || isBreaking(article.pubDate);

  return (
    <a href={article.link} target="_blank" rel="noopener noreferrer" className={styles.heroCard}>
      {!imgErr ? (
        <img
          src={imgSrc}
          alt=""
          className={styles.heroImage}
          onError={() => setImgErr(true)}
          loading="eager"
        />
      ) : (
        <div className={styles.heroImagePlaceholder}>📰</div>
      )}
      <div className={styles.heroGradient} />
      <div className={styles.heroContent}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {isBrk && (
            <span className={styles.breakingBadge}>
              <span className={styles.breakingDot} />
              BREAKING
            </span>
          )}
          <span
            className={styles.categoryBadge}
            style={{ background: TOPIC_META[article.topic]?.color, color: 'white' }}
          >
            {article.topic}
          </span>
        </div>
        <h2 className={styles.heroTitle}>{title}</h2>
        <div className={styles.heroMeta}>
          <span className={styles.langFlag}>{getLangFlag(article.lang)}</span>
          {article.favicon && <img src={article.favicon} alt="" width={14} height={14} style={{ borderRadius: '2px' }} />}
          <span>{article.source}</span>
          <span>·</span>
          <span>{timeAgo(article.pubDate)}</span>
        </div>
      </div>
    </a>
  );
}

// ─── Article Card ───
function ArticleCard({ article, title, desc }: { article: Article; title: string; desc: string }) {
  const [imgErr, setImgErr] = useState(false);
  const imgSrc = getArticleImage(article);
  const isBrk = article.breaking || isBreaking(article.pubDate);

  return (
    <a href={article.link} target="_blank" rel="noopener noreferrer" className={styles.articleCard}>
      <div className={styles.articleImageWrap}>
        {!imgErr ? (
          <img
            src={imgSrc}
            alt=""
            className={styles.articleImage}
            onError={() => setImgErr(true)}
            loading="lazy"
          />
        ) : (
          <div className={styles.articleImagePlaceholder}>📰</div>
        )}
        {/* Badges overlay */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
          {isBrk && (
            <span className={styles.breakingBadge}>
              <span className={styles.breakingDot} />
              BREAKING
            </span>
          )}
          <span
            className={styles.categoryBadge}
            style={{ background: TOPIC_META[article.topic]?.color, color: 'white' }}
          >
            {article.topic}
          </span>
        </div>
      </div>

      <div className={styles.articleBody}>
        <h3 className={styles.articleTitle}>{title}</h3>
        <p className={styles.articleDesc}>{desc}</p>
        <div className={styles.articleFooter}>
          <div className={styles.articleSource}>
            <span className={styles.langFlag}>{getLangFlag(article.lang)}</span>
            {article.favicon && <img src={article.favicon} alt="" width={14} height={14} style={{ borderRadius: '2px' }} />}
            <span>{article.source}</span>
          </div>
          <span className={styles.articleTime}>{timeAgo(article.pubDate)}</span>
        </div>
      </div>
    </a>
  );
}
