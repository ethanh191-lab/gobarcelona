"use client";
import React, { useState, useEffect, useMemo } from 'react';
import styles from './events.module.css';
import { useLanguage } from '@/components/LanguageContext';

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  venue: string;
  image: string;
  link: string;
  source: string;
};

export default function EventsPage() {
  const { lang, t } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Tonight', 'This Weekend', 'Music', 'Art', 'Festival', 'Free', 'Opening'];

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const tonight = new Date(now);
    tonight.setHours(23, 59, 59, 999);
    
    const friday = new Date(now);
    friday.setDate(now.getDate() + (5 - now.getDay()));
    friday.setHours(0, 0, 0, 0);
    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);
    sunday.setHours(23, 59, 59, 999);

    return events.filter(ev => {
      const evDate = new Date(ev.date);
      const searchLower = searchQuery.toLowerCase();
      if (searchQuery && !ev.title.toLowerCase().includes(searchLower) && !ev.description.toLowerCase().includes(searchLower)) return false;
      
      if (activeCategory === 'Tonight') {
        return evDate <= tonight && evDate >= now;
      }
      if (activeCategory === 'This Weekend') {
        return evDate >= friday && evDate <= sunday;
      }
      if (activeCategory !== 'All' && ev.category !== activeCategory) return false;
      return true;
    });
  }, [events, activeCategory, searchQuery]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(lang === 'ES' ? 'es-ES' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.appHeader}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '8px', fontWeight: 900, textTransform: 'uppercase' }}>BCN. Right Now.</h1>
          <p style={{ opacity: 0.6, fontSize: '18px', marginBottom: '32px' }}>Curated events for international residents.</p>
          
          <div className={styles.searchBar} style={{ maxWidth: '600px', margin: '0 auto' }}>
            <input 
              type="text" 
              placeholder={t('events.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
      </header>

      {/* Horizontal Category Scroll */}
      <div className={styles.categoryScrollOuter}>
        <div className={`${styles.categoryScrollInner} no-scrollbar`}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`${styles.chip} ${activeCategory === cat ? styles.chipActive : ''}`}
            >
              {cat === 'All' ? (lang === 'ES' ? 'Todos' : 'All') : 
               cat === 'Tonight' ? (lang === 'ES' ? 'Esta noche' : 'Tonight') :
               cat === 'This Weekend' ? (lang === 'ES' ? 'Este finde' : 'This Weekend') :
               t(`events.category.${cat}`)}
            </button>
          ))}
        </div>
      </div>

      <main className="container" style={{ padding: '24px var(--app-margin) 100px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {[1,2,3,4].map(i => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonImg} />
                <div className={styles.skeletonContent}>
                   <div className={styles.skeletonLine} style={{ width: '80%', height: '24px' }} />
                   <div className={styles.skeletonLine} style={{ width: '100%' }} />
                   <div className={styles.skeletonLine} style={{ width: '100%' }} />
                   <div className={styles.skeletonLine} style={{ width: '40%', marginTop: 'auto' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className={styles.eventFeed}>
            {filteredEvents.map((ev, i) => (
              <div key={ev.id} className={`app-card animate-slide-up`} style={{ animationDelay: `${i * 0.05}s` }}>
                <div className={styles.imageBox}>
                  <img src={ev.image} alt={ev.title} className={styles.eventImg} />
                  <div className={styles.priceBadge}>{t(`events.category.${ev.category}`)}</div>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h3 style={{ textTransform: 'uppercase', fontWeight: 900 }}>{ev.title}</h3>
                  </div>
                  <p className={styles.cardDesc}>{ev.description}</p>
                  <div className={styles.cardMeta}>
                    <div className={styles.metaItem}>
                      <span className="label-caps" style={{ opacity: 1, color: 'var(--primary-red)', background: 'transparent', padding: 0 }}>{formatDate(ev.date)}</span>
                      <span style={{ fontSize: '13px', opacity: 0.6 }}> • {ev.venue}</span>
                    </div>
                    <a href={ev.link} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ height: '44px', fontSize: '14px', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {t('events.tickets')}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <span>🏜️</span>
            <p>No events found right now. Check back soon.</p>
            <button className="btn-secondary" style={{ marginTop: '20px' }} onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}>Show all events</button>
          </div>
        )}
      </main>
    </div>
  );
}
