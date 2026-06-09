import type { Metadata } from 'next';
import { SessionProvider } from '../lib/session';
import './globals.css';

export const metadata: Metadata = {
  title: 'TheDigiHubs | Global B2B Procurement Marketplace',
  description: 'A global B2B procurement marketplace for supplier discovery, RFQs, quotation comparison, and clear award workflows.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><SessionProvider>{children}</SessionProvider></body>
    </html>
  );
}
