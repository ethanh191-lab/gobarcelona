"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';
import { useLanguage, Lang } from './LanguageContext';
import { useTheme } from './ThemeContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const languages: { code: Lang; label: string }[] = [
    { code: 'EN', label: 'EN' },
    { code: 'ES', label: 'ES' },
    { code: 'CA', label: 'CA' },
    { code: 'DE', label: 'DE' },
    { code: 'FR', label: 'FR' },
    { code: 'NL', label: 'NL' },
  ];

  const navItems = [
    { href: '/events', label: 'Events' },
    { href: '/map', label: 'Beer Map' },
    { href: '/guide', label: 'Guide' },
    { href: '/news', label: 'News' }
  ];

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.navbar}`}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoGo}>go</span><span className={styles.logoBarcelona}>barcelona</span>
        </Link>
        
        {/* Desktop Navigation Links */}
        <nav className={`${styles.navLinks} desktop-only`}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={styles.link}>{item.label}</Link>
          ))}
        </nav>

        <div className={styles.actions}>
          {/* Theme Toggle - 44x44 touch target */}
          <button 
            onClick={toggleTheme} 
            className={styles.actionBtn}
            style={{ width: '44px', height: '44px' }}
            title="Toggle Theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* Language Toggle Custom Pill - 44x44 height */}
          <div className={styles.langWrapper}>
            <button 
              className={`${styles.langPill} ${langOpen ? styles.langPillOpen : ''}`}
              onClick={() => setLangOpen(!langOpen)}
              style={{ height: '44px', minWidth: '70px' }}
            >
              {lang} <span className={styles.pillArrow}>{langOpen ? '▴' : '▾'}</span>
            </button>
            
            {langOpen && (
              <div className={styles.langDropdown}>
                {languages.map(l => (
                  <button
                    key={l.code}
                    className={`${styles.langOption} ${lang === l.code ? styles.langActive : ''}`}
                    onClick={() => {
                      setLang(l.code);
                      setLangOpen(false);
                    }}
                    style={{ minHeight: '44px' }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
