import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "BCN Metro, Bus & T-Usual Guide · GoBarcelona",
  description: "How to navigate Barcelona transport. Getting your T-Usual, using the Metro, and bike-sharing apps.",
};

export default function TransportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
