"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import styles from './map.module.css';
import type { Place, FilterState, FilterKey } from '@/types';

const BCN_CENTER = { lat: 41.3851, lng: 2.1734 };
const GOOGLE_API_KEY = 'AIzaSyDYQ7swNdsixXWF3whewFgtaUZo8BIHb-c';

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getWalkingTime(fromLat: number, fromLng: number, toLat: number, toLng: number): string {
  const straightLine = haversine(fromLat, fromLng, toLat, toLng);
  const walkingDistance = straightLine * 1.4; // circuity factor
  const minutes = Math.round(walkingDistance / 83.3); // 5km/h walking speed
  return minutes <= 1 ? '1 min walk' : `${minutes} min walk`;
}

function isOpenNowLogic(openingHours?: string): boolean {
  // Real logic would parse openingHours. For now, default true if string exists.
  return !!openingHours;
}

export default function BeerMapPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [fetching, setFetching] = useState(true);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  
  // Mobile / UI state
  const [openDropdown, setOpenDropdown] = useState<'price' | 'vibe' | 'features' | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [bottomSheetState, setBottomSheetState] = useState<'collapsed' | 'half' | 'full'>('half');
  const [compareList, setCompareList] = useState<Place[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Filters
  const [priceLevel, setPriceLevel] = useState<number | null>(null); // 1, 2, 3
  const [vibeFilter, setVibeFilter] = useState<string>('all');
  const [featureFilter, setFeatureFilter] = useState<string>('all');
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<any[]>([]);
  const heatmapLayerRef = useRef<any>(null);

  // Fetch data
  useEffect(() => {
    fetch('/api/places')
      .then(r => r.json())
      .then(d => {
        setPlaces(d.places || []);
        setFetching(false);
      })
      .catch(e => { console.error(e); setFetching(false); });
  }, []);

  // Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLoc(BCN_CENTER),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setUserLoc(BCN_CENTER);
    }
  }, []);

  // Load Google Maps
  useEffect(() => {
    if (window.google?.maps?.Map) { setMapsLoaded(true); return; }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&v=beta`;
    s.async = true;
    s.onload = () => setMapsLoaded(true);
    document.head.appendChild(s);
  }, []);

  // Init Map
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || mapInstanceRef.current) return;
    const init = async () => {
      const { Map } = await google.maps.importLibrary("maps") as any;
      mapInstanceRef.current = new Map(mapRef.current, {
        center: BCN_CENTER,
        zoom: 13,
        mapId: 'BCN_BEER_MAP_V4',
        disableDefaultUI: true,
        zoomControl: true,
        backgroundColor: '#0a0a0f', // Match new design system
      });
    };
    init();
  }, [mapsLoaded]);

  // Filter Logic
  const filteredPlaces = useMemo(() => {
    return places.filter(p => {
      if (priceLevel && p.priceLevel !== priceLevel) return false;
      if (vibeFilter !== 'all' && (!p.vibe || !p.vibe.includes(vibeFilter))) return false;
      if (onlyOpenNow && !p.isOpenNow) return false;
      if (featureFilter !== 'all') {
        if (featureFilter === 'student' && !p.studentDiscount) return false;
        if (featureFilter === 'terrace' && !p.outdoorSeating) return false;
        // add more feature checks
      }
      return true;
    });
  }, [places, priceLevel, vibeFilter, featureFilter, onlyOpenNow]);

  // Render Markers (with basic clustering concept)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsLoaded) return;
    const render = async () => {
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as any;
      markersRef.current.forEach(m => (m.map = null));
      markersRef.current = [];

      // Simple grid clustering
      const gridSize = 0.003; 
      const grid: Record<string, Place[]> = {};
      
      filteredPlaces.forEach(p => {
        const gx = Math.floor(p.lat / gridSize);
        const gy = Math.floor(p.lng / gridSize);
        const key = `${gx},${gy}`;
        if (!grid[key]) grid[key] = [];
        grid[key].push(p);
      });

      Object.values(grid).forEach(cluster => {
        if (cluster.length >= 3) {
          // Render cluster circle
          const cLat = cluster.reduce((sum, p) => sum + p.lat, 0) / cluster.length;
          const cLng = cluster.reduce((sum, p) => sum + p.lng, 0) / cluster.length;
          
          const el = document.createElement('div');
          el.className = styles.clusterMarker;
          el.textContent = `${cluster.length}`;
          
          const marker = new AdvancedMarkerElement({
            map: mapInstanceRef.current,
            position: { lat: cLat, lng: cLng },
            content: el,
            zIndex: 15,
          });
          
          marker.addListener('click', () => {
            mapInstanceRef.current?.setZoom((mapInstanceRef.current?.getZoom() || 13) + 2);
            mapInstanceRef.current?.panTo({ lat: cLat, lng: cLng });
          });
          markersRef.current.push(marker);
        } else {
          // Render individual markers
          cluster.forEach((p, idx) => {
            const oLat = p.lat + (idx * 0.0001); // slight offset for overlapping
            const oLng = p.lng + (idx * 0.0001);
            
            const pin = document.createElement('div');
            pin.className = `${styles.pricePin} ${p.isOpenNow ? styles.pricePinOpen : ''} ${selectedPlace?.id === p.id ? styles.pricePinSelected : ''}`;
            
            const content = document.createElement('div');
            content.className = styles.pricePinContent;
            content.textContent = p.beerPriceStr || p.name.substring(0, 8);
            if (p.studentDiscount) content.textContent = `🎓 ${content.textContent}`;
            
            const pointer = document.createElement('div');
            pointer.className = styles.pinPointer;
            
            pin.appendChild(content);
            pin.appendChild(pointer);
            
            const marker = new AdvancedMarkerElement({
              map: mapInstanceRef.current,
              position: { lat: oLat, lng: oLng },
              content: pin,
              title: p.name,
              zIndex: selectedPlace?.id === p.id ? 2000 : 10,
            });
            
            marker.addListener('click', () => {
              setSelectedPlace(p);
              mapInstanceRef.current?.panTo({ lat: oLat, lng: oLng });
              setBottomSheetState('full'); // expand mobile sheet on click
            });
            markersRef.current.push(marker);
          });
        }
      });
    };
    render();
  }, [filteredPlaces, selectedPlace?.id, mapsLoaded]);

  // Heatmap Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsLoaded || !window.google) return;
    const updateHeatmap = async () => {
      const { HeatmapLayer } = await google.maps.importLibrary("visualization") as any;
      if (!heatmapLayerRef.current) {
        heatmapLayerRef.current = new HeatmapLayer({
          data: [],
          map: mapInstanceRef.current,
          gradient: ['rgba(0, 0, 0, 0)', '#8B0000', '#FF4500', '#FFD700', '#00FFFF'],
          radius: 35,
          opacity: 0.6,
        });
      }
      if (showHeatmap) {
        const heatmapData = places.map(p => new google.maps.LatLng(p.lat, p.lng));
        heatmapLayerRef.current.setData(heatmapData);
        heatmapLayerRef.current.setMap(mapInstanceRef.current);
      } else {
        heatmapLayerRef.current.setMap(null);
      }
    };
    updateHeatmap();
  }, [showHeatmap, places, mapsLoaded]);

  const toggleCompare = (p: Place, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompareList(prev => {
      if (prev.find(x => x.id === p.id)) return prev.filter(x => x.id !== p.id);
      if (prev.length >= 3) return prev;
      return [...prev, p];
    });
  };

  const handleDropdownToggle = (menu: 'price' | 'vibe' | 'features') => {
    setOpenDropdown(prev => prev === menu ? null : menu);
  };

  return (
    <div className={styles.appWrapper} onClick={() => setOpenDropdown(null)}>
      {/* ─── Map Container ─── */}
      <main className={styles.mapContainer}>
        <div ref={mapRef} style={{ width: '100%', height: '100%', paddingBottom: '320px' }} />
      </main>

      {/* ─── Top Filter Bar ─── */}
      <div className={`${styles.topFilterBar} glass`} onClick={e => e.stopPropagation()}>
        <div className={styles.navLogo} onClick={() => window.location.href = '/'}>
          🍺 go<span style={{color:'var(--amber)'}}>BCN</span>
        </div>
        
        <div className={styles.filterPillGroup}>
          {/* Price */}
          <button className={`${styles.filterPill} ${priceLevel ? styles.filterPillActive : ''}`} onClick={() => handleDropdownToggle('price')}>
            {priceLevel ? `€`.repeat(priceLevel) : 'Price'} ▾
            {openDropdown === 'price' && (
              <div className={styles.filterDropdown} onClick={e => e.stopPropagation()}>
                <div style={{display: 'flex', gap: '8px', flexDirection: 'column'}}>
                  <div onClick={() => setPriceLevel(null)} style={{cursor:'pointer', padding:'4px', color: priceLevel===null ? 'var(--amber)' : 'white'}}>All Prices</div>
                  <div onClick={() => setPriceLevel(1)} style={{cursor:'pointer', padding:'4px', color: priceLevel===1 ? 'var(--amber)' : 'white'}}>€ (Under €3.5)</div>
                  <div onClick={() => setPriceLevel(2)} style={{cursor:'pointer', padding:'4px', color: priceLevel===2 ? 'var(--amber)' : 'white'}}>€€ (€3.5 - €5)</div>
                  <div onClick={() => setPriceLevel(3)} style={{cursor:'pointer', padding:'4px', color: priceLevel===3 ? 'var(--amber)' : 'white'}}>€€€ (Over €5)</div>
                </div>
              </div>
            )}
          </button>

          {/* Vibe */}
          <button className={`${styles.filterPill} ${vibeFilter !== 'all' ? styles.filterPillActive : ''}`} onClick={() => handleDropdownToggle('vibe')}>
            {vibeFilter !== 'all' ? vibeFilter : 'Vibe'} ▾
            {openDropdown === 'vibe' && (
              <div className={styles.filterDropdown} onClick={e => e.stopPropagation()}>
                <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', width: '200px'}}>
                  {['all', 'cozy', 'party', 'date', 'sports', 'craft', 'student'].map(v => (
                    <div key={v} onClick={() => setVibeFilter(v)} 
                         style={{padding:'4px 8px', borderRadius:'12px', background: vibeFilter===v ? 'var(--amber-glow)' : 'rgba(255,255,255,0.1)', color: vibeFilter===v ? 'var(--amber)' : 'white', cursor:'pointer', fontSize:'12px', textTransform:'capitalize'}}>
                      {v}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </button>

          {/* Features */}
          <button className={`${styles.filterPill} ${featureFilter !== 'all' ? styles.filterPillActive : ''}`} onClick={() => handleDropdownToggle('features')}>
            {featureFilter !== 'all' ? featureFilter : 'Features'} ▾
            {openDropdown === 'features' && (
              <div className={styles.filterDropdown} onClick={e => e.stopPropagation()}>
                <div style={{display: 'flex', gap: '8px', flexDirection: 'column'}}>
                  <div onClick={() => setFeatureFilter('all')} style={{cursor:'pointer', color: featureFilter==='all' ? 'var(--amber)' : 'white'}}>All Features</div>
                  <div onClick={() => setFeatureFilter('terrace')} style={{cursor:'pointer', color: featureFilter==='terrace' ? 'var(--amber)' : 'white'}}>☀️ Terrace</div>
                  <div onClick={() => setFeatureFilter('student')} style={{cursor:'pointer', color: featureFilter==='student' ? 'var(--amber)' : 'white'}}>🎓 Student Discount</div>
                </div>
              </div>
            )}
          </button>

          {/* Open Now Toggle */}
          <button className={`${styles.filterPill} ${onlyOpenNow ? styles.filterPillActive : ''}`} onClick={() => setOnlyOpenNow(!onlyOpenNow)}>
            <span className={onlyOpenNow ? styles.openDot : styles.closedDot}></span>
            Open Now
          </button>

          {/* Heatmap Toggle */}
          <button className={`${styles.filterPill} ${showHeatmap ? styles.filterPillActive : ''}`} onClick={() => setShowHeatmap(!showHeatmap)}>
            🔥 Heatmap
          </button>
        </div>
      </div>

      {/* ─── Results Drawer / Bottom Sheet ─── */}
      <div className={`${styles.resultsDrawer} ${bottomSheetState === 'full' ? styles.resultsDrawerExpanded : bottomSheetState === 'half' ? styles.resultsDrawerHalf : ''}`}>
        <div className={styles.drawerHeader} onClick={() => setBottomSheetState(prev => prev === 'full' ? 'half' : prev === 'half' ? 'collapsed' : 'half')}>
          <div className={styles.dragHandle} />
          <div className={styles.drawerTitle}>{filteredPlaces.length} bars found</div>
        </div>
        
        <div className={styles.drawerScroll}>
          {fetching ? (
            Array(5).fill(0).map((_, i) => <div key={i} className={`${styles.resultCard} ${styles.skeleton}`} style={{height: '80px', marginBottom: '8px'}} />)
          ) : (
            filteredPlaces.map(p => (
              <div key={p.id} className={`${styles.resultCard} ${selectedPlace?.id === p.id ? styles.resultCardActive : ''}`}
                   onClick={() => { setSelectedPlace(p); mapInstanceRef.current?.panTo({ lat: p.lat, lng: p.lng }); }}>
                <div className={styles.resultPrice}>{p.beerPriceStr}</div>
                <div className={styles.resultInfo}>
                  <div className={styles.resultName}>{p.name}</div>
                  <div className={styles.resultMeta}>{p.neighborhood}</div>
                  <div style={{display:'flex', gap:'4px', marginTop:'4px'}}>
                    {p.vibe?.slice(0,2).map(v => <span key={v} className={styles.vibePill}>{v}</span>)}
                  </div>
                </div>
                <div className={styles.resultWalk}>
                  <span className={`${styles.badge} ${p.isOpenNow ? styles.badgeOpen : styles.badgeClosed}`}>
                    {p.isOpenNow ? 'Open' : 'Closed'}
                  </span>
                  <div style={{marginTop: '8px'}}>{userLoc ? getWalkingTime(userLoc.lat, userLoc.lng, p.lat, p.lng) : ''}</div>
                  
                  {/* Compare Checkbox */}
                  <div style={{marginTop: '8px'}} onClick={(e) => toggleCompare(p, e)}>
                    <input type="checkbox" checked={!!compareList.find(c => c.id === p.id)} readOnly style={{cursor:'pointer'}} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Compare Button Float ─── */}
      {compareList.length >= 2 && (
        <button className={`${styles.btnPrimary} ${styles.compareButtonFloat}`} onClick={() => setShowCompareModal(true)}>
          Compare ({compareList.length})
        </button>
      )}

      {/* ─── Detail Panel ─── */}
      <div className={`${styles.detailPanel} ${selectedPlace ? styles.detailPanelVisible : ''}`}>
        {selectedPlace && (
          <>
            <div className={styles.detailHeader}>
              {selectedPlace.imageUrl ? (
                <img src={selectedPlace.imageUrl} alt={selectedPlace.name} className={styles.detailImage} />
              ) : (
                <div className={styles.detailImage} style={{background: 'linear-gradient(45deg, #24243e, #1A1A2E)'}} />
              )}
              <div className={styles.detailImageGradient} />
              <button className={styles.closePanelBtn} onClick={() => { setSelectedPlace(null); setBottomSheetState('half'); }}>✕</button>
            </div>
            
            <div className={styles.detailContent}>
              <h2 className={styles.detailTitle}>{selectedPlace.name}</h2>
              <div className={styles.detailMeta}>
                <span className={`${styles.badge} ${styles.badgeNeighborhood}`}>{selectedPlace.neighborhood}</span>
                <span className={`${styles.badge} ${selectedPlace.isOpenNow ? styles.badgeOpen : styles.badgeClosed}`}>
                  {selectedPlace.isOpenNow ? 'Open Now' : 'Closed'}
                </span>
              </div>
              
              <div className={styles.priceBlock}>
                <div className={styles.priceIndicator}>{selectedPlace.beerPriceStr} / pint</div>
                <div className={styles.walkTime}>
                  🚶 {userLoc ? getWalkingTime(userLoc.lat, userLoc.lng, selectedPlace.lat, selectedPlace.lng) : '15 min walk'}
                </div>
              </div>

              {selectedPlace.studentDiscount && (
                <div className={styles.studentBanner}>
                  🎓 Student prices available
                </div>
              )}

              <div className={styles.vibePills}>
                {selectedPlace.vibe?.map(v => <span key={v} className={styles.vibePill}>{v}</span>)}
              </div>

              <div className={styles.featureIcons}>
                {selectedPlace.outdoorSeating && <span>☀️ Terrace</span>}
                {selectedPlace.hasSports && <span>📺 Sports</span>}
                {selectedPlace.liveMusic && <span>🎵 Music</span>}
              </div>

              {selectedPlace.tapCount && (
                <div style={{color:'var(--text-secondary)', fontSize:'14px', marginBottom:'24px'}}>
                  🍺 {selectedPlace.tapCount} taps available
                </div>
              )}

              <div style={{display:'flex', gap:'12px', marginTop:'auto'}}>
                <button className={styles.btnPrimary} style={{flex:1}} 
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`)}>
                  Get Directions
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Compare Modal ─── */}
      {showCompareModal && (
        <div className={styles.compareModal} onClick={() => setShowCompareModal(false)}>
          <div className={styles.compareTableContainer} onClick={e => e.stopPropagation()}>
            <button className={styles.closePanelBtn} onClick={() => setShowCompareModal(false)}>✕</button>
            <h2 style={{color:'white', marginBottom:'24px', fontFamily:"'Barlow Condensed', sans-serif"}}>Compare Bars</h2>
            <table className={styles.compareTable}>
              <thead>
                <tr>
                  <th>Feature</th>
                  {compareList.map(p => <th key={p.id}>{p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Price/pint</td>
                  {compareList.map(p => (
                    <td key={p.id}>
                      <span className={p.beerPrice === Math.min(...compareList.map(c => c.beerPrice || 999)) ? styles.bestValue : ''}>
                        {p.beerPriceStr}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Vibe</td>
                  {compareList.map(p => <td key={p.id}>{p.vibe?.join(', ') || '—'}</td>)}
                </tr>
                <tr>
                  <td>Walking Time</td>
                  {compareList.map(p => <td key={p.id}>{userLoc ? getWalkingTime(userLoc.lat, userLoc.lng, p.lat, p.lng) : '—'}</td>)}
                </tr>
                <tr>
                  <td>Student Discount</td>
                  {compareList.map(p => <td key={p.id} style={{color: p.studentDiscount ? 'var(--success)' : 'inherit'}}>{p.studentDiscount ? '✓' : '✗'}</td>)}
                </tr>
                <tr>
                  <td>Open Now</td>
                  {compareList.map(p => <td key={p.id} style={{color: p.isOpenNow ? 'var(--success)' : 'inherit'}}>{p.isOpenNow ? '✓' : '✗'}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
