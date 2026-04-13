import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "BCN Housing & Rentals Guide · GoBarcelona",
  description: "Find your home in Barcelona. Understanding rental contracts, neighborhoods, and common pitfalls.",
};

export default function HousingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
