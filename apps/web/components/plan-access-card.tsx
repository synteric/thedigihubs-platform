'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, CheckCircle2, Clock3, LockKeyhole, ShieldCheck, XCircle } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Card, Pill } from './ui';

type AccessState = 'SAMPLE_ACCESS' | 'UNDER_REVIEW' | 'ACTIVE' | 'REJECTED';
type PlanKey = 'STARTER' | 'GROWTH' | 'PROFESSIONAL' | 'ENTERPRISE';

type AccessStatus = {
  accessState: AccessState;
  activePlan: PlanKey;
  activeFeatures: string[];
  request: null | {
    id: string;
    selectedPlan: PlanKey;
    status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    reviewedAt?: string | null;
    decisionNote?: string | null;
  };
};

const stateContent: Record<AccessState, {
  icon: ReactNode;
  tone: 'blue' | 'green' | 'red';
  title: string;
  body: string;
  cta: string;
  href: string;
}> = {
  SAMPLE_ACCESS: {
    icon: <LockKeyhole size={20} />,
    tone: 'blue',
    title: 'Sample access active',
    body: 'Your organization can preview sample workflows. Request a subscription plan when you are ready for full access.',
    cta: 'Request Full Access',
    href: '/subscribe',
  },
  UNDER_REVIEW: {
    icon: <Clock3 size={20} />,
    tone: 'blue',
    title: 'Subscription request under review',
    body: 'Your selected plan has been submitted. Admin will review the request and assign access after approval.',
    cta: 'View Samples',
    href: '/samples',
  },
  ACTIVE: {
    icon: <CheckCircle2 size={20} />,
    tone: 'green',
    title: 'Plan access active',
    body: 'Your organization has an active subscription plan. Full workflows are available according to your plan.',
    cta: 'Continue Working',
    href: '/samples',
  },
  REJECTED: {
    icon: <XCircle size={20} />,
    tone: 'red',
    title: 'Subscription request needs attention',
    body: 'The latest plan request was not approved. Review your request details or contact support before submitting again.',
    cta: 'Submit New Request',
    href: '/subscribe',
  },
};

export function PlanAccessCard({ className = '', compact = false, activeHref = '/samples' }: { className?: string; compact?: boolean; activeHref?: string }) {
  const [status, setStatus] = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const response = await apiFetch('/subscription-requests/me', { method: 'GET' });
        if (!response.ok) return;
        const payload = (await response.json()) as AccessStatus;
        if (!cancelled) setStatus(payload);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !status) {
    return (
      <Card className={`p-5 ${className}`}>
        <p className="text-sm font-black text-slate-500">Loading access status...</p>
      </Card>
    );
  }

  const content = stateContent[status.accessState];
  const selectedPlan = status.request?.selectedPlan;
  const href = status.accessState === 'ACTIVE' ? activeHref : content.href;

  return (
    <Card className={`overflow-hidden p-0 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex min-w-0 gap-4">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${content.tone === 'green' ? 'bg-emerald-50 text-emerald-700' : content.tone === 'red' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-[#155EEF]'}`}>
            {content.icon}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black">{content.title}</h2>
              <Pill tone={content.tone}>{status.activePlan}</Pill>
              {selectedPlan && status.accessState !== 'ACTIVE' && <Pill tone="gray">Requested {selectedPlan}</Pill>}
            </div>
            <p className={`mt-2 text-sm font-bold leading-6 text-slate-600 ${compact ? 'max-w-3xl' : 'max-w-4xl'}`}>{content.body}</p>
          </div>
        </div>
        <Link href={href} className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black ${content.tone === 'green' ? 'bg-emerald-600 text-white' : content.tone === 'red' ? 'bg-red-600 text-white' : 'bg-[#155EEF] text-white'}`}>
          {content.cta} <ArrowRight size={15} />
        </Link>
      </div>
      {!compact && (
        <div className="grid border-t border-[#DFE9F7] bg-[#FAFCFF] px-5 py-4 text-sm font-bold text-slate-600 md:grid-cols-3">
          <p><ShieldCheck className="mr-2 inline text-[#155EEF]" size={16} />Current plan: <span className="font-black text-[#0B1744]">{status.activePlan}</span></p>
          <p>Features active: <span className="font-black text-[#0B1744]">{status.activeFeatures.length}</span></p>
          <p>Latest request: <span className="font-black text-[#0B1744]">{status.request?.status?.replace('_', ' ') || 'None'}</span></p>
        </div>
      )}
    </Card>
  );
}
