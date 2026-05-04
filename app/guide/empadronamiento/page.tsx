"use client";
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../components/LanguageContext';

export default function GuidePage() {
  const { t } = useLanguage();
  
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px' }}>
      <Link href="/guide" style={{ color: 'var(--amber)', fontSize: '15px', marginBottom: '32px', display: 'inline-block', transition: 'color 0.2s', textDecoration: 'none', fontWeight: 600 }}>
        ← {t('guide.back')}
      </Link>
      
      <div className="animate-fade-in">
        <h1 style={{ fontSize: '64px', marginBottom: '16px', fontFamily: "'Barlow Condensed', sans-serif", color: 'white', lineHeight: 1.1 }}>
          {t('guide.empadronamiento.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '64px', lineHeight: '1.7', fontSize: '18px' }}>
          {t('guide.empadronamiento.desc')}
        </p>

        <div style={{ marginLeft: '12px', paddingLeft: '32px', borderLeft: '3px solid var(--ocean)', display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          <div style={{ position: 'relative', padding: '32px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px' }}>
            <div style={{ position: 'absolute', left: '-46px', top: '32px', width: '26px', height: '26px', borderRadius: '50%', background: 'var(--ocean)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>1</div>
            <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '12px', fontFamily: "'Barlow Condensed', sans-serif" }}>{t('guide.empadronamiento.step1')}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '16px', marginBottom: 0 }}>{t('guide.empadronamiento.step1_desc')}</p>
          </div>

          <div style={{ position: 'relative', padding: '32px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px' }}>
            <div style={{ position: 'absolute', left: '-46px', top: '32px', width: '26px', height: '26px', borderRadius: '50%', background: 'var(--ocean)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>2</div>
            <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '12px', fontFamily: "'Barlow Condensed', sans-serif" }}>{t('guide.empadronamiento.step2')}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '16px', marginBottom: 0 }}>{t('guide.empadronamiento.step2_desc')}</p>
          </div>

          <div style={{ position: 'relative', padding: '32px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px' }}>
            <div style={{ position: 'absolute', left: '-46px', top: '32px', width: '26px', height: '26px', borderRadius: '50%', background: 'var(--ocean)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>3</div>
            <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '12px', fontFamily: "'Barlow Condensed', sans-serif" }}>{t('guide.empadronamiento.step3')}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '16px', marginBottom: 0 }}>{t('guide.empadronamiento.step3_desc')}</p>
          </div>

        </div>
        </div>
      </div>
    </div>
  );
}
