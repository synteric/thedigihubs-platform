'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Bell, BriefcaseBusiness, Building2, CalendarDays, FileText, Mail, Settings, Trophy, UsersRound } from 'lucide-react';
import { AppShell } from '../../components/app-shell';
import { PlanAccessCard } from '../../components/plan-access-card';
import { Card, Donut, Kpi, LineChart, Pill } from '../../components/ui';
import { apiErrorMessage, apiFetch } from '../../lib/api';
import { useSession } from '../../lib/session';

type BuyerRfqSummary = {
  id: string;
  reference: string;
  title: string;
  category: string;
  currency: string;
  status: string;
  closingDate: string;
  quoteCount: number;
  matchCount: number;
  lineItemCount: number;
  lowestQuote: string | null;
  hasAward: boolean;
  updatedAt: string;
};

const nav = [
  { label: 'Overview', icon: <BriefcaseBusiness size={20} />, active: true },
  { label: 'RFQs', icon: <FileText size={20} /> },
  { label: 'Quotes', icon: <FileText size={20} /> },
  { label: 'Suppliers', icon: <UsersRound size={20} /> },
  { label: 'Awards', icon: <Trophy size={20} /> },
  { label: 'Contracts', icon: <Building2 size={20} /> },
  { label: 'Analytics', icon: <BarChart3 size={20} /> },
  { label: 'Records', icon: <FileText size={20} /> },
  { label: 'Settings', icon: <Settings size={20} /> },
];

function formatShortDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function formatRangeLabel() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
}

function deadlineLabel(value: string) {
  const diff = Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Closed';
  if (diff === 0) return 'Due today';
  if (diff === 1) return '1 day left';
  return `${diff} days left`;
}

function statusLabel(value: string) {
  return value.replaceAll('_', ' ');
}

function statusTone(status: string): 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray' {
  if (status === 'AWARDED') return 'green';
  if (status === 'EVALUATION') return 'purple';
  if (status === 'DRAFT') return 'orange';
  if (status === 'CANCELLED') return 'red';
  if (status === 'CLOSED') return 'gray';
  return 'blue';
}

