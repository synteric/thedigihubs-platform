'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FileSearch, FileText, RefreshCcw, Search, ShieldCheck, Trophy } from 'lucide-react';
import { AppShell } from '../../../components/app-shell';
import { Card, Kpi, Pill } from '../../../components/ui';
import { apiFetch } from '../../../lib/api';
import { adminNav } from '../admin-nav';

type RfqStatus = 'DRAFT' | 'PUBLISHED' | 'QUOTATION_OPEN' | 'EVALUATION' | 'AWARDED' | 'CANCELLED' | 'CLOSED';
type OrganizationStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

type AdminRfq = {
  id: string;
  reference: string;
  title: string;
  description: string;
  category: string;
  country: string;
  deliveryLocation?: string | null;
  currency: string;
  estimatedBudget?: string | null;
  closingDate: string;
  status: RfqStatus;
  createdAt: string;
  updatedAt: string;
  buyerOrganization: {
    id: string;
    name: string;
    type: 'BUYER' | 'SUPPLIER' | 'PLATFORM';
    status: OrganizationStatus;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  counts: {
    lineItems: number;
    invites: number;
    quotes: number;
    matches: number;
    auditLogs: number;
  };
  award: null | {
    id: string;
    awardedAt: string;
    decisionNote: string;
    supplierName: string;
    totalAmount: string;
    currency: string;
  };
  flag: null | {
    id: string;
    createdAt: string;
    actorName: string;
    reason: string;
  };
};

type RfqsResponse = {
  total: number;
  summary: {
    draft: number;
    open: number;
    evaluation: number;
    awarded: number;
    cancelled: number;
    closed: number;
  };
  filters: {
    categories: string[];
    countries: string[];
  };
  rfqs: AdminRfq[];
};

const statuses: Array<'ALL' | RfqStatus> = ['ALL', 'DRAFT', 'PUBLISHED', 'QUOTATION_OPEN', 'EVALUATION', 'AWARDED', 'CANCELLED', 'CLOSED'];
const editableStatuses: RfqStatus[] = ['DRAFT', 'PUBLISHED', 'QUOTATION_OPEN', 'EVALUATION', 'AWARDED', 'CANCELLED', 'CLOSED'];

function numberText(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function readable(value?: string | null) {
  if (!value) return 'Not available';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function money(amount?: string | null, currency = 'USD') {
  if (!amount) return 'No budget';
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return `${currency} ${amount}`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(numeric);
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function statusTone(status: RfqStatus): 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray' {
  if (status === 'AWARDED') return 'green';
  if (status === 'EVALUATION') return 'purple';
  if (status === 'PUBLISHED' || status === 'QUOTATION_OPEN') return 'blue';
  if (status === 'DRAFT') return 'orange';
  if (status === 'CANCELLED') return 'red';
  return 'gray';
}

function buildQuery(filters: {
  search: string;
  status: 'ALL' | RfqStatus;
  category: string;
  country: string;
}) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.status !== 'ALL') params.set('status', filters.status);
  if (filters.category) params.set('category', filters.category);
  if (filters.country) params.set('country', filters.country);
  const query = params.toString();
  return query ? `/admin/rfqs?${query}` : '/admin/rfqs';
}

function GovernanceCard({ data }: { data: RfqsResponse | null }) {
  return (
    <Card className="p-5">
      <div className="flex gap-3">
        <ShieldCheck className="text-[#155EEF]" />
        <div>
          <p className="font-black">RFQ Governance</p>
          <p className="text-xs text-slate-500">Status changes and flags are audited.</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm font-bold">
        <p>Total <span className="float-right text-[#155EEF]">{numberText(data?.total || 0)}</span></p>
        <p>Open <span className="float-right text-emerald-600">{numberText(data?.summary.open || 0)}</span></p>
        <p>Evaluation <span className="float-right text-purple-600">{numberText(data?.summary.evaluation || 0)}</span></p>
      </div>
    </Card>
  );
}

export function RfqGovernance() {
  const [data, setData] = useState<RfqsResponse | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | RfqStatus>('ALL');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [flagReasons, setFlagReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [updating, setUpdating] = useState('');

  const filters = useMemo(() => ({ search, status, category, country }), [search, status, category, country]);

  const loadRfqs = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiFetch(buildQuery(filters), { method: 'GET' });
      if (!response.ok) {
        setMessage('RFQs could not be loaded.');
        return;
      }
      setData((await response.json()) as RfqsResponse);
    } catch {
      setMessage('RFQs could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadRfqs();
  }, [loadRfqs]);

  function replaceRfq(updated: AdminRfq) {
    setData((current) => current ? {
      ...current,
      rfqs: current.rfqs.map((rfq) => rfq.id === updated.id ? updated : rfq),
    } : current);
  }

  async function updateStatus(rfq: AdminRfq, nextStatus: RfqStatus) {
    if (rfq.status === nextStatus) return;
    setUpdating(`${rfq.id}:status`);
    setMessage('');
    try {
      const response = await apiFetch(`/admin/rfqs/${rfq.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        setMessage(nextStatus === 'AWARDED' ? 'RFQ cannot be marked awarded unless an award exists.' : 'RFQ status could not be updated.');
        return;
      }
      replaceRfq((await response.json()) as AdminRfq);
      await loadRfqs();
      setMessage(`${rfq.reference} status updated to ${readable(nextStatus)}.`);
    } catch {
      setMessage('RFQ status could not be updated.');
    } finally {
      setUpdating('');
    }
  }

  async function flagRfq(rfq: AdminRfq) {
    const reason = flagReasons[rfq.id]?.trim() || 'Flagged for admin review';
    setUpdating(`${rfq.id}:flag`);
    setMessage('');
    try {
      const response = await apiFetch(`/admin/rfqs/${rfq.id}/flag`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        setMessage('RFQ could not be flagged.');
        return;
      }
      replaceRfq((await response.json()) as AdminRfq);
      setFlagReasons((current) => ({ ...current, [rfq.id]: '' }));
      setMessage(`${rfq.reference} flagged for review.`);
    } catch {
      setMessage('RFQ could not be flagged.');
    } finally {
      setUpdating('');
    }
  }

  const total = data?.total || 0;
  const open = data?.summary.open || 0;
  const evaluation = data?.summary.evaluation || 0;
  const awarded = data?.summary.awarded || 0;

  return (
    <AppShell
      nav={adminNav('RFQs')}
      search="Search RFQs, buyers, categories, countries, quotes, or awards..."
      sidebarCard={<GovernanceCard data={data} />}
      requiredOrganizationTypes={['PLATFORM']}
      requiredRoles={['PLATFORM_ADMIN', 'PLATFORM_SUPPORT']}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-.03em]">RFQ Governance</h1>
          <p className="mt-2 text-slate-600">Review RFQ lifecycle activity, quote signals, awards, and admin flags.</p>
        </div>
        <button onClick={loadRfqs} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-[#155EEF] px-6 py-3 text-sm font-black text-white disabled:opacity-50">
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {message && <p className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-bold text-[#155EEF]">{message}</p>}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<FileText />} label="Matching RFQs" value={numberText(total)} change="Current filtered result" />
        <Kpi icon={<FileSearch />} label="Open RFQs" value={numberText(open)} change="Published or quotation open" tone="green" />
        <Kpi icon={<AlertTriangle />} label="In Evaluation" value={numberText(evaluation)} change="Quote decisions underway" tone="purple" />
        <Kpi icon={<Trophy />} label="Awarded RFQs" value={numberText(awarded)} change="Award record present or status awarded" tone="orange" />
      </div>

      <Card className="mt-5 p-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_190px_220px_190px]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by RFQ reference, title, buyer, country, or creator"
              className="h-12 w-full rounded-xl border border-[#DFE9F7] bg-white pl-11 pr-4 text-sm font-bold outline-none focus:border-[#155EEF]"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value as 'ALL' | RfqStatus)} className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]">
            {statuses.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All statuses' : readable(item)}</option>)}
          </select>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]">
            <option value="">All categories</option>
            {(data?.filters.categories || []).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={country} onChange={(event) => setCountry(event.target.value)} className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]">
            <option value="">All countries</option>
            {(data?.filters.countries || []).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </Card>

      <Card className="mt-5 overflow-hidden p-0">
        <div className="border-b border-[#DFE9F7] p-5">
          <h2 className="text-xl font-black">RFQ Operations Table</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">Status changes and flags apply immediately and are recorded in audit logs.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[.12em] text-slate-500">
              <tr>
                <th className="px-5 py-4">RFQ</th>
                <th className="px-5 py-4">Buyer</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Signals</th>
                <th className="px-5 py-4">Award</th>
                <th className="px-5 py-4">Admin Flag</th>
              </tr>
            </thead>
            <tbody className="font-bold">
              {loading && !data ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">Loading RFQs...</td>
                </tr>
              ) : data?.rfqs.length ? data.rfqs.map((rfq) => (
                <tr key={rfq.id} className="border-t border-[#DFE9F7] align-top">
                  <td className="px-5 py-4">
                    <p className="font-black">{rfq.reference}</p>
                    <p className="mt-1 max-w-[320px] text-sm font-black text-[#0B1744]">{rfq.title}</p>
                    <p className="mt-2 max-w-[320px] text-xs leading-5 text-slate-500">{rfq.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Pill tone="blue">{rfq.category}</Pill>
                      <Pill tone="gray">{rfq.country}</Pill>
                      <Pill tone="orange">{money(rfq.estimatedBudget, rfq.currency)}</Pill>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-black">{rfq.buyerOrganization.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{rfq.createdBy.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{rfq.createdBy.email}</p>
                    <p className="mt-3 text-xs text-slate-500">Closes {shortDate(rfq.closingDate)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-2">
                      <Pill tone={statusTone(rfq.status)}>{readable(rfq.status)}</Pill>
                      <select
                        value={rfq.status}
                        disabled={updating === `${rfq.id}:status`}
                        onChange={(event) => updateStatus(rfq, event.target.value as RfqStatus)}
                        className="h-10 w-48 rounded-xl border border-[#DFE9F7] bg-white px-3 text-xs font-black outline-none focus:border-[#155EEF] disabled:opacity-60"
                      >
                        {editableStatuses.map((item) => <option key={item} value={item}>{readable(item)}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-blue-50 p-3 text-center text-[#155EEF]">
                        <p className="text-lg font-black">{numberText(rfq.counts.matches)}</p>
                        <p className="text-[11px] font-black">Matches</p>
                      </div>
                      <div className="rounded-2xl bg-emerald-50 p-3 text-center text-emerald-700">
                        <p className="text-lg font-black">{numberText(rfq.counts.quotes)}</p>
                        <p className="text-[11px] font-black">Quotes</p>
                      </div>
                      <div className="rounded-2xl bg-orange-50 p-3 text-center text-orange-700">
                        <p className="text-lg font-black">{numberText(rfq.counts.invites)}</p>
                        <p className="text-[11px] font-black">Invites</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3 text-center text-slate-600">
                        <p className="text-lg font-black">{numberText(rfq.counts.auditLogs)}</p>
                        <p className="text-[11px] font-black">Audit</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {rfq.award ? (
                      <div>
                        <Pill tone="green">Awarded</Pill>
                        <p className="mt-3 font-black">{rfq.award.supplierName}</p>
                        <p className="mt-1 text-xs text-slate-500">{money(rfq.award.totalAmount, rfq.award.currency)}</p>
                        <p className="mt-1 text-xs text-slate-500">{shortDate(rfq.award.awardedAt)}</p>
                      </div>
                    ) : (
                      <Pill tone="gray">No award</Pill>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {rfq.flag ? (
                      <div className="mb-3 rounded-2xl bg-red-50 p-3 text-xs font-bold leading-5 text-red-700">
                        <p className="font-black">Flagged by {rfq.flag.actorName}</p>
                        <p>{rfq.flag.reason}</p>
                      </div>
                    ) : (
                      <p className="mb-3 text-xs font-bold text-slate-500">No active admin flag</p>
                    )}
                    <input
                      value={flagReasons[rfq.id] || ''}
                      onChange={(event) => setFlagReasons((current) => ({ ...current, [rfq.id]: event.target.value }))}
                      placeholder="Reason for review"
                      className="h-10 w-56 rounded-xl border border-[#DFE9F7] bg-white px-3 text-xs font-bold outline-none focus:border-[#155EEF]"
                    />
                    <button
                      onClick={() => flagRfq(rfq)}
                      disabled={updating === `${rfq.id}:flag`}
                      className="mt-2 block h-10 w-56 rounded-xl bg-red-600 px-3 text-xs font-black text-white disabled:opacity-60"
                    >
                      Flag for Review
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">No RFQs match these filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
