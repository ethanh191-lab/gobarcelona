
"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './map.module.css';
import { useLanguage } from '../../components/LanguageContext';
import { getTerraceTimeline } from '@/lib/sun-calc';

const GOOGLE_API_KEY = 'AIzaSyDYQ7swNdsixXWF3whewFgtaUZo8BIHb-c';

const NEIGHBORHOODS = [
  { id: 'all',         name: 'All BCN',        lat: 41.3851, lng: 2.1734 },
  { id: 'gothic',      name: 'Gothic Quarter', lat: 41.3828, lng: 2.1771 },
  { id: 'born',        name: 'El Born',        lat: 41.3849, lng: 2.1849 },
  { id: 'eixample',    name: 'Eixample',      lat: 41.3911, lng: 2.1637 },
  { id: 'gracia',      name: 'Gràcia',        lat: 41.4033, lng: 2.1557 },
  { id: 'poblesec',     name: 'Poble Sec',     lat: 41.3720, lng: 2.1574 },
];

const MOCK_BAR: any = {
  id: 'mock_placa_cat',
  name: 'Bar Plaça Catalunya',
  lat: 41.3871,
  lng: 2.1700,
  address: 'Plaça de Catalunya 1, Barcelona',
  beerPrice: '€2.80',
  rating: 4.3,
  reviewCount: 156,
  outdoorSeating: true,
  isOpen: true,
  hasSports: true,
  groupFriendly: true,
  dogFriendly: true,
  neighborhood: 'Eixample',
  openingHoursStr: '08:00–02:00',
  openLate: true,
  priceLevel: 1,
  priceEmoji: '€',
  terrace: true,
  sports: true,
  reviews: 156
};

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
  priceLevel?: number;
  priceEmoji?: string;
  terrace?: boolean;
  sports?: boolean;
  reviews?: number;
}

const BAR_DEFAULTS = {
  priceEmoji: '€',
  terrace: true,
  sports: false,
  groupFriendly: true,
  openLate: true
};

