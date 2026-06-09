import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FileText,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import { PublicHeader } from '../../components/public-header';
import { MarketingFooter } from '../../components/marketing-footer';
import { Card, Pill, SectionTitle } from '../../components/ui';

const resourceCards = [
  {
    title: 'Free sample access',
    body: 'Start with sample marketplace and sourcing content before requesting a plan.',
    href: '/register',
    cta: 'Register',
    icon: FileCheck2,
  },
  {
    title: 'Buyer sourcing guide',
    body: 'Understand how buyers move from supplier discovery to RFQ creation and award review.',
    href: '/solutions/buyers',
    cta: 'View buyer guide',
    icon: BookOpen,
  },
  {
    title: 'Supplier response guide',
    body: 'See how suppliers review opportunities and prepare stronger quotations.',
    href: '/solutions/suppliers',
    cta: 'View supplier guide',
    icon: FileText,
  },
  {
    title: 'Quote evaluation checklist',
    body: 'Review the commercial, technical, compliance, and risk inputs behind quote decisions.',
    href: '/platform',
    cta: 'Explore evaluation',
    icon: ClipboardList,
  },
  {
    title: 'Subscription plans',
    body: 'Compare plan options and request the access level your organization needs.',
    href: '/subscribe',
    cta: 'View plans',
    icon: ShieldCheck,
  },
  {
    title: 'Support and contact',
    body: 'Send public questions, plan requests, and contact form details to TheDigiHubs support.',
    href: '/contact',
    cta: 'Contact us',
    icon: HelpCircle,
  },
];

const checklist = [
  'Define the sourcing category, scope, deadline, and decision owners.',
  'Attach specifications or supporting documents when they improve supplier response quality.',
  'Invite suppliers with the right category fit and coverage profile.',
  'Evaluate quotes using transparent inputs before award recommendations.',
];

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-[#F8FBFF] text-[#0B1744]">
      <PublicHeader />

      <section className="px-8 py-16">
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 lg:grid-cols-[.88fr_1fr]">
          <div>
            <Pill tone="blue">Resources</Pill>
            <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[1.04] tracking-[-0.05em] lg:text-6xl">
              Practical procurement resources for buyers and suppliers.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
              Use this resource center to understand TheDigiHubs workflows, request sample access, review plans, and contact support.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-[#155EEF] px-6 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(21,94,239,.18)]">
                Get free sample access <ArrowRight size={16} />
              </Link>
              <Link href="/subscribe" className="inline-flex items-center gap-2 rounded-full border border-[#BFD7FF] bg-white px-6 py-3 text-sm font-black text-[#155EEF]">
                View subscription plans
              </Link>
            </div>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="bg-[#07133B] p-7 text-white">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-[#13B6D8]">
                  <Lightbulb size={25} />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-[.16em] text-blue-200">Start here</p>
                  <h2 className="mt-1 text-2xl font-black">RFQ readiness checklist</h2>
                </div>
              </div>
            </div>
            <div className="grid gap-4 p-7">
              {checklist.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-[#DFE9F7] bg-white p-4">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={19} />
                  <p className="text-sm font-bold leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="px-8 py-14">
        <SectionTitle title="Choose the resource you need" subtitle="Each resource takes users to a proper page or workflow, not back to a landing page section." />
        <div className="mx-auto mt-10 grid max-w-[1180px] gap-5 md:grid-cols-2 lg:grid-cols-3">
          {resourceCards.map(({ title, body, href, cta, icon: Icon }) => (
            <Card key={title} className="flex h-full flex-col p-7">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-[#155EEF]">
                <Icon size={24} />
              </div>
              <h2 className="mt-6 text-xl font-black">{title}</h2>
              <p className="mt-3 flex-1 text-sm font-semibold leading-6 text-slate-600">{body}</p>
              <Link href={href} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#155EEF]">
                {cta} <ArrowRight size={15} />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-8 pb-16">
        <div className="mx-auto grid max-w-[1180px] gap-6 rounded-[30px] border border-[#DFE9F7] bg-white p-8 shadow-[0_22px_60px_rgba(16,33,63,.08)] lg:grid-cols-[.9fr_1fr]">
          <div>
            <Pill tone="orange">Plan review</Pill>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.04em]">Subscription requests are reviewed before access is assigned.</h2>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
              Users can choose a plan and complete the request form. Admin review then assigns the correct workspace access for the selected plan.
            </p>
          </div>
          <div className="grid gap-4">
            {['Select the plan that matches the organization need.', 'Submit business contact and sourcing details.', 'Admin reviews the request and activates the correct access.'].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-[#F3FAFF] p-5">
                <CheckCircle2 className="mt-0.5 shrink-0 text-[#155EEF]" size={20} />
                <p className="font-bold leading-6 text-[#0B1744]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
