import type { Metadata } from 'next';
import { SessionProvider } from '../lib/session';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.thedigihubs.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'TheDigiHubs',
  title: {
    default: 'TheDigiHubs | Connected Procurement Marketplace',
    template: '%s | TheDigiHubs',
  },
  description: 'TheDigiHubs helps organizations find suppliers, issue RFQs, receive quotations, compare offers, and award with transparency in one digital procurement platform.',
  keywords: [
    'TheDigiHubs',
    'procurement marketplace',
    'supplier discovery',
    'RFQ platform',
    'quotation comparison',
    'quote evaluation',
    'sourcing platform',
    'buyer supplier marketplace',
  ],
  creator: 'TheDigiHubs',
  publisher: 'TheDigiHubs',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'TheDigiHubs',
    title: 'TheDigiHubs | Connected Procurement Marketplace',
    description: 'Find suppliers, issue RFQs, receive quotations, compare offers, and award with transparency in one digital procurement platform.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TheDigiHubs | Connected Procurement Marketplace',
    description: 'A trusted marketplace for buyers, suppliers, RFQs, and quotations.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'procurement technology',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><SessionProvider>{children}</SessionProvider></body>
    </html>
  );
}
