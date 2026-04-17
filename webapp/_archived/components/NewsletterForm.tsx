"use client";
import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';

export default function NewsletterForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/mailing-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'server_error');
        if (typeof window !== 'undefined') {
          (window as any).lastErrorDetails = data.details || '';
        }
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage('server_error');
      if (typeof window !== 'undefined') {
        (window as any).lastErrorDetails = err.message || '';
      }
    }
  };

  return (
    <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
        <input 
          type="email" 
          placeholder={t('home.news.placeholder')} 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ 
            flex: '1 1 180px', 
            padding: '14px 20px', 
            fontSize: '1rem', 
            border: '1px solid var(--glass-border)', 
            background: 'var(--bg-primary)', 
            color: 'var(--text-primary)', 
            outline: 'none', 
            borderRadius: 0 
          }} 
        />
        <button 
          type="submit"
          className="btn-primary" 
          disabled={status === 'loading' || status === 'success'}
          style={{ 
            padding: '14px 24px', 
            borderRadius: 0, 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            fontSize: '0.9rem', 
            backgroundColor: 'var(--ocean)',
            opacity: status === 'loading' || status === 'success' ? 0.7 : 1,
            cursor: status === 'loading' || status === 'success' ? 'not-allowed' : 'pointer'
          }}
        >
          {status === 'loading' ? '...' : status === 'success' ? '✓' : t('home.news.btn')}
        </button>
      </form>
      
      {status === 'success' && (
        <p style={{ color: '#2ecc71', fontSize: '0.85rem', fontWeight: 700, margin: '4px 0 0' }}>
          {t('news.success')}
        </p>
      )}
      
      {status === 'error' && (
        <div style={{ marginTop: '8px' }}>
          <p style={{ color: 'var(--primary-red)', fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>
            {t(`news.error.${errorMessage}`)}
          </p>
          <p style={{ color: 'var(--primary-red)', fontSize: '0.7rem', opacity: 0.7, margin: '4px 0 0' }}>
            {errorMessage === 'server_error' && 'Technical details: ' + (window as any).lastErrorDetails}
          </p>
        </div>
      )}
    </div>
  );
}
