const fs = require('fs');
const path = 'app/map/page.tsx';
let c = fs.readFileSync(path, 'utf8');

// Normalize to \n for easier matching, then convert back at the end
c = c.replace(/\r\n/g, '\n');

let changes = 0;

// ────── 1. Fix distanceToWalk ──────
{
  const old = `function distanceToWalk(meters: number): { mins: number; label: string } {\n  const mins = Math.round(meters / 80); // 80m/min walking speed\n  if (meters < 1000) return { mins, label: \`\${mins} min · \${Math.round(meters)}m\` };\n  return { mins, label: \`\${mins} min · \${(meters / 1000).toFixed(1)}km\` };\n}`;
  const rep = `function distanceToWalk(straightLineMeters: number): { mins: number; label: string } {\n  // Barcelona grid layout — real walking distance ≈ 1.4x straight-line\n  const walkMeters = straightLineMeters * 1.4;\n  const mins = Math.round(walkMeters / 75); // ~4.5 km/h avg walking speed\n  return { mins, label: \`\${mins} min\` };\n}`;
  if (c.includes(old)) { c = c.replace(old, rep); changes++; console.log('✅ 1. Fixed distanceToWalk'); }
  else console.log('⚠️ 1. distanceToWalk not found');
}

// ────── 2. Change DISTANCE_OPTIONS → WALK_TIME_OPTIONS ──────
{
  const old = `const DISTANCE_OPTIONS = [\n  { value: 250,  label: '250m' },\n  { value: 500,  label: '500m' },\n  { value: 1000, label: '1km' },\n  { value: 2000, label: '2km' },\n  { value: 5000, label: '5km' },\n];`;
  const rep = `const WALK_TIME_OPTIONS = [\n  { value: 5,  label: '5 min' },\n  { value: 10, label: '10 min' },\n  { value: 15, label: '15 min' },\n  { value: 20, label: '20 min' },\n  { value: 60, label: '60 min' },\n];`;
  if (c.includes(old)) { c = c.replace(old, rep); changes++; console.log('✅ 2. Options updated'); }
  else console.log('⚠️ 2. DISTANCE_OPTIONS not found');
}

// ────── 3. Distance filter UI ──────
{
  // Find the "Max Distance" section and replace it
  const marker1 = `{/* Max Distance */}`;
  const marker2 = `{/* Walking Time */}`;
  if (c.includes(marker1) || c.includes('Max distance')) {
    // Replace the entire distance filter section
    const sectionRegex = /\{\/\* Max Distance \*\/\}[\s\S]*?<\/div>\s*<\/div>/;
    const match = c.match(sectionRegex);
    if (match) {
      c = c.replace(match[0], `{/* Walking Time */}
          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>
              <span>Max walking time</span>
              <span className={styles.filterValue}>{maxWalkMins} min</span>
            </div>
            <input
              type="range" className={styles.slider}
              min="5" max="60" step="5"
              value={maxWalkMins}
              onChange={e => setMaxWalkMins(parseInt(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              {WALK_TIME_OPTIONS.map(d => (
                <button key={d.value} onClick={() => setMaxWalkMins(d.value)}
                  style={{
                    background: maxWalkMins === d.value ? '#E63946' : 'transparent',
                    color: maxWalkMins === d.value ? 'white' : '#666',
                    border: 'none', borderRadius: '4px', padding: '3px 8px',
                    fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                  }}
                >{d.label}</button>
              ))}
            </div>
          </div>`);
      changes++; console.log('✅ 3. Distance UI updated');
    } else {
      console.log('⚠️ 3. Distance UI regex no match');
    }
  } else {
    console.log('⚠️ 3. No distance markers found');
  }
}

// ────── 4. Replace Leaderboard with Bar of the Week ──────
{
  const marker = `{/* 🏆 Leaderboard Section */}`;
  if (c.includes(marker)) {
    // Find from the marker to the closing </div> of the section
    const startIdx = c.indexOf(marker);
    // Find the end of leaderboardSection - we need to match the nested divs
    // The section starts with <div className={styles.leaderboardSection}>
    // and we need to find its closing </div>
    const sectionStart = c.indexOf('leaderboardSection}>', startIdx);
    if (sectionStart > -1) {
      // Count divs to find the matching closing tag
      let depth = 0;
      let i = sectionStart;
      let foundEnd = -1;
      while (i < c.length) {
        if (c.substring(i, i + 4) === '<div') { depth++; }
        if (c.substring(i, i + 6) === '</div>') {
          depth--;
          if (depth === 0) { foundEnd = i + 6; break; }
        }
        i++;
      }
      if (foundEnd > -1) {
        const oldSection = c.substring(startIdx, foundEnd);
        const newSection = `{/* ⭐ Bar of the Week */}
        {(() => {
          const candidates = places.filter(p => p.status !== 'permanently_closed' && p.rating && parseFloat(p.beerPrice?.replace('€','') || '99') < 6);
          const botw = candidates.sort((a,b) => (b.rating || 0) - (a.rating || 0))[0];
          if (!botw) return null;
          return (
            <div className={styles.botwSection} onClick={() => {
              setSelectedPlace(botw);
              mapInstanceRef.current?.panTo({ lat: botw.lat, lng: botw.lng });
              mapInstanceRef.current?.setZoom(17);
            }}>
              <div className={styles.botwBadge}>⭐ BAR OF THE WEEK</div>
              <div className={styles.botwName}>{botw.name}</div>
              <div className={styles.botwMeta}>
                <span>{botw.neighbourhood}</span>
                <span className={styles.botwPrice}>{botw.beerPrice}</span>
                <span>★ {botw.rating}</span>
              </div>
            </div>
          );
        })()}`;
        c = c.replace(oldSection, newSection);
        changes++; console.log('✅ 4. Replaced leaderboard with Bar of the Week');
      }
    }
  } else {
    console.log('⚠️ 4. Leaderboard marker not found');
  }
}

// ────── 5. Update detail panel walking info to use realWalk ──────
{
  const old = `{/* Walking distance */}
                {userLoc && (() => {
                  const walk = distanceToWalk(haversine(userLoc.lat, userLoc.lng, selectedPlace.lat, selectedPlace.lng));
                  return (
                    <div className={styles.walkingInfo}>
                      🚶 <strong>{walk.label}</strong> <span style={{ color: '#60a5fa', marginLeft: '4px' }}>walking</span>
                    </div>
                  );
                })()}`;
  const rep = `{/* Walking distance */}
                {userLoc && (() => {
                  const fallback = distanceToWalk(haversine(userLoc.lat, userLoc.lng, selectedPlace.lat, selectedPlace.lng));
                  return (
                    <div className={styles.walkingInfo}>
                      🚶 <strong>{realWalk ? \`\${realWalk.mins} · \${realWalk.dist}\` : fallback.label}</strong> <span style={{ color: '#60a5fa', marginLeft: '4px' }}>walking{realWalk ? '' : ' (est.)'}</span>
                    </div>
                  );
                })()}`;
  if (c.includes(old)) { c = c.replace(old, rep); changes++; console.log('✅ 5. Updated detail panel walk info'); }
  else console.log('⚠️ 5. Walk panel not found');
}

// Convert back to \r\n
c = c.replace(/\n/g, '\r\n');

fs.writeFileSync(path, c);
console.log(`\n🎉 Done! Applied ${changes} changes total.`);
