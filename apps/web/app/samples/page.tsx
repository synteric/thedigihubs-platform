'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  FileText,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  UsersRound,
} from 'lucide-react';
import { AppShell } from '../../components/app-shell';
import { PlanAccessCard } from '../../components/plan-access-card';
import { Card, Pill } from '../../components/ui';
import { useSession } from '../../lib/session';

const buyerNav = [
  { label: 'Sample Access', icon: <Sparkles size={20} />, active: true },
  { label: 'Sample RFQs', icon: <FileText size={20} /> },
  { label: 'Supplier Preview', icon: <UsersRound size={20} /> },
  { label: 'Quote Evaluation', icon: <ClipboardCheck size={20} /> },
  { label: 'Upgrade Access', icon: <ShieldCheck size={20} /> },
];

const supplierNav = [
  { label: 'Sample Access', icon: <Sparkles size={20} />, active: true },
  { label: 'Opportunity Samples', icon: <Target size={20} /> },
  { label: 'Quote Preparation', icon: <FileText size={20} /> },
  { label: 'Buyer Signals', icon: <BarChart3 size={20} /> },
  { label: 'Upgrade Access', icon: <ShieldCheck size={20} /> },
];

const buyerRfqs = [
  ['IT Support Services', 'Services', 'Open sample', '3 supplier fits'],
  ['Facilities Maintenance', 'Operations', 'Draft sample', '5 supplier fits'],
  ['Fleet Tracking Platform', 'Technology', 'Evaluation sample', '4 quotes'],
];

const supplierOpportunities = [
  ['IT Helpdesk Support', 'Technology', 'High fit', 'Quote sample'],
  ['Warehouse Equipment', 'Industrial', 'Medium fit', 'Requirements sample'],
  ['Managed Security Review', 'Professional services', 'High fit', 'Clarification sample'],
];

const buyerSteps = [
  'Review sample RFQ structure',
  'Preview supplier match signals',
  'Open Quote Evaluation preview',
  'Request a plan when your team is ready',
];

const supplierSteps = [
  'Review matched opportunity samples',
  'Preview quote preparation fields',
  'Check buyer demand signals',
  'Request a plan when your team is ready',
];

function SidebarCard({ type }: { type: 'BUYER' | 'SUPPLIER' }) {
  return (
    <Card className="p-5">
      <div className="flex gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-[#155EEF]">
          <LockKeyhole size={19} />
        </div>
        <div>
          <p className="font-black">Sample Access</p>
          <p className="text-xs font-bold leading-5 text-slate-500">
            {type === 'BUYER' ? 'Preview sourcing workflows before full access.' : 'Preview opportunity workflows before full access.'}
          </p>
        </div>
      </div>
      <Link href="/subscribe" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#155EEF] px-4 py-3 text-sm font-black text-white">
        Request Full Access <ArrowRight size={15} />
      </Link>
    </Card>
  );
}

