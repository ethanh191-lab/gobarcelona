const fs = require('fs');
let c = fs.readFileSync('app/map/page.tsx', 'utf8');

// 1. Update sidebar busyness dot to use currentPopularity
c = c.replace(
  /const busy = getBusynessLevel\(\);/g,
  `const popLevel = p.currentPopularity;
              const busy = popLevel != null
                ? popLevel > 70 ? { label: 'Very busy', color: '#ef4444' }
                  : popLevel > 30 ? { label: 'Busy', color: '#f59e0b' }
                  : { label: 'Quiet', color: '#22c55e' }
                : { label: 'Unknown', color: '#555' };`
);

// 2. Update the detail panel busyness
c = c.replace(
  /const busy = selectedPlace \? getBusynessLevel\(\) : \{ label: '', color: '' \};/,
  `const selPop = selectedPlace?.currentPopularity;
  const busy = selectedPlace
    ? selPop != null
      ? selPop > 70 ? { label: 'Very busy', color: '#ef4444' }
        : selPop > 30 ? { label: 'Busy', color: '#f59e0b' }
        : { label: 'Quiet', color: '#22c55e' }
      : { label: 'Unknown', color: '#555' }
    : { label: '', color: '' };`
);

// 3. Replace the combined hours+busyness widget
const oldWidgetRegex = /\{\/\* 🕒 Combined Hours & Busyness \*\/\}[\s\S]*?Typically busy \{busy\.label\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newWidget = `{/* 🕒 Combined Hours & Busyness */}
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
                    
                    {selectedPlace.popularTimes ? (() => {
                      const dayIndex = new Date().getDay();
                      const todayData: number[] = (selectedPlace.popularTimes as number[][])[dayIndex] || [];
                      const currentHour = new Date().getHours();
                      const maxVal = Math.max(...todayData, 1);
                      const busiestHour = todayData.indexOf(Math.max(...todayData));
                      const busiestEnd = Math.min(busiestHour + 2, 23);
                      return (
                        <>
                          <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
                            {todayData.map((val: number, i: number) => (
                              <div key={i} style={{
                                flex: 1,
                                height: \`\${Math.max((val / maxVal) * 100, 4)}%\`,
                                borderRadius: '2px 2px 0 0',
                                background: i === currentHour ? '#E63946' : i < currentHour ? '#333' : '#2E4057',
                                transition: 'height 0.3s',
                              }} title={\`\${i}:00 - \${val}% busy\`} />
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', marginTop: '6px', fontFamily: 'monospace' }}>
                            <span>0</span><span>6</span><span>12</span><span>18</span><span>23</span>
                          </div>
                          <div style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginTop: '10px', fontStyle: 'italic' }}>
                            Usually busiest: {busiestHour}:00–{busiestEnd}:00
                          </div>
                        </>
                      );
                    })() : (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#555', fontSize: '13px' }}>
                        No busyness data available
                      </div>
                    )}
                  </div>
                </div>`;

if (oldWidgetRegex.test(c)) {
  c = c.replace(oldWidgetRegex, newWidget);
  console.log('Widget replaced successfully');
} else {
  console.log('Widget regex did not match - skipping');
}

fs.writeFileSync('app/map/page.tsx', c);
console.log('Done!');
