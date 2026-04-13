import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "BCN NIE/TIE Application Guide · GoBarcelona",
  description: "Step-by-step guide on how to get your NIE or TIE in Barcelona, including links to booking appointments and tax forms.",
};

export default function NIELayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
