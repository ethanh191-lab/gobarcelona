import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Latest Barcelona News · GoBarcelona",
  description: "Real-time news feed for international residents in Barcelona. Translated, curated, and relevant.",
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
