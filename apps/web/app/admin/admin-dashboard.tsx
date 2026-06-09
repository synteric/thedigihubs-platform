'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  FileText,
  HeartPulse,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { AppShell } from '../../components/app-shell';
import { Card, Donut, Kpi, Pill } from '../../components/ui';
import { apiFetch } from '../../lib/api';
import { adminNav } from './admin-nav';
import { SubscriptionRequestQueue } from './subscription-request-queue';

type OrganizationType = 'BUYER' | 'SUPPLIER' | 'PLATFORM';
type OrganizationStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
type PlanKey = 'STARTER' | 'GROWTH' | 'PROFESSIONAL' | 'ENTERPRISE';

type AdminOverview = {
  generatedAt: string;
  kpis: {
    totalOrganizations: { value: number; change: string };
    activeUsers: { value: number; change: string };
    activeRfqs: { value: number; change: string };
    subscriptionReviews: { value: number; change: string };
  };
  recentOrganizations: Array<{
    id: string;
    name: string;
    website?: string | null;
    type: OrganizationType;
    status: OrganizationStatus;
    plan?: PlanKey | null;
    users: number;
  }>;
  planDistribution: {
    total: number;
    items: Array<{ key: PlanKey; label: string; count: number; percent: number }>;
  };
  roleSummary: {
    total: number;
    items: Array<{ label: string; count: number }>;
  };
  supportQueue: Array<{ label: string; count: number; priority: string }>;
  rfqQueue: Array<{ label: string; count: number; action: string }>;
  subscriptionInsights: {
    billingStatus: string;
    items: Array<{ label: string; value: number }>;
  };
  auditLogs: Array<{ id: string; message: string; date: string }>;
  operationsSnapshot: Array<{ label: string; value: number }>;
  systemHealth: {
    status: string;
    database: string;
    activeSessions: number;
    services: string[];
  };
};

