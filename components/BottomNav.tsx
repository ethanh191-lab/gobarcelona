"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';

const BottomNav = () => {
  const pathname = usePathname();
  if (pathname === '/map') return null;

  const navItems = [
    { 
      label: 'Home', 
      path: '/', 
      icon: (color: string) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      )
    },
    { 
      label: 'News', 
      path: '/news', 
      icon: (color: string) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      )
    },
    { 
      label: 'Map', 
      path: '/map', 
      icon: (color: string) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
          <line x1="8" y1="2" x2="8" y2="18"></line>
          <line x1="16" y1="6" x2="16" y2="22"></line>
        </svg>
      )
    },
    { 
      label: 'Guide', 
      path: '/guide', 
      icon: (color: string) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
      )
    }
  ];

  return (
    <nav className={`mobile-only ${styles.bottomNav}`}>
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        const color = isActive ? 'var(--primary-red)' : 'var(--text-secondary)';
        
        return (
          <Link key={item.path} href={item.path} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
            <div className={styles.iconWrapper}>
              {item.icon(color)}
            </div>
            <span className={styles.label} style={{ color }}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
