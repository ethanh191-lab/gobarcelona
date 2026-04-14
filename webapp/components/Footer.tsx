"use client";
import Link from 'next/link';
import styles from './Footer.module.css';
import { useLanguage } from './LanguageContext';
import NewsletterForm from './NewsletterForm';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoGo}>go</span><span className={styles.logoBarcelona}>barcelona</span>
          </Link>
          <p className={styles.desc}>{t('footer.desc')}</p>
        </div>
        
        <div className={styles.links}>
          <h4>{t('footer.platform')}</h4>
          <Link href="/events">{t('nav.events')}</Link>
          <Link href="/map">{t('nav.map')}</Link>
          <Link href="/guide">{t('nav.guide')}</Link>
        </div>

        <div className={styles.contact}>
          <h4>{t('footer.contact')}</h4>
          <a href="mailto:info@gobarcelona.es">info@gobarcelona.es</a>
          <a href="mailto:hello@gobarcelona.es">hello@gobarcelona.es</a>
        </div>

        <div className={styles.newsletter}>
          <h4>{t('home.news.title')}</h4>
          <NewsletterForm />
        </div>
      </div>
      <div className={styles.bottom}>
        <p>&copy; {new Date().getFullYear()} GoBarcelona.es - {t('footer.rights')}</p>
      </div>
    </footer>
  );
}
