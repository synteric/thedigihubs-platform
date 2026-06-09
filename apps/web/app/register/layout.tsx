import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Register for Free Sample Access',
  description: 'Register with TheDigiHubs to preview free sourcing samples, supplier discovery workflows, RFQ examples, and quote evaluation previews.',
  alternates: {
    canonical: '/register',
  },
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
