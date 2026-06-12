'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Gauge,
  MessageSquare,
  Scale,
  Send,
  Settings,
  ShieldCheck,
  Trophy,
  UsersRound,
} from 'lucide-react';
import { AppShell } from '../../../../../components/app-shell';
import { Card, Pill } from '../../../../../components/ui';
import { apiErrorMessage, apiFetch, apiUrl } from '../../../../../lib/api';
import { useSession } from '../../../../../lib/session';

type ScoreSet = {
  overall: number;
  commercial: number;
  technical: number;
  delivery: number;
  supplierFit: number;
  risk: number;
};

type EvaluationQuote = {
  quoteId: string;
  supplierProfileId?: string | null;
  rank: number;
  supplierName: string;
  quoteStatus: string;
  totalAmount: string;
  currency: string;
  deliveryDays: number;
  validityDays: number;
  warranty?: string | null;
  submittedAt: string;
  technicalSummary: string;
  commercialNotes?: string | null;
  supportingDocuments?: QuoteDocument[];
  supplier: {
    verificationStatus: string;
    rating: number;
    completedContracts: number;
    responseRate: number;
    matchScore: number | null;
  };
  scores: ScoreSet;
  flags: string[];
  clarifications: string[];
  negotiationOpportunities: string[];
  badges: string[];
};

type EvaluationOutcome = {
  label: string;
  supplierName: string | null;
  quoteId: string | null;
  value: string | null;
};

type QuoteDocument = {
  name: string;
  type: string;
  size?: string | number | null;
  category?: string | null;
  storageKey?: string | null;
  url?: string | null;
};

type RfqMessage = {
  id: string;
  rfqId: string;
  supplierProfileId?: string | null;
  quoteId?: string | null;
  senderUserId: string;
  senderUserName: string;
  senderOrganizationId: string;
  senderOrganizationName: string;
  senderOrganizationType: 'BUYER' | 'SUPPLIER' | 'PLATFORM';
  subject?: string | null;
  body: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
};

type EvaluationResponse = {
  rfq: {
    id: string;
    reference: string;
    title: string;
    description: string;
    category: string;
    country: string;
    deliveryLocation?: string | null;
    currency: string;
    status: string;
    closingDate: string;
    lineItemCount: number;
  };
  evaluatedAt: string;
  weights: Array<{ label: string; value: number }>;
  summary: {
    quoteCount: number;
    averageQuoteAmount: string;
    bestValueQuoteId: string | null;
    lowestCostQuoteId: string | null;
    fastestDeliveryQuoteId: string | null;
    clarificationCount: number;
  };
  recommendation: {
    quoteId: string;
    supplierName: string;
    overallScore: number;
    confidence: string;
    explanation: string;
  } | null;
  outcomes: EvaluationOutcome[];
  quotes: EvaluationQuote[];
};

const nav = [
  { label: 'Overview', icon: <BriefcaseBusiness size={20} /> },
  { label: 'RFQs', icon: <FileText size={20} />, active: true },
  { label: 'Quotes', icon: <FileText size={20} /> },
  { label: 'Suppliers', icon: <UsersRound size={20} /> },
  { label: 'Awards', icon: <Trophy size={20} /> },
  { label: 'Contracts', icon: <Building2 size={20} /> },
  { label: 'Analytics', icon: <BarChart3 size={20} /> },
  { label: 'Records', icon: <FileText size={20} /> },
  { label: 'Settings', icon: <Settings size={20} /> },
];

