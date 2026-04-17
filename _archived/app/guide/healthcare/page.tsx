"use client";
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../components/LanguageContext';

export default function GuidePage() {
  const { t } = useLanguage();
  
  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px' }}>
      <Link href="/guide" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px', display: 'inline-block', transition: 'color 0.2s', textDecoration: 'none' }}>
        ← {t('guide.back')}
      </Link>
      
      <div className="animate-fade-in">
        <h1 style={{ fontSize: '3.5rem', marginBottom: '16px', letterSpacing: '-1px', fontFamily: 'Syne, sans-serif' }}>
          {t('guide.health.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '64px', lineHeight: '1.7', fontSize: '1.1rem' }}>
          {t('guide.health.desc')}
        </p>

        <div style={{ marginLeft: '12px', paddingLeft: '32px', borderLeft: '3px solid #06b6d4', display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          <div className="glass-panel" style={{ position: 'relative', padding: '32px' }}>
            <div style={{ position: 'absolute', left: '-46px', top: '32px', width: '26px', height: '26px', borderRadius: '50%', background: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>1</div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--heading-color)', marginBottom: '12px', fontFamily: 'Syne, sans-serif' }}>{t('guide.health.step1')}</h2>
            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: 0 }}>{t('guide.health.step1_desc')}</p>
          </div>

          <div className="glass-panel" style={{ position: 'relative', padding: '32px' }}>
            <div style={{ position: 'absolute', left: '-46px', top: '32px', width: '26px', height: '26px', borderRadius: '50%', background: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>2</div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--heading-color)', marginBottom: '12px', fontFamily: 'Syne, sans-serif' }}>{t('guide.health.step2')}</h2>
            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: 0 }}>{t('guide.health.step2_desc')}</p>
          </div>

          <div className="glass-panel" style={{ position: 'relative', padding: '32px' }}>
            <div style={{ position: 'absolute', left: '-46px', top: '32px', width: '26px', height: '26px', borderRadius: '50%', background: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>3</div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--heading-color)', marginBottom: '12px', fontFamily: 'Syne, sans-serif' }}>{t('guide.health.step3')}</h2>
            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: 0 }}>{t('guide.health.step3_desc')}</p>
          </div>

        </div>
      </div>
    </div>
  );
}
