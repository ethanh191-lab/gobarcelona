import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us & Contact - GoBarcelona',
  description: 'Get in touch with the GoBarcelona team. We are the unbiased, automated platform for Barcelona residents.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
