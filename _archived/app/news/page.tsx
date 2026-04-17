"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TOPIC_ORDER, TOPIC_META, CATEGORY_IMAGES, type Article, type Topic, type TrendingTopic } from '../../lib/news-config';
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

function getArticleImage(article: Article): string {
  if (article.image_url && article.image_url.length > 10) return article.image_url;
  return CATEGORY_IMAGES[article.category] || CATEGORY_IMAGES['Barcelona'];
}

export default function NewsPage() {
  const { lang } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const prevArticleCount = useRef(0);

  const fetchArticles = useCallback(async () => {
    try {
      const qLang = lang === 'ES' ? 'ES' : 'EN';
      const qCat = activeFilter === 'All' ? '' : `&category=${activeFilter}`;
      
      const res = await fetch(`/api/news?language=${qLang}${qCat}`);
      const data = await res.json();
      setArticles(data.articles || []);
      if (loading) setLoading(false);
    } catch (e) {
      console.error(e);
      if (loading) setLoading(false);
    }
  }, [lang, activeFilter, loading]);

  const fetchTrends = useCallback(async () => {
    try {
      const res = await fetch('/api/trends');
      const data = await res.json();
      setTrends(data.trends || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  // Poll for updates every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchArticles();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchArticles]);

  // Separate Hero from Grid
  const heroArticle = articles.length > 0 ? articles[0] : null;
  const gridArticles = articles.slice(1);

  // Sidebar always pulls top breaking/trending and most recent, ignoring category filter
  const [sidebarArticles, setSidebarArticles] = useState<Article[]>([]);
  useEffect(() => {
    const fetchSidebar = async () => {
      try {
        const qLang = lang === 'ES' ? 'ES' : 'EN';
        const res = await fetch(`/api/news?language=${qLang}&limit=8`);
        const data = await res.json();
        setSidebarArticles(data.articles || []);
      } catch (e) {}
    };
    fetchSidebar();
  }, [lang]);

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
                <HeroCard article={heroArticle} />
              )}

              {/* Grid */}
              {gridArticles.length > 0 ? (
                <div className={styles.articleGrid}>
                  {gridArticles.map((a) => (
                    <ArticleCard key={a.id} article={a} />
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
                Array(6).fill(0).map((_, i) => <div key={i} className={`${styles.skeleton} ${styles.skeletonSidebar}`} />)
              ) : (
                sidebarArticles.map((a, i) => (
                  <a
                    key={a.id}
                    href={`/news/${a.slug}`}
                    className={`${styles.latestItem} ${i < 2 ? styles.fadeIn : ''}`}
                  >
                    <div className={styles.latestItemTime}>
                      <span>{timeAgo(a.published_at)}</span>
                      {a.is_breaking && (
                        <span className={styles.breakingBadge}>
                          <span className={styles.breakingDot} />
                          BREAKING
                        </span>
                      )}
                      <span
                        className={styles.categoryBadge}
                        style={{ background: TOPIC_META[a.category]?.bg, color: TOPIC_META[a.category]?.color }}
                      >
                        {a.category}
                      </span>
                    </div>
                    <div className={styles.latestItemTitle}>
                      {a.is_trending && <span style={{marginRight: '6px'}}>🔥</span>}
                      {a.title}
                    </div>
                  </a>
                ))
              )}
            </div>

            {/* Trending Section */}
            {trends.length > 0 && (
              <div className={styles.trendsSection}>
                <div className={styles.trendsLabel}>
                  Trending Searches
                </div>
                <div className={styles.trendsList}>
                  {trends.map((t) => (
                    <button 
                      key={t.id} 
                      onClick={() => window.location.href=`/news`} 
                      className={styles.trendTag}
                    >
                      <span className={styles.trendEmoji}>📈</span>
                      {t.topic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Hero Card ───
function HeroCard({ article }: { article: Article }) {
  const [imgErr, setImgErr] = useState(false);
  const imgSrc = getArticleImage(article);

  return (
    <a href={`/news/${article.slug}`} className={styles.heroCard}>
      {!imgErr ? (
        <img
          src={imgSrc}
          alt={article.title}
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
          {article.is_breaking && (
            <span className={styles.breakingBadge}>
              <span className={styles.breakingDot} />
              BREAKING
            </span>
          )}
          <span
            className={styles.categoryBadge}
            style={{ background: TOPIC_META[article.category]?.color || '#E63946', color: 'white' }}
          >
            {article.category}
          </span>
        </div>
        <h2 className={styles.heroTitle}>
          {article.is_trending && <span style={{marginRight: '8px'}}>🔥</span>}
          {article.title}
        </h2>
        <div className={styles.heroMeta}>
          <span>{article.source_name}</span>
          <span>·</span>
          <span>{timeAgo(article.published_at)}</span>
        </div>
      </div>
    </a>
  );
}

// ─── Article Card ───
function ArticleCard({ article }: { article: Article }) {
  const [imgErr, setImgErr] = useState(false);
  const imgSrc = getArticleImage(article);

  return (
    <a href={`/news/${article.slug}`} className={styles.articleCard}>
      <div className={styles.articleImageWrap}>
        {!imgErr ? (
          <img
            src={imgSrc}
            alt={article.title}
            className={styles.articleImage}
            onError={() => setImgErr(true)}
            loading="lazy"
          />
        ) : (
          <div className={styles.articleImagePlaceholder}>📰</div>
        )}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
          {article.is_breaking && (
            <span className={styles.breakingBadge}>
              <span className={styles.breakingDot} />
              BREAKING
            </span>
          )}
          <span
            className={styles.categoryBadge}
            style={{ background: TOPIC_META[article.category]?.color || '#E63946', color: 'white' }}
          >
            {article.category}
          </span>
        </div>
      </div>

      <div className={styles.articleBody}>
        <h3 className={styles.articleTitle}>
          {article.is_trending && <span style={{marginRight: '6px'}}>🔥</span>}
          {article.title}
        </h3>
        <p className={styles.articleDesc}>{article.summary}</p>
        <div className={styles.articleFooter}>
          <div className={styles.articleSource}>
            <span>{article.source_name}</span>
          </div>
          <span className={styles.articleTime}>{timeAgo(article.published_at)}</span>
        </div>
      </div>
    </a>
  );
}
