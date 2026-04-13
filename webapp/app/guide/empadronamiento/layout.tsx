import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Empadronamiento Guide - GoBarcelona',
  description: 'How to register at the Ajuntament (OAC) to get your Volante de Empadronamiento in Barcelona.',
};

export default function EmpadronamientoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
