import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Cheapest bars in Barcelona · GoBarcelona",
  description: "Verified beer prices across 50+ Barcelona bars. Filter by price, terrace, and rooftop.",
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
