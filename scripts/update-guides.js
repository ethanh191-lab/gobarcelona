const fs = require('fs');
const path = require('path');

const dirs = ['banking', 'empadronamiento', 'healthcare', 'housing', 'nie', 'sim', 'transport'];

for (const dir of dirs) {
  const file = path.join('c:/Users/ethan/GoBarcelona/app/guide', dir, 'page.tsx');
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Wrapper
    content = content.replace(/<div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px' }}>/g, '<div style={{ minHeight: \'100vh\', background: \'var(--bg-main)\' }}>\n      <div className="container" style={{ paddingTop: \'120px\', paddingBottom: \'80px\', maxWidth: \'800px\' }}>');
    
    // Back Link
    content = content.replace(/style={{ color: 'var\(--text-secondary\)', fontSize: '0.9rem', marginBottom: '32px', display: 'inline-block', transition: 'color 0.2s', textDecoration: 'none' }}/g, 'style={{ color: \'var(--amber)\', fontSize: \'15px\', marginBottom: \'32px\', display: \'inline-block\', transition: \'color 0.2s\', textDecoration: \'none\', fontWeight: 600 }}');
    
    // H1
    content = content.replace(/<h1 style={{ fontSize: '3.5rem', marginBottom: '16px', letterSpacing: '-1px'(, fontFamily: 'Syne, sans-serif')? }}>/g, '<h1 style={{ fontSize: \'64px\', marginBottom: \'16px\', fontFamily: "\'Barlow Condensed\', sans-serif", color: \'white\', lineHeight: 1.1 }}>');
    
    // Desc
    content = content.replace(/<p style={{ color: 'var\(--text-secondary\)', marginBottom: '64px', lineHeight: '1.7', fontSize: '1.1rem' }}>/g, '<p style={{ color: \'var(--text-secondary)\', marginBottom: \'64px\', lineHeight: \'1.7\', fontSize: \'18px\' }}>');
    
    // Border line
    content = content.replace(/borderLeft: '1px solid var\(--glass-border\)'/g, 'borderLeft: \'2px solid rgba(245, 166, 35, 0.3)\'');
    content = content.replace(/borderLeft: '3px solid #[a-f0-9]+'/g, 'borderLeft: \'2px solid rgba(245, 166, 35, 0.3)\'');
    
    // Glass panels
    content = content.replace(/className="glass-panel" style={{ position: 'relative', padding: '32px' }}/g, 'style={{ position: \'relative\', padding: \'32px\', background: \'rgba(255, 255, 255, 0.03)\', backdropFilter: \'blur(24px) saturate(180%)\', WebkitBackdropFilter: \'blur(24px) saturate(180%)\', border: \'1px solid rgba(255, 255, 255, 0.1)\', borderRadius: \'16px\' }}');
    
    // Step indicators
    content = content.replace(/background: '(var\(--primary-red\)|#[a-f0-9]+)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '14px'/g, 'background: \'var(--amber)\', display: \'flex\', alignItems: \'center\', justifyContent: \'center\', fontWeight: \'bold\', color: \'#000\', fontSize: \'16px\', boxShadow: \'0 0 16px rgba(245, 166, 35, 0.4)\'');
    
    // H2
    content = content.replace(/<h2 style={{ fontSize: '1.4rem', color: '(var\(--heading-color\)|var\(--text-primary\))', marginBottom: '12px'(, fontFamily: 'Syne, sans-serif')? }}>/g, '<h2 style={{ fontSize: \'24px\', color: \'white\', marginBottom: \'12px\', fontFamily: "\'Barlow Condensed\', sans-serif" }}>');
    
    // P text
    content = content.replace(/<p style={{ color: '(var\(--text-primary\)|var\(--text-secondary\))', lineHeight: '1.6'(, marginBottom: 0)? }}/g, '<p style={{ color: \'var(--text-secondary)\', lineHeight: \'1.6\', fontSize: \'16px\', marginBottom: 0 }}');
    
    // Closing div wrapper
    content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\);/g, '</div>\n        </div>\n      </div>\n    </div>\n  );');
    
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
}
