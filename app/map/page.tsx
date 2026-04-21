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
  openingToday?: string;
  isOpenNow?: boolean | null;
  lastUpdated?: string;
  priceConfidence?: string;
  popularTimes?: number[][] | null;
  currentPopularity?: number | null;
  vibe?: string;
  demographic?: string;
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

function distanceToWalk(straightLineMeters: number): { mins: number; label: string } {
  // Barcelona grid layout — real walking distance ≈ 1.4x straight-line
  const walkMeters = straightLineMeters * 1.4;
  const mins = Math.round(walkMeters / 75); // ~4.5 km/h avg walking speed
  return { mins, label: `${mins} min` };
}

type FilterKey = 'open' | 'terrace' | 'sports' | 'rooftop' | 'late' | 'group' | 'dog' | 'music' | 'student' | 'date' | 'happyHour' | 'new' | 'closed' | 'irish' | 'craft';

const FILTER_DEFS: { key: FilterKey; label: string; icon: string }[] = [
  { key: 'open',      label: 'Open Now',        icon: '🟢' },
  { key: 'happyHour', label: 'Happy Hour Now',  icon: '⏰' },
  { key: 'terrace',   label: 'Terrace',         icon: '☀️' },
  { key: 'sports',    label: 'Sports Bar',      icon: '⚽' },
  { key: 'rooftop',   label: 'Rooftop',         icon: '🏙️' },
  { key: 'late',      label: 'Late Night',      icon: '🌙' },
  { key: 'group',     label: 'Group Tables',    icon: '👥' },
  { key: 'dog',       label: 'Dog Friendly',    icon: '🐶' },
  { key: 'music',     label: 'Live Music',      icon: '🎵' },
  { key: 'student',   label: 'Student Discount',icon: '🎓' },
  { key: 'irish',     label: 'Irish Pub',       icon: '🍀' },
  { key: 'craft',     label: 'Craft Beer',      icon: '🍺' },
  { key: 'new',       label: 'New Openings',    icon: '🆕' },
  { key: 'closed',    label: 'Show Closed',     icon: '🚫' },
  { key: 'date',      label: 'Good for Dates',  icon: '❤️' },
];

const WALK_TIME_OPTIONS = [
  { value: 5,  label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 60, label: '60 min' },
];

