'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, Crown, Layers3, RefreshCcw, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import { AppShell } from '../../../components/app-shell';
import { Card, Kpi, Pill } from '../../../components/ui';
import { apiFetch } from '../../../lib/api';
import { adminNav } from '../admin-nav';

type PlanKey = 'STARTER' | 'GROWTH' | 'PROFESSIONAL' | 'ENTERPRISE';
type OrganizationType = 'BUYER' | 'SUPPLIER' | 'PLATFORM';

type PlanEdit = {
  name: string;
  description: string;
  featuresText: string;
};

type MembershipPlan = {
  id: string;
  key: PlanKey;
  name: string;
  description: string | null;
  features: string[];
  createdAt: string;
  updatedAt: string;
  activeAssignments: number;
  totalAssignments: number;
  requestStats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  organizations: Array<{
    id: string;
    name: string;
    type: OrganizationType;
    status: string;
  }>;
};

type PlansResponse = {
  summary: {
    totalPlans: number;
    activeAssignments: number;
    pendingRequests: number;
    configuredFeatures: number;
  };
  plans: MembershipPlan[];
};

function numberText(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function readable(value?: string | null) {
  if (!value) return 'Not set';
  if (value === 'quote_comparison') return 'Quote Evaluation';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .replace(/\bRfq\b/g, 'RFQ')
    .replace(/\bApi\b/g, 'API');
}

function planTone(plan: PlanKey): 'blue' | 'green' | 'orange' | 'purple' {
  if (plan === 'STARTER') return 'blue';
  if (plan === 'GROWTH') return 'green';
  if (plan === 'PROFESSIONAL') return 'purple';
  return 'orange';
}

function typeTone(type: OrganizationType): 'blue' | 'orange' | 'purple' {
  if (type === 'BUYER') return 'blue';
  if (type === 'SUPPLIER') return 'orange';
  return 'purple';
}

function PlanIcon({ plan }: { plan: PlanKey }) {
  const icons: Record<PlanKey, ReactNode> = {
    STARTER: <Sparkles size={20} />,
    GROWTH: <Layers3 size={20} />,
    PROFESSIONAL: <ShieldCheck size={20} />,
    ENTERPRISE: <Crown size={20} />,
  };
  return <>{icons[plan]}</>;
}

function featuresText(features: string[]) {
  return features.join('\n');
}

function parseFeatures(value: string) {
  return [...new Set(value.split(/\r?\n|,/).map((feature) => feature.trim()).filter(Boolean))];
}

function PlansSidebarCard({ data }: { data: PlansResponse | null }) {
  return (
    <Card className="p-5">
      <div className="flex gap-3">
        <WalletCards className="text-[#155EEF]" />
        <div>
          <p className="font-black">Plan Governance</p>
          <p className="text-xs text-slate-500">Plans control assigned platform access.</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm font-bold">
        <p>Plans <span className="float-right text-[#155EEF]">{numberText(data?.summary.totalPlans || 0)}</span></p>
        <p>Assignments <span className="float-right text-emerald-600">{numberText(data?.summary.activeAssignments || 0)}</span></p>
        <p>Reviews <span className="float-right text-orange-600">{numberText(data?.summary.pendingRequests || 0)}</span></p>
      </div>
    </Card>
  );
}

export function MembershipPlansManager() {
  const [data, setData] = useState<PlansResponse | null>(null);
  const [edits, setEdits] = useState<Record<string, PlanEdit>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState('');

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiFetch('/admin/membership-plans', { method: 'GET' });
      if (!response.ok) {
        setMessage('Membership plans could not be loaded.');
        return;
      }
      const payload = (await response.json()) as PlansResponse;
      setData(payload);
      setEdits(Object.fromEntries(payload.plans.map((plan) => [
        plan.id,
        {
          name: plan.name,
          description: plan.description || '',
          featuresText: featuresText(plan.features),
        },
      ])));
    } catch {
      setMessage('Membership plans could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  function updateEdit(id: string, field: keyof PlanEdit, value: string) {
    setEdits((current) => ({
      ...current,
      [id]: {
        ...(current[id] || { name: '', description: '', featuresText: '' }),
        [field]: value,
      },
    }));
  }

  async function savePlan(plan: MembershipPlan) {
    const edit = edits[plan.id];
    if (!edit) return;
    const features = parseFeatures(edit.featuresText);
    if (!edit.name.trim() || features.length === 0) {
      setMessage('Plan name and at least one feature key are required.');
      return;
    }

    setSaving(plan.id);
    setMessage('');
    try {
      const response = await apiFetch(`/admin/membership-plans/${plan.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: edit.name,
          description: edit.description,
          features,
        }),
      });
      if (!response.ok) {
        setMessage('Membership plan could not be updated.');
        return;
      }
      await loadPlans();
      setMessage(`${plan.name} plan updated.`);
    } catch {
      setMessage('Membership plan could not be updated.');
    } finally {
      setSaving('');
    }
  }

  const totalPlans = data?.summary.totalPlans || 0;
  const activeAssignments = data?.summary.activeAssignments || 0;
  const pendingRequests = data?.summary.pendingRequests || 0;
  const configuredFeatures = data?.summary.configuredFeatures || 0;

  return (
    <AppShell
      nav={adminNav('Membership Plans')}
      search="Search plans, access keys, organizations, or subscription requests..."
      sidebarCard={<PlansSidebarCard data={data} />}
      requiredOrganizationTypes={['PLATFORM']}
      requiredRoles={['PLATFORM_ADMIN', 'PLATFORM_SUPPORT']}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-.03em]">Membership Plans</h1>
          <p className="mt-2 text-slate-600">Manage plan names, descriptions, and feature keys that control organization access.</p>
        </div>
        <button onClick={loadPlans} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-[#155EEF] px-6 py-3 text-sm font-black text-white disabled:opacity-50">
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {message && <p className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-bold text-[#155EEF]">{message}</p>}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<WalletCards />} label="Configured Plans" value={numberText(totalPlans)} change="Plan records in database" />
        <Kpi icon={<CheckCircle2 />} label="Active Assignments" value={numberText(activeAssignments)} change="Active organizations with plans" tone="green" />
        <Kpi icon={<ShieldCheck />} label="Pending Reviews" value={numberText(pendingRequests)} change="Subscription requests awaiting admin" tone="orange" />
        <Kpi icon={<Sparkles />} label="Feature Keys" value={numberText(configuredFeatures)} change="Unique access controls configured" tone="purple" />
      </div>

      <div className="mt-5 rounded-2xl border border-[#DFE9F7] bg-[#F8FBFF] p-5">
        <p className="font-black text-[#0B1744]">Billing integration is not connected yet.</p>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
          This screen controls access plans and review workflow data. Revenue, invoices, and payment status should stay separate until billing is integrated.
        </p>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        {loading && !data ? (
          <Card className="p-8 text-center font-bold text-slate-500 xl:col-span-2">Loading membership plans...</Card>
        ) : data?.plans.map((plan) => {
          const edit = edits[plan.id] || { name: plan.name, description: plan.description || '', featuresText: featuresText(plan.features) };
          return (
            <Card key={plan.id} className="overflow-hidden">
              <div className="border-b border-[#DFE9F7] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className={`grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-[#155EEF]`}>
                      <PlanIcon plan={plan.key} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black">{plan.name}</h2>
                        <Pill tone={planTone(plan.key)}>{readable(plan.key)}</Pill>
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-500">{plan.description || 'No description configured.'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill tone="green">{numberText(plan.activeAssignments)} active</Pill>
                    <Pill tone="orange">{numberText(plan.requestStats.pending)} pending</Pill>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5">
                <label className="block">
                  <span className="text-sm font-black">Plan name</span>
                  <input value={edit.name} onChange={(event) => updateEdit(plan.id, 'name', event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none focus:border-[#155EEF]" />
                </label>
                <label className="block">
                  <span className="text-sm font-black">Description</span>
                  <textarea value={edit.description} onChange={(event) => updateEdit(plan.id, 'description', event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-[#DCE6F3] bg-[#FAFCFF] px-4 py-3 text-sm font-bold outline-none focus:border-[#155EEF]" />
                </label>
                <label className="block">
                  <span className="text-sm font-black">Feature keys</span>
                  <textarea value={edit.featuresText} onChange={(event) => updateEdit(plan.id, 'featuresText', event.target.value)} rows={5} className="mt-2 w-full rounded-xl border border-[#DCE6F3] bg-[#FAFCFF] px-4 py-3 font-mono text-xs font-bold outline-none focus:border-[#155EEF]" />
                </label>

                <div className="flex flex-wrap gap-2">
                  {plan.features.map((feature) => <Pill key={feature} tone="blue">{readable(feature)}</Pill>)}
                </div>

                <div className="grid gap-3 rounded-2xl border border-[#DFE9F7] bg-[#F8FBFF] p-4 md:grid-cols-3">
                  <p className="text-sm font-bold text-slate-500">Requests <span className="block text-xl font-black text-[#0B1744]">{numberText(plan.requestStats.total)}</span></p>
                  <p className="text-sm font-bold text-slate-500">Approved <span className="block text-xl font-black text-emerald-600">{numberText(plan.requestStats.approved)}</span></p>
                  <p className="text-sm font-bold text-slate-500">Rejected <span className="block text-xl font-black text-red-600">{numberText(plan.requestStats.rejected)}</span></p>
                </div>

                <div>
                  <p className="text-sm font-black">Active organizations</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {plan.organizations.length ? plan.organizations.map((organization) => (
                      <Pill key={organization.id} tone={typeTone(organization.type)}>{organization.name}</Pill>
                    )) : <Pill tone="gray">No active organizations</Pill>}
                  </div>
                </div>

                <button onClick={() => savePlan(plan)} disabled={saving === plan.id} className="mt-1 rounded-xl bg-[#155EEF] px-5 py-3 text-sm font-black text-white disabled:opacity-50">
                  {saving === plan.id ? 'Saving plan' : 'Save plan changes'}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
