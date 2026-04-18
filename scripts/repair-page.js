const fs = require('fs');
const path = 'app/map/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Find the line with isNew
const isNewLines = `  const isNew = selectedPlace && selectedPlace.openedAt ? (new Date().getTime() - new Date(selectedPlace.openedAt).getTime()) < 90 * 24 * 60 * 60 * 1000 : false;`;

// Find the broken part starting from 🏆
const brokenStart = `            <span>🏆 THIS WEEK'S CHEAPEST</span>`;

const correctBlock = `  const isNew = selectedPlace && selectedPlace.openedAt ? (new Date().getTime() - new Date(selectedPlace.openedAt).getTime()) < 90 * 24 * 60 * 60 * 1000 : false;

  // ──────────── RENDER ────────────
  return (
    <div className={styles.appWrapper}>
      {/* ─── Sidebar ─── */}
      <aside className={ \`\${styles.sidebar} \${sidebarVisible ? styles.sidebarVisible : ''}\` }>
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
            <span>🏆 THIS WEEK'S CHEAPEST</span>`;

// Replace the broken part
content = content.replace(/const isNew = selectedPlace && selectedPlace\.openedAt \? \(new Date\(\)\.getTime\(\) - new Date\(selectedPlace\.openedAt\)\.getTime\(\)\) < 90 \* 24 \* 60 \* 60 \* 1000 : false;[\s\S]*?<span>🏆 THIS WEEK'S CHEAPEST<\/span>/, correctBlock);

fs.writeFileSync(path, content);
console.log('Fixed page.tsx');
