"use client";
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../components/LanguageContext';

export default function NIERegistration() {
  const { t } = useLanguage();
  
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px' }}>
        <Link href="/guide" style={{ color: 'var(--amber)', fontSize: '15px', marginBottom: '32px', display: 'inline-flex', transition: 'color 0.2s', textDecoration: 'none', alignItems: 'center', height: '44px', fontWeight: 600 }}>
          ← {t('guide.back')}
        </Link>
        
        <div className="animate-fade-in">
          <h1 style={{ fontSize: '64px', marginBottom: '16px', fontFamily: "'Barlow Condensed', sans-serif", color: 'white', lineHeight: 1.1 }}>
            {t('guide.nie.title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', lineHeight: '1.7', fontSize: '18px' }}>
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
                border-left: 2px solid rgba(245, 166, 35, 0.3);
                gap: 48px;
              }
            }
            .step-card {
               position: relative;
               padding: 32px;
               background: rgba(255, 255, 255, 0.03);
               backdrop-filter: blur(24px) saturate(180%);
               -webkit-backdrop-filter: blur(24px) saturate(180%);
               border: 1px solid rgba(255, 255, 255, 0.1);
               border-radius: 16px;
            }
            .step-number {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: var(--amber);
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: #000;
              font-size: 16px;
              box-shadow: 0 0 16px rgba(245, 166, 35, 0.4);
              margin-bottom: 16px;
            }
            @media (min-width: 768px) {
              .step-number {
                position: absolute;
                left: -49px;
                top: 32px;
                margin-bottom: 0;
              }
            }
          `}</style>

          <div className="timeline">
            
            <div className="step-card">
              <div className="step-number">1</div>
              <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '12px', fontFamily: "'Barlow Condensed', sans-serif" }}>{t('guide.nie.step1')}</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '16px', marginBottom: '24px' }}>{t('guide.nie.step1_desc')}</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <a href="https://icp.administracionelectronica.gob.es/icpplus/citar" target="_blank" className="btn-primary" style={{ fontSize: '0.9rem', padding: '10px 20px', minWidth: 'auto' }}>{t('guide.nie.btn_cita')} ↗</a>
                <a href="https://sede.policia.gob.es/portalCiudadano/tramites/extranjeria.html" target="_blank" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: 0.6, textDecoration: 'underline' }}>Backup: policia.gob.es ↗</a>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '12px', fontFamily: "'Barlow Condensed', sans-serif" }}>{t('guide.nie.step2')}</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '16px', marginBottom: '24px' }}>{t('guide.nie.step2_desc')}</p>
              <a href="https://www.exteriores.gob.es/Consulados/amsterdam/es/ServiciosConsulares/Documents/EX15.pdf" target="_blank" className="btn-secondary" style={{ fontSize: '0.9rem', padding: '8px 20px', minWidth: 'auto' }}>{t('guide.nie.btn_ex15')} ↗</a>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '12px', fontFamily: "'Barlow Condensed', sans-serif" }}>{t('guide.nie.step3')}</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '16px', marginBottom: '24px' }}>{t('guide.nie.step3_desc')}</p>
              <a href="https://sede.policia.gob.es/Tasa790_012/" target="_blank" className="btn-secondary" style={{ fontSize: '0.9rem', padding: '8px 20px', minWidth: 'auto' }}>{t('guide.nie.btn_tasa')} ↗</a>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '12px', fontFamily: "'Barlow Condensed', sans-serif" }}>{t('guide.nie.step4')}</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '16px', marginBottom: 0 }}>{t('guide.nie.step4_desc')}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
