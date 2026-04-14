"use client";
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../components/LanguageContext';

export default function NIERegistration() {
  const { t } = useLanguage();
  
  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '80px', maxWidth: '800px' }}>
      <Link href="/guide" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px', display: 'inline-flex', transition: 'color 0.2s', textDecoration: 'none', alignItems: 'center', height: '44px' }}>
        ← {t('guide.back')}
      </Link>
      
      <div className="animate-fade-in">
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 3.5rem)', marginBottom: '16px', letterSpacing: '-1px', lineHeight: 1.1 }}>
          {t('guide.nie.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', lineHeight: '1.7', fontSize: '1.1rem' }}>
          {t('guide.nie.desc')}
        </p>

        <style jsx>{`
          .timeline {
            display: flex;
            flex-direction: column;
            gap: 32px;
          }
          @media (min-width: 768px) {
            .timeline {
              margin-left: 12px;
              padding-left: 32px;
              border-left: 1px solid var(--glass-border);
              gap: 48px;
            }
          }
          .step-card {
             position: relative;
             padding: 24px;
          }
          @media (min-width: 768px) {
            .step-card {
              padding: 32px;
            }
          }
          .step-number {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: var(--primary-red);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #fff;
            font-size: 14px;
            margin-bottom: 16px;
          }
          @media (min-width: 768px) {
            .step-number {
              position: absolute;
              left: -45px;
              top: 32px;
              margin-bottom: 0;
            }
          }
        `}</style>

        <div className="timeline">
          
          <div className="glass-panel step-card">
            <div className="step-number">1</div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '12px' }}>{t('guide.nie.step1')}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>{t('guide.nie.step1_desc')}</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a href="https://icp.administracionelectronica.gob.es/icpplus/citar" target="_blank" className="btn-primary" style={{ fontSize: '0.9rem', padding: '10px 20px', minWidth: 'auto' }}>{t('guide.nie.btn_cita')} ↗</a>
              <a href="https://sede.policia.gob.es/portalCiudadano/tramites/extranjeria.html" target="_blank" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', opacity: 0.6, textDecoration: 'underline' }}>Backup: policia.gob.es ↗</a>
            </div>
          </div>

          <div className="glass-panel step-card">
            <div className="step-number">2</div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '12px' }}>{t('guide.nie.step2')}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>{t('guide.nie.step2_desc')}</p>
            <a href="https://www.exteriores.gob.es/Consulados/amsterdam/es/ServiciosConsulares/Documents/EX15.pdf" target="_blank" className="btn-secondary" style={{ fontSize: '0.9rem', padding: '8px 20px', minWidth: 'auto', border: '1px solid var(--glass-border)' }}>{t('guide.nie.btn_ex15')} ↗</a>
          </div>

          <div className="glass-panel step-card">
            <div className="step-number">3</div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '12px' }}>{t('guide.nie.step3')}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>{t('guide.nie.step3_desc')}</p>
            <a href="https://sede.policia.gob.es/Tasa790_012/" target="_blank" className="btn-secondary" style={{ fontSize: '0.9rem', padding: '8px 20px', minWidth: 'auto', border: '1px solid var(--glass-border)' }}>{t('guide.nie.btn_tasa')} ↗</a>
          </div>

          <div className="glass-panel step-card">
            <div className="step-number">4</div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '12px' }}>{t('guide.nie.step4')}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{t('guide.nie.step4_desc')}</p>
          </div>

        </div>
      </div>
    </div>
  );
}
