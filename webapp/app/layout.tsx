import './globals.css'
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import { LanguageProvider } from '../components/LanguageContext';
import { ThemeProvider } from '../components/ThemeContext';
import { Syne, DM_Sans } from 'next/font/google';

import Script from 'next/script'
import { Analytics } from "@vercel/analytics/react"

const syne = Syne({ 
  subsets: ["latin"],
  weight: ['700', '800'],
  variable: '--font-syne' 
});

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans' 
});

// Using the key provided by the user
const GMAPS_KEY = 'AIzaSyDYQ7swNdsixXWF3whewFgtaUZo8BIHb-c';

import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://gobarcelona.es'),
  title: "GoBarcelona — BCN. Right Now.",
  description: "Aggregated events, practical guides, and economic beer maps for the international community in Barcelona. The automated platform with zero bias.",
  keywords: ["Barcelona", "events", "international residents", "guides", "beer map", "NIE", "Empadronamiento"],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GoBarcelona',
  },
  openGraph: {
    title: "GoBarcelona — BCN. Right Now.",
    description: "Your modern, unbiased hub for Barcelona events, practical guides, and city navigation.",
    url: 'https://gobarcelona.es',
    siteName: 'GoBarcelona',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoBarcelona — BCN. Right Now.',
    description: 'The automated platform for everyone in Barcelona.',
  }
}

import BottomNav from '../components/BottomNav';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://maps.googleapis.com;" />
        <Script
          id="google-maps-sdk"
          src={`https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${syne.variable} ${dmSans.variable}`}>
        <ThemeProvider>
        <LanguageProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <Navbar />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</main>
            <Footer />
            <BottomNav />
            <CookieBanner />
          </div>
          <Analytics />
        </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
