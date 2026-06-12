'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Inbox, LifeBuoy, RefreshCcw, Search, Ticket, UserRound } from 'lucide-react';
import { AppShell } from '../../../components/app-shell';
import { Card, Kpi, Pill } from '../../../components/ui';
import { apiFetch } from '../../../lib/api';
import { adminNav } from '../admin-nav';

type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CUSTOMER' | 'RESOLVED' | 'CLOSED';
type SupportTicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
type OrganizationType = 'BUYER' | 'SUPPLIER' | 'PLATFORM';
type OrganizationStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

type Assignee = {
  id: string;
  name: string;
  email: string;
};

type SupportTicketItem = {
  id: string;
  reference: string;
  subject: string;
  description: string;
  category: string | null;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  requesterName: string | null;
  requesterEmail: string | null;
  organization: null | {
    id: string;
    name: string;
    type: OrganizationType;
    status: OrganizationStatus;
  };
  createdBy: Assignee | null;
  assignedTo: Assignee | null;
  reviewedBy: Assignee | null;
  resolutionNote: string | null;
  lastResponseAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ageDays: number;
};

type SupportTicketsResponse = {
  total: number;
  summary: {
    open: number;
    inProgress: number;
    waiting: number;
    resolved: number;
    closed: number;
    urgent: number;
    accessReviews: number;
  };
  assignees: Assignee[];
  tickets: SupportTicketItem[];
};

const statuses: Array<'ALL' | SupportTicketStatus> = ['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'];
const priorities: Array<'ALL' | SupportTicketPriority> = ['ALL', 'URGENT', 'HIGH', 'NORMAL', 'LOW'];
const editableStatuses: SupportTicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'];
const editablePriorities: SupportTicketPriority[] = ['URGENT', 'HIGH', 'NORMAL', 'LOW'];

function numberText(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function readable(value?: string | null) {
  if (!value) return 'Not set';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function dateText(value?: string | null) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function statusTone(status: SupportTicketStatus): 'blue' | 'green' | 'orange' | 'purple' | 'gray' {
  if (status === 'OPEN') return 'blue';
  if (status === 'IN_PROGRESS') return 'purple';
  if (status === 'WAITING_ON_CUSTOMER') return 'orange';
  if (status === 'RESOLVED') return 'green';
  return 'gray';
}

function priorityTone(priority: SupportTicketPriority): 'green' | 'orange' | 'red' | 'gray' {
  if (priority === 'URGENT') return 'red';
  if (priority === 'HIGH') return 'orange';
  if (priority === 'NORMAL') return 'green';
  return 'gray';
}

function buildQuery(filters: {
  search: string;
  status: 'ALL' | SupportTicketStatus;
  priority: 'ALL' | SupportTicketPriority;
  assigned: string;
}) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.status !== 'ALL') params.set('status', filters.status);
  if (filters.priority !== 'ALL') params.set('priority', filters.priority);
  if (filters.assigned !== 'ALL') params.set('assigned', filters.assigned);
  const query = params.toString();
  return query ? `/admin/support?${query}` : '/admin/support';
}

function SupportSidebarCard({ data }: { data: SupportTicketsResponse | null }) {
  const active = (data?.summary.open || 0) + (data?.summary.inProgress || 0) + (data?.summary.waiting || 0);
  return (
    <Card className="p-5">
      <div className="flex gap-3">
        <LifeBuoy className="text-[#155EEF]" />
        <div>
          <p className="font-black">Support Control</p>
          <p className="text-xs text-slate-500">Review support and access requests.</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm font-bold">
        <p>Active <span className="float-right text-[#155EEF]">{numberText(active)}</span></p>
        <p>Urgent <span className="float-right text-red-600">{numberText(data?.summary.urgent || 0)}</span></p>
        <p>Resolved <span className="float-right text-emerald-600">{numberText(data?.summary.resolved || 0)}</span></p>
      </div>
    </Card>
  );
}

