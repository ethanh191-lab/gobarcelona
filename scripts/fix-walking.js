const fs = require('fs');
const path = 'app/map/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update distanceToWalk
const oldDist = `function distanceToWalk(meters: number): { mins: number; label: string } {
  const mins = Math.round(meters / 80); // 80m/min walking speed
  if (meters < 1000) return { mins, label: \`\${mins} min · \${Math.round(meters)}m\` };
  return { mins, label: \`\${mins} min · \${(meters / 1000).toFixed(1)}km\` };
}`;

const newDist = `function distanceToWalk(meters: number): { mins: number; label: string } {
  // Add a 1.35x circuity factor for urban walking (walking around blocks instead of a straight line)
  const realMeters = meters * 1.35;
  const mins = Math.round(realMeters / 75); // 75m/min walking speed (4.5 km/h)
  if (realMeters < 1000) return { mins, label: \`\${mins} min · \${Math.round(realMeters)}m\` };
  return { mins, label: \`\${mins} min · \${(realMeters / 1000).toFixed(1)}km\` };
}`;

content = content.replace(oldDist, newDist);

// Add realWalk state and useEffect
const oldState = `  const [selectedBeer, setSelectedBeer] = useState('all');`;
const newState = `  const [selectedBeer, setSelectedBeer] = useState('all');
  const [realWalk, setRealWalk] = useState<{ mins: string; dist: string } | null>(null);

  // Fetch real walking time from Google API
  useEffect(() => {
    if (selectedPlace && userLoc && window.google) {
      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix({
        origins: [{ lat: userLoc.lat, lng: userLoc.lng }],
        destinations: [{ lat: selectedPlace.lat, lng: selectedPlace.lng }],
        travelMode: google.maps.TravelMode.WALKING,
      }, (response, status) => {
        if (status === 'OK' && response && response.rows[0].elements[0].status === 'OK') {
          const element = response.rows[0].elements[0];
          setRealWalk({
            mins: element.duration.text,
            dist: element.distance.text,
          });
        } else {
          setRealWalk(null);
        }
      });
    } else {
      setRealWalk(null);
    }
  }, [selectedPlace, userLoc]);`;

content = content.replace(oldState, newState);

// Update Detail Panel UI to use realWalk
const oldUi = `                  return (
                    <div className={styles.walkingInfo}>
                      🚶 <strong>{walk.label}</strong> <span style={{ color: '#60a5fa', marginLeft: '4px' }}>walking</span>
                    </div>
                  );`;

const newUi = `                  return (
                    <div className={styles.walkingInfo}>
                      🚶 <strong>{realWalk ? \`\${realWalk.mins} · \${realWalk.dist}\` : walk.label}</strong> <span style={{ color: '#60a5fa', marginLeft: '4px' }}>walking</span>
                    </div>
                  );`;

content = content.replace(oldUi, newUi);

fs.writeFileSync(path, content);
console.log('Fixed walking accuracy');