export default function BeerMapPage() {
  const { t } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<any[]>([]);
  const userDotRef = useRef<any>(null);
  const heatmapRef = useRef<any>(null);
  const walkCircleRef = useRef<any>(null);

  const [places, setPlaces] = useState<Place[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // User location state
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  // Filters
  const [priceRange, setPriceRange] = useState(10);
  const [maxWalkMins, setMaxWalkMins] = useState(60);
  const [selectedNb, setSelectedNb] = useState('all');
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
    open: false, terrace: false, sports: false, rooftop: false,
    late: false, group: false, dog: false, music: false,
    student: false, date: false, happyHour: false, new: false, closed: false,
    irish: false, craft: false,
  });
  const [selectedBeer, setSelectedBeer] = useState('all');
  const [realWalk, setRealWalk] = useState<{ mins: string; dist: string } | null>(null);

  // New State for Accordions, Sorting, and Mock Filters
  const [openAccordions, setOpenAccordions] = useState({ price: true, vibe: true, amenities: true, beer: false });
  const toggleAccordion = (sec: string) => setOpenAccordions(p => ({ ...p, [sec as keyof typeof openAccordions]: !p[sec as keyof typeof openAccordions] }));
  const [sortMode, setSortMode] = useState('closest');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [vibeFilter, setVibeFilter] = useState('all');
  const [demoFilter, setDemoFilter] = useState('all');

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
  }, [selectedPlace, userLoc]);

  const COMMON_BEERS = ['Estrella Damm', 'Moritz', 'Voll-Damm', 'Estrella Galicia', 'Heineken', 'Mahou', 'San Miguel'];

  const [showReportModal, setShowReportModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(true); // kept for compat
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
      
      // Inject Mock Data for the new premium filters
      const mocked = (data.places || []).map((p: any) => ({
        ...p,
        vibe: ['cozy', 'party', 'date', 'sports'][Math.floor(Math.random() * 4)],
        demographic: ['students', 'locals', 'expats', 'mixed'][Math.floor(Math.random() * 4)],
      }));
      setPlaces(mocked);
    } catch (e) { console.error(e); }
    finally { setTimeout(() => setFetching(false), 400); }
  }, [selectedNb]);

  useEffect(() => { fetchPlaces(); }, [fetchPlaces]);

  // ────── 6. Filtering (price + distance + toggles) ──────
  const filteredPlaces = useMemo(() => {
    return places.filter(p => {
      if (selectedNb !== 'all') {
        const nb = NEIGHBOURHOODS.find(n => n.id === selectedNb);
        if (nb && p.neighbourhood !== nb.name) return false;
      }
      if (p.status === 'permanently_closed' && !filters.closed) return false;
      const price = parseFloat(p.beerPrice?.replace('€', '') || '0');
      if (price > priceRange) return false;
      // Walking time filter
      if (userLoc) {
        const dist = haversine(userLoc.lat, userLoc.lng, p.lat, p.lng);
        const walkInfo = distanceToWalk(dist);
        if (walkInfo.mins > maxWalkMins) return false;
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
      if (filters.irish && !(p as any).irishPub) return false;
      if (filters.craft && !(p as any).craftBeer) return false;
      if (vibeFilter !== 'all' && p.vibe !== vibeFilter) return false;
      if (demoFilter !== 'all' && p.demographic !== demoFilter) return false;
      return true;
    });
  }, [places, priceRange, maxWalkMins, filters, userLoc, selectedNb, vibeFilter, demoFilter, selectedBeer]);

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
        if (f.key === 'irish') return (p as any).irishPub;
        if (f.key === 'craft') return (p as any).craftBeer;
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
  const selPop = selectedPlace?.currentPopularity;
  const busy = selectedPlace
    ? selPop != null
      ? selPop > 70 ? { label: 'Very busy', color: '#ef4444' }
        : selPop > 30 ? { label: 'Busy', color: '#f59e0b' }
        : { label: 'Quiet', color: '#22c55e' }
      : { label: 'Unknown', color: '#555' }
    : { label: '', color: '' };
  const isNew = selectedPlace && selectedPlace.openedAt ? (new Date().getTime() - new Date(selectedPlace.openedAt).getTime()) < 90 * 24 * 60 * 60 * 1000 : false;

  // ────── 8. Premium Map Layers (Heatmap & Walking Radius) ──────
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsLoaded || !window.google) return;
    
    // 1. Heatmap Layer
    const initHeatmap = async () => {
      if (!heatmapRef.current) {
        const { HeatmapLayer } = await google.maps.importLibrary("visualization") as any;
        heatmapRef.current = new HeatmapLayer({
          data: [],
          map: null,
          radius: 45,
          opacity: 0.6,
          gradient: ['rgba(0,0,0,0)', 'rgba(230,57,70,0.5)', 'rgba(230,57,70,0.8)', 'rgba(255,165,0,0.9)', 'rgba(255,255,0,1)']
        });
      }
      
      if (showHeatmap) {
        const heatData = filteredPlaces.map(p => ({
          location: new google.maps.LatLng(p.lat, p.lng),
          weight: (p.currentPopularity || 1) * 2
        }));
        heatmapRef.current.setData(heatData);
        heatmapRef.current.setMap(mapInstanceRef.current);
      } else {
        heatmapRef.current.setMap(null);
      }
    };
    initHeatmap();

    // 2. Walking Radius Circle
    if (!walkCircleRef.current) {
      walkCircleRef.current = new google.maps.Circle({
        strokeColor: "#E63946",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#E63946",
        fillOpacity: 0.05,
        map: null,
        center: BCN_CENTER,
        radius: 0,
      });
    }
    
    if (userLoc && maxWalkMins < 60) {
      walkCircleRef.current.setCenter(userLoc);
      walkCircleRef.current.setRadius((maxWalkMins * 75) / 1.4); // Convert mins to straight-line radius
      walkCircleRef.current.setMap(mapInstanceRef.current);
    } else {
      walkCircleRef.current.setMap(null);
    }
    
  }, [filteredPlaces, showHeatmap, maxWalkMins, userLoc, mapsLoaded]);

  // ──────────── RENDER ────────────
  return (
    <div className={styles.appWrapper}>
      {/* ─── Sidebar ─── */}
      <aside className={`${styles.sidebar} ${sidebarVisible ? styles.sidebarVisible : ''}`}>
        <div className={styles.sidebarHeader}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1><span style={{ color: '#E63946' }}>go</span><span style={{ color: 'white' }}>barcelona</span> <span style={{ color: '#888', fontSize: '14px', fontWeight: 400 }}>Beer Map</span></h1>
            {sidebarVisible && (
              <button className={styles.mobileCloseSidebar} onClick={() => setSidebarVisible(false)}>✕</button>
            )}
          </div>
          <p className={styles.sidebarSubtitle}>{filteredPlaces.length} verified locations</p>
        </div>

        {/* ⭐ Bar of the Week */}
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
        })()}

        {/* Location denied banner */}
        {locationDenied && (
          <div className={styles.locationBanner}>
            <span style={{ flex: 1 }}>📍 Enable location for walking distances</span>
            <button className={styles.locationBannerBtn} onClick={requestLocation}>Enable</button>
          </div>
        )}

        
        <div className={styles.sidebarScroll}>
          {/* Quick Presets */}
          <div className={styles.quickPresets}>
            <button className={`${styles.presetBtn} ${filters.open && priceRange < 4 ? styles.presetBtnActive : ''}`}
              onClick={() => { setFilters(prev => ({...prev, open: true})); setPriceRange(3.5); }}>
              ⚡ Cheap & Open Now
            </button>
            <button className={`${styles.presetBtn} ${filters.terrace && filters.sports ? styles.presetBtnActive : ''}`}
              onClick={() => { setFilters(prev => ({...prev, terrace: true, sports: true})); }}>
              ☀️ Sports & Terrace
            </button>
            <button className={`${styles.presetBtn} ${vibeFilter === 'date' ? styles.presetBtnActive : ''}`}
              onClick={() => setVibeFilter('date')}>
              ❤️ Date Night
            </button>
          </div>

          {/* ACCORDION 1: Price & Distance */}
          <div className={styles.accordionHeader} onClick={() => toggleAccordion('price')}>
            <span className={styles.accordionTitle}>Price & Distance</span>
            <span className={`${styles.accordionIcon} ${openAccordions.price ? styles.accordionIconOpen : ''}`}>▼</span>
          </div>
          {openAccordions.price && (
            <div className={styles.accordionContent}>
              <div className={styles.filterSection} style={{ border: 'none', padding: '0 0 16px' }}>
                <div className={styles.filterLabel}><span>Max price</span><span className={styles.filterValue}>€{priceRange.toFixed(2)}</span></div>
                <input type="range" className={styles.slider} min="1.50" max="10" step="0.25" value={priceRange} onChange={e => setPriceRange(parseFloat(e.target.value))} />
              </div>
              <div className={styles.filterSection} style={{ border: 'none', padding: 0 }}>
                <div className={styles.filterLabel}><span>Max walking time</span><span className={styles.filterValue}>{maxWalkMins} min</span></div>
                <input type="range" className={styles.slider} min="5" max="60" step="5" value={maxWalkMins} onChange={e => setMaxWalkMins(parseInt(e.target.value))} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                  {WALK_TIME_OPTIONS.map(d => (
                    <button key={d.value} onClick={() => setMaxWalkMins(d.value)}
                      style={{
                        background: maxWalkMins === d.value ? '#E63946' : 'rgba(255,255,255,0.05)',
                        color: maxWalkMins === d.value ? 'white' : '#aaa',
                        border: 'none', borderRadius: '4px', padding: '4px 8px',
                        fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                      }}
                    >{d.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACCORDION 2: Vibe & Crowd */}
          <div className={styles.accordionHeader} onClick={() => toggleAccordion('vibe')}>
            <span className={styles.accordionTitle}>Vibe & Crowd</span>
            <span className={`${styles.accordionIcon} ${openAccordions.vibe ? styles.accordionIconOpen : ''}`}>▼</span>
          </div>
          {openAccordions.vibe && (
            <div className={styles.accordionContent}>
              <div style={{ marginBottom: '16px' }}>
                <div className={styles.filterLabel}><span>The Vibe</span></div>
                <div className={styles.pillGroup}>
                  {['all', 'cozy', 'party', 'date', 'sports'].map(v => (
                    <div key={v} onClick={() => setVibeFilter(v)}
                      className={`${styles.filterPill} ${vibeFilter === v ? styles.filterPillActive : ''}`}>
                      {v === 'all' ? 'Any Vibe' : v.charAt(0).toUpperCase() + v.slice(1)}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className={styles.filterLabel}><span>Main Crowd</span></div>
                <div className={styles.pillGroup}>
                  {['all', 'students', 'locals', 'expats', 'mixed'].map(d => (
                    <div key={d} onClick={() => setDemoFilter(d)}
                      className={`${styles.filterPill} ${demoFilter === d ? styles.filterPillActive : ''}`}>
                      {d === 'all' ? 'Anyone' : d.charAt(0).toUpperCase() + d.slice(1)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACCORDION 3: Amenities */}
          <div className={styles.accordionHeader} onClick={() => toggleAccordion('amenities')}>
            <span className={styles.accordionTitle}>Amenities & Features</span>
            <span className={`${styles.accordionIcon} ${openAccordions.amenities ? styles.accordionIconOpen : ''}`}>▼</span>
          </div>
          {openAccordions.amenities && (
            <div className={styles.accordionContent}>
              <div className={styles.iconGrid} style={{ marginBottom: '16px' }}>
                {FILTER_DEFS.slice(2, 8).map(f => (
                  <div key={f.key} onClick={() => toggleFilter(f.key)} className={`${styles.iconBtn} ${filters[f.key] ? styles.iconBtnActive : ''}`}>
                    <span className={styles.iconBtnEmoji}>{f.icon}</span>
                    <span className={styles.iconBtnLabel}>{f.label}</span>
                  </div>
                ))}
              </div>
              <div className={styles.pillGroup}>
                {FILTER_DEFS.slice(0, 2).concat(FILTER_DEFS.slice(8)).map(f => (
                  <div key={f.key} onClick={() => toggleFilter(f.key)} className={`${styles.filterPill} ${filters[f.key] ? styles.filterPillActive : ''}`}>
                    {f.icon} {f.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACCORDION 4: Beer Selection */}
          <div className={styles.accordionHeader} onClick={() => toggleAccordion('beer')}>
            <span className={styles.accordionTitle}>Tap Beer</span>
            <span className={`${styles.accordionIcon} ${openAccordions.beer ? styles.accordionIconOpen : ''}`}>▼</span>
          </div>
          {openAccordions.beer && (
            <div className={styles.accordionContent}>
              <div className={styles.logoGrid}>
                <div onClick={() => setSelectedBeer('all')} className={`${styles.logoBtn} ${selectedBeer === 'all' ? styles.logoBtnActive : ''}`}>ALL</div>
                {COMMON_BEERS.map(b => (
                  <div key={b} onClick={() => setSelectedBeer(b)} className={`${styles.logoBtn} ${selectedBeer === b ? styles.logoBtnActive : ''}`}>
                    {b.substring(0, 4).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Sorting Pill ─── */}
          <div className={styles.sortWrapper}>
            <span className={styles.sortLabel}>Results ({filteredPlaces.length})</span>
            <select className={styles.sortSelect} value={sortMode} onChange={e => setSortMode(e.target.value)}>
              <option value="closest">Sort: Closest</option>
              <option value="cheapest">Sort: Cheapest</option>
              <option value="rating">Sort: Highest Rated</option>
              <option value="popular">Sort: Most Popular Now</option>
            </select>
          </div>

          {/* ─── Bar List ─── */}
          {fetching ? (
            Array(5).fill(0).map((_, i) => <div key={i} className={`${styles.barListItem} ${styles.skeleton}`} style={{ height: '80px', margin: '0 0 8px' }} />)
          ) : filteredPlaces.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
              <p>No bars match these filters.</p>
            </div>
          ) : (
            filteredPlaces.sort((a, b) => {
              if (sortMode === 'cheapest') return parseFloat(a.beerPrice?.replace('€','') || '99') - parseFloat(b.beerPrice?.replace('€','') || '99');
              if (sortMode === 'rating') return (b.rating || 0) - (a.rating || 0);
              if (sortMode === 'popular') return (b.currentPopularity || 0) - (a.currentPopularity || 0);
              if (userLoc) return haversine(userLoc.lat, userLoc.lng, a.lat, a.lng) - haversine(userLoc.lat, userLoc.lng, b.lat, b.lng);
              return 0;
            }).map((p, idx) => {
              const walk = getBarWalkInfo(p);
              const isHH = isHappyHourActive(p.happyHourStart, p.happyHourEnd);
              const popLevel = p.currentPopularity;
              const busy = popLevel != null ? popLevel > 70 ? { label: 'Very busy', color: '#ef4444' } : popLevel > 30 ? { label: 'Busy', color: '#f59e0b' } : { label: 'Quiet', color: '#22c55e' } : { label: 'Unknown', color: '#555' };
              const isNew = p.openedAt && (new Date().getTime() - new Date(p.openedAt).getTime()) < 90 * 24 * 60 * 60 * 1000;
              
              return (
                <React.Fragment key={p.id}>
                  {/* Inline Bar of the week logic */}
                  {idx === 2 && !filters.closed && (
                    <div className={styles.botwInline} onClick={() => { /* maybe pan to it */ }}>
                      <div className={styles.botwInlineBadge}>SPOTLIGHT</div>
                      <h4 style={{ color: 'white', margin: '0 0 4px', fontSize: '16px' }}>Bar of the Week</h4>
                      <p style={{ color: '#aaa', margin: 0, fontSize: '12px' }}>Try this local favorite!</p>
                    </div>
                  )}

                  <div className={`${styles.barListItem} ${selectedPlace?.id === p.id ? styles.barActive : ''} ${p.status === 'temporarily_closed' ? styles.barClosed : ''}`}
                    onClick={() => { setSelectedPlace(p); mapInstanceRef.current?.panTo({ lat: p.lat, lng: p.lng }); mapInstanceRef.current?.setZoom(17); }}>
                    <div className={styles.barCardHeader}>
                      <h4>
                        <span className={styles.busyDot} style={{ background: busy.color }} title={busy.label} />
                        {p.name}
                        {isNew && <span className={styles.newBadgeMini}>NEW</span>}
                      </h4>
                      <span className={styles.barCardPrice}>{p.beerPrice}</span>
                    </div>
                    <div className={styles.barCardMeta}>{p.address}</div>
                    <div className={styles.barCardBottom}>
                      {p.isOpenNow ? <span className={`${styles.openBadge} ${styles.openBadgeOpen}`}>Open</span> : <span className={`${styles.openBadge} ${styles.openBadgeClosed}`}>Closed</span>}
                      {isHH && <span className={styles.hhBadgeMini}>HH</span>}
                      {walk && <span className={styles.barCardWalk}>🚶 {walk.label}</span>}
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          
          <div className={styles.floatingResultsBtn}>
            <button className={styles.resultsBtn} onClick={() => setSidebarVisible(false)}>
              Show {filteredPlaces.length} Bars
            </button>
          </div>
        </div>
      </aside>


      {/* ─── Map ─── */}
      <main className={styles.mapContainer}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {/* Heatmap Toggle */}
        <button className={`${styles.heatmapToggle} ${showHeatmap ? styles.heatmapToggleActive : ''}`} onClick={() => setShowHeatmap(!showHeatmap)}>🔥 {showHeatmap ? 'Heatmap On' : 'Heatmap Off'}</button>

        {/* Mobile Filter Toggle */}
        <button
          className={styles.mobileFilterBtn}
          onClick={() => setSidebarVisible(!sidebarVisible)}
        >
          {sidebarVisible ? '✕ Close' : '☰ Filters'}
        </button>

        {/* Mobile Bottom Tab Bar */}
        <div className={styles.mobileTabBar}>
          <div className={styles.tabItem} onClick={() => window.location.href = '/'}>
            <span className={styles.tabIcon}>🏠</span>
            <span className={styles.tabLabel}>Home</span>
          </div>
          <div className={`${styles.tabItem} ${styles.tabItemActive}`}>
            <span className={styles.tabIcon}>🍻</span>
            <span className={styles.tabLabel}>Map</span>
          </div>
        </div>

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
  ) : selectedPlace.isOpenNow !== undefined && selectedPlace.isOpenNow !== null ? (
    <span className={`${styles.openBadge} ${selectedPlace.isOpenNow ? styles.openBadgeOpen : styles.openBadgeClosed}`}>
      {selectedPlace.isOpenNow ? 'Open' : 'Closed'}
    </span>
  ) : (
    <span className={`${styles.openBadge} ${styles.openBadgeClosed}`} style={{ background: '#555', color: 'white' }}>
      Unknown
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
                  const fallback = distanceToWalk(haversine(userLoc.lat, userLoc.lng, selectedPlace.lat, selectedPlace.lng));
                  return (
                    <div className={styles.walkingInfo}>
                      🚶 <strong>{realWalk ? `${realWalk.mins} · ${realWalk.dist}` : fallback.label}</strong> <span style={{ color: '#60a5fa', marginLeft: '4px' }}>walking{realWalk ? '' : ' (est.)'}</span>
                    </div>
                  );
                })()}

                {/* 🕒 Combined Hours & Busyness */}
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
                                height: `${Math.max((val / maxVal) * 100, 4)}%`,
                                borderRadius: '2px 2px 0 0',
                                background: i === currentHour ? '#E63946' : i < currentHour ? '#333' : '#2E4057',
                                transition: 'height 0.3s',
                              }} title={`${i}:00 - ${val}% busy`} />
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
                
                {/* Request Info Update */}
                <button
                  onClick={() => setShowUpdateModal(true)}
                  style={{
                    background: 'transparent', color: '#888', border: '1px dashed rgba(255,255,255,0.2)',
                    padding: '12px 20px', borderRadius: '12px', fontWeight: 600, fontSize: '13px',
                    cursor: 'pointer', fontFamily: 'inherit', marginTop: '12px', width: '100%',
                    transition: 'all 0.2s'
                  }}
                >
                  Suggest an Edit / Report Issue
                </button>
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
      {/* Update Info Modal */}
      {showUpdateModal && selectedPlace && (
        <UpdateModal
          place={selectedPlace}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={() => setShowUpdateModal(false)}
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

function UpdateModal({ place, onClose, onSuccess }: { place: Place; onClose: () => void; onSuccess: () => void }) {
  const [field, setField] = useState('price');
  const [suggestion, setSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch('/api/bar-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bar_id: place.id, field_to_adjust: field, suggested_value: suggestion }),
      });
    } catch (e) { console.error(e); }
    setSubmitting(false);
    onSuccess();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ background: '#1A1A2E', padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: '20px', color: 'white', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif" }}>Suggest an Edit</h3>
        <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>Found a mistake for {place.name}? Let us know.</p>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', color: '#666', fontWeight: 700 }}>What's wrong?</label>
            <select value={field} onChange={e => setField(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '14px', outline: 'none' }}>
              <option value="price">Wrong Price</option>
              <option value="hours">Opening Hours</option>
              <option value="status">Permanently Closed</option>
              <option value="location">Wrong Location</option>
              <option value="features">Missing Features (Terrace, Sports, etc)</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', color: '#666', fontWeight: 700 }}>Correction / Details</label>
            <textarea value={suggestion} onChange={e => setSuggestion(e.target.value)} rows={3} placeholder="e.g. They close at 2AM on Fridays now"
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'grid', gap: '10px' }}>
          <button onClick={handleSubmit} disabled={submitting || !suggestion.trim()}
            style={{ background: '#E63946', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 800, fontSize: '14px', cursor: (submitting || !suggestion.trim()) ? 'not-allowed' : 'pointer', opacity: (submitting || !suggestion.trim()) ? 0.5 : 1 }}>
            {submitting ? 'Submitting...' : 'Submit Edit'}
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
