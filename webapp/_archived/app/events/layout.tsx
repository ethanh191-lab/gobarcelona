import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Events in Barcelona this week · GoBarcelona",
  description: "Curated events for international residents in Barcelona. From festivals to free rooftop parties.",
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
