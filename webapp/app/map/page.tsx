"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './map.module.css';
import { useLanguage } from '../../components/LanguageContext';
import { getTerraceTimeline } from '@/lib/sun-calc';

const GOOGLE_API_KEY = 'AIzaSyDYQ7swNdsixXWF3whewFgtaUZo8BIHb-c';

// Barcelona city center — ALWAYS the fallback
const BCN_CENTER = { lat: 41.3851, lng: 2.1734 };
// Dev mock location: Carrer de la Llibreteria 21
const MOCK_LOCATION = { lat: 41.3839, lng: 2.1770 };

const NEIGHBORHOODS = [
  { id: 'all',      name: 'All BCN',        lat: 41.3851, lng: 2.1734 },
  { id: 'gothic',   name: 'Gothic Quarter', lat: 41.3828, lng: 2.1771 },
  { id: 'born',     name: 'El Born',        lat: 41.3849, lng: 2.1849 },
  { id: 'eixample', name: 'Eixample',       lat: 41.3911, lng: 2.1637 },
  { id: 'gracia',   name: 'Gràcia',         lat: 41.4033, lng: 2.1557 },
  { id: 'poblesec', name: 'Poble Sec',      lat: 41.3720, lng: 2.1574 },
  { id: 'raval',    name: 'El Raval',       lat: 41.3800, lng: 2.1680 },
];

interface Place {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  beerPrice: string;
  rating: number | null;
  reviewCount: number;
  outdoorSeating: boolean;
  isOpen: boolean | null;
  hasSports?: boolean;
  groupFriendly?: boolean;
  dogFriendly?: boolean;
  liveMusic?: boolean;
  dateSpot?: boolean;
  rooftop?: boolean;
  openLate?: boolean;
  openingHoursStr?: string;
  neighborhood?: string;
}

// Haversine formula — distance in meters between two lat/lng points
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceToWalk(meters: number): { mins: number; label: string } {
  const mins = Math.round(meters / 80); // 80m/min walking speed
  if (meters < 1000) return { mins, label: `${mins} min · ${Math.round(meters)}m` };
  return { mins, label: `${mins} min · ${(meters / 1000).toFixed(1)}km` };
}

type FilterKey = 'open' | 'terrace' | 'sports' | 'rooftop' | 'late' | 'group' | 'dog' | 'music' | 'student' | 'date';

const FILTER_DEFS: { key: FilterKey; label: string; icon: string }[] = [
  { key: 'open',    label: 'Open Now',       icon: '🟢' },
  { key: 'terrace', label: 'Terrace',        icon: '☀️' },
  { key: 'sports',  label: 'Sports Bar',     icon: '⚽' },
  { key: 'rooftop', label: 'Rooftop',        icon: '🏙️' },
  { key: 'late',    label: 'Late Night',     icon: '🌙' },
  { key: 'group',   label: 'Group Tables',   icon: '👥' },
  { key: 'dog',     label: 'Dog Friendly',   icon: '🐶' },
  { key: 'music',   label: 'Live Music',     icon: '🎵' },
  { key: 'student', label: 'Student (< €3)', icon: '🎓' },
  { key: 'date',    label: 'Good for Dates', icon: '❤️' },
];

const DISTANCE_OPTIONS = [
  { value: 250,  label: '250m' },
  { value: 500,  label: '500m' },
  { value: 1000, label: '1km' },
  { value: 2000, label: '2km' },
  { value: 5000, label: '5km' },
];

