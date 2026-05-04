"use client";
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../components/LanguageContext';

export default function HousingGuide() {
  const { t } = useLanguage();
  
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px' }}>
      <Link href="/guide" style={{ color: 'var(--amber)', fontSize: '15px', marginBottom: '32px', display: 'inline-block', transition: 'color 0.2s', textDecoration: 'none', fontWeight: 600 }}>
        ← {t('guide.back')}
      </Link>
      
      <div className="animate-fade-in">
        <h1 style={{ fontSize: '64px', marginBottom: '16px', fontFamily: "'Barlow Condensed', sans-serif", color: 'white', lineHeight: 1.1 }}>
          {t('guide.house.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '64px', lineHeight: '1.7', fontSize: '18px' }}>
          {t('guide.house.desc')}
        </p>

        <div style={{ marginLeft: '12px', paddingLeft: '32px', borderLeft: '2px solid rgba(245, 166, 35, 0.3)', display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          <div style={{ position: 'relative', padding: '32px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px' }}>
            <div style={{ position: 'absolute', left: '-45px', top: '32px', width: '26px', height: '26px', borderRadius: '50%', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000', fontSize: '16px', boxShadow: '0 0 16px rgba(245, 166, 35, 0.4)' }}>1</div>
            <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '12px', fontFamily: "'Barlow Condensed', sans-serif" }}>{t('guide.house.step1')}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '16px', marginBottom: 0 }}>{t('guide.house.step1_desc')}</p>
          </div>

          <div style={{ position: 'relative', padding: '32px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px' }}>
            <div style={{ position: 'absolute', left: '-45px', top: '32px', width: '26px', height: '26px', borderRadius: '50%', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000', fontSize: '16px', boxShadow: '0 0 16px rgba(245, 166, 35, 0.4)' }}>2</div>
            <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '12px', fontFamily: "'Barlow Condensed', sans-serif" }}>{t('guide.house.step2')}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>{t('guide.house.step2_desc')}</p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a href="https://www.idealista.com/" target="_blank" className="btn-secondary" style={{ fontSize: '0.9rem', padding: '8px 20px' }}>{t('guide.house.btn_idealista')} ↗</a>
              <a href="https://badi.com/" target="_blank" className="btn-secondary" style={{ fontSize: '0.9rem', padding: '8px 20px' }}>{t('guide.house.btn_badi')} ↗</a>
            </div>
          </div>

          <div style={{ position: 'relative', padding: '32px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px' }}>
            <div style={{ position: 'absolute', left: '-45px', top: '32px', width: '26px', height: '26px', borderRadius: '50%', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000', fontSize: '16px', boxShadow: '0 0 16px rgba(245, 166, 35, 0.4)' }}>3</div>
            <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '12px', fontFamily: "'Barlow Condensed', sans-serif" }}>{t('guide.house.step3')}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '16px', marginBottom: 0 }}>{t('guide.house.step3_desc')}</p>
          </div>

          <div style={{ position: 'relative', padding: '32px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px' }}>
            <div style={{ position: 'absolute', left: '-45px', top: '32px', width: '26px', height: '26px', borderRadius: '50%', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000', fontSize: '16px', boxShadow: '0 0 16px rgba(245, 166, 35, 0.4)' }}>4</div>
            <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '12px', fontFamily: "'Barlow Condensed', sans-serif" }}>{t('guide.house.step4')}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '16px', marginBottom: 0 }}>{t('guide.house.step4_desc')}</p>
          </div>

        </div>
        </div>
      </div>
    </div>
  );
}
