import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Health Insurance Guide - GoBarcelona',
  description: 'Navigating CatSalut public health vs. private insurance providers (Sanitas, Adeslas) for visas in Barcelona.',
};

export default function InsuranceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
