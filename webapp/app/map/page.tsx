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

const NEIGHBOURHOODS = [
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
  neighbourhood?: string;
  // New features
  happyHourStart?: string;
  happyHourEnd?: string;
  happyHourPrice?: number;
  beersOnTap?: string[];
  studentDiscount?: boolean;
  studentPrice?: number;
  openedAt?: string;
  status?: string;
  closureNote?: string;
  reopeningDate?: string;
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

function isHappyHourActive(start?: string, end?: string): boolean {
  if (!start || !end) return false;
  const now = new Date();
  const time = now.getHours() * 100 + now.getMinutes();
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  const s = sH * 100 + sM;
  const e = eH * 100 + eM;
  if (e < s) return time >= s || time <= e; // spans midnight
  return time >= s && time <= e;
}

function getBusynessLevel(): { label: string; color: string } {
  const hour = new Date().getHours();
  // Simple mock: busy at lunch (13-15) and dinner (20-23)
  if ((hour >= 13 && hour <= 15) || (hour >= 20 && hour <= 23)) {
    return { label: 'Busy now', color: '#f59e0b' };
  }
  if (hour >= 23 || hour <= 2) {
    return { label: 'Very busy now', color: '#ef4444' };
  }
  return { label: 'Quiet now', color: '#22c55e' };
}

function distanceToWalk(meters: number): { mins: number; label: string } {
  const mins = Math.round(meters / 80); // 80m/min walking speed
  if (meters < 1000) return { mins, label: `${mins} min · ${Math.round(meters)}m` };
  return { mins, label: `${mins} min · ${(meters / 1000).toFixed(1)}km` };
}

type FilterKey = 'open' | 'terrace' | 'sports' | 'rooftop' | 'late' | 'group' | 'dog' | 'music' | 'student' | 'date' | 'happyHour' | 'new' | 'closed';

const FILTER_DEFS: { key: FilterKey; label: string; icon: string }[] = [
  { key: 'open',      label: 'Open Now',       icon: '🟢' },
  { key: 'happyHour', label: 'Happy Hour Now', icon: '⏰' },
  { key: 'terrace',   label: 'Terrace',        icon: '☀️' },
  { key: 'sports',    label: 'Sports Bar',     icon: '⚽' },
  { key: 'rooftop',   label: 'Rooftop',        icon: '🏙️' },
  { key: 'late',      label: 'Late Night',     icon: '🌙' },
  { key: 'group',     label: 'Group Tables',   icon: '👥' },
  { key: 'dog',       label: 'Dog Friendly',   icon: '🐶' },
  { key: 'music',     label: 'Live Music',     icon: '🎵' },
  { key: 'student',   label: 'Student Discount', icon: '🎓' },
  { key: 'new',       label: 'New Openings',   icon: '🆕' },
  { key: 'closed',    label: 'Show Closed',    icon: '🚫' },
  { key: 'date',      label: 'Good for Dates', icon: '❤️' },
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
    student: false, date: false, happyHour: false, new: false, closed: false,
  });
  const [selectedBeer, setSelectedBeer] = useState('all');

  const COMMON_BEERS = ['Estrella Damm', 'Moritz', 'Voll-Damm', 'Estrella Galicia', 'Heineken', 'Mahou', 'San Miguel'];

  const [showReportModal, setShowReportModal] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(true);
  const [compareList, setCompareList] = useState<Place[]>([]);

  const toggleCompare = (p: Place) => {
    setCompareList(prev => {
      if (prev.find(x => x.id === p.id)) return prev.filter(x => x.id !== p.id);
      if (prev.length >= 3) return prev;
      return [...prev, p];
    });
  };

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

  // ────── 4. Neighbourhood Pan ──────
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const nb = NEIGHBOURHOODS.find(n => n.id === selectedNb);
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
      const nb = NEIGHBOURHOODS.find(n => n.id === selectedNb);
      const lat = nb?.lat || BCN_CENTER.lat;
      const lng = nb?.lng || BCN_CENTER.lng;
      const res = await fetch(`/api/places?lat=${lat}&lng=${lng}&radius=5000`);
      const data = await res.json();
      setPlaces(data.places || []);
    } catch (e) { console.error(e); }
    finally { setTimeout(() => setFetching(false), 400); }
  }, [selectedNb]);

  useEffect(() => { fetchPlaces(); }, [fetchPlaces]);

  // ────── 6. Filtering (price + distance + toggles) ──────
  const filteredPlaces = useMemo(() => {
    return places.filter(p => {
      if (p.status === 'permanently_closed' && !filters.closed) return false;
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
      if (filters.student && !p.studentDiscount) return false;
      if (filters.new && !(p.openedAt && (new Date().getTime() - new Date(p.openedAt).getTime()) < 90 * 24 * 60 * 60 * 1000)) return false;
      if (filters.happyHour && !isHappyHourActive(p.happyHourStart, p.happyHourEnd)) return false;
      if (selectedBeer !== 'all' && !(p.beersOnTap && p.beersOnTap.includes(selectedBeer))) return false;
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
        if (f.key === 'student') return !!p.studentDiscount;
        if (f.key === 'new') return !!(p.openedAt && (new Date().getTime() - new Date(p.openedAt).getTime()) < 90 * 24 * 60 * 60 * 1000);
        if (f.key === 'happyHour') return isHappyHourActive(p.happyHourStart, p.happyHourEnd);
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

        const rawPrice = p.beerPrice?.replace('€', '');
        const price = (rawPrice && rawPrice !== '?' && rawPrice !== '0.00') ? parseFloat(rawPrice) : null;
        
        let colorClass = styles.pinUnknown;
        if (price !== null) {
          if (price < 3.00) colorClass = styles.pinCheap;
          else if (price > 4.50) colorClass = styles.pinExpensive;
          else colorClass = styles.pinNormal;
        }

        if (p.status === 'temporarily_closed') colorClass = styles.pinClosed;

        const pin = document.createElement('div');
        pin.className = `${styles.pricePin} ${colorClass} ${selectedPlace?.id === p.id ? styles.pricePinSelected : ''}`;

        // NEW Badge on Pin
        const isNew = p.openedAt && (new Date().getTime() - new Date(p.openedAt).getTime()) < 90 * 24 * 60 * 60 * 1000;
        if (isNew) {
          const newEl = document.createElement('div');
          newEl.className = styles.newBadgePin;
          newEl.textContent = 'NEW';
          pin.appendChild(newEl);
        }

        const priceEl = document.createElement('div');
        priceEl.className = styles.pricePinPrice;
        priceEl.textContent = p.status === 'temporarily_closed' ? 'CLOSED' : (p.beerPrice || '?');
        
        // Student icon on price tag
        if (p.studentDiscount) {
          priceEl.textContent = `🎓 ${priceEl.textContent}`;
        }
        
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

  const isHH = selectedPlace ? isHappyHourActive(selectedPlace.happyHourStart, selectedPlace.happyHourEnd) : false;
  const busy = selectedPlace ? getBusynessLevel() : { label: '', color: '' };
  const isNew = selectedPlace && selectedPlace.openedAt ? (new Date().getTime() - new Date(selectedPlace.openedAt).getTime()) < 90 * 24 * 60 * 60 * 1000 : false;

  // ──────────── RENDER ────────────
  return (
    <div className={styles.appWrapper}>
      {/* ─── Sidebar ─── */}
      <aside className={`${styles.sidebar} ${sidebarVisible ? styles.sidebarVisible : ''}`}>
        <div className={styles.sidebarHeader}>
          <h1><span style={{ color: '#E63946' }}>go</span><span style={{ color: 'white' }}>barcelona</span> <span style={{ color: '#888', fontSize: '14px', fontWeight: 400 }}>Beer Map</span></h1>
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
                .sort((a, b) => parseFloat(a.beerPrice.replace('€', '')) - parseFloat(b.beerPrice.replace('€', '')))
                .slice(0, 5)
                .map((p, i) => (
                  <div key={p.id} className={styles.leaderboardItem} onClick={() => {
                    setSelectedPlace(p);
                    mapInstanceRef.current?.panTo({ lat: p.lat, lng: p.lng });
                    mapInstanceRef.current?.setZoom(17);
                  }}>
                    <span className={styles.rank}>{i + 1}</span>
                    <div className={styles.lbInfo}>
                      <div className={styles.lbName}>{p.name}</div>
                      <div className={styles.lbNb}>{p.neighborhood}</div>
                    </div>
                    <span className={styles.lbPrice}>{p.beerPrice}</span>
                  </div>
                ))}
            </div>
          )}
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

          {/* Tap Beer */}
          <div className={styles.filterSection}>
            <div className={styles.filterLabel}><span>Tap Beer</span></div>
            <select className={styles.nbSelect} value={selectedBeer} onChange={e => setSelectedBeer(e.target.value)}>
              <option value="all">All Brands</option>
              {COMMON_BEERS.map(b => <option key={b} value={b}>{b}</option>)}
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
                setFilters({ open: false, terrace: false, sports: false, rooftop: false, late: false, group: false, dog: false, music: false, student: false, date: false, happyHour: false, new: false, closed: false });
                setPriceRange(10);
                setMaxDistance(5000);
              }} style={{ marginTop: '12px', background: '#E63946', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                Reset Filters
              </button>
            </div>
          ) : (
            filteredPlaces.map(p => {
              const walk = getBarWalkInfo(p);
              const isHH = isHappyHourActive(p.happyHourStart, p.happyHourEnd);
              const busy = getBusynessLevel();
              const isNew = p.openedAt && (new Date().getTime() - new Date(p.openedAt).getTime()) < 90 * 24 * 60 * 60 * 1000;
              
              return (
                <div
                  key={p.id}
                  className={`${styles.barListItem} ${selectedPlace?.id === p.id ? styles.barActive : ''} ${p.status === 'temporarily_closed' ? styles.barClosed : ''}`}
                  onClick={() => {
                    setSelectedPlace(p);
                    mapInstanceRef.current?.panTo({ lat: p.lat, lng: p.lng });
                    mapInstanceRef.current?.setZoom(17);
                  }}
                >
                  <div className={styles.barCardHeader}>
                    <h4>
                      <span className={styles.busyDot} style={{ background: busy.color }} title={busy.label} />
                      {p.name}
                      {isNew && <span className={styles.newBadgeMini}>NEW</span>}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span className={styles.barCardPrice}>{p.beerPrice}</span>
                      <button 
                        className={`${styles.compareMiniBtn} ${compareList.find(x => x.id === p.id) ? styles.compareMiniBtnActive : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleCompare(p); }}
                      >
                        {compareList.find(x => x.id === p.id) ? 'Added' : '+ Compare'}
                      </button>
                    </div>
                  </div>
                  <div className={styles.barCardMeta}>{p.address}</div>
                  <div className={styles.barCardBottom}>
                    {p.status === 'temporarily_closed' ? (
                      <span className={styles.statusWarning}>⚠️ Temporarily Closed</span>
                    ) : p.isOpen !== null && (
                      <span className={`${styles.openBadge} ${p.isOpen ? styles.openBadgeOpen : styles.openBadgeClosed}`}>
                        {p.isOpen ? 'Open' : 'Closed'}
                      </span>
                    )}
                    {isHH && <span className={styles.hhBadgeMini}>HH</span>}
                    {p.studentDiscount && <span title="Student Discount">🎓</span>}
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
                <span className={`${styles.badge} ${styles.badgeRed}`}>{selectedPlace.neighbourhood || 'BCN'}</span>
                <h2 style={{ fontSize: '24px', color: 'white', margin: '0 0 6px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800 }}>
                  <span className={styles.busyDot} style={{ background: busy.color }} title={busy.label} />
                  {selectedPlace.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', fontSize: '13px' }}>
                  📍 {selectedPlace.address}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>★ {selectedPlace.rating || 'N/A'}</span>
                  <span style={{ fontSize: '12px', color: '#666' }}>{selectedPlace.reviewCount} reviews</span>
                  {selectedPlace.status === 'temporarily_closed' ? (
                    <span className={styles.statusWarning}>⚠️ Temporarily Closed</span>
                  ) : selectedPlace.isOpen !== null && (
                    <span className={`${styles.openBadge} ${selectedPlace.isOpen ? styles.openBadgeOpen : styles.openBadgeClosed}`}>
                      {selectedPlace.isOpen ? 'Open' : 'Closed'}
                    </span>
                  )}
                </div>
                
                {/* ⏰ Happy Hour Badge */}
                {isHH && (
                  <div className={styles.hhBadgeBig}>
                    ⏰ HAPPY HOUR NOW — €{parseFloat(selectedPlace.happyHourPrice as any || 0).toFixed(2)}
                  </div>
                )}

                <button className={styles.closeBtn} onClick={() => setSelectedPlace(null)}>✕</button>
              </div>

              <div className={styles.panelContent}>
                {/* Closure Note */}
                {selectedPlace.status === 'temporarily_closed' && selectedPlace.closureNote && (
                  <div className={styles.closureBanner}>
                    <strong>Closure Note:</strong> {selectedPlace.closureNote}
                    {selectedPlace.reopeningDate && <div>Reopening: {new Date(selectedPlace.reopeningDate).toLocaleDateString()}</div>}
                  </div>
                )}

                {/* Walking distance */}
                {userLoc && (() => {
                  const walk = distanceToWalk(haversine(userLoc.lat, userLoc.lng, selectedPlace.lat, selectedPlace.lng));
                  return (
                    <div className={styles.walkingInfo}>
                      🚶 <strong>{walk.label}</strong> <span style={{ color: '#60a5fa', marginLeft: '4px' }}>walking</span>
                    </div>
                  );
                })()}

                {/* 📊 Busyness Chart */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 className={styles.sectionTitle}>Typical Busyness ({busy.label})</h4>
                  <div className={styles.busynessChart}>
                    {[0.2, 0.4, 0.7, 0.9, 0.8, 0.5, 0.3].map((val, i) => (
                      <div key={i} className={styles.busyBar} style={{ height: `${val * 40}px`, background: val > 0.8 ? '#ef4444' : val > 0.6 ? '#f59e0b' : '#22c55e' }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#555', marginTop: '4px' }}>
                    <span>Morning</span>
                    <span>Afternoon</span>
                    <span>Evening</span>
                  </div>
                </div>

                {/* Price & Compare */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                  <div>
                    <h1 style={{ color: '#E63946', margin: 0, fontSize: '38px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900 }}>{selectedPlace.beerPrice}</h1>
                    <p style={{ margin: 0, color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Per half litre</p>
                  </div>
                  <button 
                    className={`${styles.compareBtn} ${compareList.find(x => x.id === selectedPlace.id) ? styles.compareBtnActive : ''}`}
                    onClick={() => toggleCompare(selectedPlace)}
                  >
                    {compareList.find(x => x.id === selectedPlace.id) ? '✓ Added to Compare' : '+ Compare Bar'}
                  </button>
                </div>

                {/* 🎓 Student Discount */}
                {selectedPlace.studentDiscount && (
                  <div className={styles.studentBadge}>
                    🎓 Student discount — €{parseFloat(selectedPlace.studentPrice as any || 0).toFixed(2)} with student ID
                  </div>
                )}

                {/* Features */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 className={styles.sectionTitle}>Features</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {selectedPlace.outdoorSeating && <span className={styles.attributePill}>☀️ Terrace</span>}
                    {selectedPlace.hasSports && <span className={styles.attributePill}>⚽ Sports TV</span>}
                    {selectedPlace.rooftop && <span className={styles.attributePill}>🏙️ Rooftop</span>}
                    {selectedPlace.dogFriendly && <span className={styles.attributePill}>🐶 Dog Friendly</span>}
                  </div>
                </div>

                {/* 🍺 Beers on Tap */}
                {selectedPlace.beersOnTap && selectedPlace.beersOnTap.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 className={styles.sectionTitle}>Beers on Tap</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedPlace.beersOnTap.map(beer => (
                        <span key={beer} className={styles.beerPill}>{beer}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 🕒 Visual Hours Timeline */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 className={styles.sectionTitle}>Opening Hours</h4>
                  <div className={styles.hoursTimeline}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                      const isToday = new Date().getDay() === (i + 1) % 7;
                      return (
                        <div key={day} className={`${styles.timelineRow} ${isToday ? styles.timelineToday : ''}`}>
                          <span className={styles.dayLabel}>{day}</span>
                          <div className={styles.timelineBarWrapper}>
                            <div className={styles.timelineBar} style={{ background: '#E63946' }} />
                            <span className={styles.timeLabelStart}>09:00</span>
                            <span className={styles.timeLabelEnd}>23:00</span>
                            {isToday && <div className={styles.currentTimeLine} style={{ left: `${(new Date().getHours() * 60 + new Date().getMinutes()) / (24 * 60) * 100}%` }} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

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
                    Get Directions
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
      {/* ─── Comparison Panel ─── */}
      <ComparisonPanel 
        items={compareList} 
        onClose={() => setCompareList([])} 
        onRemove={(p) => toggleCompare(p)} 
        userLoc={userLoc}
      />
    </div>
  );
}

function ComparisonPanel({ items, onClose, onRemove, userLoc }: { items: Place[]; onClose: () => void; onRemove: (p: Place) => void; userLoc: any }) {
  if (items.length < 2) return null;

  const attributes = [
    { label: 'Price', key: 'beerPrice' },
    { label: 'Neighborhood', key: 'neighborhood' },
    { label: 'Walking Dist.', key: 'walk' },
    { label: 'Happy Hour', key: 'happyHour' },
    { label: 'Terrace', key: 'outdoorSeating' },
    { label: 'Sports TV', key: 'hasSports' },
    { label: 'Dog Friendly', key: 'dogFriendly' },
    { label: 'Rating', key: 'rating' },
    { label: 'Tap Beers', key: 'beersOnTap' },
  ];

  return (
    <div className={styles.comparisonPanel}>
      <div className={styles.comparisonHeader}>
        <h3>Compare Bars</h3>
        <button onClick={onClose} className={styles.comparisonClose}>✕</button>
      </div>
      <div className={styles.comparisonTableWrapper}>
        <table className={styles.comparisonTable}>
          <thead>
            <tr>
              <th>Attribute</th>
              {items.map(p => (
                <th key={p.id}>
                  <div className={styles.compBarHeader}>
                    <span>{p.name}</span>
                    <button onClick={() => onRemove(p)}>✕</button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attributes.map(attr => (
              <tr key={attr.key}>
                <td className={styles.attrLabel}>{attr.label}</td>
                {items.map(p => {
                  let val: any = (p as any)[attr.key];
                  let style = {};

                  if (attr.key === 'beerPrice') {
                    const price = parseFloat(p.beerPrice.replace('€', ''));
                    const minPrice = Math.min(...items.map(x => parseFloat(x.beerPrice.replace('€', ''))));
                    const maxPrice = Math.max(...items.map(x => parseFloat(x.beerPrice.replace('€', ''))));
                    if (price === minPrice) style = { color: '#22c55e', fontWeight: 800 };
                    if (price === maxPrice && items.length > 1) style = { color: '#ef4444' };
                  }
                  
                  if (attr.key === 'walk' && userLoc) {
                    const dist = haversine(userLoc.lat, userLoc.lng, p.lat, p.lng);
                    val = `${Math.round(dist / 80)} min`;
                  }

                  if (attr.key === 'happyHour') {
                    val = isHappyHourActive(p.happyHourStart, p.happyHourEnd) ? '✅ YES' : (p.happyHourStart ? `${p.happyHourStart}-${p.happyHourEnd}` : 'No');
                  }

                  if (typeof val === 'boolean') val = val ? '✅' : '❌';
                  if (Array.isArray(val)) val = val.join(', ');
                  if (val === null || val === undefined) val = '-';

                  return <td key={p.id} style={style}>{val}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
