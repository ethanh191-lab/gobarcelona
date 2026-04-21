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

// Custom hook to trigger entrance animations
function useInView(options: IntersectionObserverInit = { threshold: 0.2 }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
      }
    }, options);
    
    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.disconnect(); };
  }, [options]);

  return { ref, inView };
}

export default function Home() {
  const [barCount, setBarCount] = useState(0);
  const [topBars, setTopBars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Observers for each section
  const heroRef = useInView({ threshold: 0.1 });
  const statsRef = useInView({ threshold: 0.5 });
  const cheapestRef = useInView({ threshold: 0.3 });
  const beersRef = useInView({ threshold: 0.3 });
  const howRef = useInView({ threshold: 0.3 });
  const nlRef = useInView({ threshold: 0.5 });

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

  const animatedCount = useCountUp(barCount, 1500, statsRef.inView);

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
    <main className={styles.snapContainer}>
      
      {/* ─── HERO ─── */}
      <section className={`${styles.snapSection} ${styles.bgDark}`} ref={heroRef.ref as any}>
        <div className={styles.heroParticles}>
          <div className={styles.blob1} />
          <div className={styles.blob2} />
        </div>
        <div className={`${styles.heroContent} ${styles.reveal} ${heroRef.inView ? styles.inView : ''}`}>
          <span className={styles.accentTag}>[ BCN 2026 ]</span>
          <h1 className={styles.heroTitle}>BARCELONA&apos;S<br/>BEER MAP.</h1>
          <p className={styles.heroSub}>EVERY BAR. EVERY PRICE. RIGHT NOW.</p>
          <Link href="/map" className={styles.heroCta}>OPEN THE MAP</Link>
        </div>
        <div className={styles.scrollIndicator}>
          <span className={styles.scrollText}>Scroll</span>
          <div className={styles.scrollLine} />
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className={`${styles.snapSection} ${styles.bgLight}`} ref={statsRef.ref as any}>
        <div className={`${styles.statsInner} ${styles.reveal} ${statsRef.inView ? styles.inView : ''}`}>
          <div className={`${styles.stat} ${styles.reveal} ${styles.delay1} ${statsRef.inView ? styles.inView : ''}`}>
            <span className={styles.statNum}>{animatedCount}</span>
            <span className={styles.statLabel}>BARS MAPPED</span>
          </div>
          <div className={`${styles.stat} ${styles.reveal} ${styles.delay2} ${statsRef.inView ? styles.inView : ''}`}>
            <span className={styles.statNum}>100%</span>
            <span className={styles.statLabel}>VERIFIED PRICES</span>
          </div>
          <div className={`${styles.stat} ${styles.reveal} ${styles.delay3} ${statsRef.inView ? styles.inView : ''}`}>
            <span className={styles.statNum}>LIVE</span>
            <span className={styles.statLabel}>WALKING DISTANCES</span>
          </div>
        </div>
      </section>

      {/* ─── CHEAPEST RIGHT NOW ─── */}
      <section className={`${styles.snapSection} ${styles.bgDark}`} ref={cheapestRef.ref as any}>
        <span className={`${styles.accentTag} ${styles.reveal} ${cheapestRef.inView ? styles.inView : ''}`}>[ LIVE DATA ]</span>
        <h2 className={`${styles.sectionTitle} ${styles.reveal} ${styles.delay1} ${cheapestRef.inView ? styles.inView : ''}`}>CHEAPEST RIGHT NOW</h2>
        
        <div className={`${styles.cheapestList} ${styles.reveal} ${styles.delay2} ${cheapestRef.inView ? styles.inView : ''}`}>
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className={`${styles.cheapestCard} ${styles.skeleton}`} style={{ height: 80 }} />
            ))
          ) : topBars.length > 0 ? (
            topBars.map((bar, i) => (
              <div key={i} className={styles.cheapestCard}>
                <span className={styles.rank}>#{i + 1}</span>
                <div className={styles.cheapestInfo}>
                  <strong>{bar.name}</strong>
                  <span className={styles.nbBadge}>{bar.neighbourhood}</span>
                </div>
                <div className={styles.cheapestPrice}>
                  €{parseFloat(bar.price_per_500ml || 0).toFixed(2)}
                </div>
              </div>
            ))
          ) : null}
        </div>
      </section>

      {/* ─── BEER TYPES ─── */}
      <section className={`${styles.snapSection} ${styles.bgLight}`} ref={beersRef.ref as any}>
        <span className={`${styles.accentTag} ${styles.reveal} ${beersRef.inView ? styles.inView : ''}`}>[ TAP LIST ]</span>
        <h2 className={`${styles.sectionTitle} ${styles.reveal} ${styles.delay1} ${beersRef.inView ? styles.inView : ''}`}>POPULAR ON TAP</h2>
        
        <div className={`${styles.beerGrid} ${styles.reveal} ${styles.delay2} ${beersRef.inView ? styles.inView : ''}`}>
          {[
            { name: 'ESTRELLA DAMM', color: '#E63946' },
            { name: 'MORITZ', color: '#F4A261' },
            { name: 'VOLL-DAMM', color: '#2A9D8F' },
            { name: 'ESTRELLA GALICIA', color: '#E63946' },
            { name: 'HEINEKEN', color: '#22C55E' },
            { name: 'MAHOU', color: '#E63946' },
            { name: 'SAN MIGUEL', color: '#E9C46A' },
          ].map((beer, i) => (
            <Link href="/map" key={i} className={styles.beerCard} style={{ '--hover-color': beer.color } as any}>
              <span className={styles.beerName}>{beer.name}</span>
              <span className={styles.beerArrow}>→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className={`${styles.snapSection} ${styles.bgDark}`} ref={howRef.ref as any}>
        <span className={`${styles.accentTag} ${styles.reveal} ${howRef.inView ? styles.inView : ''}`}>[ SYSTEM ]</span>
        <h2 className={`${styles.sectionTitle} ${styles.reveal} ${styles.delay1} ${howRef.inView ? styles.inView : ''}`}>HOW IT WORKS</h2>
        
        <div className={`${styles.howGrid} ${styles.reveal} ${styles.delay2} ${howRef.inView ? styles.inView : ''}`}>
          <div className={styles.howStep}>
            <div className={styles.howIcon}>📍</div>
            <div className={styles.howNum}>1</div>
            <h3>FIND YOUR BAR</h3>
            <p>Use the map to discover bars near you, filtered by price, terrace, sports and more.</p>
          </div>
          <div className={styles.howStep}>
            <div className={styles.howIcon}>💰</div>
            <div className={styles.howNum}>2</div>
            <h3>CHECK THE PRICE</h3>
            <p>See verified tap beer prices crowdsourced by locals and verified by the community.</p>
          </div>
          <div className={styles.howStep}>
            <div className={styles.howIcon}>✓</div>
            <div className={styles.howNum}>3</div>
            <h3>VERIFY & EARN</h3>
            <p>Submit prices you find and help keep the map accurate for everyone.</p>
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER ─── */}
      <section className={`${styles.snapSection} ${styles.bgLight}`} ref={nlRef.ref as any}>
        <span className={`${styles.accentTag} ${styles.reveal} ${nlRef.inView ? styles.inView : ''}`}>[ JOIN ]</span>
        <h2 className={`${styles.sectionTitle} ${styles.reveal} ${styles.delay1} ${nlRef.inView ? styles.inView : ''}`}>THE WEEKLY BEER UPDATE</h2>
        
        <div className={`${styles.newsletterInner} ${styles.reveal} ${styles.delay2} ${nlRef.inView ? styles.inView : ''}`}>
          <p className={styles.nlSub}>EVERY WEEK: THE CHEAPEST BEERS, NEW OPENINGS, AND WHAT&apos;S ON IN BCN.</p>
          {subscribed ? (
            <p className={styles.nlSuccess}>✓ YOU&apos;RE IN! CHECK YOUR INBOX.</p>
          ) : (
            <form onSubmit={handleSubscribe} className={styles.nlForm}>
              <input
                type="email"
                placeholder="ENTER YOUR EMAIL"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button type="submit">SUBSCRIBE</button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
