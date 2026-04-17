import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { CATEGORY_IMAGES, TOPIC_META, type Topic, type Article } from '../../../lib/news-config';
import React from 'react';

// Revalidate short-lived caches for breaking news edits
export const revalidate = 60;

// ─── Time Formatting ───
function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 60000);

  if (diff < 60) return `${diff} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
  return `${Math.floor(diff / 1440)} days ago`;
}

// ─── Metadata Generation ───
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: routeData } = await supabase.from('news_articles').select('*').eq('slug', params.slug).single();
  if (!routeData) {
    return { title: 'Article Not Found · GoBarcelona' };
  }

  const img = routeData.image_url || CATEGORY_IMAGES[routeData.category as Topic] || CATEGORY_IMAGES['Barcelona'];

  return {
    title: `${routeData.title} · GoBarcelona News`,
    description: routeData.summary,
    openGraph: {
      title: routeData.title,
      description: routeData.summary,
      images: [img],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: routeData.title,
      description: routeData.summary,
      images: [img],
    }
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  // 1. Fetch main article
  const { data: article } = await supabase
    .from('news_articles')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!article) {
    notFound();
  }

  // Update read counts asynchronously ideally, but doing it directly here for simplicity (though Next.js cache might ignore subsequent hits)
  await supabase.rpc('increment_page_view', { page_slug: article.slug });

  // 2. Fetch related articles from same category
  const { data: related } = await supabase
    .from('news_articles')
    .select('*')
    .eq('category', article.category)
    .neq('slug', article.slug)
    .order('published_at', { ascending: false })
    .limit(3);

  const heroImage = article.image_url || CATEGORY_IMAGES[article.category as Topic] || CATEGORY_IMAGES['Barcelona'];
  const topicColor = TOPIC_META[article.category as Topic]?.color || '#E63946';

  const shareUrl = `https://gobarcelona.es/news/${article.slug}`;

  return (
    <div style={{ paddingTop: '64px', minHeight: '100vh', background: '#0f0f1a' }}>
      
      {/* ─── Hero Section ─── */}
      <div style={{ position: 'relative', width: '100%', height: '50vh', minHeight: '400px', backgroundColor: '#1a1a2e' }}>
        <img 
          src={heroImage} 
          alt={article.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%', background: 'linear-gradient(to top, rgba(15,15,26,1) 0%, rgba(15,15,26,0.5) 60%, transparent 100%)', pointerEvents: 'none' }} />
        
        <div className="container" style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', padding: '0 24px 40px', width: '100%', maxWidth: '900px' }}>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            {article.is_breaking && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#E63946', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                <span style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                BREAKING
              </span>
            )}
            <span style={{ background: topicColor, color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {article.category}
            </span>
          </div>

          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 4vw, 48px)', color: 'white', lineHeight: 1.15, marginBottom: '20px' }}>
            {article.is_trending && <span style={{marginRight: '12px'}}>🔥</span>}
            {article.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>
            <span style={{ color: 'white' }}>GoBarcelona Editorial</span>
            <span>·</span>
            <span>{timeAgo(article.published_at)}</span>
            <span>·</span>
            <span>{article.category}</span>
          </div>
        </div>
      </div>

      <main className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px 100px' }}>
        
        {/* Breadcrumbs */}
        <div style={{ fontSize: '13px', color: '#666', fontWeight: 600, marginBottom: '40px' }}>
          <a href="/" style={{ color: '#aaa', textDecoration: 'none' }}>Home</a> &gt;{' '}
          <a href="/news" style={{ color: '#aaa', textDecoration: 'none' }}>News</a> &gt;{' '}
          <span style={{ color: '#E63946' }}>{article.category}</span>
        </div>

        {/* ─── Article Body ─── */}
        <article style={{ color: '#ccc', fontSize: '17px', lineHeight: '1.8', fontFamily: "'DM Sans', sans-serif" }}>
          {/* Output paragraphs correctly based on newlines in body */}
          {article.body.split('\n').filter((p: string) => p.trim()).map((paragraph: string, idx: number) => (
            <p key={idx} style={{ marginBottom: '24px' }}>
              {paragraph}
            </p>
          ))}
        </article>

        {/* ─── Attribution & Share ─── */}
        <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <a href={article.source_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', textDecoration: 'none', fontSize: '14px', fontWeight: 600, background: 'rgba(255,255,255,0.03)', padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            Originally reported by <strong style={{ color: '#aaa' }}>{article.source_name}</strong>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>

          <div style={{ display: 'flex', gap: '12px' }}>
            <a href={`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer" style={{ background: '#25D366', color: 'white', padding: '10px 20px', borderRadius: '24px', textDecoration: 'none', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              WhatsApp
            </a>
            <a href={`https://x.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" style={{ background: 'black', color: 'white', padding: '10px 20px', borderRadius: '24px', textDecoration: 'none', fontWeight: 800, fontSize: '13px', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              X (Twitter)
            </a>
          </div>
        </div>

        {/* ─── Related Articles ─── */}
        {related && related.length > 0 && (
          <div style={{ marginTop: '80px' }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '24px', color: 'white', marginBottom: '24px' }}>More {article.category} News</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              {related.map((ra: Article) => {
                const raImg = ra.image_url || CATEGORY_IMAGES[ra.category as Topic] || CATEGORY_IMAGES['Barcelona'];
                return (
                  <a key={ra.id} href={`/news/${ra.slug}`} style={{ display: 'block', textDecoration: 'none', background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s' }}>
                    <img src={raImg} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                    <div style={{ padding: '20px' }}>
                      <h4 style={{ color: 'white', fontFamily: "'Syne', sans-serif", fontSize: '16px', lineHeight: 1.3, marginBottom: '8px' }}>{ra.title}</h4>
                      <p style={{ color: '#888', fontSize: '13px', fontWeight: 600 }}>{timeAgo(ra.published_at)}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
