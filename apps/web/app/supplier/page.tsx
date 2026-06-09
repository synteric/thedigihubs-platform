'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BarChart3, BriefcaseBusiness, CalendarDays, FileText, Folder, MessageSquare, Settings, ShoppingCart, Target, Trophy, UsersRound } from 'lucide-react';
import { AppShell } from '../../components/app-shell';
import { PlanAccessCard } from '../../components/plan-access-card';
import { Card, Kpi, LineChart, Pill } from '../../components/ui';
import { apiFetch } from '../../lib/api';
import { useSession } from '../../lib/session';

type SupplierOpportunity = {
  matchId: string;
  rfqId: string;
  reference: string;
  title: string;
  category: string;
  buyerName: string;
  score: number;
  status: string;
  quoteStatus: string | null;
  closingDate: string;
  lineItemCount: number;
  actionLabel: string;
};

const nav = [
  { label: 'Overview', icon: <BriefcaseBusiness size={20} />, active: true },
  { label: 'Matched Opportunities', icon: <Target size={20} /> },
  { label: 'Quotes', icon: <FileText size={20} /> },
  { label: 'Orders', icon: <ShoppingCart size={20} /> },
  { label: 'Buyers', icon: <UsersRound size={20} /> },
  { label: 'Performance', icon: <BarChart3 size={20} /> },
  { label: 'Documents', icon: <Folder size={20} /> },
  { label: 'Messages', icon: <MessageSquare size={20} /> },
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
  const deadline = new Date(value).getTime();
  const diff = Math.ceil((deadline - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Closed';
  if (diff === 0) return 'Due today';
  if (diff === 1) return '1 day left';
  return `${diff} days left`;
}

function displayStatus(opportunity: SupplierOpportunity) {
  if (opportunity.quoteStatus) return opportunity.quoteStatus.replaceAll('_', ' ');
  if (opportunity.status === 'DRAFT') return 'Matched';
  if (opportunity.status === 'QUOTATION_OPEN' || opportunity.status === 'PUBLISHED') return 'New';
  return opportunity.status.replaceAll('_', ' ');
}

function statusTone(opportunity: SupplierOpportunity): 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray' {
  if (opportunity.quoteStatus === 'AWARDED') return 'green';
  if (opportunity.quoteStatus === 'SHORTLISTED') return 'purple';
  if (opportunity.quoteStatus === 'REJECTED' || opportunity.quoteStatus === 'WITHDRAWN') return 'red';
  if (opportunity.quoteStatus === 'DRAFT') return 'orange';
  if (opportunity.status === 'CLOSED' || opportunity.status === 'CANCELLED') return 'gray';
  return 'blue';
}

function CompleteCard() {
  return (
    <Card className="p-5">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-full border-4 border-blue-100 text-xl font-black text-[#155EEF]">78%</div>
      <p className="text-lg font-black">Complete your profile</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">Increase your visibility and get matched with more opportunities.</p>
      <Link href="/subscribe" className="mt-5 block w-full rounded-xl bg-[#155EEF] py-3 text-center text-sm font-black text-white">
        Complete Now →
      </Link>
    </Card>
  );
}

export default function Supplier() {
  const { session } = useSession();
  const firstName = session?.user.name.split(' ')[0] || 'there';
  const canUseQuoteWorkflow = Boolean(session?.features.includes('quote_comparison'));
  const [opportunities, setOpportunities] = useState<SupplierOpportunity[]>([]);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(true);
  const [opportunitiesError, setOpportunitiesError] = useState('');
  const dateRangeLabel = useMemo(() => formatRangeLabel(), []);
  const opportunityMetrics = useMemo(() => {
    const submittedQuotes = opportunities.filter((opportunity) => opportunity.quoteStatus && opportunity.quoteStatus !== 'DRAFT').length;
    const activeOrders = opportunities.filter((opportunity) => opportunity.status === 'AWARDED' || opportunity.quoteStatus === 'AWARDED').length;
    const awardsWon = opportunities.filter((opportunity) => opportunity.quoteStatus === 'AWARDED').length;
    const draftQuotes = opportunities.filter((opportunity) => opportunity.quoteStatus === 'DRAFT').length;
    const readyToQuote = opportunities.filter((opportunity) => !opportunity.quoteStatus).length;
    const shortlisted = opportunities.filter((opportunity) => opportunity.quoteStatus === 'SHORTLISTED').length;
    const averageScore = opportunities.length
      ? Math.round(opportunities.reduce((total, opportunity) => total + opportunity.score, 0) / opportunities.length)
      : 0;

    return {
      matched: opportunities.length,
      submittedQuotes,
      activeOrders,
      awardsWon,
      draftQuotes,
      readyToQuote,
      shortlisted,
      averageScore,
    };
  }, [opportunities]);
  const buyerEngagement = useMemo(() => {
    const buyers = new Map<string, number>();
    opportunities.forEach((opportunity) => {
      buyers.set(opportunity.buyerName, Math.max(buyers.get(opportunity.buyerName) || 0, opportunity.score));
    });

    return Array.from(buyers.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [opportunities]);
  const recentActivity = useMemo(() => opportunities.slice(0, 4).map((opportunity) => ({
    id: opportunity.matchId,
    label: `${opportunity.reference} matched from ${opportunity.buyerName}`,
    time: deadlineLabel(opportunity.closingDate),
  })), [opportunities]);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;

    async function loadOpportunities() {
      setOpportunitiesLoading(true);
      setOpportunitiesError('');

      try {
        const response = await apiFetch('/rfqs/supplier/opportunities', { method: 'GET' });
        if (!response.ok) {
          throw new Error('Unable to load supplier opportunities');
        }

        const data = await response.json();
        if (!cancelled) {
          setOpportunities(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          setOpportunitiesError(error instanceof Error ? error.message : 'Unable to load supplier opportunities');
          setOpportunities([]);
        }
      } finally {
        if (!cancelled) {
          setOpportunitiesLoading(false);
        }
      }
    }

    loadOpportunities();

    return () => {
      cancelled = true;
    };
  }, [session]);

  return (
    <AppShell
      nav={nav}
      search="Search RFQs, buyers, categories, or anything..."
      sidebarCard={<CompleteCard />}
      requiredOrganizationTypes={['SUPPLIER']}
      requiredRoles={['SUPPLIER_OWNER', 'SUPPLIER_MANAGER', 'SUPPLIER_STAFF']}
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-[-.03em]">Welcome back, {firstName}.</h1>
          <p className="mt-2 text-slate-600">Here&apos;s your supplier dashboard overview.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-[#DFE9F7] bg-white px-5 py-3 text-sm font-black">
            <CalendarDays className="mr-2 inline" size={16} />
            {dateRangeLabel}
          </div>
          <Link href={canUseQuoteWorkflow ? '#matched-opportunities' : '/samples'} className="rounded-xl bg-[#155EEF] px-6 py-3 text-sm font-black text-white">
            {canUseQuoteWorkflow ? 'View Opportunities →' : 'View Samples →'}
          </Link>
        </div>
      </div>

      <PlanAccessCard className="mb-5" compact activeHref="/supplier" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<Target />} label="Matched Opportunities" value={opportunitiesLoading ? '...' : String(opportunityMetrics.matched)} change="live match feed" />
        <Kpi icon={<FileText />} label="Submitted Quotes" value={String(opportunityMetrics.submittedQuotes)} change="from your quotes" tone="green" />
        <Kpi icon={<ShoppingCart />} label="Active Orders" value={String(opportunityMetrics.activeOrders)} change="awarded RFQs" tone="orange" />
        <Kpi icon={<Trophy />} label="Awards Won" value={String(opportunityMetrics.awardsWon)} change="supplier wins" tone="purple" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_.8fr]">
        <Card className="overflow-x-auto p-5" id="matched-opportunities">
          <div className="mb-4 flex justify-between">
            <h2 className="text-xl font-black">Matched Opportunities</h2>
            <Link href="#matched-opportunities" className="text-sm font-black text-[#155EEF]">View all opportunities →</Link>
          </div>
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th>RFQ</th>
                <th>Buyer</th>
                <th>Match Score</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody className="font-bold">
              {opportunitiesLoading && (
                <tr className="border-t border-[#DFE9F7]">
                  <td colSpan={6} className="py-8 text-center text-slate-500">Loading matched opportunities...</td>
                </tr>
              )}
              {!opportunitiesLoading && opportunitiesError && (
                <tr className="border-t border-[#DFE9F7]">
                  <td colSpan={6} className="py-8 text-center text-red-500">{opportunitiesError}</td>
                </tr>
              )}
              {!opportunitiesLoading && !opportunitiesError && opportunities.length === 0 && (
                <tr className="border-t border-[#DFE9F7]">
                  <td colSpan={6} className="py-8 text-center text-slate-500">No matched opportunities yet. New buyer RFQs will appear here after supplier matching runs.</td>
                </tr>
              )}
              {!opportunitiesLoading && !opportunitiesError && opportunities.slice(0, 5).map((opportunity) => (
                <tr key={opportunity.matchId} className="border-t border-[#DFE9F7]">
                  <td className="py-4 text-[#155EEF]">
                    {opportunity.reference}
                    <br />
                    <span className="text-xs text-slate-500">{opportunity.category}</span>
                  </td>
                  <td>{opportunity.buyerName}</td>
                  <td>
                    <span className="text-emerald-700">{opportunity.score}%</span>
                    <div className="mt-1 h-1.5 rounded bg-slate-100">
                      <div className="h-full rounded bg-emerald-500" style={{ width: `${Math.max(8, Math.min(100, opportunity.score))}%` }} />
                    </div>
                  </td>
                  <td>
                    {formatShortDate(opportunity.closingDate)}
                    <br />
                    <span className="text-xs text-red-500">{deadlineLabel(opportunity.closingDate)}</span>
                  </td>
                  <td>
                    <Pill tone={statusTone(opportunity)}>{displayStatus(opportunity)}</Pill>
                  </td>
                  <td>
                    <Link href={`/supplier/rfq/${opportunity.rfqId}`} className="inline-flex rounded-lg border border-blue-200 px-3 py-2 text-xs font-black text-[#155EEF]">
                      {opportunity.actionLabel || 'Prepare Quote'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex justify-between">
              <h2 className="text-xl font-black">Profile & Compliance</h2>
              <Pill tone="green">Verified Supplier</Pill>
            </div>
            <div className="mt-5 flex gap-6">
              <div className="grid h-32 w-32 place-items-center rounded-full border-[12px] border-[#155EEF] text-center">
                <p className="text-3xl font-black">85%</p>
                <p className="text-xs">Complete</p>
              </div>
              <div className="space-y-2 text-sm font-bold text-slate-600">
                <p>✓ Company Profile</p>
                <p>✓ Capabilities & Services</p>
                <p>✓ Certifications</p>
                <p className="text-orange-500">3 expiring documents ⚠</p>
              </div>
            </div>
            <p className="mt-5 text-sm font-black text-[#155EEF]">Upload Documents →</p>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-black">Buyer Engagement</h2>
            {buyerEngagement.length === 0 && (
              <p className="py-3 text-sm font-bold text-slate-500">Buyer engagement will populate as matched RFQs arrive.</p>
            )}
            {buyerEngagement.map(([buyer, score]) => (
              <p key={buyer} className="border-b border-[#DFE9F7] py-3 text-sm font-bold last:border-0">
                {buyer} <span className="float-right text-blue-600">{score}%</span>
              </p>
            ))}
          </Card>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_.8fr_.9fr]">
        <Card className="p-5">
          <h2 className="text-xl font-black">Opportunity Activity Trend</h2>
          <LineChart />
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-black">Quote Performance Snapshot</h2>
          {[
            ['Matched RFQs', String(opportunityMetrics.matched)],
            ['Ready to Quote', String(opportunityMetrics.readyToQuote)],
            ['Average Match Score', `${opportunityMetrics.averageScore}%`],
            ['Quotes Submitted', String(opportunityMetrics.submittedQuotes)],
            ['Awards Won', String(opportunityMetrics.awardsWon)],
          ].map((row) => (
            <p key={row[0]} className="flex justify-between border-b border-[#DFE9F7] py-3 text-sm font-bold">
              <span>{row[0]}</span>
              <span>{row[1]}</span>
            </p>
          ))}
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-black">Recent Activity</h2>
          {recentActivity.length === 0 && (
            <p className="py-3 text-sm font-bold text-slate-500">New matched RFQ activity will appear here.</p>
          )}
          {recentActivity.map((activity) => (
            <p key={activity.id} className="border-b border-[#DFE9F7] py-3 text-sm font-bold last:border-0">
              {activity.label}
              <span className="float-right text-xs text-slate-500">{activity.time}</span>
            </p>
          ))}
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <h2 className="text-xl font-black">Quote Pipeline</h2>
        <div className="mt-4 grid grid-cols-5 gap-4">
          {[
            ['Ready to Quote', String(opportunityMetrics.readyToQuote)],
            ['Draft Quotes', String(opportunityMetrics.draftQuotes)],
            ['Submitted', String(opportunityMetrics.submittedQuotes)],
            ['Shortlisted', String(opportunityMetrics.shortlisted)],
            ['Awarded', String(opportunityMetrics.awardsWon)],
          ].map((stage) => (
            <div key={stage[0]} className="rounded-2xl border border-[#DFE9F7] p-4">
              <p className="text-sm font-black">{stage[0]}</p>
              <p className="mt-1 text-3xl font-black">{stage[1]}</p>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
