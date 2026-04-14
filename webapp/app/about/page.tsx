"use client";
import { useLanguage } from '../../components/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <section style={{ 
        background: 'var(--night-blue)', 
        color: '#fff', 
        padding: '120px 24px 80px', 
        clipPath: 'polygon(0 0, 100% 0, 100% 90%, 0 100%)', 
        marginBottom: '40px' 
      }}>
        <div className="container">
          <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: '900', textTransform: 'uppercase', margin: 0, fontFamily: 'Syne, sans-serif' }}>
            {t('nav.about') || 'About Us'}
          </h1>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: '60px', display: 'flex', flexWrap: 'wrap', gap: '60px' }}>
        <div style={{ flex: '1 1 400px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '24px', color: 'var(--heading-color)', fontFamily: 'Syne, sans-serif', letterSpacing: '-1px' }}>
            Who We Are
          </h2>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-primary)', lineHeight: 1.8, opacity: 0.9 }}>
            GoBarcelona is the definitive modern hub for international residents. We believe that navigating a new city shouldn't be a fragmented experience. Our platform automatically aggregates the best local events, news from across the region, and provides dead-simple practical guides.
          </p>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-primary)', lineHeight: 1.8, opacity: 0.9, marginTop: '16px' }}>
            Built by locals and internationals, we provide unbiased, up-to-date resources so you can spend less time searching and more time experiencing Barcelona.
          </p>
        </div>

        <div style={{ flex: '1 1 400px', padding: '40px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '24px', color: 'var(--heading-color)', fontFamily: 'Syne, sans-serif', letterSpacing: '-1px' }}>
            {t('home.contact.title')}
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', opacity: 0.8, fontWeight: 500, marginBottom: '24px' }}>
            {t('home.contact.desc')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="text" placeholder={t('home.contact.name')} 
              style={{ width: '100%', padding: '16px', background: 'var(--bg-primary)', border: 'none', borderBottom: '3px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, outline: 'none' }} 
            />
            <input type="email" placeholder={t('home.contact.email')} 
              style={{ width: '100%', padding: '16px', background: 'var(--bg-primary)', border: 'none', borderBottom: '3px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, outline: 'none' }} 
            />
            <textarea placeholder={t('home.contact.msg')} rows={5} 
              style={{ width: '100%', padding: '16px', background: 'var(--bg-primary)', border: 'none', borderBottom: '3px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, outline: 'none', resize: 'vertical' }}
            ></textarea>
            <button className="btn-primary" style={{ alignSelf: 'flex-start', borderRadius: 0, padding: '16px 40px', fontWeight: 900, textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '1px' }}>
              {t('home.contact.btn')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
