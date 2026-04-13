import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Opening a Spanish Bank Account · GoBarcelona",
  description: "Comparing the best banks for expats in Barcelona. Digital banking vs traditional institutions.",
};

export default function BankingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
