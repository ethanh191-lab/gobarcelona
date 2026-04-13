"use client";
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../components/LanguageContext';

export default function TransportGuide() {
  const { t } = useLanguage();
  
  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px' }}>
      <Link href="/guide" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px', display: 'inline-block', transition: 'color 0.2s', textDecoration: 'none' }}>
        ← {t('guide.back')}
      </Link>
      
      <div className="animate-fade-in">
        <h1 style={{ fontSize: '3.5rem', marginBottom: '16px', letterSpacing: '-1px' }}>
          {t('guide.trans.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '64px', lineHeight: '1.7', fontSize: '1.1rem' }}>
          {t('guide.trans.desc')}
        </p>

        <div style={{ marginLeft: '12px', paddingLeft: '32px', borderLeft: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          <div className="glass-panel" style={{ position: 'relative', padding: '32px' }}>
            <div style={{ position: 'absolute', left: '-45px', top: '32px', width: '26px', height: '26px', borderRadius: '50%', background: 'var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>1</div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '12px' }}>{t('guide.trans.step1')}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>{t('guide.trans.step1_desc')}</p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a href="https://t-mobilitat.atm.cat/web/t-mobilitat/inici" target="_blank" className="btn-secondary" style={{ fontSize: '0.9rem', padding: '8px 20px' }}>{t('guide.trans.btn_app')} ↗</a>
            </div>
          </div>

          <div className="glass-panel" style={{ position: 'relative', padding: '32px' }}>
            <div style={{ position: 'absolute', left: '-45px', top: '32px', width: '26px', height: '26px', borderRadius: '50%', background: 'var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>2</div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '12px' }}>{t('guide.trans.step2')}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{t('guide.trans.step2_desc')}</p>
          </div>

          <div className="glass-panel" style={{ position: 'relative', padding: '32px' }}>
            <div style={{ position: 'absolute', left: '-45px', top: '32px', width: '26px', height: '26px', borderRadius: '50%', background: 'var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>!</div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '12px' }}>{t('guide.trans.step3')}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{t('guide.trans.step3_desc')}</p>
          </div>

          <div className="glass-panel" style={{ position: 'relative', padding: '32px' }}>
            <div style={{ position: 'absolute', left: '-45px', top: '32px', width: '26px', height: '26px', borderRadius: '50%', background: 'var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>3</div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '12px' }}>{t('guide.trans.step4')}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>{t('guide.trans.step4_desc')}</p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a href="https://www.tmb.cat/documents/20182/96078/Pl%C3%A0nol+xarxa+Metro.pdf" target="_blank" className="btn-secondary" style={{ fontSize: '0.9rem', padding: '8px 20px' }}>{t('guide.trans.btn_map')} ↗</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
