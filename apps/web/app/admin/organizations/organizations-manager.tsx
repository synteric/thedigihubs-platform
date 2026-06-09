'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, RefreshCcw, Search, ShieldCheck, UsersRound, WalletCards } from 'lucide-react';
import { AppShell } from '../../../components/app-shell';
import { Card, Kpi, Pill } from '../../../components/ui';
import { apiFetch } from '../../../lib/api';
import { adminNav } from '../admin-nav';

type OrganizationType = 'BUYER' | 'SUPPLIER' | 'PLATFORM';
type OrganizationStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
type PlanKey = 'STARTER' | 'GROWTH' | 'PROFESSIONAL' | 'ENTERPRISE';

type OrganizationItem = {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
  status: OrganizationStatus;
  country?: string | null;
  website?: string | null;
  description?: string | null;
  plan: null | {
    key: PlanKey;
    name: string;
    features: string[];
  };
  users: number;
  rfqs: number;
  sessions: number;
  createdAt: string;
  updatedAt: string;
};

type OrganizationsResponse = {
  total: number;
  summary: {
    active: number;
    suspended: number;
    pendingVerification: number;
  };
  organizations: OrganizationItem[];
};

const organizationTypes: Array<'ALL' | OrganizationType> = ['ALL', 'BUYER', 'SUPPLIER', 'PLATFORM'];
const organizationStatuses: Array<'ALL' | OrganizationStatus> = ['ALL', 'ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'];
const planOptions: Array<'ALL' | PlanKey> = ['ALL', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'];
const assignablePlans: PlanKey[] = ['STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'];

function numberText(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function readable(value?: string | null) {
  if (!value) return 'No plan';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function typeTone(type: OrganizationType): 'blue' | 'orange' | 'purple' {
  if (type === 'BUYER') return 'blue';
  if (type === 'SUPPLIER') return 'orange';
  return 'purple';
}

function statusTone(status: OrganizationStatus): 'green' | 'orange' | 'red' {
  if (status === 'ACTIVE') return 'green';
  if (status === 'PENDING_VERIFICATION') return 'orange';
  return 'red';
}

function buildQuery(filters: {
  search: string;
  type: 'ALL' | OrganizationType;
  status: 'ALL' | OrganizationStatus;
  plan: 'ALL' | PlanKey;
}) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.type !== 'ALL') params.set('type', filters.type);
  if (filters.status !== 'ALL') params.set('status', filters.status);
  if (filters.plan !== 'ALL') params.set('plan', filters.plan);
  const query = params.toString();
  return query ? `/admin/organizations?${query}` : '/admin/organizations';
}

function GovernanceCard({ total, active }: { total: number; active: number }) {
  return (
    <Card className="p-5">
      <div className="flex gap-3">
        <ShieldCheck className="text-[#155EEF]" />
        <div>
          <p className="font-black">Organization Governance</p>
          <p className="text-xs text-slate-500">Plans and access are controlled here.</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm font-bold">
        <p>Total <span className="float-right text-[#155EEF]">{numberText(total)}</span></p>
        <p>Active <span className="float-right text-emerald-600">{numberText(active)}</span></p>
      </div>
    </Card>
  );
}

export function OrganizationsManager() {
  const [data, setData] = useState<OrganizationsResponse | null>(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'ALL' | OrganizationType>('ALL');
  const [status, setStatus] = useState<'ALL' | OrganizationStatus>('ALL');
  const [plan, setPlan] = useState<'ALL' | PlanKey>('ALL');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [updating, setUpdating] = useState('');

  const filters = useMemo(() => ({ search, type, status, plan }), [search, type, status, plan]);

  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiFetch(buildQuery(filters), { method: 'GET' });
      if (!response.ok) {
        setMessage('Organizations could not be loaded.');
        return;
      }
      setData((await response.json()) as OrganizationsResponse);
    } catch {
      setMessage('Organizations could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  function replaceOrganization(updated: OrganizationItem) {
    setData((current) => current ? {
      ...current,
      organizations: current.organizations.map((organization) => organization.id === updated.id ? updated : organization),
    } : current);
  }

  async function updateStatus(organization: OrganizationItem, nextStatus: OrganizationStatus) {
    if (organization.status === nextStatus) return;
    setUpdating(`${organization.id}:status`);
    setMessage('');
    try {
      const response = await apiFetch(`/admin/organizations/${organization.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        setMessage('Organization status could not be updated.');
        return;
      }
      replaceOrganization((await response.json()) as OrganizationItem);
      await loadOrganizations();
      setMessage(`${organization.name} status updated to ${readable(nextStatus)}.`);
    } catch {
      setMessage('Organization status could not be updated.');
    } finally {
      setUpdating('');
    }
  }

  async function assignPlan(organization: OrganizationItem, nextPlan: PlanKey) {
    if (organization.plan?.key === nextPlan) return;
    setUpdating(`${organization.id}:plan`);
    setMessage('');
    try {
      const response = await apiFetch(`/admin/organizations/${organization.id}/plan`, {
        method: 'PATCH',
        body: JSON.stringify({ planKey: nextPlan }),
      });
      if (!response.ok) {
        setMessage('Organization plan could not be updated.');
        return;
      }
      replaceOrganization((await response.json()) as OrganizationItem);
      await loadOrganizations();
      setMessage(`${organization.name} assigned to ${readable(nextPlan)}.`);
    } catch {
      setMessage('Organization plan could not be updated.');
    } finally {
      setUpdating('');
    }
  }

  const total = data?.total || 0;
  const active = data?.summary.active || 0;
  const pending = data?.summary.pendingVerification || 0;
  const suspended = data?.summary.suspended || 0;

  return (
    <AppShell
      nav={adminNav('Organizations')}
      search="Search organizations, users, plans, RFQs, or audit history..."
      sidebarCard={<GovernanceCard total={total} active={active} />}
      requiredOrganizationTypes={['PLATFORM']}
      requiredRoles={['PLATFORM_ADMIN', 'PLATFORM_SUPPORT']}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-.03em]">Organizations</h1>
          <p className="mt-2 text-slate-600">Manage workspace status, membership plans, and access governance.</p>
        </div>
        <button onClick={loadOrganizations} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-[#155EEF] px-6 py-3 text-sm font-black text-white disabled:opacity-50">
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {message && <p className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-bold text-[#155EEF]">{message}</p>}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<Building2 />} label="Matching Organizations" value={numberText(total)} change="Current filtered result" />
        <Kpi icon={<ShieldCheck />} label="Active Workspaces" value={numberText(active)} change="Available for platform access" tone="green" />
        <Kpi icon={<WalletCards />} label="Pending Verification" value={numberText(pending)} change="Requires admin review" tone="orange" />
        <Kpi icon={<UsersRound />} label="Suspended" value={numberText(suspended)} change="Access restricted" tone="purple" />
      </div>

      <Card className="mt-5 p-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_180px_210px_180px]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by organization, website, country, user, or email"
              className="h-12 w-full rounded-xl border border-[#DFE9F7] bg-white pl-11 pr-4 text-sm font-bold outline-none focus:border-[#155EEF]"
            />
          </label>
          <select value={type} onChange={(event) => setType(event.target.value as 'ALL' | OrganizationType)} className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]">
            {organizationTypes.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All types' : readable(item)}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value as 'ALL' | OrganizationStatus)} className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]">
            {organizationStatuses.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All statuses' : readable(item)}</option>)}
          </select>
          <select value={plan} onChange={(event) => setPlan(event.target.value as 'ALL' | PlanKey)} className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]">
            {planOptions.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All plans' : readable(item)}</option>)}
          </select>
        </div>
      </Card>

      <Card className="mt-5 overflow-hidden p-0">
        <div className="border-b border-[#DFE9F7] p-5">
          <h2 className="text-xl font-black">Organization Access Table</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">Plan and status changes are applied immediately and recorded in audit logs.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[.12em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Organization</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Plan</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Users</th>
                <th className="px-5 py-4">RFQs</th>
                <th className="px-5 py-4">Sessions</th>
              </tr>
            </thead>
            <tbody className="font-bold">
              {loading && !data ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">Loading organizations...</td>
                </tr>
              ) : data?.organizations.length ? data.organizations.map((organization) => (
                <tr key={organization.id} className="border-t border-[#DFE9F7] align-top">
                  <td className="px-5 py-4">
                    <p className="font-black">{organization.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{organization.website || organization.slug}</p>
                    {organization.country && <p className="mt-1 text-xs text-slate-500">{organization.country}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <Pill tone={typeTone(organization.type)}>{readable(organization.type)}</Pill>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={organization.plan?.key || ''}
                      disabled={updating === `${organization.id}:plan`}
                      onChange={(event) => assignPlan(organization, event.target.value as PlanKey)}
                      className="h-11 w-44 rounded-xl border border-[#DFE9F7] bg-white px-3 text-sm font-black outline-none focus:border-[#155EEF] disabled:opacity-60"
                    >
                      <option value="" disabled>Select plan</option>
                      {assignablePlans.map((item) => <option key={item} value={item}>{readable(item)}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-2">
                      <Pill tone={statusTone(organization.status)}>{readable(organization.status)}</Pill>
                      <select
                        value={organization.status}
                        disabled={updating === `${organization.id}:status` || organization.type === 'PLATFORM'}
                        onChange={(event) => updateStatus(organization, event.target.value as OrganizationStatus)}
                        className="h-10 w-48 rounded-xl border border-[#DFE9F7] bg-white px-3 text-xs font-black outline-none focus:border-[#155EEF] disabled:opacity-60"
                      >
                        {organizationStatuses.filter((item) => item !== 'ALL').map((item) => <option key={item} value={item}>{readable(item)}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4">{numberText(organization.users)}</td>
                  <td className="px-5 py-4">{numberText(organization.rfqs)}</td>
                  <td className="px-5 py-4">{numberText(organization.sessions)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">No organizations match these filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