export function SupportTicketsManager() {
  const [data, setData] = useState<SupportTicketsResponse | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | SupportTicketStatus>('ALL');
  const [priority, setPriority] = useState<'ALL' | SupportTicketPriority>('ALL');
  const [assigned, setAssigned] = useState('ALL');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');
  const [message, setMessage] = useState('');

  const filters = useMemo(() => ({ search, status, priority, assigned }), [search, status, priority, assigned]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiFetch(buildQuery(filters), { method: 'GET' });
      if (!response.ok) {
        setMessage('Support tickets could not be loaded.');
        return;
      }
      const payload = (await response.json()) as SupportTicketsResponse;
      setData(payload);
      setNotes((current) => {
        const next = { ...current };
        for (const ticket of payload.tickets) {
          if (next[ticket.id] === undefined) next[ticket.id] = ticket.resolutionNote || '';
        }
        return next;
      });
    } catch {
      setMessage('Support tickets could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  function replaceTicket(updated: SupportTicketItem) {
    setData((current) => current ? {
      ...current,
      tickets: current.tickets.map((ticket) => ticket.id === updated.id ? updated : ticket),
    } : current);
    setNotes((current) => ({ ...current, [updated.id]: updated.resolutionNote || '' }));
  }

  async function updateTicket(ticket: SupportTicketItem, patch: Partial<{
    status: SupportTicketStatus;
    priority: SupportTicketPriority;
    assignedToId: string;
    resolutionNote: string;
  }>, successMessage: string) {
    setUpdating(ticket.id);
    setMessage('');
    try {
      const response = await apiFetch(`/admin/support/${ticket.id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        setMessage('Support ticket could not be updated.');
        return;
      }
      replaceTicket((await response.json()) as SupportTicketItem);
      await loadTickets();
      setMessage(successMessage);
    } catch {
      setMessage('Support ticket could not be updated.');
    } finally {
      setUpdating('');
    }
  }

  return (
    <AppShell
      nav={adminNav('Support Tickets')}
      search="Search organizations, users, plans, RFQs, or audit history..."
      sidebarCard={<SupportSidebarCard data={data} />}
      requiredOrganizationTypes={['PLATFORM']}
      requiredRoles={['PLATFORM_ADMIN', 'PLATFORM_SUPPORT']}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-.03em]">Support Tickets</h1>
          <p className="mt-2 text-slate-600">Triage support issues, registration reviews, ownership, and resolution notes.</p>
        </div>
        <button onClick={loadTickets} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-[#155EEF] px-6 py-3 text-sm font-black text-white disabled:opacity-50">
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {message && <p className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-bold text-[#155EEF]">{message}</p>}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<Ticket />} label="Matching Tickets" value={numberText(data?.total || 0)} change="Current filtered result" />
        <Kpi icon={<Inbox />} label="Open" value={numberText(data?.summary.open || 0)} change="New customer issues" tone="green" />
        <Kpi icon={<Clock3 />} label="Access Reviews" value={numberText(data?.summary.accessReviews || 0)} change="Registration reviews awaiting admin" tone="orange" />
        <Kpi icon={<AlertTriangle />} label="Urgent" value={numberText(data?.summary.urgent || 0)} change="Priority review required" tone="purple" />
      </div>

      <Card className="mt-5 p-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_190px_170px_220px]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by ticket, requester, organization, category, access review, or assignee"
              className="h-12 w-full rounded-xl border border-[#DFE9F7] bg-white pl-11 pr-4 text-sm font-bold outline-none focus:border-[#155EEF]"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value as 'ALL' | SupportTicketStatus)} className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]">
            {statuses.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All statuses' : readable(item)}</option>)}
          </select>
          <select value={priority} onChange={(event) => setPriority(event.target.value as 'ALL' | SupportTicketPriority)} className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]">
            {priorities.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All priorities' : readable(item)}</option>)}
          </select>
          <select value={assigned} onChange={(event) => setAssigned(event.target.value)} className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]">
            <option value="ALL">All assignees</option>
            <option value="UNASSIGNED">Unassigned</option>
            {(data?.assignees || []).map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name}</option>)}
          </select>
        </div>
      </Card>

      <Card className="mt-5 overflow-hidden p-0">
        <div className="border-b border-[#DFE9F7] p-5">
          <h2 className="text-xl font-black">Ticket Queue</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">Status, priority, assignee, and resolution updates are captured in the audit log.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[.12em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Ticket</th>
                <th className="px-5 py-4">Requester</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Priority</th>
                <th className="px-5 py-4">Assigned</th>
                <th className="px-5 py-4">Admin Response</th>
                <th className="px-5 py-4">Timeline</th>
              </tr>
            </thead>
            <tbody className="font-bold">
              {loading && !data ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">Loading support tickets...</td>
                </tr>
              ) : data?.tickets.length ? data.tickets.map((ticket) => (
                <tr key={ticket.id} className="border-t border-[#DFE9F7] align-top">
                  <td className="max-w-[340px] px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs font-black text-[#155EEF]">{ticket.reference}</p>
                      {ticket.category && <Pill tone="gray">{ticket.category}</Pill>}
                    </div>
                    <p className="mt-2 text-base font-black text-[#0B1744]">{ticket.subject}</p>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">{ticket.description}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-[#155EEF]">
                        <UserRound size={18} />
                      </div>
                      <div>
                        <p className="font-black">{ticket.requesterName || ticket.createdBy?.name || 'Requester'}</p>
                        <p className="mt-1 text-xs text-slate-500">{ticket.requesterEmail || ticket.createdBy?.email || 'No email recorded'}</p>
                        {ticket.organization && <p className="mt-2 text-xs text-slate-500">{ticket.organization.name}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-2">
                      <Pill tone={statusTone(ticket.status)}>{readable(ticket.status)}</Pill>
                      <select
                        value={ticket.status}
                        disabled={updating === ticket.id}
                        onChange={(event) => updateTicket(ticket, { status: event.target.value as SupportTicketStatus }, `${ticket.reference} status updated.`)}
                        className="h-10 w-48 rounded-xl border border-[#DFE9F7] bg-white px-3 text-xs font-black outline-none focus:border-[#155EEF] disabled:opacity-60"
                      >
                        {editableStatuses.map((item) => <option key={item} value={item}>{readable(item)}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-2">
                      <Pill tone={priorityTone(ticket.priority)}>{readable(ticket.priority)}</Pill>
                      <select
                        value={ticket.priority}
                        disabled={updating === ticket.id}
                        onChange={(event) => updateTicket(ticket, { priority: event.target.value as SupportTicketPriority }, `${ticket.reference} priority updated.`)}
                        className="h-10 w-36 rounded-xl border border-[#DFE9F7] bg-white px-3 text-xs font-black outline-none focus:border-[#155EEF] disabled:opacity-60"
                      >
                        {editablePriorities.map((item) => <option key={item} value={item}>{readable(item)}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={ticket.assignedTo?.id || 'UNASSIGNED'}
                      disabled={updating === ticket.id}
                      onChange={(event) => updateTicket(ticket, { assignedToId: event.target.value }, `${ticket.reference} assignee updated.`)}
                      className="h-10 w-52 rounded-xl border border-[#DFE9F7] bg-white px-3 text-xs font-black outline-none focus:border-[#155EEF] disabled:opacity-60"
                    >
                      <option value="UNASSIGNED">Unassigned</option>
                      {(data?.assignees || []).map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name}</option>)}
                    </select>
                    {ticket.assignedTo && <p className="mt-2 text-xs text-slate-500">{ticket.assignedTo.email}</p>}
                  </td>
                  <td className="w-[300px] px-5 py-4">
                    <textarea
                      value={notes[ticket.id] ?? ''}
                      onChange={(event) => setNotes((current) => ({ ...current, [ticket.id]: event.target.value }))}
                      placeholder="Add internal resolution note"
                      className="min-h-24 w-full resize-y rounded-xl border border-[#DFE9F7] bg-white px-3 py-3 text-xs font-bold leading-5 outline-none focus:border-[#155EEF]"
                    />
                    <button
                      disabled={updating === ticket.id}
                      onClick={() => updateTicket(ticket, { resolutionNote: notes[ticket.id] || '' }, `${ticket.reference} response note updated.`)}
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#155EEF] px-4 py-2 text-xs font-black text-white disabled:opacity-60"
                    >
                      <CheckCircle2 size={14} />
                      Save Response
                    </button>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    <p><span className="font-black text-[#0B1744]">{ticket.ageDays}</span> days open</p>
                    <p className="mt-2">Created {dateText(ticket.createdAt)}</p>
                    <p className="mt-2">Updated {dateText(ticket.updatedAt)}</p>
                    {ticket.resolvedAt && <p className="mt-2 text-emerald-700">Resolved {dateText(ticket.resolvedAt)}</p>}
                    {ticket.reviewedBy && <p className="mt-2">Last reviewed by {ticket.reviewedBy.name}</p>}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <p className="font-black text-[#0B1744]">No support tickets match these filters.</p>
                    <p className="mt-2 text-sm font-bold text-slate-500">When customers submit support, contact, or registration requests, they will appear here for admin review.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
