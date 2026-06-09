'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  Clock3,
  FileSearch,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserRoundCog,
} from 'lucide-react';
import { AppShell } from '../../../components/app-shell';
import { Card, Pill } from '../../../components/ui';
import { apiFetch } from '../../../lib/api';
import { adminNav } from '../admin-nav';

type PillTone = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray';

type AuditMetadata = {
  key: string;
  value: string;
};

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  ipAddress: string | null;
  message: string;
  actor: null | {
    id: string;
    name: string;
    email: string;
  };
  rfq: null | {
    id: string;
    reference: string;
    title: string;
    status: string;
    buyerOrganization: {
      id: string;
      name: string;
    };
  };
  metadata: AuditMetadata[];
};

type AuditResponse = {
  total: number;
  summary: {
    recent: number;
    adminActions: number;
    rfqFlags: number;
    userAccessChanges: number;
  };
  filters: {
    entities: string[];
    actions: string[];
  };
  logs: AuditLog[];
};

function numberText(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function readable(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .replace(/\bRfq\b/g, 'RFQ')
    .replace(/\bApi\b/g, 'API');
}

function shortDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function actionTone(action: string): PillTone {
  if (action.includes('FLAG')) return 'red';
  if (action.includes('ROLE')) return 'purple';
  if (action.includes('STATUS')) return 'orange';
  if (action.includes('PLAN')) return 'green';
  if (action.startsWith('ADMIN_')) return 'blue';
  return 'gray';
}

function entityTone(entity: string): PillTone {
  if (entity === 'Rfq') return 'purple';
  if (entity === 'User') return 'blue';
  if (entity === 'Organization') return 'green';
  if (entity === 'Quote' || entity === 'QuoteEvaluation') return 'orange';
  return 'gray';
}

function buildQuery(filters: {
  search: string;
  entity: string;
  action: string;
  actor: string;
  from: string;
  to: string;
}) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.entity) params.set('entity', filters.entity);
  if (filters.action) params.set('action', filters.action);
  if (filters.actor.trim()) params.set('actor', filters.actor.trim());
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  const query = params.toString();
  return query ? `/admin/audit?${query}` : '/admin/audit';
}

function AuditSidebarCard({ data }: { data: AuditResponse | null }) {
  return (
    <Card className="p-5">
      <div className="flex gap-3">
        <FileSearch className="text-[#155EEF]" />
        <div>
          <p className="font-black">Audit Controls</p>
          <p className="text-xs text-slate-500">Trace admin decisions and platform activity.</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm font-bold">
        <p>Total <span className="float-right text-[#155EEF]">{numberText(data?.total || 0)}</span></p>
        <p>Recent <span className="float-right text-emerald-600">{numberText(data?.summary.recent || 0)}</span></p>
        <p>RFQ flags <span className="float-right text-red-600">{numberText(data?.summary.rfqFlags || 0)}</span></p>
      </div>
    </Card>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
  tone = 'blue',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
  tone?: 'blue' | 'green' | 'orange' | 'purple';
}) {
  const tones = {
    blue: 'bg-blue-50 text-[#155EEF]',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-500',
    purple: 'bg-violet-50 text-violet-600',
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={`grid h-14 w-14 place-items-center rounded-full ${tones[tone]}`}>{icon}</div>
        <div>
          <p className="text-sm font-extrabold text-[#0B1744]">{label}</p>
          <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#0B1744]">{value}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{helper}</p>
        </div>
      </div>
    </Card>
  );
}

