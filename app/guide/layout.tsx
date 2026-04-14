import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Barcelona expat guide · GoBarcelona",
  description: 'Detailed, step-by-step instructions for navigating Barcelona bureaucracy, from NIE to housing and healthcare.',
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
