import { Suspense } from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';
import ClientShell from '../components/client-shell';
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
      <head>
        <meta name="google-adsense-account" content="ca-pub-4861541956465835" />
      </head>
      <body>
        <Script
          id="google-adsense-loader"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4861541956465835"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        <Script
          id="google-analytics-loader"
          src="https://www.googletagmanager.com/gtag/js?id=G-2J7PJ51C04"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-2J7PJ51C04');
            `,
          }}
        />
        <Suspense fallback={null}>
          <ClientShell>
            {children}
          </ClientShell>
        </Suspense>
      </body>
    </html>
  );
}
