"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { TOPIC_META, type Article } from '../lib/news-config';

// ─── Utilities ─────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function NewsCard({ article }: { article: Article }) {
  const meta = TOPIC_META[article.category];
  return (
    <a href={article.source_url} target="_blank" rel="noopener noreferrer" className={styles.newsCard}>
      {article.image_url && (
        <div className={styles.newsCardImg}>
          <img src={article.image_url} alt="" loading="lazy" />
          <span className={styles.newsCardCat} style={{ background: meta?.color || '#E63946' }}>
            {article.category}
          </span>
        </div>
      )}
      <div className={styles.newsCardBody}>
        <p className={styles.newsCardTitle}>{article.title}</p>
        <div className={styles.newsCardMeta}>
          <span className={styles.newsCardSource}>{article.source_name}</span>
          <span className={styles.newsCardTime}>{timeAgo(article.published_at)}</span>
        </div>
        {article.summary && (
          <p className={styles.newsCardSummary}>{article.summary}</p>
        )}
      </div>
    </a>
  );
}

function EventCard({ article }: { article: Article }) {
  const isFree = article.category === 'Free Things';
  return (
    <a href={article.source_url} target="_blank" rel="noopener noreferrer" className={styles.eventCard}>
      <div className={styles.eventCardTop}>
        <span className={`${styles.eventBadge} ${isFree ? styles.eventBadgeFree : styles.eventBadgePaid}`}>
          {isFree ? '✦ FREE' : '🎟 EVENT'}
        </span>
        <span className={styles.eventTime}>{timeAgo(article.published_at)}</span>
      </div>
      <h3 className={styles.eventTitle}>{article.title}</h3>
      {article.summary && <p className={styles.eventSummary}>{article.summary}</p>}
      <div className={styles.eventSource}>{article.source_name} →</div>
    </a>
  );
}

