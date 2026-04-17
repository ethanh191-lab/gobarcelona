"use client";
import React, { useState } from 'react';
import styles from './contact.module.css';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setSending(false);
  };

  return (
    <main className={styles.main}>
      <div className={styles.grid}>
        {/* Left Side: About */}
        <div className={styles.aboutSide}>
          <div className={styles.badge}>OUR MISSION</div>
          <h1 className={styles.title}>The city, <br/><span className={styles.red}>mapped by locals.</span></h1>
          <p className={styles.description}>
            GoBarcelona was born from a simple mission: to map every bar and every price in the city, 
            verified by locals, for the international community. 
            <br/><br/>
            No tourist traps. No sponsored content. <br/>
            <strong>Just the best beer at the best price.</strong>
          </p>
          
          <div className={styles.socials}>
            <div className={styles.socialItem}>
              <span className={styles.icon}>📧</span>
              <a href="mailto:info@gobarcelona.es">info@gobarcelona.es</a>
            </div>
            <div className={styles.socialItem}>
              <span className={styles.icon}>📸</span>
              <a href="https://instagram.com/gobarcelona.es" target="_blank" rel="noopener noreferrer">@gobarcelona.es</a>
            </div>
          </div>
        </div>

        {/* Right Side: Contact Form */}
        <div className={styles.formSide}>
          <div className={styles.formCard}>
            {sent ? (
              <div className={styles.success}>
                <span className={styles.successIcon}>✓</span>
                <h3>Message sent.</h3>
                <p>We&apos;ll get back to you within 48 hours.</p>
                <button onClick={() => setSent(false)} className={styles.resetBtn}>Send another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                <h2 className={styles.formTitle}>Send us a message</h2>
                <div className={styles.field}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div className={styles.field}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    required
                    placeholder="john@example.com"
                  />
                </div>
                <div className={styles.field}>
                  <label>Message</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm({...form, message: e.target.value})}
                    required
                    placeholder="Tell us about a bar, a price update, or a partnership..."
                    rows={4}
                  />
                </div>
                {error && <p className={styles.error}>{error}</p>}
                <button type="submit" className={styles.submit} disabled={sending}>
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
