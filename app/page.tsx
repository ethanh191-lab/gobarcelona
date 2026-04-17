"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

function useCountUp(target: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || target <= 0) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

export default function Home() {
  const [barCount, setBarCount] = useState(0);
  const [topBars, setTopBars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/bars/cheapest?limit=5')
      .then(r => r.json())
      .then(data => {
        setTopBars(data.bars || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('/api/places')
      .then(r => r.json())
      .then(data => setBarCount(data.count || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const animatedCount = useCountUp(barCount, 1500, statsVisible);

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

  return (
    <main className={styles.main}>
      {/* ─── HERO ─── */}
      <section className={styles.hero}>
        <div className={styles.heroParticles}>
          <div className={styles.blob1} />
          <div className={styles.blob2} />
          <div className={styles.blob3} />
        </div>
        <div className={styles.heroInner}>
          <div className={styles.logoMark}>
            <span className={styles.logoGo}>go</span><span className={styles.logoBcn}>barcelona</span>
          </div>
          <h1 className={styles.heroTitle}>Barcelona&apos;s beer map.</h1>
          <p className={styles.heroSub}>Every bar. Every price. Right now.</p>
          <Link href="/map" className={styles.heroCta}>Open the map →</Link>
          <p className={styles.heroLive}>
            Currently tracking <strong>{barCount}</strong> bars across Barcelona
          </p>
        </div>
        <div className={styles.scrollArrow}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12l7 7 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className={styles.statsBar} ref={statsRef}>
        <div className={styles.statsInner}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{animatedCount}</span>
            <span className={styles.statLabel}>bars mapped</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>✓</span>
            <span className={styles.statLabel}>Prices verified by locals</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>🚶</span>
            <span className={styles.statLabel}>Walking distance from you</span>
          </div>
        </div>
      </section>

      {/* ─── CHEAPEST RIGHT NOW ─── */}
      <section className={styles.cheapest}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.liveDot} />
            <h2>CHEAPEST RIGHT NOW</h2>
          </div>
          <div className={styles.cheapestList}>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className={`${styles.cheapestCard} ${styles.skeleton}`} />
              ))
            ) : topBars.length > 0 ? (
              topBars.map((bar, i) => (
                <div key={i} className={styles.cheapestCard}>
                  <span className={styles.rank}>#{i + 1}</span>
                  <div className={styles.cheapestInfo}>
                    <strong>{bar.name}</strong>
                    <span className={styles.nbBadge}>{bar.neighbourhood}</span>
                  </div>
                  <div className={styles.cheapestRight}>
                    <span className={styles.cheapestPrice}>€{parseFloat(bar.price_per_500ml || 0).toFixed(2)}</span>
                    <span className={styles.openDot} style={{ background: bar.status === 'open' ? '#22c55e' : '#ef4444' }} />
                  </div>
                </div>
              ))
            ) : (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className={styles.cheapestCard}>
                  <span className={styles.rank}>#{i + 1}</span>
                  <div className={styles.cheapestInfo}><strong>—</strong></div>
                  <div className={styles.cheapestRight}>
                    <span className={styles.cheapestPrice}>?</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link href="/map" className={styles.seeAll}>See all bars on the map →</Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className={styles.howSection}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '48px' }}>How it works</h2>
          <div className={styles.howGrid}>
            <div className={styles.howStep}>
              <div className={styles.howIcon}>📍</div>
              <div className={styles.howNum}>1</div>
              <h3>Find your bar</h3>
              <p>Use the map to discover bars near you, filtered by price, terrace, sports and more.</p>
            </div>
            <div className={styles.howStep}>
              <div className={styles.howIcon}>💰</div>
              <div className={styles.howNum}>2</div>
              <h3>Check the price</h3>
              <p>See verified tap beer prices crowdsourced by locals and verified by the community.</p>
            </div>
            <div className={styles.howStep}>
              <div className={styles.howIcon}>✓</div>
              <div className={styles.howNum}>3</div>
              <h3>Verify &amp; earn cred</h3>
              <p>Submit prices you find and help keep the map accurate for everyone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ABOUT TEASER ─── */}
      <section className={styles.aboutTeaser}>
        <div className="container">
          <div className={styles.aboutCard}>
            <p>I moved to Barcelona as an international student. Every platform I tried was either outdated, full of sponsored content, or built for tourists. So I started mapping it myself — and GoBarcelona was born.</p>
            <Link href="/about" className={styles.aboutLink}>Read our story →</Link>
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER ─── */}
      <section className={styles.newsletter}>
        <div className="container">
          <div className={styles.newsletterInner}>
            <h2>THE WEEKLY BEER UPDATE</h2>
            <p className={styles.nlSub}>Every week: the cheapest beers, new openings, and what&apos;s on in BCN.</p>
            {subscribed ? (
              <p className={styles.nlSuccess}>✓ You&apos;re in! Check your inbox.</p>
            ) : (
              <form onSubmit={handleSubscribe} className={styles.nlForm}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button type="submit">Subscribe</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
