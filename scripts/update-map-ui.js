const fs = require('fs');

let content = fs.readFileSync('app/map/page.tsx', 'utf8');

// 1. Update Place interface
content = content.replace(
  /  closureNote\?: string;\r?\n  reopeningDate\?: string;\r?\n\}/,
  `  closureNote?: string;
  reopeningDate?: string;
  openingToday?: string;
  isOpenNow?: boolean | null;
  lastUpdated?: string;
  priceConfidence?: string;
}`
);

// 2. Sidebar Price & Open Badge
content = content.replace(
  /<span className=\{styles\.barCardPrice\}>\{p\.beerPrice\}<\/span>/,
  `<span className={styles.barCardPrice} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    {p.priceConfidence === 'verified' && <span style={{ color: '#22c55e' }}>✓</span>}
    {p.priceConfidence === 'estimated' && <span style={{ color: '#f59e0b', fontSize: '14px' }}>~</span>}
    {p.priceConfidence === 'unverified' && <span style={{ color: '#888', fontSize: '14px' }}>?</span>}
    {p.priceConfidence === 'unverified' ? 'Price unknown' : p.beerPrice}
  </span>`
);

content = content.replace(
  /\{p\.status === 'temporarily_closed' \? \([\s\S]*?\) : p\.isOpen !== null && \([\s\S]*?<\/span>\r?\n\s*\)\}/,
  `{p.status === 'temporarily_closed' ? (
    <span className={styles.statusWarning}>⚠️ Temporarily Closed</span>
  ) : p.isOpenNow !== undefined && p.isOpenNow !== null ? (
    <span className={\`\${styles.openBadge} \${p.isOpenNow ? styles.openBadgeOpen : styles.openBadgeClosed}\`}>
      {p.isOpenNow ? 'Open' : 'Closed'}
    </span>
  ) : (
    <span className={\`\${styles.openBadge} \${styles.openBadgeClosed}\`} style={{ background: '#555', color: 'white' }}>
      Unknown
    </span>
  )}`
);

// 3. Detail Panel updates
// Find the header badge:
content = content.replace(
  /\{selectedPlace\.status === 'temporarily_closed' \? \([\s\S]*?\) : selectedPlace\.isOpen !== null && \([\s\S]*?<\/span>\r?\n\s*\)\}/,
  `{selectedPlace.status === 'temporarily_closed' ? (
    <span className={styles.statusWarning}>⚠️ Temporarily Closed</span>
  ) : selectedPlace.isOpenNow !== undefined && selectedPlace.isOpenNow !== null ? (
    <span className={\`\${styles.openBadge} \${selectedPlace.isOpenNow ? styles.openBadgeOpen : styles.openBadgeClosed}\`}>
      {selectedPlace.isOpenNow ? 'Open' : 'Closed'}
    </span>
  ) : (
    <span className={\`\${styles.openBadge} \${styles.openBadgeClosed}\`} style={{ background: '#555', color: 'white' }}>
      Unknown
    </span>
  )}`
);

// Find the price display in detail panel:
content = content.replace(
  /<h1 style=\{\{ color: '#E63946', margin: 0, fontSize: '38px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900 \}\}>\{selectedPlace\.beerPrice\}<\/h1>/,
  `<h1 style={{ color: '#E63946', margin: 0, fontSize: '38px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900 }}>
    {selectedPlace.priceConfidence === 'unverified' ? 'Unknown' : selectedPlace.beerPrice}
  </h1>
  <div style={{ fontSize: '13px', color: '#888', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
    {selectedPlace.priceConfidence === 'verified' && <span style={{ color: '#22c55e' }}>✓ Verified</span>}
    {selectedPlace.priceConfidence === 'estimated' && <span style={{ color: '#f59e0b' }}>~ Estimated</span>}
    {selectedPlace.priceConfidence === 'unverified' && <span>? Unverified</span>}
  </div>`
);

// Find Busyness Chart and Opening Hours and replace with the combined widget
content = content.replace(
  /\{(\/\* 📊 Busyness Chart \*\/)[\s\S]*?(?=\{\/\* Actions \*\/)/,
  `{/* 🕒 Combined Hours & Busyness */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 className={styles.sectionTitle}>TODAY'S HOURS & BUSYNESS</h4>
                  <div style={{ background: '#111', padding: '16px', borderRadius: '12px', border: '1px solid #333' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'white', fontWeight: 600 }}>
                      {selectedPlace.isOpenNow !== undefined && selectedPlace.isOpenNow !== null ? (
                        <span style={{ color: selectedPlace.isOpenNow ? '#22c55e' : '#ef4444' }}>
                          {selectedPlace.isOpenNow ? '🟢 Open now' : '🔴 Closed'}
                        </span>
                      ) : (
                        <span style={{ color: '#888' }}>⚪ Check hours</span>
                      )}
                      <span style={{ color: '#555' }}>·</span>
                      <span>{selectedPlace.openingToday || 'Unknown'}</span>
                    </div>
                    
                    <div className={styles.busynessChart} style={{ height: '60px' }}>
                      {[0.1, 0.2, 0.4, 0.6, 0.9, 0.8, 0.4].map((val, i) => (
                        <div key={i} className={styles.busyBar} style={{ height: \`\${val * 100}%\`, background: val > 0.8 ? '#ef4444' : val > 0.6 ? '#f59e0b' : '#333' }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666', marginTop: '8px', fontFamily: 'monospace' }}>
                      <span>12</span><span>14</span><span>16</span><span>18</span><span>20</span><span>22</span><span>00</span>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginTop: '12px', fontStyle: 'italic' }}>
                      Typically busy {busy.label}
                    </div>
                  </div>
                </div>

                `
);

// Append Last Updated
content = content.replace(
  /(\{\/\* Actions \*\/\}(.|\n)*?<\/div>)(?=\s*<\/div>\s*<\/main>)/,
  `$1\n                <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '11px', color: '#555' }}>\n                  Last updated: {selectedPlace.lastUpdated || 'Unknown'}\n                </div>`
);

fs.writeFileSync('app/map/page.tsx', content);
console.log('Done!');
