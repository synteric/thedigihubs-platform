import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BarChart3, CheckCircle2, FileText, Globe2, Layers3, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { MarketingFooter } from '../../components/marketing-footer';
import { MarketingHeader } from '../../components/marketing-shell';
import { Card, SectionTitle } from '../../components/ui';

type SolutionPageProps = {
  audience: 'buyers' | 'suppliers';
  eyebrow: string;
  title: string;
  intro: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta: string;
  secondaryHref: string;
  metrics: Array<[string, string]>;
  steps: SolutionStep[];
  outcomes: string[];
};

type SolutionStep = {
  title: string;
  body: string;
  icon: LucideIcon;
};

function VisualPanel({ audience }: { audience: 'buyers' | 'suppliers' }) {
  const rows = audience === 'buyers'
    ? [
      ['RFQ workspace', 'Supplier shortlist ready', 'Ready'],
      ['Quote evaluation', 'Commercial and risk inputs', 'Review'],
      ['Award workflow', 'Decision notes captured', 'Controlled'],
    ]
    : [
      ['Opportunity workspace', 'Matched RFQ detail', 'Open'],
      ['Quote builder', 'Commercial response draft', 'Ready'],
      ['Buyer communication', 'Clarification thread', 'Active'],
    ];
  const highlights = audience === 'buyers'
    ? [
      ['RFQ setup', 'Requirements'],
      ['Quote review', 'Evaluation'],
      ['Award control', 'Governance'],
    ]
    : [
      ['Opportunity match', 'RFQ fit'],
      ['Quote builder', 'Response'],
      ['Pipeline view', 'Status'],
    ];

  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-[28px] border border-[#DFE9F7] bg-gradient-to-br from-white via-[#F7FBFF] to-[#EAF4FF] p-4 shadow-[0_28px_70px_rgba(16,33,63,.09)] sm:min-h-[460px] sm:rounded-[34px] sm:p-6">
      <div className="absolute inset-8 opacity-70" style={{ backgroundImage: 'radial-gradient(#A8D8FF 1.15px, transparent 1.15px)', backgroundSize: '12px 12px', maskImage: 'radial-gradient(ellipse at center, black 25%, transparent 74%)' }} />
      <div className="relative rounded-[24px] border border-[#DFE9F7] bg-white p-5 shadow-[0_16px_40px_rgba(16,33,63,.08)]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-[#0B1744]">{audience === 'buyers' ? 'Buyer sourcing command center' : 'Supplier opportunity workspace'}</p>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Live</span>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {highlights.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[#DFE9F7] bg-[#F8FBFF] p-4">
              <p className="text-xs font-bold text-slate-500">{label}</p>
              <p className="mt-2 text-sm font-black leading-5 text-[#0B1744]">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {rows.map(([name, status, score]) => (
            <div key={name} className="grid grid-cols-1 items-start gap-2 rounded-2xl border border-[#DFE9F7] bg-white p-4 text-sm sm:grid-cols-[1fr_1fr_92px] sm:items-center sm:gap-3">
              <p className="font-black text-[#155EEF]">{name}</p>
              <p className="font-bold text-slate-600">{status}</p>
              <p className="rounded-full bg-emerald-50 px-3 py-1 text-center text-xs font-black text-emerald-700">{score}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="relative mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#DFE9F7] bg-white p-5 shadow-sm">
          <BarChart3 className="text-[#155EEF]" />
          <p className="mt-4 text-sm font-black text-[#0B1744]">Decision insight</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Compare performance, risk, and value before every next step.</p>
        </div>
        <div className="rounded-2xl border border-[#DFE9F7] bg-white p-5 shadow-sm">
          <ShieldCheck className="text-[#13B6D8]" />
          <p className="mt-4 text-sm font-black text-[#0B1744]">Controlled workflow</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Keep every action tied to roles, tenants, and audit history.</p>
        </div>
      </div>
    </div>
  );
}

export function SolutionPage({ audience, eyebrow, title, intro, primaryCta, primaryHref, secondaryCta, secondaryHref, metrics, steps, outcomes }: SolutionPageProps) {
  return (
    <main className="min-h-screen bg-white text-[#0B1744]">
      <MarketingHeader />
      <section className="px-4 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-16">
        <div className="mx-auto grid max-w-[1320px] items-center gap-14 lg:grid-cols-[.9fr_1fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[.18em] text-[#155EEF]">{eyebrow}</p>
            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-5xl lg:text-6xl">{title}</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">{intro}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={primaryHref} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#155EEF] px-6 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(21,94,239,.18)]">
                {primaryCta} <ArrowRight size={16} />
              </Link>
              <Link href={secondaryHref} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#BFD7FF] bg-white px-6 py-3 text-sm font-extrabold text-[#155EEF]">
                {secondaryCta}
              </Link>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
              {metrics.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[#DFE9F7] bg-[#F8FBFF] p-4">
                  <p className="text-2xl font-black tracking-[-0.04em]">{value}</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <VisualPanel audience={audience} />
        </div>
      </section>

      <section className="bg-[#F3FAFF] px-4 py-12 sm:px-8 sm:py-16">
        <SectionTitle title={audience === 'buyers' ? 'A better path from sourcing to award' : 'A better path from match to awarded'} />
        <div className="mx-auto mt-10 grid max-w-[1180px] gap-5 md:grid-cols-3">
          {steps.map(({ title: stepTitle, body, icon: Icon }) => (
            <Card key={stepTitle} className="p-7">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-[#155EEF]">
                <Icon size={24} />
              </div>
              <h2 className="mt-6 text-xl font-black">{stepTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[360px_1fr]">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Built for daily procurement work.</h2>
            <p className="mt-4 leading-7 text-slate-600">Focused controls, clear data, and practical workflows without leaving the approved TheDigiHubs experience.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {outcomes.map((outcome) => (
              <div key={outcome} className="flex gap-3 rounded-2xl border border-[#DFE9F7] bg-white p-5 shadow-sm">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} />
                <p className="text-sm font-bold leading-6 text-[#0B1744]">{outcome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-8 sm:pb-16">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-5 rounded-[28px] bg-gradient-to-r from-[#17245D] to-[#155EEF] p-6 text-white sm:p-8">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">{audience === 'buyers' ? 'Ready to source with more confidence?' : 'Ready to respond to better opportunities?'}</h2>
            <p className="mt-2 text-blue-100">Register for access and TheDigiHubs support will review the right workspace path.</p>
          </div>
          <Link href="/register" className="inline-flex rounded-full bg-[#FFB000] px-6 py-3 text-sm font-black text-[#0B1744]">
            Register Now
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}

export const buyerSteps: SolutionStep[] = [
  { title: 'Discover verified suppliers', body: 'Search trusted supplier profiles, categories, ratings, and coverage before inviting teams into a sourcing event.', icon: UsersRound },
  { title: 'Create RFQs with context', body: 'Structure requirements, optional documents, supplier invites, and evaluation notes in a governed workflow.', icon: FileText },
  { title: 'Compare and award clearly', body: 'Review quote values, supplier fit, risk signals, and award recommendations from one workspace.', icon: Layers3 },
];

export const supplierSteps: SolutionStep[] = [
  { title: 'Find matched opportunities', body: 'See RFQs that fit your categories, countries served, certifications, and response profile.', icon: Sparkles },
  { title: 'Prepare complete quotes', body: 'Review buyer requirements, upload commercial details, and submit offers with confidence.', icon: FileText },
  { title: 'Grow buyer relationships', body: 'Track messages, shortlist status, orders, and award outcomes from a supplier workspace.', icon: Globe2 },
];