function WeeklyCard({ article, index }: { article: Article; index: number }) {
  const meta = TOPIC_META[article.category];
  const emojis = ['🎭', '🍻', '🌆'];
  return (
    <a href={article.source_url} target="_blank" rel="noopener noreferrer"
      className={styles.weeklyCard}
      style={{ animationDelay: `${index * 0.12}s` }}
    >
      {article.image_url && (
        <div className={styles.weeklyImg}>
          <img src={article.image_url} alt="" loading="lazy" />
          <div className={styles.weeklyImgOverlay} />
        </div>
      )}
      <div className={styles.weeklyBody}>
        <span className={styles.weeklyCat} style={{ color: meta?.color || '#E63946' }}>
          {emojis[index] || '📍'} {article.category}
        </span>
        <h3 className={styles.weeklyTitle}>{article.title}</h3>
        {article.summary && <p className={styles.weeklySummary}>{article.summary}</p>}
      </div>
    </a>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function Home() {
  const [newsArticles, setNewsArticles] = useState<Article[]>([]);
  const [eventArticles, setEventArticles] = useState<Article[]>([]);
  const [weeklyArticles, setWeeklyArticles] = useState<Article[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const heroSection = useInView(0.1);
  const newsSection = useInView(0.1);
  const eventsSection = useInView(0.1);
  const weeklySection = useInView(0.1);
  const signupSection = useInView(0.2);

  useEffect(() => {
    // Fetch news feed
    fetch('/api/news?limit=6&language=EN')
      .then(r => r.json())
      .then(data => { setNewsArticles(data.articles || []); setNewsLoading(false); })
      .catch(() => setNewsLoading(false));

    // Fetch events (Events + Free Things categories)
    fetch('/api/news?limit=8&language=EN&category=Events')
      .then(r => r.json())
      .then(data => {
        setEventArticles(data.articles || []);
        setEventsLoading(false);
      })
      .catch(() => setEventsLoading(false));

    // Fetch weekly highlights (diverse categories)
    fetch('/api/news?limit=3&language=EN')
      .then(r => r.json())
      .then(data => { setWeeklyArticles((data.articles || []).slice(0, 3)); setWeeklyLoading(false); })
      .catch(() => setWeeklyLoading(false));
  }, []);

  // Fetch free events separately and merge
  useEffect(() => {
    if (!eventsLoading) return; // don't double-fetch
    fetch('/api/news?limit=6&language=EN&category=Free Things')
      .then(r => r.json())
      .then(data => {
        setEventArticles(prev => {
          const ids = new Set(prev.map(a => a.id));
          const merged = [...prev, ...(data.articles || []).filter((a: Article) => !ids.has(a.id))];
          return merged.slice(0, 8);
        });
      })
      .catch(() => {});
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch('/api/mailing-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubscribed(true);
    } catch {}
  };

  const freeEvents = eventArticles.filter(a => a.category === 'Free Things');
  const paidEvents = eventArticles.filter(a => a.category === 'Events');

  return (
    <main className={styles.page}>

      {/* ═══ HERO ═══ */}
      <section className={styles.hero} ref={heroSection.ref as any}>
        {/* Animated blobs */}
        <div className={styles.blobWrap} aria-hidden="true">
          <div className={styles.blob1} />
          <div className={styles.blob2} />
          <div className={styles.blob3} />
        </div>

        {/* Grid lines */}
        <div className={styles.heroGrid} aria-hidden="true" />

        <div className={`${styles.heroContent} ${heroSection.inView ? styles.inView : ''}`}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            <span>AI-Powered City Guide</span>
          </div>

          <h1 className={styles.heroTitle}>
            your barcelona,<br />
            <span className={styles.heroAccent}>curated by ai.</span>
          </h1>

          <p className={styles.heroSub}>
            The essential guide for international students &amp; residents.<br />
            Live news, events, and city intel — updated daily.
          </p>

          <div className={styles.heroCtas}>
            <a href="#news" className={styles.ctaPrimary}>
              explore the city
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <Link href="/map" className={styles.ctaSecondary}>
              beer map →
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div className={styles.scrollCue} aria-hidden="true">
          <div className={styles.scrollLine} />
          <span>scroll</span>
        </div>
      </section>

      {/* ═══ NEWS TICKER STRIP ═══ */}
      {newsArticles.length > 0 && (
        <div className={styles.tickerStrip} aria-label="Breaking news ticker">
          <span className={styles.tickerLabel}>LIVE</span>
          <div className={styles.tickerTrack}>
            <div className={styles.tickerInner}>
              {[...newsArticles, ...newsArticles].map((a, i) => (
                <a key={`${a.id}-${i}`} href={a.source_url} target="_blank" rel="noopener noreferrer" className={styles.tickerItem}>
                  <span className={styles.tickerDot} style={{ background: TOPIC_META[a.category]?.color || '#E63946' }} />
                  {a.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ LIVE NEWS FEED ═══ */}
      <section id="news" className={styles.section} ref={newsSection.ref as any}>
        <div className={`${styles.sectionInner} ${newsSection.inView ? styles.inView : ''}`}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionLabel}>[ live feed ]</div>
              <h2 className={styles.sectionTitle}>Barcelona News</h2>
              <p className={styles.sectionSub}>AI-translated and rewritten in English from 30+ local sources</p>
            </div>
            <Link href="/news" className={styles.viewAll}>All news →</Link>
          </div>

          {newsLoading ? (
            <div className={styles.newsGrid}>
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className={`${styles.newsCard} ${styles.skeleton}`} style={{ height: 280 }} />
              ))}
            </div>
          ) : newsArticles.length > 0 ? (
            <div className={styles.newsGrid}>
              {newsArticles.map(a => <NewsCard key={a.id} article={a} />)}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span>🔄</span>
              <p>News is being updated — check back shortly.</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══ EVENTS THIS WEEK ═══ */}
      <section id="events" className={`${styles.section} ${styles.sectionAlt}`} ref={eventsSection.ref as any}>
        <div className={`${styles.sectionInner} ${eventsSection.inView ? styles.inView : ''}`}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionLabel}>[ this week ]</div>
              <h2 className={styles.sectionTitle}>Events in Barcelona</h2>
              <p className={styles.sectionSub}>Free and paid events curated for international residents</p>
            </div>
            <Link href="/news" className={styles.viewAll}>All events →</Link>
          </div>

          {eventsLoading ? (
            <div className={styles.eventsGrid}>
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className={`${styles.eventCard} ${styles.skeleton}`} style={{ height: 200 }} />
              ))}
            </div>
          ) : eventArticles.length > 0 ? (
            <div className={styles.eventsColumns}>
              <div className={styles.eventsCol}>
                <div className={styles.eventsColLabel}>
                  <span className={styles.freeBadge}>✦ FREE</span> Free Events
                </div>
                {freeEvents.length > 0 ? (
                  freeEvents.slice(0, 4).map(a => <EventCard key={a.id} article={a} />)
                ) : (
                  <div className={styles.eventsColEmpty}>No free events found right now. Check back soon!</div>
                )}
              </div>
              <div className={styles.eventsCol}>
                <div className={styles.eventsColLabel}>
                  <span className={styles.paidBadge}>🎟 TICKETED</span> Ticketed Events
                </div>
                {paidEvents.length > 0 ? (
                  paidEvents.slice(0, 4).map(a => <EventCard key={a.id} article={a} />)
                ) : (
                  eventArticles.slice(0, 4).map(a => <EventCard key={a.id} article={a} />)
                )}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span>📅</span>
              <p>Events loading — the AI is scanning Barcelona right now.</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══ THIS WEEK IN BARCELONA ═══ */}
      <section id="weekly" className={styles.section} ref={weeklySection.ref as any}>
        <div className={`${styles.sectionInner} ${weeklySection.inView ? styles.inView : ''}`}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionLabel}>[ weekly picks ]</div>
              <h2 className={styles.sectionTitle}>This Week in Barcelona</h2>
              <p className={styles.sectionSub}>Our AI's top picks for what's happening this week</p>
            </div>
          </div>

          {weeklyLoading ? (
            <div className={styles.weeklyGrid}>
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className={`${styles.weeklyCard} ${styles.skeleton}`} style={{ height: 360 }} />
              ))}
            </div>
          ) : weeklyArticles.length > 0 ? (
            <div className={styles.weeklyGrid}>
              {weeklyArticles.map((a, i) => <WeeklyCard key={a.id} article={a} index={i} />)}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span>🌆</span>
              <p>Weekly highlights loading soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══ EMAIL SIGNUP ═══ */}
      <section id="signup" className={`${styles.section} ${styles.signupSection}`} ref={signupSection.ref as any}>
        <div className={`${styles.signupInner} ${signupSection.inView ? styles.inView : ''}`}>
          <div className={styles.signupIcon}>📬</div>
          <div className={styles.sectionLabel} style={{ justifyContent: 'center', display: 'flex', marginBottom: '16px' }}>
            [ weekly digest ]
          </div>
          <h2 className={styles.signupTitle}>Stay in the Loop</h2>
          <p className={styles.signupSub}>
            Every week: what's on in Barcelona, free events, local news, and city tips — written for international residents.
          </p>

          {subscribed ? (
            <div className={styles.signupSuccess}>
              <span>✓</span> You&apos;re in! Check your inbox for the first edition.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className={styles.signupForm} id="email-signup-form">
              <input
                id="signup-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={styles.signupInput}
              />
              <button type="submit" className={styles.signupBtn}>
                subscribe →
              </button>
            </form>
          )}

          <p className={styles.signupNote}>No spam. Unsubscribe anytime. 100% Barcelona.</p>
        </div>
      </section>

    </main>
  );
}
