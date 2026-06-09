import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Contact TheDigiHubs about procurement platform access, subscription requests, partnerships, support, and sourcing workflow questions.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