function InviteCard() {
  return (
    <Card className="p-5">
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-[#155EEF]">
        <UsersRound />
      </div>
      <p className="text-lg font-black">Invite suppliers</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">Bring more suppliers into this sourcing event before final evaluation.</p>
      <Link href="/rfq/new" className="mt-5 block w-full rounded-xl bg-[#155EEF] py-3 text-center text-sm font-black text-white">
        Create RFQ
      </Link>
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatMoney(value: string | number | null | undefined, currency: string) {
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

function documentLabel(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes('pdf')) return 'PDF';
  if (normalized.includes('doc') || normalized.includes('word')) return 'DOCX';
  if (normalized.includes('zip')) return 'ZIP';
  return type && type.length <= 8 ? type.toUpperCase() : 'FILE';
}

function documentColor(type: string) {
  const label = documentLabel(type);
  if (label === 'PDF') return 'bg-red-500';
  if (label === 'DOCX') return 'bg-[#155EEF]';
  if (label === 'ZIP') return 'bg-orange-400';
  return 'bg-slate-500';
}

function documentUrl(document: QuoteDocument) {
  const rawUrl = document.url?.trim();
  if (rawUrl) return rawUrl.startsWith('http') ? rawUrl : apiUrl(rawUrl);
  return document.storageKey ? apiUrl(`/documents/${document.storageKey}`) : null;
}

function daysLeft(value: string) {
  const diff = Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Closed';
  if (diff === 0) return 'Due today';
  if (diff === 1) return '1 day left';
  return `${diff} days left`;
}

function statusLabel(value: string) {
  return value.replaceAll('_', ' ');
}

function toneForScore(score: number): 'green' | 'orange' | 'red' | 'blue' {
  if (score >= 80) return 'green';
  if (score >= 65) return 'blue';
  if (score >= 50) return 'orange';
  return 'red';
}

function scoreColor(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 65) return 'bg-[#155EEF]';
  if (score >= 50) return 'bg-orange-400';
  return 'bg-red-500';
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-black text-slate-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${scoreColor(value)}`} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function OutcomeCard({ outcome, currency }: { outcome: EvaluationOutcome; currency: string }) {
  const formattedValue = outcome.label === 'Lowest Cost' && outcome.value
    ? formatMoney(outcome.value, currency)
    : outcome.value || '-';

  return (
    <Card className="p-5">
      <p className="text-sm font-black uppercase tracking-[0.08em] text-slate-500">{outcome.label}</p>
      <p className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#0B1744]">{formattedValue}</p>
      <p className="mt-2 text-sm font-bold text-slate-600">{outcome.supplierName || 'Review required'}</p>
    </Card>
  );
}

function QuoteRankingCard({ quote }: { quote: EvaluationQuote }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-sm font-black text-[#155EEF]">#{quote.rank}</span>
            <h3 className="text-lg font-black">{quote.supplierName}</h3>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {quote.badges.map((badge) => (
              <Pill key={badge} tone={badge === 'Best Value' ? 'green' : 'blue'}>{badge}</Pill>
            ))}
            <Pill tone={toneForScore(quote.scores.overall)}>{quote.scores.overall}% overall</Pill>
          </div>
          <p className="mt-3 text-xs font-bold text-slate-500">{quote.supportingDocuments?.length || 0} quote documents</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-[#0B1744]">{formatMoney(quote.totalAmount, quote.currency)}</p>
          <p className="text-xs font-bold text-slate-500">{quote.deliveryDays} days delivery</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <ScoreBar label="Commercial" value={quote.scores.commercial} />
        <ScoreBar label="Technical" value={quote.scores.technical} />
        <ScoreBar label="Delivery" value={quote.scores.delivery} />
        <ScoreBar label="Risk" value={quote.scores.risk} />
      </div>
    </Card>
  );
}

function QuoteDocumentReview({ quote }: { quote: EvaluationQuote }) {
  const documents = quote.supportingDocuments || [];

  return (
    <div className="rounded-2xl border border-[#DFE9F7] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-black text-[#0B1744]">{quote.supplierName}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{documents.length} submitted document{documents.length === 1 ? '' : 's'}</p>
        </div>
        <Pill tone={documents.length ? 'green' : 'orange'}>{documents.length ? 'Ready for review' : 'Documents missing'}</Pill>
      </div>
      <div className="mt-4 space-y-3">
        {documents.length === 0 && (
          <p className="rounded-xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">Request proposal, pricing, compliance, or certification documents before award.</p>
        )}
        {documents.map((document, index) => {
          const href = documentUrl(document);
          return (
            <div key={`${quote.quoteId}-${document.name}-${index}`} className="flex flex-col gap-3 rounded-xl border border-[#DFE9F7] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[10px] font-black text-white ${documentColor(document.type)}`}>
                  {documentLabel(document.type)}
                </span>
                <div>
                  <p className="text-sm font-black text-[#0B1744]">{document.name}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {document.category || 'Quote Document'} {document.size ? `- ${document.size}` : ''}
                  </p>
                </div>
              </div>
              {href ? (
                <a className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-black text-[#155EEF]" href={href} target="_blank" rel="noreferrer">
                  Open <ExternalLink size={14} />
                </a>
              ) : (
                <span className="inline-flex rounded-lg bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">Registered</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function QuoteEvaluationPage() {
  const params = useParams<{ id: string }>();
  const rfqId = params.id;
  const { session } = useSession();
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decisionNote, setDecisionNote] = useState('');
  const [actionQuoteId, setActionQuoteId] = useState('');
  const [clarificationSending, setClarificationSending] = useState('');
  const [messages, setMessages] = useState<RfqMessage[]>([]);
  const [buyerMessageText, setBuyerMessageText] = useState('');
  const [buyerMessageSending, setBuyerMessageSending] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const topQuotes = useMemo(() => evaluation?.quotes.slice(0, 3) || [], [evaluation?.quotes]);
  const firstQuote = evaluation?.quotes[0] || null;
  const canAward = session?.role === 'BUYER_OWNER' || session?.role === 'BUYER_MANAGER';
  const rfqAwarded = evaluation?.rfq.status === 'AWARDED' || evaluation?.quotes.some((quote) => quote.quoteStatus === 'AWARDED') || false;
  const allClarifications = useMemo(() => {
    if (!evaluation) return [];
    return evaluation.quotes.flatMap((quote) => quote.clarifications.map((question) => ({
      quoteId: quote.quoteId,
      supplierProfileId: quote.supplierProfileId || null,
      supplierName: quote.supplierName,
      question,
    }))).slice(0, 8);
  }, [evaluation]);

  const loadEvaluation = useCallback(async (showLoading = true) => {
    if (!session || !rfqId) return;

    if (showLoading) {
      setLoading(true);
    }
    setError('');

    try {
      const response = await apiFetch(`/rfqs/${rfqId}/evaluation`, { method: 'GET' });
      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, `Unable to load Quote Evaluation. Status ${response.status}.`));
      }

      const data = await response.json() as EvaluationResponse;
      setEvaluation(data);

      const messagesResponse = await apiFetch(`/rfqs/${rfqId}/messages`, { method: 'GET' });
      if (messagesResponse.ok) {
        const messageData = await messagesResponse.json() as RfqMessage[];
        setMessages(messageData);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load Quote Evaluation.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [rfqId, session]);

  useEffect(() => {
    loadEvaluation();
  }, [loadEvaluation]);

  async function updateDecision(quote: EvaluationQuote, status: 'SHORTLISTED' | 'REJECTED') {
    setActionQuoteId(`${status}:${quote.quoteId}`);
    setActionMessage('');
    setActionError('');

    try {
      const response = await apiFetch(`/rfqs/${rfqId}/quotes/${quote.quoteId}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note: decisionNote }),
      });

      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, `Unable to update quote decision. Status ${response.status}.`));
      }

      setActionMessage(status === 'SHORTLISTED' ? `${quote.supplierName} shortlisted.` : `${quote.supplierName} rejected.`);
      await loadEvaluation(false);
    } catch (decisionError) {
      setActionError(decisionError instanceof Error ? decisionError.message : 'Unable to update quote decision.');
    } finally {
      setActionQuoteId('');
    }
  }

  async function awardQuote(quote: EvaluationQuote) {
    setActionQuoteId(`AWARD:${quote.quoteId}`);
    setActionMessage('');
    setActionError('');

    try {
      const response = await apiFetch(`/rfqs/${rfqId}/award`, {
        method: 'POST',
        body: JSON.stringify({
          quoteId: quote.quoteId,
          decisionNote: decisionNote || `Awarded to ${quote.supplierName} through Quote Evaluation.`,
        }),
      });

      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, `Unable to award quote. Status ${response.status}.`));
      }

      setActionMessage(`${quote.supplierName} awarded.`);
      await loadEvaluation(false);
    } catch (awardError) {
      setActionError(awardError instanceof Error ? awardError.message : 'Unable to award quote.');
    } finally {
      setActionQuoteId('');
    }
  }

  async function sendClarification(item: { quoteId: string; supplierProfileId: string | null; supplierName: string; question: string }) {
    if (!item.supplierProfileId) {
      setActionError('This supplier cannot receive platform clarification messages yet.');
      return;
    }

    setClarificationSending(`${item.quoteId}:${item.question}`);
    setActionMessage('');
    setActionError('');

    try {
      const response = await apiFetch(`/rfqs/${rfqId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          supplierProfileId: item.supplierProfileId,
          quoteId: item.quoteId,
          subject: 'Quote clarification request',
          body: item.question,
        }),
      });

      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, `Unable to send clarification. Status ${response.status}.`));
      }

      const message = await response.json() as RfqMessage;
      setMessages((current) => [...current, message]);
      setActionMessage(`Clarification sent to ${item.supplierName}.`);
    } catch (clarificationError) {
      setActionError(clarificationError instanceof Error ? clarificationError.message : 'Unable to send clarification.');
    } finally {
      setClarificationSending('');
    }
  }

  async function sendBuyerMessage() {
    const body = buyerMessageText.trim();
    if (!body) {
      setActionError('Enter a message before sending.');
      return;
    }

    setBuyerMessageSending(true);
    setActionMessage('');
    setActionError('');

    try {
      const response = await apiFetch(`/rfqs/${rfqId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, `Unable to send message. Status ${response.status}.`));
      }

      const message = await response.json() as RfqMessage;
      setMessages((current) => [...current, message]);
      setBuyerMessageText('');
      setActionMessage('Message sent to linked suppliers.');
    } catch (messageError) {
      setActionError(messageError instanceof Error ? messageError.message : 'Unable to send this message right now.');
    } finally {
      setBuyerMessageSending(false);
    }
  }

  return (
    <AppShell
      nav={nav}
      sidebarCard={<InviteCard />}
      search="Search RFQs, suppliers, quotes, and awards..."
      requiredOrganizationTypes={['BUYER']}
      requiredRoles={['BUYER_OWNER', 'BUYER_MANAGER', 'BUYER_EVALUATOR']}
    >
      <div className="mb-6 flex flex-col items-start justify-between gap-5 sm:flex-row">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <Link href="/buyer" className="grid h-10 w-10 place-items-center rounded-xl border border-[#DFE9F7] bg-white text-[#0B1744]">
              <ArrowLeft size={18} />
            </Link>
            <Pill>Quote Evaluation</Pill>
          </div>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-[#0B1744]">
            {evaluation?.rfq.title || 'Quote Evaluation'}
          </h1>
          <p className="mt-2 text-slate-600">
            {evaluation ? `${evaluation.rfq.reference} - ${evaluation.rfq.category}` : 'Evaluating supplier responses and outcomes.'}
          </p>
        </div>

        {evaluation && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="rounded-2xl border border-[#DFE9F7] bg-white px-5 py-3 text-sm font-bold text-slate-600 shadow-sm">
              <Clock3 className="mr-2 inline text-[#155EEF]" size={16} />
              {formatDate(evaluation.rfq.closingDate)} - {daysLeft(evaluation.rfq.closingDate)}
            </div>
            <Link href="/buyer" className="rounded-xl bg-[#155EEF] px-5 py-3 text-sm font-black text-white">
              Back to Buyer Dashboard
            </Link>
          </div>
        )}
      </div>

      {loading && (
        <Card className="p-5 sm:p-8">
          <p className="text-sm font-black text-slate-600">Loading Quote Evaluation...</p>
        </Card>
      )}

      {!loading && error && (
        <Card className="p-5 sm:p-8">
          <p className="text-sm font-black text-red-600">{error}</p>
        </Card>
      )}

      {!loading && evaluation && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-5">
              <p className="text-sm font-black uppercase tracking-[0.08em] text-slate-500">Quotes Evaluated</p>
              <p className="mt-3 text-3xl font-black text-[#0B1744]">{evaluation.summary.quoteCount}</p>
              <p className="mt-1 text-sm font-bold text-slate-500">{evaluation.rfq.lineItemCount} RFQ line items</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm font-black uppercase tracking-[0.08em] text-slate-500">Average Quote</p>
              <p className="mt-3 text-3xl font-black text-[#0B1744]">{formatMoney(evaluation.summary.averageQuoteAmount, evaluation.rfq.currency)}</p>
              <p className="mt-1 text-sm font-bold text-slate-500">Commercial baseline</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm font-black uppercase tracking-[0.08em] text-slate-500">Clarifications</p>
              <p className="mt-3 text-3xl font-black text-[#0B1744]">{evaluation.summary.clarificationCount}</p>
              <p className="mt-1 text-sm font-bold text-slate-500">Questions to resolve</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm font-black uppercase tracking-[0.08em] text-slate-500">Recommendation</p>
              <p className="mt-3 text-3xl font-black text-[#0B1744]">{evaluation.recommendation?.confidence || 'Pending'}</p>
              <p className="mt-1 text-sm font-bold text-slate-500">{evaluation.recommendation?.supplierName || 'Awaiting submitted quotes'}</p>
            </Card>
          </div>

          {evaluation.recommendation && (
            <Card className="mt-5 overflow-hidden border-0 bg-gradient-to-r from-[#10215F] to-[#155EEF] p-0 text-white">
              <div className="grid grid-cols-1 gap-6 p-7 lg:grid-cols-[1fr_320px]">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.08em]">
                    <Award size={16} />
                    Best Value Recommendation
                  </div>
                  <h2 className="text-3xl font-black tracking-[-0.03em]">{evaluation.recommendation.supplierName}</h2>
                  <p className="mt-3 max-w-4xl text-sm leading-6 text-blue-50">{evaluation.recommendation.explanation}</p>
                  <div className="mt-5 max-w-4xl">
                    <label className="text-xs font-black uppercase tracking-[0.08em] text-blue-50">Decision note</label>
                    <textarea
                      className="mt-2 h-20 w-full rounded-2xl border border-white/20 bg-white/10 p-4 text-sm font-bold text-white outline-none placeholder:text-blue-100"
                      value={decisionNote}
                      onChange={(event) => setDecisionNote(event.target.value)}
                      placeholder="Add award, shortlist, or rejection rationale for the audit trail."
                    />
                  </div>
                  {(actionMessage || actionError) && (
                    <p className={`mt-3 text-sm font-black ${actionError ? 'text-orange-100' : 'text-emerald-100'}`}>
                      {actionError || actionMessage}
                    </p>
                  )}
                </div>
                <div className="rounded-2xl bg-white/10 p-5">
                  <p className="text-sm font-black text-blue-50">Overall Score</p>
                  <p className="mt-2 text-4xl font-black sm:text-5xl">{evaluation.recommendation.overallScore}%</p>
                  <p className="mt-3 text-sm font-bold text-blue-50">Confidence: {evaluation.recommendation.confidence}</p>
                </div>
              </div>
            </Card>
          )}

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {evaluation.outcomes.map((outcome) => (
              <OutcomeCard key={outcome.label} outcome={outcome} currency={evaluation.rfq.currency} />
            ))}
          </div>

          {evaluation.quotes.length === 0 && (
            <Card className="mt-5 p-5 text-center sm:p-8">
              <MessageSquare className="mx-auto text-[#155EEF]" size={34} />
              <h2 className="mt-4 text-xl font-black">No submitted quotes yet</h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Quote Evaluation will populate when suppliers submit responses for this RFQ.
              </p>
            </Card>
          )}

          {evaluation.quotes.length > 0 && (
            <>
              <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_.8fr]">
                <Card className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black">Supplier Ranking</h2>
                      <p className="mt-1 text-sm text-slate-600">Ranked by weighted commercial, technical, delivery, supplier fit, and risk inputs.</p>
                    </div>
                    <Pill>{formatDate(evaluation.evaluatedAt)}</Pill>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-[#DFE9F7]">
                    <table className="w-full min-w-[860px] text-left text-sm">
                      <thead className="bg-blue-50/60 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Rank</th>
                          <th className="px-4 py-3">Supplier</th>
                          <th className="px-4 py-3">Quote</th>
                          <th className="px-4 py-3">Delivery</th>
                          <th className="px-4 py-3">Overall</th>
                          <th className="px-4 py-3">Flags</th>
                          <th className="px-4 py-3">Decision</th>
                        </tr>
                      </thead>
                      <tbody className="font-bold">
                        {evaluation.quotes.map((quote) => (
                          <tr key={quote.quoteId} className="border-t border-[#DFE9F7]">
                            <td className="px-4 py-4 text-[#155EEF]">#{quote.rank}</td>
                            <td className="px-4 py-4">
                              <p className="font-black text-[#0B1744]">{quote.supplierName}</p>
                              <p className="text-xs text-slate-500">{statusLabel(quote.supplier.verificationStatus)} - {quote.supplier.matchScore || 0}% match</p>
                              <div className="mt-2">
                                <Pill tone={quote.quoteStatus === 'AWARDED' ? 'green' : quote.quoteStatus === 'REJECTED' ? 'red' : quote.quoteStatus === 'SHORTLISTED' ? 'purple' : 'blue'}>
                                  {statusLabel(quote.quoteStatus)}
                                </Pill>
                              </div>
                            </td>
                            <td className="px-4 py-4">{formatMoney(quote.totalAmount, quote.currency)}</td>
                            <td className="px-4 py-4">{quote.deliveryDays} days</td>
                            <td className="px-4 py-4">
                              <Pill tone={toneForScore(quote.scores.overall)}>{quote.scores.overall}%</Pill>
                            </td>
                            <td className="px-4 py-4">
                              {quote.flags.length ? (
                                <span className="inline-flex items-center gap-1 text-orange-600">
                                  <AlertTriangle size={14} />
                                  {quote.flags.length}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-700">
                                  <CheckCircle2 size={14} />
                                  Clear
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-700 disabled:opacity-50"
                                  disabled={rfqAwarded || quote.quoteStatus === 'SHORTLISTED' || quote.quoteStatus === 'AWARDED' || Boolean(actionQuoteId)}
                                  onClick={() => updateDecision(quote, 'SHORTLISTED')}
                                >
                                  {actionQuoteId === `SHORTLISTED:${quote.quoteId}` ? 'Saving' : quote.quoteStatus === 'SHORTLISTED' ? 'Shortlisted' : 'Shortlist'}
                                </button>
                                <button
                                  type="button"
                                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-600 disabled:opacity-50"
                                  disabled={rfqAwarded || quote.quoteStatus === 'REJECTED' || quote.quoteStatus === 'AWARDED' || Boolean(actionQuoteId)}
                                  onClick={() => updateDecision(quote, 'REJECTED')}
                                >
                                  {actionQuoteId === `REJECTED:${quote.quoteId}` ? 'Saving' : quote.quoteStatus === 'REJECTED' ? 'Rejected' : 'Reject'}
                                </button>
                                {canAward && (
                                  <button
                                    type="button"
                                    className="rounded-lg bg-[#155EEF] px-3 py-2 text-xs font-black text-white disabled:opacity-50"
                                    disabled={rfqAwarded || quote.quoteStatus === 'REJECTED' || Boolean(actionQuoteId)}
                                    onClick={() => awardQuote(quote)}
                                  >
                                    {actionQuoteId === `AWARD:${quote.quoteId}` ? 'Awarding' : quote.quoteStatus === 'AWARDED' ? 'Awarded' : 'Award'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <Card className="p-5">
                  <h2 className="text-xl font-black">Evaluation Inputs</h2>
                  <p className="mt-1 text-sm text-slate-600">Weights used for this Quote Evaluation.</p>
                  <div className="mt-5 space-y-4">
                    {evaluation.weights.map((weight) => (
                      <ScoreBar key={weight.label} label={weight.label} value={weight.value} />
                    ))}
                  </div>
                  <div className="mt-6 rounded-2xl bg-blue-50 p-4">
                    <p className="flex items-center gap-2 text-sm font-black text-[#0B1744]">
                      <Scale className="text-[#155EEF]" size={18} />
                      Best value, not lowest price alone
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">The evaluation balances commercial value, delivery confidence, technical response quality, supplier fit, and risk signals.</p>
                  </div>
                </Card>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {topQuotes.map((quote) => (
                  <QuoteRankingCard key={quote.quoteId} quote={quote} />
                ))}
              </div>

              <Card className="mt-5 p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <FileText className="text-[#155EEF]" size={20} />
                    <div>
                      <h2 className="text-xl font-black">Quote Document Review</h2>
                      <p className="mt-1 text-sm text-slate-600">Proposal, pricing, compliance, and certification records submitted with supplier quotes.</p>
                    </div>
                  </div>
                  <Pill>{evaluation.quotes.reduce((total, quote) => total + (quote.supportingDocuments?.length || 0), 0)} documents</Pill>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {evaluation.quotes.map((quote) => (
                    <QuoteDocumentReview key={quote.quoteId} quote={quote} />
                  ))}
                </div>
              </Card>

              <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1fr]">
                <Card className="p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <MessageSquare className="text-[#155EEF]" size={20} />
                    <h2 className="text-xl font-black">Clarifications Needed</h2>
                  </div>
                  {allClarifications.length === 0 && (
                    <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">No major clarification questions were flagged.</p>
                  )}
                  {allClarifications.map((item) => (
                    <div key={`${item.quoteId}-${item.question}`} className="border-b border-[#DFE9F7] py-3 last:border-0">
                      <p className="text-sm font-black text-[#0B1744]">{item.supplierName}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.question}</p>
                      <button
                        type="button"
                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-black text-[#155EEF] disabled:opacity-50"
                        disabled={!item.supplierProfileId || Boolean(clarificationSending)}
                        onClick={() => sendClarification(item)}
                      >
                        {clarificationSending === `${item.quoteId}:${item.question}` ? 'Sending' : 'Send to supplier'}
                      </button>
                    </div>
                  ))}
                </Card>

                <Card className="p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <Gauge className="text-[#155EEF]" size={20} />
                    <h2 className="text-xl font-black">Score Breakdown</h2>
                  </div>
                  {firstQuote && (
                    <div>
                      <div className="mb-4 flex items-center justify-between rounded-2xl bg-blue-50 p-4">
                        <div>
                          <p className="text-sm font-black text-[#0B1744]">{firstQuote.supplierName}</p>
                          <p className="text-xs font-bold text-slate-500">Current best value quote</p>
                        </div>
                        <Pill tone={toneForScore(firstQuote.scores.overall)}>{firstQuote.scores.overall}%</Pill>
                      </div>
                      <div className="space-y-4">
                        <ScoreBar label="Commercial" value={firstQuote.scores.commercial} />
                        <ScoreBar label="Technical" value={firstQuote.scores.technical} />
                        <ScoreBar label="Delivery" value={firstQuote.scores.delivery} />
                        <ScoreBar label="Supplier Fit" value={firstQuote.scores.supplierFit} />
                        <ScoreBar label="Risk" value={firstQuote.scores.risk} />
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              <Card className="mt-5 p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="text-[#155EEF]" size={20} />
                    <div>
                      <h2 className="text-xl font-black">Message Activity</h2>
                      <p className="mt-1 text-sm text-slate-600">Buyer and supplier clarification history for this RFQ.</p>
                    </div>
                  </div>
                  <Pill>{messages.length} messages</Pill>
                </div>
                <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
                  <div className="max-h-[360px] overflow-y-auto rounded-2xl border border-[#DFE9F7] bg-slate-50/60 p-3">
                    {messages.length === 0 && (
                      <p className="rounded-xl bg-white p-4 text-sm font-bold text-slate-500">No RFQ messages have been sent yet.</p>
                    )}
                    <div className="space-y-3">
                      {messages.map((message) => {
                        const mine = message.senderOrganizationId === session?.activeOrganization.id;
                        return (
                          <div key={message.id} className={`rounded-2xl border p-4 ${mine ? 'border-blue-100 bg-blue-50/70' : 'border-[#DFE9F7] bg-white'}`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-black text-[#0B1744]">
                                {message.senderOrganizationName}
                                <Pill tone={message.senderOrganizationType === 'BUYER' ? 'blue' : 'green'}>{message.senderOrganizationType === 'BUYER' ? 'Buyer' : 'Supplier'}</Pill>
                              </p>
                              <p className="text-xs font-bold text-slate-400">{formatMessageTime(message.createdAt)}</p>
                            </div>
                            {message.subject && <p className="mt-2 text-xs font-black uppercase tracking-[0.08em] text-slate-500">{message.subject}</p>}
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{message.body}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#DFE9F7] bg-white p-3">
                    <textarea
                      className="h-40 w-full resize-none bg-transparent px-2 text-sm outline-none placeholder:text-slate-400"
                      placeholder="Send a clarification update to linked suppliers for this RFQ."
                      value={buyerMessageText}
                      onChange={(event) => setBuyerMessageText(event.target.value)}
                      maxLength={4000}
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-slate-400">{buyerMessageText.length}/4000</p>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#155EEF] px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                        disabled={buyerMessageSending || !buyerMessageText.trim()}
                        onClick={sendBuyerMessage}
                      >
                        {buyerMessageSending ? 'Sending' : 'Send Update'} <Send size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="mt-5 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <ShieldCheck className="text-[#155EEF]" size={20} />
                  <h2 className="text-xl font-black">Risk Flags & Negotiation Opportunities</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {evaluation.quotes.map((quote) => (
                    <div key={quote.quoteId} className="rounded-2xl border border-[#DFE9F7] p-4">
                      <p className="font-black text-[#0B1744]">{quote.supplierName}</p>
                      <div className="mt-3 space-y-2">
                        {quote.flags.length === 0 && <p className="text-sm font-bold text-emerald-700">No major flags.</p>}
                        {quote.flags.slice(0, 3).map((flag) => (
                          <p key={flag} className="text-sm font-bold text-orange-600">{flag}</p>
                        ))}
                        {quote.negotiationOpportunities.slice(0, 2).map((opportunity) => (
                          <p key={opportunity} className="text-sm leading-6 text-slate-600">{opportunity}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </AppShell>
  );
}
