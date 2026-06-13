import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { PublicHeader } from '../../components/public-header';
import { MarketingFooter } from '../../components/marketing-footer';
import { Card, Pill } from '../../components/ui';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'Review TheDigiHubs terms covering public registration, subscription review, support requests, platform access, RFQ workflows, and governance controls.',
  alternates: {
    canonical: '/terms-and-conditions',
  },
};

const terms = [
  'Public registration provides sample access and starts an access review process.',
  'Subscription requests are reviewed by TheDigiHubs admin before plan access is assigned.',
  'Users are responsible for submitting accurate organization, contact, RFQ, and quotation information.',
  'Platform access can be managed, limited, suspended, or updated through organization and role controls.',
  'Support requests and contact form information are routed to support@thedigihubs.com.',
];

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-[#F8FBFF] text-[#0B1744]">
      <PublicHeader />
      <section className="px-8 py-16">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[.8fr_1fr]">
          <div>
            <Pill tone="blue">Terms</Pill>
            <h1 className="mt-6 text-4xl font-black leading-[1.04] tracking-[-0.05em] sm:text-5xl">Terms and Conditions</h1>
            <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">
              These terms summarize how public access requests, subscription review, support, and platform use are handled in TheDigiHubs.
            </p>
            <Link href="/contact" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#155EEF] px-6 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(21,94,239,.18)]">
              Ask a question <ArrowRight size={16} />
            </Link>
          </div>
          <Card className="p-7">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-[#155EEF]">
                <ClipboardCheck size={25} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[.16em] text-[#155EEF]">Platform access</p>
                <h2 className="text-2xl font-black">Reviewed and role-aware</h2>
              </div>
            </div>
            <div className="mt-7 space-y-4">
              {terms.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-[#DFE9F7] bg-[#F8FBFF] p-4">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={19} />
                  <p className="text-sm font-bold leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
      <section className="px-8 pb-16">
        <div className="mx-auto grid max-w-[1180px] gap-5 md:grid-cols-3">
          {[
            ['Subscriptions', 'Plans are requested publicly and assigned by admin after review.'],
            ['RFQ and quotes', 'Buyer and supplier activity should be accurate, authorized, and connected to real sourcing work.'],
            ['Governance', 'Organization roles, support records, and audit controls help protect platform operations.'],
          ].map(([title, body], index) => (
            <Card key={title} className="p-7">
              {index === 2 ? <ShieldCheck className="text-[#155EEF]" size={28} /> : <ClipboardCheck className="text-[#155EEF]" size={28} />}
              <h2 className="mt-5 text-xl font-black">{title}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{body}</p>
            </Card>
          ))}
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
