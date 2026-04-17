"use client";
import React, { useState } from 'react';
import styles from './contact.module.css';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General question', message: '' });
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
      <section className={styles.hero}>
        <h1>Get in touch.</h1>
        <p className={styles.heroSub}>Questions, bar suggestions, partnership enquiries — we read everything.</p>
      </section>

      <section className={styles.formSection}>
        <div className="container">
          <div className={styles.formCard}>
            {sent ? (
              <div className={styles.success}>
                <span className={styles.successIcon}>✓</span>
                <h3>Message sent.</h3>
                <p>We&apos;ll get back to you within 48 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                  <label>Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    required
                    placeholder="Your name"
                  />
                </div>
                <div className={styles.field}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    required
                    placeholder="your@email.com"
                  />
                </div>
                <div className={styles.field}>
                  <label>Subject</label>
                  <select
                    value={form.subject}
                    onChange={e => setForm({...form, subject: e.target.value})}
                  >
                    <option>General question</option>
                    <option>Add or correct a bar</option>
                    <option>Partnership / advertising</option>
                    <option>Press enquiry</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Message</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm({...form, message: e.target.value})}
                    required
                    placeholder="Your message..."
                    rows={5}
                  />
                </div>
                {error && <p className={styles.error}>{error}</p>}
                <button type="submit" className={styles.submit} disabled={sending}>
                  {sending ? 'Sending...' : 'Send message'}
                </button>
              </form>
            )}
          </div>

          <div className={styles.contactInfo}>
            <div className={styles.infoItem}>
              <span>📧</span>
              <a href="mailto:info@gobarcelona.es">info@gobarcelona.es</a>
            </div>
            <div className={styles.infoItem}>
              <span>📸</span>
              <a href="https://instagram.com/gobarcelona.es" target="_blank" rel="noopener noreferrer">@gobarcelona.es</a>
            </div>
            <div className={styles.infoItem}>
              <span>⏱️</span>
              <span>We typically respond within 48 hours</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
