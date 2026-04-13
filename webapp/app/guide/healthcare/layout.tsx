import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Healthcare System Guide - GoBarcelona',
  description: 'How to access Barcelona’s public healthcare system, register at your local CAP, and use La Meva Salut.',
};

export default function HealthcareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
