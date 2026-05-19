"use client";
import React from 'react';
import Link from 'next/link';

export default function NewsPage() {
  return (
    <main style={{ padding: '120px 20px', minHeight: '100vh', textAlign: 'center', background: '#0a0a0f', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: '48px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', marginBottom: '24px' }}>Barcelona News</h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '40px', fontSize: '18px' }}>Our AI is curating the latest news. Full news hub coming soon.</p>
      <Link href="/" style={{ padding: '12px 24px', background: '#E63946', color: 'white', borderRadius: '100px', textDecoration: 'none', fontWeight: 'bold', textTransform: 'uppercase' }}>← Back to Guide</Link>
    </main>
  );
}