function formatMoney(value: string | null, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '-';

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('en-US')}`;
  }
}

function InviteCard({ canCreateRfq }: { canCreateRfq: boolean }) {
  return (
    <Card className="p-5">
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-[#155EEF]">
        <UsersRound />
      </div>
      <p className="text-lg font-black">Invite external suppliers</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">Grow your network and get more competitive quotes.</p>
      <Link href={canCreateRfq ? '/rfq/new' : '/subscribe'} className="mt-5 block w-full rounded-xl bg-[#155EEF] py-3 text-center text-sm font-black text-white">
        {canCreateRfq ? 'Invite Suppliers' : 'Request Full Access'}
      </Link>
    </Card>
  );
}

export default function BuyerDashboard() {
  const { session } = useSession();
  const firstName = session?.user.name.split(' ')[0] || 'there';
  const canCreateRfq = Boolean(session?.features.includes('rfq_creation'));
  const [rfqs, setRfqs] = useState<BuyerRfqSummary[]>([]);
  const [rfqsLoading, setRfqsLoading] = useState(true);
  const [rfqsError, setRfqsError] = useState('');
  const [showAllRfqs, setShowAllRfqs] = useState(false);
  const [showAllHighlights, setShowAllHighlights] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const dateRangeLabel = useMemo(() => formatRangeLabel(), []);
  const dashboardMetrics = useMemo(() => {
    const activeRfqs = rfqs.filter((rfq) => !['CLOSED', 'CANCELLED', 'AWARDED'].includes(rfq.status)).length;
    const quoteCount = rfqs.reduce((total, rfq) => total + rfq.quoteCount, 0);
    const evaluationReady = rfqs.filter((rfq) => rfq.quoteCount > 0 && !rfq.hasAward).length;
    const pendingAwards = rfqs.filter((rfq) => rfq.quoteCount > 0 && !rfq.hasAward && ['QUOTATION_OPEN', 'EVALUATION', 'PUBLISHED'].includes(rfq.status)).length;

    return {
      activeRfqs,
      quoteCount,
      evaluationReady,
      pendingAwards,
    };
  }, [rfqs]);
  const quoteEvaluationRows = showAllRfqs ? rfqs : rfqs.slice(0, 5);
  const evaluationHighlights = rfqs.filter((rfq) => rfq.quoteCount > 0);
  const visibleEvaluationHighlights = showAllHighlights ? evaluationHighlights : evaluationHighlights.slice(0, 3);
  const visibleActivity = showAllActivity ? rfqs : rfqs.slice(0, 5);
  const pipelineStages = useMemo(() => ([
    ['Draft', rfqs.filter((rfq) => rfq.status === 'DRAFT').length],
    ['Published', rfqs.filter((rfq) => ['PUBLISHED', 'QUOTATION_OPEN'].includes(rfq.status)).length],
    ['Closing Soon', rfqs.filter((rfq) => {
      const daysLeft = Math.ceil((new Date(rfq.closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return !['CLOSED', 'CANCELLED', 'AWARDED'].includes(rfq.status) && daysLeft >= 0 && daysLeft <= 7;
    }).length],
    ['Evaluation', rfqs.filter((rfq) => rfq.quoteCount > 0 && !rfq.hasAward).length],
    ['Awarded', rfqs.filter((rfq) => rfq.hasAward || rfq.status === 'AWARDED').length],
  ]), [rfqs]);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;

    async function loadRfqs() {
      setRfqsLoading(true);
      setRfqsError('');

      try {
        const response = await apiFetch('/rfqs/buyer/rfqs', { method: 'GET' });
        if (!response.ok) {
          throw new Error(await apiErrorMessage(response, `Unable to load buyer RFQs. Status ${response.status}.`));
        }

        const data = await response.json();
        if (!cancelled) {
          setRfqs(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          setRfqsError(error instanceof Error ? error.message : 'Unable to load buyer RFQs.');
          setRfqs([]);
        }
      } finally {
        if (!cancelled) {
          setRfqsLoading(false);
        }
      }
    }

    loadRfqs();

    return () => {
      cancelled = true;
    };
  }, [session]);

  return (
    <AppShell
      nav={nav}
      sidebarCard={<InviteCard canCreateRfq={canCreateRfq} />}
      requiredOrganizationTypes={['BUYER']}
      requiredRoles={['BUYER_OWNER', 'BUYER_MANAGER', 'BUYER_EVALUATOR']}
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-[-.03em]">Welcome back, {firstName}</h1>
          <p className="mt-2 text-slate-600">Here&apos;s what&apos;s happening with your sourcing activity.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-[#DFE9F7] bg-white px-5 py-3 text-sm font-black">
            <CalendarDays className="mr-2 inline" size={16} />
            {dateRangeLabel}
          </div>
          <Link href={canCreateRfq ? '/rfq/new' : '/subscribe'} className="rounded-xl bg-[#155EEF] px-6 py-3 text-sm font-black text-white">
            {canCreateRfq ? '+ Create RFQ' : 'Request Full Access'}
          </Link>
        </div>
      </div>

      <PlanAccessCard className="mb-5" compact activeHref="/buyer" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<FileText />} label="Active RFQs" value={rfqsLoading ? '...' : String(dashboardMetrics.activeRfqs)} change="live RFQ feed" />
        <Kpi icon={<Mail />} label="Quotes Received" value={rfqsLoading ? '...' : String(dashboardMetrics.quoteCount)} change="submitted supplier quotes" tone="green" />
        <Kpi icon={<UsersRound />} label="Ready to Evaluate" value={rfqsLoading ? '...' : String(dashboardMetrics.evaluationReady)} change="quote evaluation queue" tone="orange" />
        <Kpi icon={<Trophy />} label="Pending Awards" value={rfqsLoading ? '...' : String(dashboardMetrics.pendingAwards)} change="awaiting decision" tone="purple" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_1fr]">
        <Card className="p-5">
          <div className="flex justify-between">
            <h2 className="text-xl font-black">RFQ Activity Trend</h2>
            <p className="text-sm font-bold text-slate-600">RFQs Created &nbsp;&nbsp; - - Quotes Received</p>
          </div>
          <LineChart />
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-black">Spend by Category</h2>
          <div className="mt-3">
            <Donut />
          </div>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_.9fr_.9fr]">
        <Card className="overflow-x-auto p-5">
          <div className="flex justify-between">
            <h2 className="text-xl font-black">Quote Evaluation Queue</h2>
            <Link href={canCreateRfq ? '/rfq/new' : '/subscribe'} className="text-sm font-black text-[#155EEF]">
              {canCreateRfq ? 'Create RFQ ->' : 'Request access ->'}
            </Link>
          </div>
          <table className="mt-4 min-w-[720px] w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th>RFQ</th>
                <th>Quotes</th>
                <th>Lowest Quote</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody className="font-bold">
              {rfqsLoading && (
                <tr className="border-t border-[#DFE9F7]">
                  <td colSpan={6} className="py-8 text-center text-slate-500">Loading RFQs...</td>
                </tr>
              )}
              {!rfqsLoading && rfqsError && (
                <tr className="border-t border-[#DFE9F7]">
                  <td colSpan={6} className="py-8 text-center text-red-600">{rfqsError}</td>
                </tr>
              )}
              {!rfqsLoading && !rfqsError && rfqs.length === 0 && (
                <tr className="border-t border-[#DFE9F7]">
                  <td colSpan={6} className="py-8 text-center text-slate-500">No RFQs yet. Create and publish an RFQ to start receiving quotes.</td>
                </tr>
              )}
              {!rfqsLoading && !rfqsError && quoteEvaluationRows.map((rfq) => (
                <tr key={rfq.id} className="border-t border-[#DFE9F7]">
                  <td className="py-4 text-[#155EEF]">
                    {rfq.title}
                    <br />
                    <span className="text-xs text-slate-500">{rfq.reference} - {rfq.category}</span>
                  </td>
                  <td>{rfq.quoteCount}</td>
                  <td>{formatMoney(rfq.lowestQuote, rfq.currency)}</td>
                  <td>
                    {formatShortDate(rfq.closingDate)}
                    <br />
                    <span className="text-xs text-red-500">{deadlineLabel(rfq.closingDate)}</span>
                  </td>
                  <td><Pill tone={statusTone(rfq.status)}>{statusLabel(rfq.status)}</Pill></td>
                  <td>
                    <Link
                      href={`/buyer/rfq/${rfq.id}/evaluation`}
                      className={`inline-flex rounded-lg px-3 py-2 text-xs font-black ${rfq.quoteCount > 0 ? 'border border-blue-200 text-[#155EEF]' : 'border border-slate-200 text-slate-400'}`}
                    >
                      {rfq.quoteCount > 0 ? 'Evaluate' : 'Awaiting Quotes'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rfqs.length > 5 && (
            <button type="button" onClick={() => setShowAllRfqs((current) => !current)} className="mt-3 text-sm font-black text-[#155EEF]">
              {showAllRfqs ? 'Show fewer quote evaluations' : `View all ${rfqs.length} quote evaluations ->`}
            </button>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex justify-between">
            <h2 className="text-xl font-black">Evaluation Highlights</h2>
            {evaluationHighlights.length > 3 && (
              <button type="button" onClick={() => setShowAllHighlights((current) => !current)} className="text-sm font-black text-[#155EEF]">
                {showAllHighlights ? 'Show fewer' : 'View all ->'}
              </button>
            )}
          </div>
          {rfqsLoading && <p className="py-4 text-sm font-bold text-slate-500">Loading highlights...</p>}
          {!rfqsLoading && visibleEvaluationHighlights.map((rfq) => (
            <div key={rfq.id} className="border-b border-[#DFE9F7] py-4 last:border-0">
              <div className="flex justify-between">
                <p className="font-black">{rfq.title}</p>
                <p className="font-black text-emerald-600">{rfq.quoteCount} quote{rfq.quoteCount === 1 ? '' : 's'}</p>
              </div>
              <p className="text-sm text-slate-600">Lowest quote {formatMoney(rfq.lowestQuote, rfq.currency)} - {rfq.matchCount} matched suppliers</p>
            </div>
          ))}
          {!rfqsLoading && evaluationHighlights.length === 0 && (
            <p className="py-4 text-sm font-bold text-slate-500">Evaluation highlights will appear when submitted quotes arrive.</p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex justify-between">
            <h2 className="text-xl font-black">Recent Activity</h2>
            {rfqs.length > 5 && (
              <button type="button" onClick={() => setShowAllActivity((current) => !current)} className="text-sm font-black text-[#155EEF]">
                {showAllActivity ? 'Show fewer' : 'View all ->'}
              </button>
            )}
          </div>
          {rfqsLoading && <p className="py-4 text-sm font-bold text-slate-500">Loading recent activity...</p>}
          {!rfqsLoading && visibleActivity.map((rfq) => (
            <div key={rfq.id} className="flex gap-3 border-b border-[#DFE9F7] py-3 last:border-0">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-[#155EEF]">
                <Bell size={16} />
              </span>
              <div>
                <p className="text-sm font-black">{rfq.reference} has {rfq.quoteCount} quote{rfq.quoteCount === 1 ? '' : 's'}</p>
                <p className="text-xs text-slate-500">{statusLabel(rfq.status)} - updated {formatShortDate(rfq.updatedAt)}</p>
              </div>
            </div>
          ))}
          {!rfqsLoading && rfqs.length === 0 && <p className="py-4 text-sm font-bold text-slate-500">RFQ activity will appear here.</p>}
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <div className="flex justify-between">
          <h2 className="text-xl font-black">RFQ Pipeline</h2>
          <Link href={canCreateRfq ? '/rfq/new' : '/subscribe'} className="text-sm font-black text-[#155EEF]">
            {canCreateRfq ? 'Create RFQ ->' : 'Request access ->'}
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {pipelineStages.map((stage) => (
            <div key={stage[0]} className="rounded-2xl border border-[#DFE9F7] bg-white p-4">
              <p className="text-sm font-black">{stage[0]}</p>
              <p className="mt-1 text-3xl font-black">{stage[1]}</p>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
