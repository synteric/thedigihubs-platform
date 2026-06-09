import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  LockKeyhole,
  MessageSquareText,
  Search,
  Workflow,
} from 'lucide-react';
import { PublicHeader } from '../../components/public-header';
import { MarketingFooter } from '../../components/marketing-footer';
import { Card, Pill, SectionTitle } from '../../components/ui';

const modules = [
  {
    title: 'Supplier Discovery',
    body: 'Find and organize suppliers by category, profile, capability, and fit for sourcing events.',
    icon: Search,
  },
  {
    title: 'RFQ Workflow',
    body: 'Create structured RFQs, attach optional documents, invite suppliers, and manage deadlines.',
    icon: FileText,
  },
  {
    title: 'Quote Evaluation',
    body: 'Compare offers using commercial, technical, risk, and compliance inputs before award review.',
    icon: ClipboardCheck,
  },
  {
    title: 'Supplier Collaboration',
    body: 'Keep buyer and supplier communication connected to the sourcing record.',
    icon: MessageSquareText,
  },
  {
    title: 'Governance Controls',
    body: 'Manage organizations, roles, memberships, access levels, support, and audit visibility.',
    icon: LockKeyhole,
  },
  {
    title: 'Reporting & Audit',
    body: 'Track RFQ progress, quote decisions, platform activity, and admin review history.',
    icon: BarChart3,
  },
];

const flow = [
  'Register the organization and set up role-aware access.',
  'Create RFQs with requirements, documents, categories, and deadlines.',
  'Invite suppliers or review matched supplier opportunities.',
  'Evaluate quotations with clear inputs, outcomes, and award notes.',
];

export default function PlatformPage() {
  return (
    <main className="min-h-screen bg-[#F8FBFF] text-[#0B1744]">
      <PublicHeader />

      <section className="px-8 py-16">
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 lg:grid-cols-[.92fr_1fr]">
          <div>
            <Pill tone="blue">Platform overview</Pill>
            <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[1.04] tracking-[-0.05em] lg:text-6xl">
              One connected platform for sourcing work that needs control.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
              TheDigiHubs connects buyers, suppliers, RFQs, quotations, evaluations, and admin governance in one procurement workspace.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-[#155EEF] px-6 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(21,94,239,.18)]">
                Register for access <ArrowRight size={16} />
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-[#BFD7FF] bg-white px-6 py-3 text-sm font-black text-[#155EEF]">
                Contact support
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[34px] border border-[#DFE9F7] bg-white p-6 shadow-[0_30px_80px_rgba(16,33,63,.1)]">
            <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(#A8D8FF 1px, transparent 1px)', backgroundSize: '13px 13px', maskImage: 'radial-gradient(ellipse at center, black 28%, transparent 72%)' }} />
            <div className="relative grid min-h-[430px] place-items-center">
              <div className="absolute grid h-32 w-32 place-items-center rounded-full border border-[#BFD7FF] bg-white shadow-[0_20px_50px_rgba(21,94,239,.14)]">
                <Workflow size={44} className="text-[#155EEF]" />
              </div>
              <div className="grid w-full gap-4 md:grid-cols-2">
                {modules.map(({ title, icon: Icon }, index) => (
                  <div key={title} className={`flex items-center gap-3 rounded-2xl border border-[#DFE9F7] bg-white/95 p-4 shadow-sm ${index % 2 ? 'md:ml-20' : 'md:mr-20'}`}>
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 text-[#155EEF]">
                      <Icon size={20} />
                    </div>
                    <p className="text-sm font-black">{title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-8 py-14">
        <SectionTitle title="What the platform brings together" subtitle="Each module has its own job, but the value comes from keeping the sourcing record connected from first request to final award." />
        <div className="mx-auto mt-10 grid max-w-[1180px] gap-5 md:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ title, body, icon: Icon }) => (
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

      <section className="bg-[#07133B] px-8 py-16 text-white">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[.8fr_1fr]">
          <div>
            <Pill tone="gray">Operating model</Pill>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.04em]">Built around the procurement lifecycle.</h2>
            <p className="mt-4 max-w-md text-base font-semibold leading-7 text-blue-100">
              Buyers and suppliers work from different dashboards, while admin teams keep membership, support, roles, revenue, and audit controls in view.
            </p>
          </div>
          <div className="grid gap-4">
            {flow.map((item, index) => (
              <div key={item} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#155EEF] text-sm font-black text-white">{index + 1}</span>
                <p className="font-bold leading-6 text-blue-50">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-8 py-16">
        <div className="mx-auto grid max-w-[1180px] gap-6 md:grid-cols-3">
          {[
            ['Buyer workspace', 'RFQ creation, supplier discovery, quote comparison, and award decisions.'],
            ['Supplier workspace', 'Matched opportunities, RFQ detail, quote preparation, and pipeline visibility.'],
            ['Admin workspace', 'Organizations, users, roles, plans, support, audit, revenue, and system health.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-[24px] border border-[#DFE9F7] bg-white p-7 shadow-sm">
              <CheckCircle2 className="text-emerald-600" />
              <h2 className="mt-5 text-xl font-black">{title}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-8 pb-16">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 rounded-[28px] bg-gradient-to-r from-[#17245D] to-[#155EEF] p-8 text-white">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.04em]">Ready to see the platform in context?</h2>
            <p className="mt-2 font-semibold text-blue-100">Register for sample access or contact TheDigiHubs support for review.</p>
          </div>
          <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-[#FFB000] px-6 py-3 text-sm font-black text-[#0B1744]">
            Register Now <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
