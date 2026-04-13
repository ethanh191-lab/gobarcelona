"use client";
import React from 'react';
import styles from './ReviewTicker.module.css';
import { useLanguage } from './LanguageContext';

export default function ReviewTicker() {
  const { t } = useLanguage();

  const reviews = [
    { text: t('review.1'), author: 'Dave' },
    { text: t('review.2'), author: 'Maria T.' },
    { text: t('review.3'), author: 'John D.' },
    { text: t('review.4'), author: 'Sarah M.' },
    { text: t('review.5'), author: 'Carlos B.' },
  ];

  // We duplicate the array to create a seamless infinite scrolling loop
  const duplicatedReviews = [...reviews, ...reviews, ...reviews];

  return (
    <div className={styles.tickerContainer}>
      <div className={styles.tickerTrack}>
        {duplicatedReviews.map((review, index) => (
          <div key={index} className={styles.reviewCard}>
            <div className={styles.stars}>★★★★★</div>
            <p className={styles.text}>{review.text}</p>
            <span className={styles.author}>— {review.author}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