export function AuditLogViewer() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [actor, setActor] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const filters = useMemo(() => ({ search, entity, action, actor, from, to }), [search, entity, action, actor, from, to]);

  const loadAudit = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiFetch(buildQuery(filters), { method: 'GET' });
      if (!response.ok) {
        setMessage('Audit logs could not be loaded.');
        return;
      }
      setData((await response.json()) as AuditResponse);
    } catch {
      setMessage('Audit logs could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  const total = data?.total || 0;
  const recent = data?.summary.recent || 0;
  const adminActions = data?.summary.adminActions || 0;
  const userAccessChanges = data?.summary.userAccessChanges || 0;

  return (
    <AppShell
      nav={adminNav('Audit Logs')}
      search="Search audit events, actors, RFQs, organizations, or actions..."
      sidebarCard={<AuditSidebarCard data={data} />}
      requiredOrganizationTypes={['PLATFORM']}
      requiredRoles={['PLATFORM_ADMIN', 'PLATFORM_SUPPORT']}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-.03em]">Audit Logs</h1>
          <p className="mt-2 text-slate-600">Review platform actions, governance changes, RFQ flags, and user access updates.</p>
        </div>
        <button onClick={loadAudit} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-[#155EEF] px-6 py-3 text-sm font-black text-white disabled:opacity-50">
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {message && <p className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-bold text-[#155EEF]">{message}</p>}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<FileSearch />} label="Matching Logs" value={numberText(total)} helper="Current filtered result" />
        <MetricCard icon={<Clock3 />} label="Recent Activity" value={numberText(recent)} helper="Last seven days" tone="green" />
        <MetricCard icon={<ShieldCheck />} label="Admin Actions" value={numberText(adminActions)} helper="Governance and access events" tone="purple" />
        <MetricCard icon={<UserRoundCog />} label="User Access Changes" value={numberText(userAccessChanges)} helper="Status and role updates" tone="orange" />
      </div>

      <Card className="mt-5 p-5">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_.8fr_.9fr_.9fr_.7fr_.7fr_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search action, entity, actor, RFQ..."
              className="h-12 w-full rounded-xl border border-[#DFE9F7] bg-white pl-11 pr-4 text-sm font-bold outline-none focus:border-[#155EEF]"
            />
          </label>
          <select value={entity} onChange={(event) => setEntity(event.target.value)} className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]">
            <option value="">All entities</option>
            {(data?.filters.entities || []).map((item) => <option key={item} value={item}>{readable(item)}</option>)}
          </select>
          <select value={action} onChange={(event) => setAction(event.target.value)} className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]">
            <option value="">All actions</option>
            {(data?.filters.actions || []).map((item) => <option key={item} value={item}>{readable(item)}</option>)}
          </select>
          <input
            value={actor}
            onChange={(event) => setActor(event.target.value)}
            placeholder="Actor name or email"
            className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]"
          />
          <input
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            type="date"
            className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]"
          />
          <input
            value={to}
            onChange={(event) => setTo(event.target.value)}
            type="date"
            className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]"
          />
          <button onClick={loadAudit} disabled={loading} className="h-12 rounded-xl bg-[#121D4D] px-5 text-sm font-black text-white disabled:opacity-50">
            Apply
          </button>
        </div>
      </Card>

      <Card className="mt-5 overflow-hidden">
        <div className="border-b border-[#DFE9F7] px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-black text-[#0B1744]">Platform Activity</p>
              <p className="text-sm text-slate-500">Showing up to the latest 100 matching records.</p>
            </div>
            {data?.summary.rfqFlags ? <Pill tone="red">{numberText(data.summary.rfqFlags)} RFQ flags</Pill> : <Pill tone="green">No RFQ flags in view</Pill>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-[#F7FAFF] text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Linked RFQ</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF4FF]">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center font-bold text-slate-500">Loading audit logs...</td>
                </tr>
              )}
              {!loading && data?.logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center font-bold text-slate-500">No audit logs match the current filters.</td>
                </tr>
              )}
              {!loading && data?.logs.map((log) => (
                <tr key={log.id} className="align-top">
                  <td className="px-6 py-5">
                    <p className="font-black text-[#0B1744]">{shortDateTime(log.createdAt)}</p>
                    {log.ipAddress && <p className="mt-1 text-xs font-bold text-slate-400">{log.ipAddress}</p>}
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-black text-[#0B1744]">{log.actor?.name || 'System'}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{log.actor?.email || 'Automated platform event'}</p>
                  </td>
                  <td className="px-6 py-5">
                    <Pill tone={actionTone(log.action)}>{readable(log.action)}</Pill>
                    <p className="mt-2 max-w-[260px] text-xs font-bold leading-5 text-slate-500">{log.message}</p>
                  </td>
                  <td className="px-6 py-5">
                    <Pill tone={entityTone(log.entity)}>{readable(log.entity)}</Pill>
                    {log.entityId && <p className="mt-2 max-w-[170px] truncate text-xs font-bold text-slate-400">{log.entityId}</p>}
                  </td>
                  <td className="px-6 py-5">
                    {log.rfq ? (
                      <div>
                        <p className="font-black text-[#0B1744]">{log.rfq.reference}</p>
                        <p className="mt-1 max-w-[240px] text-xs font-bold leading-5 text-slate-500">{log.rfq.title}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Pill tone="gray">{readable(log.rfq.status)}</Pill>
                          <Pill tone="blue">{log.rfq.buyerOrganization.name}</Pill>
                        </div>
                      </div>
                    ) : (
                      <Pill tone="gray">No RFQ link</Pill>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    {log.metadata.length > 0 ? (
                      <div className="flex max-w-[360px] flex-wrap gap-2">
                        {log.metadata.map((item) => (
                          <span key={`${log.id}:${item.key}`} className="rounded-xl border border-[#DFE9F7] bg-[#F8FBFF] px-3 py-2 text-xs font-bold text-slate-600">
                            <span className="text-[#0B1744]">{item.key}:</span> {item.value}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <Pill tone="gray">No details</Pill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
