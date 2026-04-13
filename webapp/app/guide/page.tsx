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
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: '64px' }}>
      <header className="container" style={{ padding: '40px var(--app-margin) 16px' }}>
        <span className="label-caps" style={{ marginBottom: '8px', display: 'block' }}>Practical Intelligence</span>
        <h1 style={{ marginBottom: '12px' }}>{t('nav.guide')}</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px' }}>{t('guide.desc')}</p>
      </header>

      <main className="container" style={{ padding: '24px var(--app-margin) 100px' }}>
        {/* iOS Settings style list on mobile, card grid on desktop */}

        {/* Mobile: settings list */}
        <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
          {guides.map((guide, i) => (
            <Link 
              href={guide.slug} 
              key={guide.title}
              className="animate-slide-up"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                padding: '16px', 
                textDecoration: 'none',
                borderBottom: i === guides.length - 1 ? 'none' : '1px solid var(--glass-border)',
                animationDelay: `${i * 0.03}s`
              }}
            >
              <div style={{ width: '40px', height: '40px', background: `${guide.color}20`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                {guide.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{guide.title}</h3>
              </div>
              <div style={{ opacity: 0.3, fontSize: '20px' }}>›</div>
            </Link>
          ))}
        </div>

        {/* Desktop: card grid */}
        <div className="desktop-only" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {guides.map((guide, i) => (
            <Link 
              href={guide.slug} 
              key={guide.title + '-desktop'}
              className="app-card animate-slide-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div style={{ padding: '32px' }}>
                <div style={{ width: '56px', height: '56px', background: `${guide.color}20`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px' }}>
                  {guide.icon}
                </div>
                <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{guide.title}</h3>
                {guide.desc && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{guide.desc}</p>}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
