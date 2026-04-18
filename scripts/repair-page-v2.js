const fs = require('fs');
const path = 'app/map/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `  const busy = selectedPlace
    ? selPop != null
      ? selPop > 70 ? { label: 'Very busy', color: '#ef4444' }
        : selPop > 30 ? { label: 'Busy', color: '#f59e0b' }
        : { label: 'Quiet', color: '#22c55e' }
      : { label: 'Unknown', color: '#555' }
                .sort((a, b) => parseFloat(a.beerPrice.replace('€', '')) - parseFloat(b.beerPrice.replace('€', '')))`;

const replacement = `  const busy = selectedPlace
    ? selPop != null
      ? selPop > 70 ? { label: 'Very busy', color: '#ef4444' }
        : selPop > 30 ? { label: 'Busy', color: '#f59e0b' }
        : { label: 'Quiet', color: '#22c55e' }
      : { label: 'Unknown', color: '#555' }
    : { label: '', color: '' };
  const isNew = selectedPlace && selectedPlace.openedAt ? (new Date().getTime() - new Date(selectedPlace.openedAt).getTime()) < 90 * 24 * 60 * 60 * 1000 : false;

  // ──────────── RENDER ────────────
  return (
    <div className={styles.appWrapper}>
      {/* ─── Sidebar ─── */}
      <aside className={\`\${styles.sidebar} \${sidebarVisible ? styles.sidebarVisible : ''}\`}>
        <div className={styles.sidebarHeader}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1><span style={{ color: '#E63946' }}>go</span><span style={{ color: 'white' }}>barcelona</span> <span style={{ color: '#888', fontSize: '14px', fontWeight: 400 }}>Beer Map</span></h1>
            {sidebarVisible && (
              <button className={styles.mobileCloseSidebar} onClick={() => setSidebarVisible(false)}>✕</button>
            )}
          </div>
          <p className={styles.sidebarSubtitle}>{filteredPlaces.length} verified locations</p>
        </div>

        {/* 🏆 Leaderboard Section */}
        <div className={styles.leaderboardSection}>
          <div className={styles.leaderboardHeader} onClick={() => setLeaderboardOpen(!leaderboardOpen)}>
            <span>🏆 THIS WEEK'S CHEAPEST</span>
            <span className={styles.pillArrow}>{leaderboardOpen ? '▴' : '▾'}</span>
          </div>
          {leaderboardOpen && (
            <div className={styles.leaderboardList}>
              {places
                .filter(p => p.status !== 'permanently_closed')
                .sort((a, b) => parseFloat(a.beerPrice.replace('€', '')) - parseFloat(b.beerPrice.replace('€', '')))`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content);
  console.log('Fixed page.tsx precisely');
} else {
  console.log('Target NOT found');
}
