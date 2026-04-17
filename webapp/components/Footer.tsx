"use client";
import Link from 'next/link';
import styles from './Footer.module.css';
import { useLanguage } from './LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoGo}>go</span><span className={styles.logoBarcelona}>barcelona</span>
          </Link>
          <p className={styles.desc}>The only real-time map of tap beer prices across Barcelona. Free, always.</p>
        </div>
        
        <div className={styles.contact}>
          <h4>Contact</h4>
          <a href="mailto:info@gobarcelona.es">info@gobarcelona.es</a>
          <a href="https://instagram.com/gobarcelona" target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>&copy; {new Date().getFullYear()} GoBarcelona.es - {t('footer.rights')}</p>
      </div>
    </footer>
  );
}
