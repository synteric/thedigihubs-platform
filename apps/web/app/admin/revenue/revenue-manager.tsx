'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  RefreshCcw,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { AppShell } from '../../../components/app-shell';
import { Card, Pill } from '../../../components/ui';
import { apiFetch } from '../../../lib/api';
import { adminNav } from '../admin-nav';

type PlanKey = 'STARTER' | 'GROWTH' | 'PROFESSIONAL' | 'ENTERPRISE';
type OrganizationType = 'BUYER' | 'SUPPLIER' | 'PLATFORM';
type RequestStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

type RequestStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

type RevenuePlan = {
  id: string;
  key: PlanKey;
  name: string;
  description: string | null;
  features: string[];
  activeAssignments: number;
  totalAssignments: number;
  requestStats: RequestStats;
  conversionRate: number;
  percentOfAssignments: number;
  organizations: Array<{
    id: string;
    name: string;
    type: OrganizationType;
    status: string;
  }>;
};

type RecentRequest = {
  id: string;
  selectedPlan: PlanKey;
  status: RequestStatus;
  name: string;
  email: string;
  organizationName: string;
  organizationType: OrganizationType;
  country: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

type RecentDecision = {
  id: string;
  selectedPlan: PlanKey;
  status: RequestStatus;
  name: string;
  email: string;
  organizationName: string;
  decisionNote: string | null;
  reviewedAt: string | null;
  updatedAt: string;
};

type RecentAssignment = {
  id: string;
  plan: {
    key: PlanKey;
    name: string;
  };
  organization: {
    id: string;
    name: string;
    type: OrganizationType;
    status: string;
  };
  startsAt: string;
  endsAt: string | null;
};

type ReadinessItem = {
  label: string;
  status: string;
  complete: boolean;
};

type RevenueResponse = {
  generatedAt: string;
  billing: {
    connected: boolean;
    status: string;
    label: string;
    provider: string | null;
    currency: string | null;
    message: string;
  };
  summary: {
    configuredPlans: number;
    activeAssignments: number;
    activeOrganizations: number;
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    approvalRate: number;
  };
  financials: {
    recognizedRevenue: number | null;
    recurringRevenue: number | null;
    outstandingInvoices: number | null;
    note: string;
  };
  plans: RevenuePlan[];
  recentRequests: RecentRequest[];
  recentDecisions: RecentDecision[];
  recentAssignments: RecentAssignment[];
  readiness: ReadinessItem[];
};

function numberText(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function dateText(value?: string | null) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function readable(value?: string | null) {
  if (!value) return 'Not set';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .replace(/\bRfq\b/g, 'RFQ')
    .replace(/\bApi\b/g, 'API');
}

function statusTone(status: RequestStatus): 'blue' | 'green' | 'orange' | 'red' | 'gray' {
  if (status === 'APPROVED') return 'green';
  if (status === 'REJECTED') return 'red';
  if (status === 'PENDING_REVIEW') return 'orange';
  return 'gray';
}

function typeTone(type: OrganizationType): 'blue' | 'orange' | 'purple' {
  if (type === 'BUYER') return 'blue';
  if (type === 'SUPPLIER') return 'orange';
  return 'purple';
}

function planTone(plan: PlanKey): 'blue' | 'green' | 'orange' | 'purple' {
  if (plan === 'STARTER') return 'blue';
  if (plan === 'GROWTH') return 'green';
  if (plan === 'PROFESSIONAL') return 'purple';
  return 'orange';
}

function metricTone(tone: 'blue' | 'green' | 'orange' | 'purple' | 'gray') {
  const tones = {
    blue: 'bg-blue-50 text-[#155EEF]',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-500',
    purple: 'bg-violet-50 text-violet-600',
    gray: 'bg-slate-50 text-slate-600',
  };
  return tones[tone];
}

function RevenueSidebarCard({ data }: { data: RevenueResponse | null }) {
  const complete = data?.readiness.filter((item) => item.complete).length || 0;
  const total = data?.readiness.length || 0;
  return (
    <Card className="p-5">
      <div className="flex gap-3">
        <CreditCard className="text-[#155EEF]" />
        <div>
          <p className="font-black">Billing Control</p>
          <p className="text-xs text-slate-500">Plan access, requests, and billing readiness.</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm font-bold">
        <p>Billing <span className="float-right text-orange-600">{data?.billing.label || 'Checking'}</span></p>
        <p>Assignments <span className="float-right text-[#155EEF]">{numberText(data?.summary.activeAssignments || 0)}</span></p>
        <p>Pending Reviews <span className="float-right text-orange-600">{numberText(data?.summary.pendingRequests || 0)}</span></p>
      </div>
      <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-xs font-black text-[#155EEF]">
        Readiness {complete}/{total || '-'}
      </div>
    </Card>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  tone = 'blue',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone?: 'blue' | 'green' | 'orange' | 'purple' | 'gray';
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${metricTone(tone)}`}>{icon}</div>
        <div>
          <p className="text-sm font-extrabold text-[#0B1744]">{label}</p>
          <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#0B1744]">{value}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{detail}</p>
        </div>
      </div>
    </Card>
  );
}

function FinancialLine({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-2xl border border-[#DFE9F7] bg-slate-50 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-[#0B1744]">{value === null ? 'Not available' : numberText(value)}</p>
    </div>
  );
}

function PlanActivity({ plan }: { plan: RevenuePlan }) {
  return (
    <div className="rounded-2xl border border-[#DFE9F7] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Pill tone={planTone(plan.key)}>{readable(plan.key)}</Pill>
          <h3 className="mt-3 text-xl font-black text-[#0B1744]">{plan.name}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{plan.description || 'No description set.'}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-[#155EEF]">{numberText(plan.activeAssignments)}</p>
          <p className="text-xs font-bold text-slate-500">active assignments</p>
        </div>
      </div>
      <div className="mt-5 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-[#155EEF]" style={{ width: `${Math.min(plan.percentOfAssignments, 100)}%` }} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <p className="font-black text-[#0B1744]">{numberText(plan.requestStats.total)}</p>
          <p className="text-xs font-bold text-slate-500">requests</p>
        </div>
        <div>
          <p className="font-black text-orange-600">{numberText(plan.requestStats.pending)}</p>
          <p className="text-xs font-bold text-slate-500">pending</p>
        </div>
        <div>
          <p className="font-black text-emerald-600">{numberText(plan.requestStats.approved)}</p>
          <p className="text-xs font-bold text-slate-500">approved</p>
        </div>
        <div>
          <p className="font-black text-[#155EEF]">{plan.conversionRate}%</p>
          <p className="text-xs font-bold text-slate-500">approval rate</p>
        </div>
      </div>
      <div className="mt-5 border-t border-[#DFE9F7] pt-4">
        <p className="text-xs font-black uppercase tracking-[.16em] text-slate-400">Assigned organizations</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {plan.organizations.length ? plan.organizations.map((organization) => (
            <Pill key={organization.id} tone={typeTone(organization.type)}>{organization.name}</Pill>
          )) : <span className="text-sm font-bold text-slate-400">No active organizations assigned.</span>}
        </div>
      </div>
    </div>
  );
}

export function RevenueManager() {
  const [data, setData] = useState<RevenueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadRevenue = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiFetch('/admin/revenue', { method: 'GET' });
      if (!response.ok) {
        setMessage('Revenue controls could not be loaded.');
        return;
      }
      setData((await response.json()) as RevenueResponse);
    } catch {
      setMessage('Revenue controls could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRevenue();
  }, [loadRevenue]);

  return (
    <AppShell
      nav={adminNav('Revenue')}
      search="Search plans, organizations, subscription requests, or billing status..."
      sidebarCard={<RevenueSidebarCard data={data} />}
      requiredOrganizationTypes={['PLATFORM']}
      requiredRoles={['PLATFORM_ADMIN', 'PLATFORM_SUPPORT']}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-.03em]">Revenue & Billing</h1>
          <p className="mt-2 text-slate-600">Review plan access, subscription requests, and billing readiness for the platform.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-xl border border-[#DFE9F7] bg-white px-5 py-3 text-sm font-black">
            <CalendarDays className="mr-2 inline" size={16} />
            {data ? `Updated ${dateText(data.generatedAt)}` : 'Loading revenue controls'}
          </button>
          <button onClick={loadRevenue} className="rounded-xl bg-[#155EEF] px-6 py-3 text-sm font-black text-white disabled:opacity-50" disabled={loading}>
            <RefreshCcw className="mr-2 inline" size={16} />
            Refresh
          </button>
        </div>
      </div>

      {message && <p className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-700">{message}</p>}

      {loading && !data ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Card key={item} className="p-6">
              <div className="h-5 w-36 rounded-full bg-slate-100" />
              <div className="mt-5 h-8 w-24 rounded-full bg-slate-100" />
              <div className="mt-4 h-4 w-44 rounded-full bg-slate-100" />
            </Card>
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={<CreditCard />} label="Billing Status" value={data.billing.connected ? 'Connected' : 'Not connected'} detail="Provider setup required" tone="orange" />
            <MetricCard icon={<WalletCards />} label="Active Assignments" value={numberText(data.summary.activeAssignments)} detail={`${numberText(data.summary.activeOrganizations)} active organizations`} />
            <MetricCard icon={<Clock3 />} label="Pending Reviews" value={numberText(data.summary.pendingRequests)} detail={`${numberText(data.summary.totalRequests)} total subscription requests`} tone="purple" />
            <MetricCard icon={<ShieldCheck />} label="Approval Rate" value={`${data.summary.approvalRate}%`} detail={`${numberText(data.summary.approvedRequests)} approved requests`} tone="green" />
          </div>

          <Card className="mt-5 overflow-hidden p-0">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_.75fr]">
              <div className="bg-gradient-to-r from-[#101B4A] to-[#155EEF] p-7 text-white">
                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.18em] text-blue-100">Billing readiness</p>
                    <h2 className="mt-2 text-2xl font-black">{data.billing.label}</h2>
                    <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-blue-50">{data.billing.message}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FinancialLine label="Recognized revenue" value={data.financials.recognizedRevenue} />
                  <FinancialLine label="Recurring revenue" value={data.financials.recurringRevenue} />
                  <FinancialLine label="Outstanding invoices" value={data.financials.outstandingInvoices} />
                  <div className="rounded-2xl border border-[#DFE9F7] bg-slate-50 px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-[.16em] text-slate-400">Payment provider</p>
                    <p className="mt-1 text-lg font-black text-[#0B1744]">{data.billing.provider || 'Not connected'}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs font-bold text-slate-500">{data.financials.note}</p>
              </div>
            </div>
          </Card>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_.75fr]">
            <Card className="p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-[#0B1744]">Plan Activity</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Real access assignments and subscription request outcomes by plan.</p>
                </div>
                <Pill tone="blue">{numberText(data.summary.configuredPlans)} configured plans</Pill>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {data.plans.map((plan) => <PlanActivity key={plan.id} plan={plan} />)}
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-5 flex items-center gap-3">
                <BarChart3 className="text-[#155EEF]" />
                <div>
                  <h2 className="text-xl font-black text-[#0B1744]">Revenue Readiness</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">What is ready now and what still needs billing build-out.</p>
                </div>
              </div>
              <div className="space-y-3">
                {data.readiness.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-[#DFE9F7] px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.complete ? <CheckCircle2 className="text-emerald-600" size={18} /> : <Clock3 className="text-orange-500" size={18} />}
                      <p className="text-sm font-black text-[#0B1744]">{item.label}</p>
                    </div>
                    <Pill tone={item.complete ? 'green' : 'orange'}>{item.status}</Pill>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_.8fr]">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-[#DFE9F7] p-5">
                <h2 className="text-xl font-black text-[#0B1744]">Recent Subscription Requests</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Newest plan requests awaiting or receiving admin review.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Organization</th>
                      <th className="px-5 py-3">Plan</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Country</th>
                      <th className="px-5 py-3">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFE9F7]">
                    {data.recentRequests.length ? data.recentRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-5 py-4">
                          <p className="font-black text-[#0B1744]">{request.organizationName}</p>
                          <p className="text-xs font-semibold text-slate-500">{request.name} | {request.email}</p>
                        </td>
                        <td className="px-5 py-4"><Pill tone={planTone(request.selectedPlan)}>{readable(request.selectedPlan)}</Pill></td>
                        <td className="px-5 py-4"><Pill tone={statusTone(request.status)}>{readable(request.status)}</Pill></td>
                        <td className="px-5 py-4 font-bold text-slate-600">{request.country}</td>
                        <td className="px-5 py-4 font-bold text-slate-600">{dateText(request.createdAt)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td className="px-5 py-8 text-center font-bold text-slate-400" colSpan={5}>No subscription requests yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="space-y-5">
              <Card className="p-5">
                <h2 className="text-xl font-black text-[#0B1744]">Recent Decisions</h2>
                <div className="mt-4 space-y-3">
                  {data.recentDecisions.length ? data.recentDecisions.map((decision) => (
                    <div key={decision.id} className="rounded-2xl border border-[#DFE9F7] px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-[#0B1744]">{decision.organizationName}</p>
                          <p className="text-xs font-bold text-slate-500">{dateText(decision.reviewedAt || decision.updatedAt)}</p>
                        </div>
                        <Pill tone={statusTone(decision.status)}>{readable(decision.status)}</Pill>
                      </div>
                      {decision.decisionNote && <p className="mt-2 text-sm font-semibold text-slate-600">{decision.decisionNote}</p>}
                    </div>
                  )) : <p className="rounded-2xl border border-dashed border-[#DFE9F7] p-5 text-sm font-bold text-slate-400">No approved or rejected requests yet.</p>}
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-xl font-black text-[#0B1744]">Recent Assignments</h2>
                <div className="mt-4 space-y-3">
                  {data.recentAssignments.length ? data.recentAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#DFE9F7] px-4 py-3">
                      <div>
                        <p className="font-black text-[#0B1744]">{assignment.organization.name}</p>
                        <p className="text-xs font-bold text-slate-500">Started {dateText(assignment.startsAt)}</p>
                      </div>
                      <Pill tone={planTone(assignment.plan.key)}>{assignment.plan.name}</Pill>
                    </div>
                  )) : <p className="rounded-2xl border border-dashed border-[#DFE9F7] p-5 text-sm font-bold text-slate-400">No active plan assignments yet.</p>}
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
