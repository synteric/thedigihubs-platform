import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Subscription Plans',
  description: 'Review TheDigiHubs subscription plans and submit a plan request for admin review and role-aware procurement platform access.',
  alternates: {
    canonical: '/subscribe',
  },
};

export default function SubscribeLayout({ children }: { children: ReactNode }) {
  return children;
}
