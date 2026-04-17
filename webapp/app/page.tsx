"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { useLanguage } from '../components/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  const [topBars, setTopBars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bars/cheapest')
      .then(r => r.json())
      .then(data => {
        setTopBars(data.bars || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className={styles.main}>
      {/* ─── Hero Section ─── */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.logoWordmark}>
              <span className={styles.logoGo}>go</span><span className={styles.logoBarcelona}>barcelona</span>
            </div>
            <h1 className={styles.heroTitle}>Barcelona's cheapest beers. <span className={styles.highlight}>Right now.</span></h1>
            <p className={styles.heroSubline}>
              The only real-time map of tap beer prices across the city. Free, always.
            </p>
            
            <div className={styles.ctaGroup}>
              <Link href="/map" className={styles.primaryCta}>
                Open the Beer Map →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Strip ─── */}
      <section className={styles.featuresStrip}>
        <div className="container">
          <div className={styles.featuresGrid}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>📍</div>
              <div className={styles.featureText}>
                <h3>1,000+ bars mapped</h3>
                <p>Every corner of the city covered.</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✅</div>
              <div className={styles.featureText}>
                <h3>Prices verified by locals</h3>
                <p>Updated in real-time by the community.</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>🚶</div>
              <div className={styles.featureText}>
                <h3>Walking distance from you</h3>
                <p>Find the cheapest pint near you.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Cheapest Bars Teaser ─── */}
      <section className={styles.teaserSection}>
        <div className="container">
          <header className={styles.teaserHeader}>
            <h2>This Week's Cheapest</h2>
            <p>Verified tap prices across BCN</p>
          </header>

          <div className={styles.teaserGrid}>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className={`${styles.teaserCard} ${styles.skeleton}`} style={{ height: '140px' }} />
              ))
            ) : topBars.length > 0 ? (
              topBars.map((bar, i) => (
                <div key={i} className={styles.teaserCard}>
                  <div className={styles.teaserCardInfo}>
                    <h3>{bar.name}</h3>
                    <p>{bar.neighbourhood}</p>
                    <div className={styles.statusRow}>
                      <span className={styles.statusDot} style={{ background: bar.status === 'open' ? '#22c55e' : '#666' }} />
                      <span>{bar.status === 'open' ? 'Open' : 'Closed'}</span>
                    </div>
                  </div>
                  <div className={styles.teaserCardPrice}>
                    €{parseFloat(bar.price_per_500ml || 0).toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noData}>No data available yet. Be the first to report!</div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link href="/map" className={styles.secondaryCta}>
              View all 1,000+ bars
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Email Signup ─── */}
      <section className={styles.newsletterSection}>
        <div className="container">
          <div className={styles.newsletterBox}>
            <h2>Get the weekly Barcelona beer update</h2>
            <p>The best new openings, price drops, and secret happy hours.</p>
            <form className={styles.signupForm} onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" required />
              <button type="submit">Join the community</button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
