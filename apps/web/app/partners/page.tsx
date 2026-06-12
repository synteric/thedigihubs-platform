import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Handshake,
  Layers3,
  Network,
  Settings2,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { PublicHeader } from '../../components/public-header';
import { MarketingFooter } from '../../components/marketing-footer';
import { Card, Pill, SectionTitle } from '../../components/ui';

export const metadata: Metadata = {
  title: 'Partners',
  description: 'Partner with TheDigiHubs to support supplier onboarding, buyer implementation, sourcing workflow adoption, and connected procurement transformation.',
  alternates: {
    canonical: '/partners',
  },
};

const partnerTypes = [
  {
    title: 'Supplier ecosystem partners',
    body: 'Help qualified suppliers become easier for buyers to discover, invite, and evaluate.',
    icon: UsersRound,
  },
  {
    title: 'Implementation partners',
    body: 'Support organizations with setup, workflow configuration, category mapping, and adoption.',
    icon: Settings2,
  },
  {
    title: 'Advisory and channel partners',
    body: 'Work with procurement teams that need marketplace, RFQ, and sourcing transformation support.',
    icon: Handshake,
  },
];

const process = [
  ['Connect', 'Share the partnership request through the contact page.'],
  ['Review', 'TheDigiHubs reviews the fit, scope, and expected collaboration model.'],
  ['Configure', 'Set up access, operating responsibilities, and support handoff.'],
  ['Launch', 'Move partner-supported buyers or suppliers into the right workflow.'],
];

export default function PartnersPage() {
  return (
    <main className="min-h-screen bg-[#F8FBFF] text-[#0B1744]">
      <PublicHeader />

      <section className="px-4 py-10 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 lg:grid-cols-[.88fr_1fr]">
          <div>
            <Pill tone="blue">Partners</Pill>
            <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Partner with TheDigiHubs to support better sourcing outcomes.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
              TheDigiHubs works with partners who help buyers and suppliers adopt connected procurement workflows with clarity and control.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-[#155EEF] px-6 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(21,94,239,.18)]">
                Start partner conversation <ArrowRight size={16} />
              </Link>
              <Link href="/platform" className="inline-flex items-center gap-2 rounded-full border border-[#BFD7FF] bg-white px-6 py-3 text-sm font-black text-[#155EEF]">
                Explore platform
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[34px] border border-[#DFE9F7] bg-white p-5 shadow-[0_30px_80px_rgba(16,33,63,.1)] sm:p-7">
            <div className="absolute inset-0 bg-gradient-to-br from-white via-[#F7FBFF] to-[#EAF4FF]" />
            <div className="absolute inset-8 opacity-70" style={{ backgroundImage: 'radial-gradient(#A8D8FF 1px, transparent 1px)', backgroundSize: '13px 13px', maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)' }} />
            <div className="relative grid gap-5">
              <div className="rounded-[26px] bg-[#07133B] p-7 text-white">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-[#13B6D8]">
                    <Network size={25} />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-[.16em] text-blue-200">Partner network</p>
                    <h2 className="mt-1 text-2xl font-black">Connected buyer and supplier support</h2>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {['Supplier onboarding', 'Workflow setup', 'Category mapping', 'Support routing'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#DFE9F7] bg-white p-4">
                    <CheckCircle2 className="text-emerald-600" size={19} />
                    <p className="text-sm font-black">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-8 sm:py-14">
        <SectionTitle title="Partnership areas" subtitle="Clear routes for partners who support supplier readiness, buyer implementation, and procurement transformation." />
        <div className="mx-auto mt-10 grid max-w-[1180px] gap-5 md:grid-cols-3">
          {partnerTypes.map(({ title, body, icon: Icon }) => (
            <Card key={title} className="p-7">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-[#155EEF]">
                <Icon size={24} />
              </div>
              <h2 className="mt-6 text-xl font-black">{title}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-[#07133B] px-4 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[.8fr_1fr]">
          <div>
            <Pill tone="gray">Partner process</Pill>
            <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Simple, reviewed, and controlled.</h2>
            <p className="mt-4 max-w-md text-base font-semibold leading-7 text-blue-100">
              Partnership conversations should move through clear review before any access or operational responsibility is assigned.
            </p>
          </div>
          <div className="grid gap-4">
            {process.map(([title, body], index) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/10 p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#155EEF] text-sm font-black text-white">{index + 1}</span>
                <div>
                  <h3 className="font-black">{title}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-blue-100">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-[1180px] gap-6 md:grid-cols-2">
          <div className="rounded-[28px] border border-[#DFE9F7] bg-white p-8 shadow-sm">
            <Layers3 className="text-[#155EEF]" size={30} />
            <h2 className="mt-5 text-2xl font-black">For buyer-facing partners</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              Support sourcing teams with workspace setup, supplier invitation strategy, RFQ configuration, and quote evaluation adoption.
            </p>
          </div>
          <div className="rounded-[28px] border border-[#DFE9F7] bg-white p-8 shadow-sm">
            <ShieldCheck className="text-[#13B6D8]" size={30} />
            <h2 className="mt-5 text-2xl font-black">For supplier-facing partners</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              Help suppliers prepare profiles, respond to RFQs, strengthen quotation quality, and manage buyer relationships.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-8 sm:pb-16">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 rounded-[28px] bg-gradient-to-r from-[#17245D] to-[#155EEF] p-6 text-white sm:p-8">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">Want to discuss partnership fit?</h2>
            <p className="mt-2 font-semibold text-blue-100">Your request goes to support@thedigihubs.com for review.</p>
          </div>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-[#FFB000] px-6 py-3 text-sm font-black text-[#0B1744]">
            Contact Us <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
