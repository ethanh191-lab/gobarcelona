"use client";
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../../components/LanguageContext';

export default function GuidePage() {
  const { t } = useLanguage();
  
  const guides = [
    { title: t('guide.nie.title'), icon: '🆔', slug: '/guide/nie', color: '#E63946', desc: t('guide.nie.desc') },
    { title: t('guide.empadronamiento.title'), icon: '🏠', slug: '/guide/empadronamiento', color: '#3b82f6', desc: t('guide.empadronamiento.desc') },
    { title: t('guide.house.title'), icon: '🔑', slug: '/guide/housing', color: '#f59e0b', desc: t('guide.house.desc') },
    { title: t('guide.trans.title'), icon: '🚇', slug: '/guide/transport', color: '#22c55e', desc: t('guide.trans.desc') },
    { title: t('guide.sim.title'), icon: '📱', slug: '/guide/sim', color: '#8b5cf6', desc: t('guide.sim.desc') },
    { title: t('guide.insurance.title'), icon: '🛡️', slug: '/guide/insurance', color: '#ec4899', desc: t('guide.insurance.desc') },
    { title: t('guide.bank.title'), icon: '🏦', slug: '/guide/banking', color: '#eab308', desc: t('guide.bank.desc') },
    { title: t('guide.health.title'), icon: '🏥', slug: '/guide/healthcare', color: '#06b6d4', desc: '' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', paddingTop: '96px' }}>
      <header className="container" style={{ padding: '40px var(--app-margin) 16px' }}>
        <span className="label-caps" style={{ color: 'var(--amber)', marginBottom: '8px', display: 'block', fontWeight: 700 }}>PRACTICAL INTELLIGENCE</span>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '48px', color: 'white', marginBottom: '12px' }}>{t('nav.guide')}</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '18px' }}>{t('guide.desc')}</p>
      </header>

      <main className="container" style={{ padding: '24px var(--app-margin) 100px' }}>
        {/* Desktop & Mobile unified grid layout for premium feel */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {guides.map((guide, i) => (
            <Link 
              href={guide.slug} 
              key={guide.title}
              className="animate-slide-up"
              style={{ 
                animationDelay: `${i * 0.05}s`,
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '32px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                display: 'block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'var(--amber)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ width: '56px', height: '56px', background: `${guide.color}30`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px', border: `1px solid ${guide.color}50` }}>
                {guide.icon}
              </div>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '24px', color: 'white', marginBottom: '8px' }}>{guide.title}</h3>
              {guide.desc && <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{guide.desc}</p>}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