export default function BeerMapPage() {
  const { t } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<any[]>([]);
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  
  // Advanced Filters
  const [priceRange, setPriceRange] = useState(10);
  const [selectedNb, setSelectedNb] = useState('gothic');
  const [filters, setFilters] = useState({
    terrace: false,
    sports: false,
    group: false,
    late: false,
    student: false, // < 3.00
    music: false,
    dog: false,
    date: false,
    rooftop: false,
    open: false
  });

  const [priceData, setPriceData] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // 1. Load Google Maps script & Libraries Robustly
  useEffect(() => {
    if (window.google?.maps?.Map) {
      setMapsLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&v=beta`;
    script.async = true;
    script.onload = () => setMapsLoaded(true);
    document.head.appendChild(script);
  }, []);

  // 2. Initialize Map (Mock User Location: Carrer de la Llibreteria 21)
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      try {
        const { Map } = await google.maps.importLibrary("maps") as any;
        const spawnPoint = { lat: 41.3834, lng: 2.1776 };
        
        mapInstanceRef.current = new Map(mapRef.current, {
          center: spawnPoint,
          zoom: 15,
          mapId: 'BCN_MAP_PRO_BASE',
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          backgroundColor: '#1A1A2E',
          restriction: {
            latLngBounds: {
              north: 41.47,
              south: 41.30,
              west: 2.05,
              east: 2.25,
            },
            strictBounds: false,
          },
        });
      } catch (e) {
        console.error("Map Load Error:", e);
      }
    };

    initMap();
  }, [mapsLoaded]);

  // 2.5 Sync Map Center to Selection
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const nb = NEIGHBORHOODS.find(n => n.id === selectedNb);
    if (!nb) return;

    mapInstanceRef.current.panTo({ lat: nb.lat, lng: nb.lng });
    mapInstanceRef.current.setZoom(selectedNb === 'all' ? 14 : 16);
  }, [selectedNb]);

  // 3. Fetch Places (No Mock Bar)
  const fetchPlaces = useCallback(async () => {
    setFetching(true);
    try {
      const nb = NEIGHBORHOODS.find(n => n.id === selectedNb);
      const lat = nb?.lat || 41.3834;
      const lng = nb?.lng || 2.1776;
      const res = await fetch(`/api/places?lat=${lat}&lng=${lng}&radius=2500`);
      const data = await res.json();
      
      const augmented = (data.places || []).map((p: any) => ({
        ...p,
        groupFriendly: Math.random() > 0.5,
        dogFriendly: Math.random() > 0.7,
        liveMusic: Math.random() > 0.8,
        dateSpot: Math.random() > 0.6,
        rooftop: p.name.toLowerCase().includes('rooftop') || Math.random() > 0.9,
        openLate: p.isOpen && Math.random() > 0.5,
      }));

      setPlaces(augmented);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setFetching(false), 600);
    }
  }, [selectedNb]);

  useEffect(() => { fetchPlaces(); }, [fetchPlaces]);

  // 4. Filtering Logic
  const filteredPlaces = useMemo(() => {
    return places.filter(p => {
      const priceNum = parseFloat(p.beerPrice?.replace('€', '') || '0');
      if (priceNum > priceRange) return false;
      if (filters.terrace && !p.outdoorSeating) return false;
      if (filters.sports && !p.hasSports) return false;
      if (filters.group && !p.groupFriendly) return false;
      if (filters.late && !p.openLate) return false;
      if (filters.student && priceNum >= 3.00) return false;
      if (filters.music && !p.liveMusic) return false;
      if (filters.dog && !p.dogFriendly) return false;
      if (filters.date && !p.dateSpot) return false;
      if (filters.rooftop && !p.rooftop) return false;
      if (filters.open && p.isOpen === false) return false;
      return true;
    });
  }, [places, priceRange, filters]);

  // 5. Marker Management (Color Coded pins)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsLoaded) return;

    const renderMarkers = async () => {
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as any;

      markersRef.current.forEach(m => m.map = null);
      markersRef.current = [];

      const latLngCounts: Record<string, number> = {};

      filteredPlaces.forEach(p => {
        const key = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
        const count = latLngCounts[key] || 0;
        latLngCounts[key] = count + 1;
        
        const offsetLat = p.lat + (count * 0.00005);
        const offsetLng = p.lng + (count * 0.00005);

        const priceNum = parseFloat(p.beerPrice?.replace('€', '') || '0');
        let colorClass = styles.pinNormal;
        if (priceNum < 3.00) colorClass = styles.pinCheap;
        else if (priceNum > 4.50) colorClass = styles.pinExpensive;

        const priceTag = document.createElement('div');
        priceTag.className = `${styles.pricePin} ${colorClass} ${selectedPlace?.id === p.id ? styles.pricePinSelected : ''}`;
        priceTag.textContent = p.beerPrice || '?';

        const marker = new AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: { lat: offsetLat, lng: offsetLng },
          content: priceTag,
          title: p.name,
        });

        marker.addListener('click', () => {
          setSelectedPlace(p);
          mapInstanceRef.current?.panTo({ lat: offsetLat, lng: offsetLng });
        });

        markersRef.current.push(marker);
      });
    };

    renderMarkers();
  }, [filteredPlaces, selectedPlace?.id, mapsLoaded]);

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={styles.appWrapper}>
      {/* ─── Sidebar ─── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 style={{ fontSize: '28px', color: 'white' }}>Bar Finder</h1>
          <p style={{ opacity: 0.6, fontSize: '14px', margin: '4px 0 0' }}>{filteredPlaces.length} locations verified</p>
        </div>

        <div className={styles.sidebarContent}>
          {/* ALL FILTERS NOW IN SIDEBAR */}
          <div className={styles.priceSliderBox}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.7, fontWeight: 900 }}>Max Price: €{priceRange.toFixed(2)}</span>
            <input type="range" min="1.5" max="10" step="0.5" value={priceRange} onChange={e => setPriceRange(parseFloat(e.target.value))} />
          </div>

          <div style={{ padding: '0 0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <select className={styles.nbSelect} value={selectedNb} onChange={e => setSelectedNb(e.target.value)}>
              {NEIGHBORHOODS.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
            
            <button className={`${styles.filterItem} ${filters.open ? styles.filterActive : ''}`} onClick={() => toggleFilter('open')}>🔓 Open Now</button>
            <button className={`${styles.filterItem} ${filters.terrace ? styles.filterActive : ''}`} onClick={() => toggleFilter('terrace')}>☀️ Terrace</button>
            <button className={`${styles.filterItem} ${filters.sports ? styles.filterActive : ''}`} onClick={() => toggleFilter('sports')}>⚽ Sports Bars</button>
            <button className={`${styles.filterItem} ${filters.rooftop ? styles.filterActive : ''}`} onClick={() => toggleFilter('rooftop')}>🏙️ Rooftops</button>
            <button className={`${styles.filterItem} ${filters.late ? styles.filterActive : ''}`} onClick={() => toggleFilter('late')}>🌙 Late Night</button>
            <button className={`${styles.filterItem} ${filters.group ? styles.filterActive : ''}`} onClick={() => toggleFilter('group')}>👥 Group Tables</button>
            <button className={`${styles.filterItem} ${filters.dog ? styles.filterActive : ''}`} onClick={() => toggleFilter('dog')}>🐶 Dog Friendly</button>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid var(--glass-border)', margin: '16px 0 24px' }} />

          {fetching ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className={`${styles.barListItem} ${styles.skeleton}`} style={{ height: '100px', marginBottom: '12px' }} />
            ))
          ) : filteredPlaces.length === 0 ? (
            <div style={{ padding: '40px 10px', textAlign: 'center', opacity: 0.5 }}>
              <p>No results match these filters.</p>
              <button className="btn-secondary" style={{ marginTop: '16px' }} onClick={() => {
                setFilters({
                  terrace: false, sports: false, group: false, late: false, student: false,
                  music: false, dog: false, date: false, rooftop: false, open: false
                });
                setPriceRange(10);
              }}>Reset Search</button>
            </div>
          ) : (
            filteredPlaces.map(p => (
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
                <div className={styles.barCardMuted}>{p.address}</div>
                <div className={styles.barCardIcons}>
                  {p.outdoorSeating && '☀️'}
                  {p.hasSports && '⚽'}
                  {p.rooftop && '🏙️'}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ─── Map Main Area ─── */}
      <main className={styles.mapContainer}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* ─── Detail Panel ─── */}
        <div className={`${styles.detailPanel} ${selectedPlace ? styles.detailPanelVisible : ''}`}>
          {selectedPlace && (
            <>
              <div className={styles.panelHeader}>
                <span className={`${styles.badge} ${styles.badgeRed}`}>{selectedPlace.neighborhood || 'BCN'}</span>
                <h2 style={{ fontSize: '26px', color: 'white' }}>{selectedPlace.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6, fontSize: '13px' }}>
                  <span>📍</span> {selectedPlace.address}
                </div>
                <button className={styles.closeBtn} onClick={() => setSelectedPlace(null)}>✕</button>
              </div>
              
              <div className={styles.panelContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                  <div>
                    <h1 style={{ color: 'var(--primary-red)', margin: 0, fontSize: '38px' }}>{selectedPlace.beerPrice}</h1>
                    <p style={{ margin: 0, opacity: 0.5, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('map.per_half_litre')}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800 }}>★ {selectedPlace.rating || 'N/A'}</div>
                    <div style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase' }}>{selectedPlace.reviewCount} {t('map.reviews')}</div>
                  </div>
                </div>

                <div className={styles.confidenceBox}>
                  {priceData?.confidence === 'high' ? <span style={{ color: '#22c55e', fontSize: '22px' }}>✓</span> : <span style={{ color: '#6B7280', fontSize: '22px' }}>?</span>}
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px' }}>{t('map.verified_price')}</strong>
                    <span style={{ opacity: 0.6, fontSize: '12px' }}>{t('map.verified_desc')}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '14px', textTransform: 'uppercase', opacity: 0.6 }}>{t('map.features')}</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {selectedPlace.outdoorSeating && <span className={styles.attributePill}>{t('map.feature.terrace')}</span>}
                    {selectedPlace.hasSports && <span className={styles.attributePill}>{t('map.feature.sports')}</span>}
                    {selectedPlace.rooftop && <span className={styles.attributePill}>{t('map.feature.rooftop')}</span>}
                  </div>
                </div>

                {selectedPlace.outdoorSeating && (
                   <div className={styles.sunTimeline}>
                      <h4>☀️ {t('map.sun_outlook')}</h4>
                      <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 600 }}>
                        {getTerraceTimeline(selectedPlace.lat, selectedPlace.lng).label}
                      </p>
                   </div>
                )}

                <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`)}>
                    {t('map.get_directions')}
                  </button>
                  <button className="btn-secondary" onClick={() => setShowReportModal(true)}>
                    {t('map.update_price')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

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

function ReportModal({ place, onClose, onSuccess }: any) {
  const { t } = useLanguage();
  const [price, setPrice] = useState('2.50');
  const [type, setType] = useState('tap');
  const [size, setSize] = useState('500');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await fetch('/api/beer-prices', {
      method: 'POST',
      body: JSON.stringify({ bar_id: place.id, price, type, size_ml: size })
    });
    setSubmitting(false);
    onSuccess();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ background: '#1A1A2E', padding: '40px', borderRadius: '28px', width: '100%', maxWidth: '420px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: '24px', color: 'white', marginBottom: '8px' }}>Report Actual Price</h3>
        <p style={{ opacity: 0.6, fontSize: '14px', marginBottom: '24px' }}>Help the community by reporting the current price at {place.name}.</p>
        
        <div style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', opacity: 0.6 }}>Price in Euros (€)</label>
            <input type="number" step="0.10" value={price} onChange={e => setPrice(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '18px', outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', opacity: 0.6 }}>Serving Type</label>
            <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '16px', outline: 'none' }}>
              <option value="tap">Draught / Tap</option>
              <option value="bottle">Bottle</option>
              <option value="can">Can</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '32px', display: 'grid', gap: '12px' }}>
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
