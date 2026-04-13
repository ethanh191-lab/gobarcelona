"use client";
import React, { useState, useMemo } from 'react';
import { useLanguage } from './LanguageContext';

interface MiniCalendarProps {
  events: { date: string }[];
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
}

export default function MiniCalendar({ events, selectedDate, onDateSelect }: MiniCalendarProps) {
  const { lang, t } = useLanguage();
  const [viewDate, setViewDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for start of month
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) days.push(new Date(year, month, i));
    return days;
  }, [viewDate]);

  const eventDays = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => {
      try {
        set.add(new Date(e.date).toDateString());
      } catch (e) {}
    });
    return set;
  }, [events]);

  const monthName = viewDate.toLocaleString(lang === 'ES' ? 'es-ES' : lang === 'CA' ? 'ca-ES' : 'en-US', { month: 'long' });
  const weekdays = lang === 'CA' ? ['Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'] : lang === 'ES' ? ['L', 'M', 'X', 'J', 'V', 'S', 'D'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
  const isSelected = (d: Date) => selectedDate && d.toDateString() === selectedDate.toDateString();

  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '20px', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h4 style={{ margin: 0, textTransform: 'capitalize', fontWeight: 800, color: 'var(--heading-color)' }}>
          {monthName} {viewDate.getFullYear()}
        </h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} style={navBtnStyle}>←</button>
          <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} style={navBtnStyle}>→</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
        {weekdays.map(w => <div key={w} style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 700, paddingBottom: '8px' }}>{w}</div>)}
        
        {daysInMonth.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const hasEvent = eventDays.has(day.toDateString());
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(isSelected(day) ? null : day)}
              style={{
                ...dayCellBase,
                backgroundColor: isSelected(day) ? 'var(--primary-red)' : 'transparent',
                color: isSelected(day) ? '#fff' : 'var(--text-primary)',
                border: isToday(day) ? '1px solid var(--primary-red)' : 'none',
              }}
            >
              {day.getDate()}
              {hasEvent && !isSelected(day) && (
                <div style={{ width: '4px', height: '4px', background: 'var(--primary-red)', borderRadius: '50%', position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)' }} />
              )}
            </button>
          );
        })}
      </div>
      
      {selectedDate && (
        <button 
          onClick={() => onDateSelect(null)}
          style={{ width: '100%', marginTop: '16px', background: 'none', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
        >
          Clear Selection
        </button>
      )}
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  background: 'var(--bg-primary)',
  border: '1px solid var(--glass-border)',
  color: 'var(--text-primary)',
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.8rem'
};

const dayCellBase: React.CSSProperties = {
  aspectRatio: '1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  position: 'relative',
  padding: 0,
  transition: 'all 0.2s'
};
