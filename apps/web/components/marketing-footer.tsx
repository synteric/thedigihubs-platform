import Link from 'next/link';
import { Linkedin, Mail, ShieldCheck } from 'lucide-react';
import { Logo } from './brand';

const footerColumns = [
  {
    heading: 'Solutions',
    links: [
      ['For Buyers', '/solutions/buyers'],
      ['For Suppliers', '/solutions/suppliers'],
      ['Register', '/register'],
      ['Subscribe', '/subscribe'],
    ],
  },
  {
    heading: 'Platform',
    links: [
      ['Platform Overview', '/platform'],
      ['Marketplace', '/marketplace'],
      ['RFQ Workflow', '/platform'],
      ['Quote Evaluation', '/platform'],
    ],
  },
  {
    heading: 'Resources',
    links: [
      ['Resource Center', '/resources'],
      ['Free Samples', '/samples'],
      ['Contact Support', '/contact'],
      ['Privacy Policy', '/privacy-policy'],
    ],
  },
  {
    heading: 'Company',
    links: [
      ['Partners', '/partners'],
      ['Contact Us', '/contact'],
      ['Terms', '/terms-and-conditions'],
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="bg-[#07133B] px-8 py-10 text-white">
      <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm font-semibold leading-6 text-blue-100">
            Connected procurement marketplace for buyers, suppliers, RFQs, quotations, and governed sourcing decisions.
          </p>
          <div className="mt-5 flex gap-3">
            <Link href="/contact" aria-label="Email TheDigiHubs" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-blue-100 transition hover:bg-white/20">
              <Mail size={17} />
            </Link>
            <Link href="/privacy-policy" aria-label="Privacy and security" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-blue-100 transition hover:bg-white/20">
              <ShieldCheck size={17} />
            </Link>
            <Link href="/partners" aria-label="Partner with TheDigiHubs" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-blue-100 transition hover:bg-white/20">
              <Linkedin size={17} />
            </Link>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.heading}>
              <h2 className="text-sm font-black uppercase tracking-[.16em] text-blue-200">{column.heading}</h2>
              <div className="mt-4 space-y-3">
                {column.links.map(([label, href]) => (
                  <Link key={label} href={href} className="block text-sm font-semibold text-blue-100 transition hover:text-white">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
