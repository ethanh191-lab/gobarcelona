"use client";
import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

export default function CookieBanner() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('gobarcelona_cookie_consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = { essential: true, optional: true, timestamp: new Date().toISOString() };
    localStorage.setItem('gobarcelona_cookie_consent', JSON.stringify(consent));
    setShow(false);
  };

  const handleDeclineOptional = () => {
    const consent = { essential: true, optional: false, timestamp: new Date().toISOString() };
    localStorage.setItem('gobarcelona_cookie_consent', JSON.stringify(consent));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      width: '90%',
      maxWidth: '600px'
    }} className="animate-fade-in delay-200">
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid var(--primary-red)' }}>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800 }}>🍪 {t('cookie.title')}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', fontWeight: 500 }}>
          {t('cookie.desc')}
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
          <button onClick={handleAcceptAll} className="btn-primary" style={{ flex: '1 1 200px', padding: '12px 0', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase' }}>
            {t('cookie.accept')}
          </button>
          <button onClick={handleDeclineOptional} style={{ flex: '1 1 200px', padding: '12px 0', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}>
            {t('cookie.decline')}
          </button>
        </div>
      </div>
    </div>
  );
}