function numberText(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function readable(value?: string | null) {
  if (!value) return 'No plan';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function orgTone(type: OrganizationType): 'blue' | 'orange' | 'purple' {
  if (type === 'BUYER') return 'blue';
  if (type === 'SUPPLIER') return 'orange';
  return 'purple';
}

function statusTone(status: OrganizationStatus): 'green' | 'orange' | 'red' | 'gray' {
  if (status === 'ACTIVE') return 'green';
  if (status === 'PENDING_VERIFICATION') return 'orange';
  if (status === 'SUSPENDED') return 'red';
  return 'gray';
}

function Health({ overview }: { overview: AdminOverview | null }) {
  return (
    <Card className="p-5">
      <div className="flex gap-3">
        <HeartPulse className="text-[#155EEF]" />
        <div>
          <p className="font-black">System Health</p>
          <p className="text-xs text-emerald-600">{overview?.systemHealth.status || 'Checking status'}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm font-bold">
        <p>Database <span className="float-right text-emerald-600">{overview?.systemHealth.database || 'Checking'}</span></p>
        <p>Active Sessions <span className="float-right text-[#155EEF]">{overview ? numberText(overview.systemHealth.activeSessions) : '-'}</span></p>
        <p>Services <span className="float-right text-emerald-600">{overview ? `${overview.systemHealth.services.length}/${overview.systemHealth.services.length}` : '-'}</span></p>
      </div>
      <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-xs font-black text-[#155EEF]">
        {overview?.systemHealth.services.join(' | ') || 'API | Database | Auth | Admin'}
      </div>
    </Card>
  );
}

function LoadingCard() {
  return (
    <Card className="p-6">
      <div className="h-5 w-40 rounded-full bg-slate-100" />
      <div className="mt-5 space-y-3">
        <div className="h-4 rounded-full bg-slate-100" />
        <div className="h-4 w-10/12 rounded-full bg-slate-100" />
        <div className="h-4 w-8/12 rounded-full bg-slate-100" />
      </div>
    </Card>
  );
}

export function AdminDashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiFetch('/admin/overview', { method: 'GET' });
      if (!response.ok) {
        setMessage('Admin overview could not be loaded.');
        return;
      }
      const data = (await response.json()) as AdminOverview;
      setOverview(data);
    } catch {
      setMessage('Admin overview could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const donutItems = useMemo(() => {
    if (!overview) return [];
    return overview.planDistribution.items.map((item) => `${item.label} ${numberText(item.count)} (${item.percent}%)`);
  }, [overview]);

  return (
    <AppShell
      nav={adminNav('Overview')}
      search="Search organizations, users, RFQs, tickets, revenue, or anything..."
      sidebarCard={<Health overview={overview} />}
      requiredOrganizationTypes={['PLATFORM']}
      requiredRoles={['PLATFORM_ADMIN', 'PLATFORM_SUPPORT']}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-.03em]">Admin Dashboard</h1>
          <p className="mt-2 text-slate-600">Platform administration overview and marketplace governance.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-xl border border-[#DFE9F7] bg-white px-5 py-3 text-sm font-black">
            <CalendarDays className="mr-2 inline" size={16} />
            {overview ? `Updated ${shortDate(overview.generatedAt)}` : 'Loading overview'}
          </button>
          <button onClick={loadOverview} className="rounded-xl bg-[#155EEF] px-6 py-3 text-sm font-black text-white disabled:opacity-50" disabled={loading}>
            Refresh Overview
          </button>
          <a href="#subscription-requests" className="rounded-xl border border-blue-200 bg-white px-6 py-3 text-sm font-black text-[#155EEF]">
            Review Requests
          </a>
        </div>
      </div>

      {message && <p className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-700">{message}</p>}

      {loading && !overview ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      ) : overview ? (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Kpi icon={<Building2 />} label="Total Organizations" value={numberText(overview.kpis.totalOrganizations.value)} change={overview.kpis.totalOrganizations.change} />
            <Kpi icon={<UsersRound />} label="Active Users" value={numberText(overview.kpis.activeUsers.value)} change={overview.kpis.activeUsers.change} tone="green" />
            <Kpi icon={<FileText />} label="Active RFQs" value={numberText(overview.kpis.activeRfqs.value)} change={overview.kpis.activeRfqs.change} tone="purple" />
            <Kpi icon={<WalletCards />} label="Plan Reviews" value={numberText(overview.kpis.subscriptionReviews.value)} change={overview.kpis.subscriptionReviews.change} tone="orange" />
          </div>

          <div id="subscription-requests">
            <SubscriptionRequestQueue />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_.9fr_.75fr]">
            <Card className="p-5">
              <div className="mb-4 flex justify-between">
                <h2 className="text-xl font-black">Recent Organizations</h2>
                <p className="text-sm font-black text-[#155EEF]">View all organizations</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-xs text-slate-500">
                    <tr>
                      <th>Organization</th>
                      <th>Type</th>
                      <th>Plan</th>
                      <th>Users</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold">
                    {overview.recentOrganizations.map((organization) => (
                      <tr key={organization.id} className="border-t border-[#DFE9F7]">
                        <td className="py-3">
                          {organization.name}<br />
                          <span className="text-xs text-slate-500">{organization.website || 'Workspace profile'}</span>
                        </td>
                        <td><Pill tone={orgTone(organization.type)}>{readable(organization.type)}</Pill></td>
                        <td>{readable(organization.plan)}</td>
                        <td>{numberText(organization.users)}</td>
                        <td><Pill tone={statusTone(organization.status)}>{readable(organization.status)}</Pill></td>
                        <td className="text-[#155EEF]">Review</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-xl font-black">Plan Distribution</h2>
              <div className="mt-4">
                <Donut center={numberText(overview.planDistribution.total)} label="Active Plans" items={donutItems} />
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-xl font-black">Role & Access Summary</h2>
              {overview.roleSummary.items.map((row) => (
                <p key={row.label} className="flex justify-between border-b border-[#DFE9F7] py-3 text-sm font-bold">
                  <span>{row.label}</span>
                  <span>{numberText(row.count)}</span>
                </p>
              ))}
              <p className="mt-4 font-black">Total Users <span className="float-right">{numberText(overview.roleSummary.total)}</span></p>
            </Card>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[.8fr_.8fr_1.2fr]">
            <Card className="p-5">
              <h2 className="text-xl font-black">Support & Access Queue</h2>
              {overview.supportQueue.map((row) => (
                <p key={row.label} className="grid grid-cols-3 border-b border-[#DFE9F7] py-3 text-sm font-bold">
                  <span>{row.label}</span>
                  <span>{numberText(row.count)}</span>
                  <span className={row.priority === 'Clear' ? 'text-emerald-600' : 'text-[#155EEF]'}>{row.priority}</span>
                </p>
              ))}
            </Card>

            <Card className="p-5">
              <h2 className="text-xl font-black">RFQ Review Queue</h2>
              {overview.rfqQueue.map((row) => (
                <p key={row.label} className="flex justify-between border-b border-[#DFE9F7] py-4 text-sm font-bold">
                  <span>{row.label}</span>
                  <span>{numberText(row.count)} <b className="text-[#155EEF]">{row.action}</b></span>
                </p>
              ))}
            </Card>

            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-black">Revenue & Subscription Insights</h2>
                <Pill tone="gray">{overview.subscriptionInsights.billingStatus}</Pill>
              </div>
              <div className="my-5 rounded-2xl border border-[#DFE9F7] bg-slate-50 p-5 text-sm font-bold leading-6 text-slate-600">
                Billing integration is not connected yet. The activity below is based on subscription requests and active plan assignments.
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm font-bold md:grid-cols-4">
                {overview.subscriptionInsights.items.map((item) => (
                  <p key={item.label}>{item.label} <span className="block text-lg text-[#155EEF]">{numberText(item.value)}</span></p>
                ))}
              </div>
            </Card>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.4fr]">
            <Card className="p-5">
              <h2 className="text-xl font-black">Recent Admin Activity</h2>
              {overview.auditLogs.length ? overview.auditLogs.map((item) => (
                <p key={item.id} className="border-b border-[#DFE9F7] py-3 text-sm font-bold last:border-0">
                  {item.message}<span className="float-right text-xs text-slate-500">{shortDate(item.date)}</span>
                </p>
              )) : (
                <p className="py-5 text-sm font-bold text-slate-500">No audit activity recorded yet.</p>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="text-xl font-black">Platform Operations Snapshot</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                {overview.operationsSnapshot.map((row) => (
                  <div key={row.label} className="rounded-2xl border border-[#DFE9F7] p-4 text-center">
                    <p className="text-xs font-black text-slate-500">{row.label}</p>
                    <p className="mt-2 text-2xl font-black">{numberText(row.value)}</p>
                    <p className="mt-2 text-xs font-black text-[#155EEF]">View</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
