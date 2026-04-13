import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mobile & SIM Cards Guide - GoBarcelona',
  description: 'Compare Digi, Orange, and Vodafone. Learn how to get a prepaid SIM card as an international resident in Barcelona.',
};

export default function SIMLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
