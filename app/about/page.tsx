"use client";
import React from 'react';
import Link from 'next/link';
import styles from './about.module.css';

export default function AboutPage() {
  return (
    <main className={styles.main}>
      {/* ─── HERO ─── */}
      <section className={styles.hero}>
        <h1>Why we built this.</h1>
        <p className={styles.heroSub}>A beer map for the people who actually live here.</p>
      </section>

      {/* ─── STORY ─── */}
      <section className={styles.story}>
        <div className="container">
          <div className={styles.storyContent}>
            <p>I moved to Barcelona as an international student. Like most people who arrive here, I was immediately overwhelmed — in the best possible way. The city has everything: incredible bars, terraces that stay warm until midnight, sports nights, cheap beer hidden down side streets, rooftops you&apos;d never find on Google.</p>

            <p>But finding them was chaos. Every platform I tried was either outdated, full of sponsored content, or built for tourists who&apos;d only be here for a week. I needed something honest. Something built for people who actually live here — whether you&apos;ve been here three months or three years.</p>

            <p>So I started mapping it myself. First a spreadsheet, then a proper database. I walked the city with my phone and started verifying prices.</p>
          </div>

          <blockquote className={styles.pullQuote}>
            &ldquo;A tap beer for €1.80 in El Raval. €5.50 in the Gothic Quarter. The difference matters.&rdquo;
          </blockquote>

          <div className={styles.storyContent}>
            <p>GoBarcelona started as a personal project. Now it&apos;s a platform — and the goal has never changed: give internationals, students, expats and locals the honest, unbiased information they need to enjoy this city to the fullest. No ads. No sponsored rankings. Just real data, built by people who love Barcelona.</p>
          </div>

          {/* ─── Values ─── */}
          <div className={styles.values}>
            <div className={styles.value}><span>No ads</span></div>
            <div className={styles.valueDivider} />
            <div className={styles.value}><span>No sponsored rankings</span></div>
            <div className={styles.valueDivider} />
            <div className={styles.value}><span>Just real data</span></div>
          </div>
        </div>
      </section>

      {/* ─── WHAT WE'RE BUILDING ─── */}
      <section className={styles.building}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '48px' }}>What we&apos;re building</h2>
          <div className={styles.buildGrid}>
            <div className={styles.buildCard}>
              <div className={styles.buildIcon}>🗺️</div>
              <h3>The Beer Map</h3>
              <p>Every bar in Barcelona with verified tap prices, terraces, sports and more.</p>
            </div>
            <div className={styles.buildCard}>
              <div className={styles.buildIcon}>👥</div>
              <h3>The Community</h3>
              <p>Locals verifying prices, reporting openings, keeping the map honest.</p>
            </div>
            <div className={styles.buildCard}>
              <div className={styles.buildIcon}>📬</div>
              <h3>The Weekly Update</h3>
              <p>Every Sunday: cheap beers, new bars, what&apos;s on this week.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className={styles.ctaSection}>
        <Link href="/map" className={styles.bigCta}>Explore the Beer Map →</Link>
        <Link href="/#newsletter" className={styles.smallCta}>Get the weekly update →</Link>
      </section>
    </main>
  );
}