function BuyerSamples() {
  return (
    <>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="overflow-hidden p-0">
          <div className="bg-[#061F46] p-6 text-white">
            <p className="text-sm font-black uppercase tracking-[.14em] text-[#FFCF4D]">Buyer sample access</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">Explore sample sourcing workflows.</h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-blue-100">
              Review sample RFQs, supplier match signals, and quote evaluation outputs before requesting a subscription plan.
            </p>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-3">
            {[
              ['Sample RFQs', 'See how requirements, documents, and dates are organized.', <FileSearch key="i" />],
              ['Supplier Preview', 'Review category and location fit signals.', <UsersRound key="i" />],
              ['Quote Evaluation', 'Preview how quotes are compared side by side.', <ClipboardCheck key="i" />],
            ].map(([title, body, icon]) => (
              <div key={title as string} className="rounded-2xl border border-[#DFE9F7] bg-[#FAFCFF] p-4">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-blue-50 text-[#155EEF]">{icon}</div>
                <p className="mt-4 font-black">{title}</p>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-black uppercase tracking-[.14em] text-[#155EEF]">Next steps</p>
          <h2 className="mt-2 text-xl font-black">Start here</h2>
          <div className="mt-5 space-y-3">
            {buyerSteps.map((step, index) => (
              <div key={step} className="flex gap-3 rounded-2xl border border-[#DFE9F7] bg-white p-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-black text-[#155EEF]">{index + 1}</div>
                <p className="text-sm font-black leading-6">{step}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_.82fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">Sample RFQs</h2>
            <Pill tone="blue">Preview only</Pill>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs font-black uppercase tracking-[.08em] text-slate-500">
                <tr>
                  <th className="py-3">RFQ</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Signal</th>
                </tr>
              </thead>
              <tbody className="font-bold">
                {buyerRfqs.map((row) => (
                  <tr key={row[0]} className="border-t border-[#DFE9F7]">
                    <td className="py-4">{row[0]}</td>
                    <td>{row[1]}</td>
                    <td><Pill tone={row[2].includes('Open') ? 'green' : 'gray'}>{row[2]}</Pill></td>
                    <td className="text-[#155EEF]">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-black">Quote Evaluation Preview</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
            A sample evaluation output showing how commercial, technical, delivery, supplier fit, and risk inputs can support a decision.
          </p>
          <div className="mt-5 space-y-3">
            {[
              ['Best value', 'Supplier A', '92'],
              ['Lowest cost', 'Supplier C', '86'],
              ['Fastest delivery', 'Supplier B', '81'],
            ].map(([label, supplier, score]) => (
              <div key={label} className="grid grid-cols-[1fr_auto] rounded-2xl border border-[#DFE9F7] p-4">
                <div>
                  <p className="font-black">{label}</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">{supplier}</p>
                </div>
                <p className="text-2xl font-black text-[#155EEF]">{score}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function SupplierSamples() {
  return (
    <>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="overflow-hidden p-0">
          <div className="bg-[#061F46] p-6 text-white">
            <p className="text-sm font-black uppercase tracking-[.14em] text-[#FFCF4D]">Supplier sample access</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">Preview matched opportunity workflows.</h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-blue-100">
              Review sample opportunities, buyer demand signals, and quote preparation fields before requesting a subscription plan.
            </p>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-3">
            {[
              ['Opportunity Samples', 'See how matched RFQ opportunities are presented.', <Target key="i" />],
              ['Quote Preparation', 'Preview pricing, delivery, and compliance fields.', <FileText key="i" />],
              ['Buyer Signals', 'Understand category demand and fit indicators.', <BarChart3 key="i" />],
            ].map(([title, body, icon]) => (
              <div key={title as string} className="rounded-2xl border border-[#DFE9F7] bg-[#FAFCFF] p-4">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-blue-50 text-[#155EEF]">{icon}</div>
                <p className="mt-4 font-black">{title}</p>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-black uppercase tracking-[.14em] text-[#155EEF]">Next steps</p>
          <h2 className="mt-2 text-xl font-black">Start here</h2>
          <div className="mt-5 space-y-3">
            {supplierSteps.map((step, index) => (
              <div key={step} className="flex gap-3 rounded-2xl border border-[#DFE9F7] bg-white p-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-black text-[#155EEF]">{index + 1}</div>
                <p className="text-sm font-black leading-6">{step}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_.82fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">Opportunity Samples</h2>
            <Pill tone="blue">Preview only</Pill>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs font-black uppercase tracking-[.08em] text-slate-500">
                <tr>
                  <th className="py-3">Opportunity</th>
                  <th>Category</th>
                  <th>Fit</th>
                  <th>Preview</th>
                </tr>
              </thead>
              <tbody className="font-bold">
                {supplierOpportunities.map((row) => (
                  <tr key={row[0]} className="border-t border-[#DFE9F7]">
                    <td className="py-4">{row[0]}</td>
                    <td>{row[1]}</td>
                    <td><Pill tone={row[2] === 'High fit' ? 'green' : 'gray'}>{row[2]}</Pill></td>
                    <td className="text-[#155EEF]">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-black">Quote Preparation Preview</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
            Sample quote fields help suppliers understand what buyers may expect before submitting a response.
          </p>
          <div className="mt-5 space-y-3">
            {[
              ['Commercial inputs', 'Pricing, currency, taxes, and discounts'],
              ['Delivery inputs', 'Lead time, milestones, and availability'],
              ['Compliance inputs', 'Documents, notes, and exceptions'],
            ].map(([title, body]) => (
              <div key={title} className="flex gap-3 rounded-2xl border border-[#DFE9F7] p-4">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                <div>
                  <p className="font-black">{title}</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

export default function SamplesPage() {
  const { session } = useSession();
  const type = session?.activeOrganization.type === 'SUPPLIER' ? 'SUPPLIER' : 'BUYER';
  const firstName = session?.user.name?.split(' ')[0] || 'there';
  const dashboardHref = type === 'SUPPLIER' ? '/supplier' : '/buyer';

  return (
    <AppShell
      nav={type === 'SUPPLIER' ? supplierNav : buyerNav}
      search={type === 'SUPPLIER' ? 'Search sample opportunities, buyers, or categories...' : 'Search sample RFQs, suppliers, or categories...'}
      sidebarCard={<SidebarCard type={type} />}
      requiredOrganizationTypes={['BUYER', 'SUPPLIER']}
      requiredRoles={['BUYER_OWNER', 'BUYER_MANAGER', 'BUYER_EVALUATOR', 'SUPPLIER_OWNER', 'SUPPLIER_MANAGER', 'SUPPLIER_STAFF']}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[.16em] text-[#155EEF]">Free sample access</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-.03em]">Welcome, {firstName}.</h1>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-600">
            This sample area helps your team understand TheDigiHubs before requesting full plan access.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={dashboardHref} className="inline-flex items-center gap-2 rounded-xl border border-[#DFE9F7] bg-white px-5 py-3 text-sm font-black text-[#155EEF]">
            Open Dashboard <ArrowRight size={15} />
          </Link>
          <Link href="/subscribe" className="inline-flex items-center gap-2 rounded-xl bg-[#155EEF] px-5 py-3 text-sm font-black text-white">
            Request Full Access <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <PlanAccessCard className="mb-5" />

      {type === 'SUPPLIER' ? <SupplierSamples /> : <BuyerSamples />}
    </AppShell>
  );
}