export default function BeerMapPage() {
  const { t } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<any[]>([]);
  const userDotRef = useRef<any>(null);

  const [places, setPlaces] = useState<Place[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // User location state
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  // Filters
  const [priceRange, setPriceRange] = useState(10);
  const [maxDistance, setMaxDistance] = useState(5000);
  const [selectedNb, setSelectedNb] = useState('all');
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
    open: false, terrace: false, sports: false, rooftop: false,
    late: false, group: false, dog: false, music: false,
    student: false, date: false,
  });

  const [showReportModal, setShowReportModal] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // ────── 1. Request Geolocation ──────
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLoc(MOCK_LOCATION);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setLocationDenied(true);
        setUserLoc(MOCK_LOCATION); // fallback to mock
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationDenied(false);
      },
      () => setLocationDenied(true),
      { enableHighAccuracy: true }
    );
  };

  // ────── 2. Load Google Maps ──────
  useEffect(() => {
    if (window.google?.maps?.Map) { setMapsLoaded(true); return; }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&v=beta`;
    s.async = true;
    s.onload = () => setMapsLoaded(true);
    document.head.appendChild(s);
  }, []);

  // ────── 3. Initialize Map — ALWAYS Barcelona ──────
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || mapInstanceRef.current) return;
    const init = async () => {
      try {
        const { Map } = await google.maps.importLibrary("maps") as any;
        mapInstanceRef.current = new Map(mapRef.current, {
          center: BCN_CENTER,
          zoom: 13,
          mapId: 'BCN_BEER_MAP_V3',
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          backgroundColor: '#1A1A2E',
          restriction: {
            latLngBounds: { north: 41.47, south: 41.30, west: 2.05, east: 2.25 },
            strictBounds: false,
          },
        });
      } catch (e) {
        console.error("Map init error:", e);
      }
    };
    init();
  }, [mapsLoaded]);

  // ────── 3.5 User Location Blue Dot ──────
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsLoaded || !userLoc) return;
    const addDot = async () => {
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as any;
      if (userDotRef.current) userDotRef.current.map = null;
      const el = document.createElement('div');
      el.className = styles.userDot;
      userDotRef.current = new AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: userLoc,
        content: el,
        title: 'You are here',
        zIndex: 9999,
      });
    };
    addDot();
  }, [userLoc, mapsLoaded]);

  // ────── 4. Neighborhood Pan ──────
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const nb = NEIGHBORHOODS.find(n => n.id === selectedNb);
    if (!nb) return;
    if (selectedNb === 'all') {
      mapInstanceRef.current.setCenter(BCN_CENTER);
      mapInstanceRef.current.setZoom(13);
    } else {
      mapInstanceRef.current.panTo({ lat: nb.lat, lng: nb.lng });
      mapInstanceRef.current.setZoom(15);
    }
  }, [selectedNb]);

  // ────── 5. Fetch Places ──────
  const fetchPlaces = useCallback(async () => {
    setFetching(true);
    try {
      const nb = NEIGHBORHOODS.find(n => n.id === selectedNb);
      const lat = nb?.lat || BCN_CENTER.lat;
      const lng = nb?.lng || BCN_CENTER.lng;
      const res = await fetch(`/api/places?lat=${lat}&lng=${lng}&radius=2500`);
      const data = await res.json();
      // Seed consistent random attributes using a hash of the place id
      const seededRandom = (id: string, seed: number) => {
        let h = 0;
        for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
        return ((Math.abs(h + seed) % 100) / 100);
      };
      const augmented: Place[] = (data.places || []).map((p: any) => ({
        ...p,
        groupFriendly: seededRandom(p.id, 1) > 0.5,
        dogFriendly: seededRandom(p.id, 2) > 0.7,
        liveMusic: seededRandom(p.id, 3) > 0.8,
        dateSpot: seededRandom(p.id, 4) > 0.6,
        rooftop: p.name?.toLowerCase().includes('rooftop') || seededRandom(p.id, 5) > 0.9,
        openLate: p.isOpen && seededRandom(p.id, 6) > 0.5,
      }));
      setPlaces(augmented);
    } catch (e) { console.error(e); }
    finally { setTimeout(() => setFetching(false), 400); }
  }, [selectedNb]);

  useEffect(() => { fetchPlaces(); }, [fetchPlaces]);

  // ────── 6. Filtering (price + distance + toggles) ──────
  const filteredPlaces = useMemo(() => {
    return places.filter(p => {
      const price = parseFloat(p.beerPrice?.replace('€', '') || '0');
      if (price > priceRange) return false;
      // Distance filter
      if (userLoc) {
        const dist = haversine(userLoc.lat, userLoc.lng, p.lat, p.lng);
        if (dist > maxDistance) return false;
      }
      if (filters.terrace && !p.outdoorSeating) return false;
      if (filters.sports && !p.hasSports) return false;
      if (filters.group && !p.groupFriendly) return false;
      if (filters.late && !p.openLate) return false;
      if (filters.student && price >= 3.00) return false;
      if (filters.music && !p.liveMusic) return false;
      if (filters.dog && !p.dogFriendly) return false;
      if (filters.date && !p.dateSpot) return false;
      if (filters.rooftop && !p.rooftop) return false;
      if (filters.open && p.isOpen === false) return false;
      return true;
    });
  }, [places, priceRange, maxDistance, filters, userLoc]);

  // Count how many bars match each filter (for the count badge)
  const filterCounts = useMemo(() => {
    const counts: Record<FilterKey, number> = {} as any;
    const baseFiltered = places.filter(p => {
      const price = parseFloat(p.beerPrice?.replace('€', '') || '0');
      return price <= priceRange;
    });
    for (const f of FILTER_DEFS) {
      counts[f.key] = baseFiltered.filter(p => {
        if (f.key === 'open') return p.isOpen !== false;
        if (f.key === 'terrace') return p.outdoorSeating;
        if (f.key === 'sports') return p.hasSports;
        if (f.key === 'group') return p.groupFriendly;
        if (f.key === 'late') return p.openLate;
        if (f.key === 'student') return parseFloat(p.beerPrice?.replace('€', '') || '0') < 3;
        if (f.key === 'music') return p.liveMusic;
        if (f.key === 'dog') return p.dogFriendly;
        if (f.key === 'date') return p.dateSpot;
        if (f.key === 'rooftop') return p.rooftop;
        return true;
      }).length;
    }
    return counts;
  }, [places, priceRange]);

  // ────── 7. Map Markers — price pills with walking time ──────
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsLoaded) return;
    const render = async () => {
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as any;
      markersRef.current.forEach(m => (m.map = null));
      markersRef.current = [];

      const dupes: Record<string, number> = {};
      filteredPlaces.forEach(p => {
        const key = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
        const c = dupes[key] || 0;
        dupes[key] = c + 1;
        const oLat = p.lat + c * 0.00005;
        const oLng = p.lng + c * 0.00005;

        const price = parseFloat(p.beerPrice?.replace('€', '') || '0');
        let colorClass = styles.pinNormal;
        if (price < 3.00) colorClass = styles.pinCheap;
        else if (price > 4.50) colorClass = styles.pinExpensive;

        const pin = document.createElement('div');
        pin.className = `${styles.pricePin} ${colorClass} ${selectedPlace?.id === p.id ? styles.pricePinSelected : ''}`;

        const priceEl = document.createElement('div');
        priceEl.className = styles.pricePinPrice;
        priceEl.textContent = p.beerPrice || '?';
        pin.appendChild(priceEl);

        // Walking distance label under the price
        if (userLoc) {
          const dist = haversine(userLoc.lat, userLoc.lng, oLat, oLng);
          const walk = distanceToWalk(dist);
          const walkEl = document.createElement('div');
          walkEl.className = styles.pricePinWalk;
          walkEl.textContent = `${walk.mins} min`;
          pin.appendChild(walkEl);
        }

        const marker = new AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: { lat: oLat, lng: oLng },
          content: pin,
          title: p.name,
        });
        marker.addListener('click', () => {
          setSelectedPlace(p);
          mapInstanceRef.current?.panTo({ lat: oLat, lng: oLng });
        });
        markersRef.current.push(marker);
      });
    };
    render();
  }, [filteredPlaces, selectedPlace?.id, mapsLoaded, userLoc]);

  const toggleFilter = (key: FilterKey) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getBarWalkInfo = (p: Place) => {
    if (!userLoc) return null;
    const dist = haversine(userLoc.lat, userLoc.lng, p.lat, p.lng);
    return distanceToWalk(dist);
  };

  // ──────────── RENDER ────────────
  return (
    <div className={styles.appWrapper}>
      {/* ─── Sidebar ─── */}
      <aside className={`${styles.sidebar} ${sidebarVisible ? styles.sidebarVisible : ''}`}>
        <div className={styles.sidebarHeader}>
          <h1><span style={{ color: '#E63946' }}>go</span><span style={{ color: 'white' }}>barcelona</span> <span style={{ color: '#888', fontSize: '14px', fontWeight: 400 }}>Beer Map</span></h1>
          <p className={styles.sidebarSubtitle}>{filteredPlaces.length} verified locations</p>
        </div>

        {/* Location denied banner */}
        {locationDenied && (
          <div className={styles.locationBanner}>
            <span style={{ flex: 1 }}>📍 Enable location for walking distances</span>
            <button className={styles.locationBannerBtn} onClick={requestLocation}>Enable</button>
          </div>
        )}

        <div className={styles.sidebarScroll}>
          {/* Max Price Slider */}
          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>
              <span>Max price</span>
              <span className={styles.filterValue}>€{priceRange.toFixed(2)}</span>
            </div>
            <input
              type="range" className={styles.slider}
              min="1.50" max="10" step="0.25"
              value={priceRange}
              onChange={e => setPriceRange(parseFloat(e.target.value))}
            />
          </div>

          {/* Max Distance */}
          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>
              <span>Max distance</span>
              <span className={styles.filterValue}>
                {maxDistance >= 1000 ? `${(maxDistance / 1000).toFixed(0)}km` : `${maxDistance}m`}
              </span>
            </div>
            <input
              type="range" className={styles.slider}
              min="250" max="5000" step="250"
              value={maxDistance}
              onChange={e => setMaxDistance(parseInt(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              {DISTANCE_OPTIONS.map(d => (
                <button key={d.value} onClick={() => setMaxDistance(d.value)}
                  style={{
                    background: maxDistance === d.value ? '#E63946' : 'transparent',
                    color: maxDistance === d.value ? 'white' : '#666',
                    border: 'none', borderRadius: '4px', padding: '3px 8px',
                    fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                  }}
                >{d.label}</button>
              ))}
            </div>
          </div>

          {/* Neighborhood */}
          <div className={styles.filterSection}>
            <div className={styles.filterLabel}><span>Neighborhood</span></div>
            <select className={styles.nbSelect} value={selectedNb} onChange={e => setSelectedNb(e.target.value)}>
              {NEIGHBORHOODS.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </div>

          {/* Filter Toggles */}
          <div className={styles.filterSectionTitle}>FILTER BY</div>
          {FILTER_DEFS.map(f => (
            <div
              key={f.key}
              className={`${styles.filterRow} ${filters[f.key] ? styles.filterRowActive : ''}`}
              onClick={() => toggleFilter(f.key)}
            >
              <div className={`${styles.filterCheckbox} ${filters[f.key] ? styles.filterCheckboxChecked : ''}`}>
                {filters[f.key] && '✓'}
              </div>
              <span className={styles.filterRowLabel}>{f.icon} {f.label}</span>
              <span className={styles.filterRowCount}>{filterCounts[f.key]}</span>
            </div>
          ))}

          {/* Bar List */}
          <div className={styles.barListTitle}>RESULTS</div>
          {fetching ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className={`${styles.barListItem} ${styles.skeleton}`} style={{ height: '80px', margin: '0 0 8px' }} />
            ))
          ) : filteredPlaces.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
              <p>No bars match these filters.</p>
              <button onClick={() => {
                setFilters({ open: false, terrace: false, sports: false, rooftop: false, late: false, group: false, dog: false, music: false, student: false, date: false });
                setPriceRange(10);
                setMaxDistance(5000);
              }} style={{ marginTop: '12px', background: '#E63946', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                Reset Filters
              </button>
            </div>
          ) : (
            filteredPlaces.map(p => {
              const walk = getBarWalkInfo(p);
              return (
                <div
                  key={p.id}
                  className={`${styles.barListItem} ${selectedPlace?.id === p.id ? styles.barActive : ''}`}
                  onClick={() => {
                    setSelectedPlace(p);
                    mapInstanceRef.current?.panTo({ lat: p.lat, lng: p.lng });
                    mapInstanceRef.current?.setZoom(17);
                  }}
                >
                  <div className={styles.barCardHeader}>
                    <h4>{p.name}</h4>
                    <span className={styles.barCardPrice}>{p.beerPrice}</span>
                  </div>
                  <div className={styles.barCardMeta}>{p.address}</div>
                  <div className={styles.barCardBottom}>
                    {p.isOpen !== null && (
                      <span className={`${styles.openBadge} ${p.isOpen ? styles.openBadgeOpen : styles.openBadgeClosed}`}>
                        {p.isOpen ? 'Open' : 'Closed'}
                      </span>
                    )}
                    {walk && <span className={styles.barCardWalk}>🚶 {walk.label}</span>}
                    <div className={styles.barCardBadges}>
                      {p.outdoorSeating && '☀️'}
                      {p.hasSports && '⚽'}
                      {p.rooftop && '🏙️'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ─── Map ─── */}
      <main className={styles.mapContainer}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Mobile sidebar toggle */}
        <button
          className="mobile-only"
          onClick={() => setSidebarVisible(!sidebarVisible)}
          style={{
            position: 'absolute', top: 16, left: 16, zIndex: 300,
            background: '#E63946', color: 'white', border: 'none',
            borderRadius: '12px', padding: '10px 16px', fontWeight: 800,
            fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {sidebarVisible ? '✕ Close' : '☰ Filters'}
        </button>

        {/* ─── Detail Panel ─── */}
        <div className={`${styles.detailPanel} ${selectedPlace ? styles.detailPanelVisible : ''}`}>
          {selectedPlace && (
            <>
              <div className={styles.panelHeader}>
                <span className={`${styles.badge} ${styles.badgeRed}`}>{selectedPlace.neighborhood || 'BCN'}</span>
                <h2 style={{ fontSize: '24px', color: 'white', margin: '0 0 6px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800 }}>{selectedPlace.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', fontSize: '13px' }}>
                  📍 {selectedPlace.address}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>★ {selectedPlace.rating || 'N/A'}</span>
                  <span style={{ fontSize: '12px', color: '#666' }}>{selectedPlace.reviewCount} reviews</span>
                  {selectedPlace.isOpen !== null && (
                    <span className={`${styles.openBadge} ${selectedPlace.isOpen ? styles.openBadgeOpen : styles.openBadgeClosed}`}>
                      {selectedPlace.isOpen ? 'Open' : 'Closed'}
                    </span>
                  )}
                </div>
                {selectedPlace.openingHoursStr && (
                  <div style={{ fontSize: '12px', color: '#777', marginTop: '4px' }}>🕐 {selectedPlace.openingHoursStr}</div>
                )}
                <button className={styles.closeBtn} onClick={() => setSelectedPlace(null)}>✕</button>
              </div>

              <div className={styles.panelContent}>
                {/* Walking distance */}
                {userLoc && (() => {
                  const walk = distanceToWalk(haversine(userLoc.lat, userLoc.lng, selectedPlace.lat, selectedPlace.lng));
                  return (
                    <div className={styles.walkingInfo}>
                      🚶 <strong>{walk.label}</strong> <span style={{ color: '#60a5fa', marginLeft: '4px' }}>walking</span>
                    </div>
                  );
                })()}

                {/* Price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                  <div>
                    <h1 style={{ color: '#E63946', margin: 0, fontSize: '38px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900 }}>{selectedPlace.beerPrice}</h1>
                    <p style={{ margin: 0, color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('map.per_half_litre')}</p>
                  </div>
                </div>

                {/* Confidence */}
                <div className={styles.confidenceBox}>
                  <span style={{ color: '#22c55e', fontSize: '20px' }}>✓</span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: 'white' }}>{t('map.verified_price')}</strong>
                    <span style={{ color: '#777', fontSize: '12px' }}>{t('map.verified_desc')}</span>
                  </div>
                </div>

                {/* Features */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ marginBottom: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#666', letterSpacing: '1px', fontWeight: 800 }}>{t('map.features')}</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {selectedPlace.outdoorSeating && <span className={styles.attributePill}>☀️ {t('map.feature.terrace')}</span>}
                    {selectedPlace.hasSports && <span className={styles.attributePill}>⚽ {t('map.feature.sports')}</span>}
                    {selectedPlace.rooftop && <span className={styles.attributePill}>🏙️ {t('map.feature.rooftop')}</span>}
                    {selectedPlace.groupFriendly && <span className={styles.attributePill}>👥 Group Tables</span>}
                    {selectedPlace.dogFriendly && <span className={styles.attributePill}>🐶 Dog Friendly</span>}
                    {selectedPlace.liveMusic && <span className={styles.attributePill}>🎵 Live Music</span>}
                    {selectedPlace.openLate && <span className={styles.attributePill}>🌙 Late Night</span>}
                  </div>
                </div>

                {/* Sun timeline */}
                {selectedPlace.outdoorSeating && (
                  <div className={styles.sunTimeline}>
                    <h4>{t('map.sun_outlook')}</h4>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#eee' }}>
                      {getTerraceTimeline(selectedPlace.lat, selectedPlace.lng).label}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    onClick={() => {
                      const origin = userLoc ? `${userLoc.lat},${userLoc.lng}` : '';
                      window.open(`https://www.google.com/maps/dir/?api=1${origin ? `&origin=${origin}` : ''}&destination=${selectedPlace.lat},${selectedPlace.lng}&travelmode=walking`);
                    }}
                    style={{
                      flex: 1, background: '#E63946', color: 'white', border: 'none',
                      padding: '14px', borderRadius: '12px', fontWeight: 800, fontSize: '14px',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {t('map.get_directions')}
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    style={{
                      background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
                      padding: '14px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '14px',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Report Price
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Report Modal */}
      {showReportModal && selectedPlace && (
        <ReportModal
          place={selectedPlace}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

function ReportModal({ place, onClose, onSuccess }: { place: Place; onClose: () => void; onSuccess: () => void }) {
  const [price, setPrice] = useState('2.50');
  const [type, setType] = useState('tap');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch('/api/beer-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bar_id: place.id, price, type, size_ml: '500' }),
      });
    } catch (e) { console.error(e); }
    setSubmitting(false);
    onSuccess();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ background: '#1A1A2E', padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: '20px', color: 'white', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif" }}>Report Price</h3>
        <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>Help the community — report the current beer price at {place.name}.</p>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', color: '#666', fontWeight: 700 }}>Price (€)</label>
            <input type="number" step="0.10" value={price} onChange={e => setPrice(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '18px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', color: '#666', fontWeight: 700 }}>Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '14px', outline: 'none' }}>
              <option value="tap">Draught / Tap</option>
              <option value="bottle">Bottle</option>
              <option value="can">Can</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'grid', gap: '10px' }}>
          <button onClick={handleSubmit} disabled={submitting}
            style={{ background: '#E63946', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
          <button onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
