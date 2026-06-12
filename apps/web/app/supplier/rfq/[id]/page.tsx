'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileText,
  Folder,
  MapPin,
  MessageSquare,
  Paperclip,
  Save,
  Send,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Target,
  UploadCloud,
  UsersRound,
  Clock3,
  XCircle,
} from 'lucide-react';
import { AppShell } from '../../../../components/app-shell';
import { PlanAccessCard } from '../../../../components/plan-access-card';
import { Card, Pill } from '../../../../components/ui';
import { apiErrorMessage, apiFetch, apiUrl } from '../../../../lib/api';
import { uploadDocument } from '../../../../lib/documents';
import { useSession } from '../../../../lib/session';

type SupplierQuote = {
  id: string;
  status: string;
  totalAmount: string;
  currency: string;
  deliveryDays: number;
  validityDays: number;
  warranty?: string | null;
  technicalResponse?: unknown;
  commercialNotes?: string | null;
  supportingDocuments?: unknown;
  submittedAt: string;
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

type SupplierRfqDetail = {
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
  status: string;
  technicalNotes?: string | null;
  supportingDocuments?: unknown;
  buyerOrganization: {
    id: string;
    name: string;
    country?: string | null;
    status: string;
  };
  lineItems: Array<{
    id: string;
    name: string;
    description?: string | null;
    quantity: string;
    unit: string;
  }>;
  match?: {
    id: string;
    score: number;
    explanation?: unknown;
  } | null;
  quote?: SupplierQuote | null;
  messages: RfqMessage[];
  canQuote: boolean;
};

type QuoteForm = {
  totalAmount: string;
  currency: string;
  deliveryDays: string;
  validityDays: string;
  warranty: string;
  proposalSummary: string;
  commercialNotes: string;
};

type RfqDocument = {
  type: 'PDF' | 'DOCX' | 'ZIP' | 'FILE';
  name: string;
  size: string;
  category?: string;
  storageKey?: string | null;
  url?: string | null;
  file?: File;
};

const nav = [
  { label: 'Overview', icon: <BriefcaseBusiness size={20} /> },
  { label: 'Matched Opportunities', icon: <Target size={20} />, active: true },
  { label: 'Quotes', icon: <FileText size={20} /> },
  { label: 'Orders', icon: <ShoppingCart size={20} /> },
  { label: 'Buyers', icon: <UsersRound size={20} /> },
  { label: 'Performance', icon: <BarChart3 size={20} /> },
  { label: 'Documents', icon: <Folder size={20} /> },
  { label: 'Messages', icon: <MessageSquare size={20} /> },
  { label: 'Settings', icon: <Settings size={20} /> },
];

const emptyQuoteForm: QuoteForm = {
  totalAmount: '',
  currency: 'USD',
  deliveryDays: '90',
  validityDays: '30',
  warranty: '12 months',
  proposalSummary: '',
  commercialNotes: '',
};

function CompleteProfileCard() {
  return (
    <Card className="p-5">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-full border-4 border-blue-100 text-xl font-black text-[#155EEF]">
        78%
      </div>
      <p className="text-lg font-black">Complete your profile</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">Increase your visibility and get matched with more opportunities.</p>
      <Link href="/subscribe" className="mt-5 block w-full rounded-xl bg-[#155EEF] py-3 text-center text-sm font-black text-white">
        Complete Now -&gt;
      </Link>
    </Card>
  );
}

function InfoMetric({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="border-b border-[#DFE9F7] px-0 py-4 last:border-b-0 sm:px-5 xl:border-b-0 xl:border-r xl:py-0 xl:last:border-r-0">
      <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <div className="mt-2 text-lg font-black text-[#0B1744]">{value}</div>
      {children && <div className="mt-1 text-xs font-bold text-slate-500">{children}</div>}
    </div>
  );
}

function OverviewRow({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="grid grid-cols-[34px_1fr] items-start gap-4 border-b border-[#DFE9F7] py-4 last:border-0 sm:grid-cols-[34px_190px_1fr]">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-[#155EEF]">{icon}</div>
      <p className="text-sm font-black text-[#0B1744]">{title}</p>
      <p className="col-span-2 text-sm leading-6 text-slate-600 sm:col-span-1">{body}</p>
    </div>
  );
}

function FileRow({ type, name, size, url }: RfqDocument) {
  const typeColor = type === 'PDF' ? 'bg-red-500' : type === 'DOCX' ? 'bg-[#155EEF]' : type === 'ZIP' ? 'bg-orange-400' : 'bg-slate-500';

  return (
    <div className="grid min-w-[720px] grid-cols-[1fr_90px_100px_130px_90px] items-center border-b border-[#DFE9F7] py-3 text-sm last:border-b-0">
      <div className="flex items-center gap-3 font-black text-[#0B1744]">
        <span className={`grid h-9 w-9 place-items-center rounded-lg text-[10px] font-black text-white ${typeColor}`}>
          {type}
        </span>
        {name}
      </div>
      <span className="font-bold text-slate-600">{type}</span>
      <span className="font-bold text-slate-600">{size}</span>
      <span className="font-bold text-slate-600">Provided</span>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="flex gap-3 text-[#155EEF]" aria-label={`Open ${name}`}>
          <Eye size={17} />
          <Download size={17} />
        </a>
      ) : (
        <div className="flex gap-3 text-slate-300">
          <Eye size={17} />
          <Download size={17} />
        </div>
      )}
    </div>
  );
}

function QuoteDocumentRow({ document, onRemove }: { document: RfqDocument; onRemove: () => void }) {
  const typeColor = document.type === 'PDF' ? 'bg-red-500' : document.type === 'DOCX' ? 'bg-[#155EEF]' : document.type === 'ZIP' ? 'bg-orange-400' : 'bg-slate-500';

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#DFE9F7] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[10px] font-black text-white ${typeColor}`}>
          {document.type}
        </span>
        <div>
          <p className="text-sm font-black text-[#0B1744]">{document.name}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {document.category || 'Quote Document'} {document.size ? `- ${document.size}` : ''}
          </p>
          {document.url && (
            <a className="mt-1 inline-flex text-xs font-black text-[#155EEF]" href={document.url} target="_blank" rel="noreferrer">
              Review link
            </a>
          )}
        </div>
      </div>
      <button className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-red-600" onClick={onRemove}>
        <XCircle size={15} />
        Remove
      </button>
    </div>
  );
}

function PricingRow({
  index,
  item,
  description,
  qty,
  unit,
}: {
  index: string;
  item: string;
  description: string;
  qty: string;
  unit: string;
}) {
  return (
    <tr className="border-b border-[#DFE9F7] last:border-0">
      <td className="py-3 pr-3 font-bold text-slate-500">{index}</td>
      <td className="py-3 pr-3 font-black text-[#0B1744]">{item}</td>
      <td className="py-3 pr-3 text-slate-600">{description}</td>
      <td className="py-3 pr-3 font-bold">{qty}</td>
      <td className="py-3 pr-3 text-right font-bold">{unit}</td>
      <td className="py-3 text-right font-black">Included</td>
    </tr>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
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

function statusTone(value: string): 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray' {
  if (value === 'SUBMITTED' || value === 'AWARDED') return 'green';
  if (value === 'DRAFT') return 'orange';
  if (value === 'SHORTLISTED') return 'purple';
  if (value === 'REJECTED' || value === 'WITHDRAWN' || value === 'CANCELLED') return 'red';
  if (value === 'CLOSED') return 'gray';
  return 'blue';
}

function formatFileSize(value: unknown) {
  if (typeof value === 'number') {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)} MB`;
    if (value >= 1000) return `${Math.ceil(value / 1000)} KB`;
    return `${value} B`;
  }

  if (typeof value === 'string' && value.trim()) return value;
  return '-';
}

function documentTypeFrom(name: string, mimeType: string): RfqDocument['type'] {
  const source = `${name} ${mimeType}`.toLowerCase();
  if (source.includes('pdf')) return 'PDF';
  if (source.includes('doc') || source.includes('word')) return 'DOCX';
  if (source.includes('zip')) return 'ZIP';
  return 'FILE';
}

function documentsFrom(value: unknown): RfqDocument[] {
  if (!Array.isArray(value)) return [];

  return value
    .flatMap((document, index): RfqDocument[] => {
      if (!document || typeof document !== 'object') return [];
      const record = document as Record<string, unknown>;
      const name = typeof record.name === 'string' && record.name.trim() ? record.name : `Document ${index + 1}`;
      const mimeType = typeof record.type === 'string' ? record.type : '';
      const storageKey = typeof record.storageKey === 'string' && record.storageKey.trim() ? record.storageKey : null;
      const rawUrl = typeof record.url === 'string' && record.url.trim() ? record.url.trim() : '';
      const url = rawUrl
        ? rawUrl.startsWith('http')
          ? rawUrl
          : apiUrl(rawUrl)
        : storageKey
          ? apiUrl(`/documents/${storageKey}`)
          : null;

      return [{
        type: documentTypeFrom(name, mimeType),
        name,
        size: formatFileSize(record.size),
        category: typeof record.category === 'string' ? record.category : undefined,
        storageKey,
        url,
      }];
    });
}

function quoteSummaryFrom(value: unknown) {
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, unknown>;
  return typeof record.summary === 'string' ? record.summary : '';
}

function formatMoney(value: string | number | null | undefined, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return '-';

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

function formFromQuote(rfq: SupplierRfqDetail): QuoteForm {
  const quote = rfq.quote;
  if (!quote) {
    return {
      ...emptyQuoteForm,
      currency: rfq.currency || emptyQuoteForm.currency,
    };
  }

  return {
    totalAmount: quote.totalAmount || '',
    currency: quote.currency || rfq.currency || emptyQuoteForm.currency,
    deliveryDays: quote.deliveryDays ? String(quote.deliveryDays) : emptyQuoteForm.deliveryDays,
    validityDays: quote.validityDays ? String(quote.validityDays) : emptyQuoteForm.validityDays,
    warranty: quote.warranty || emptyQuoteForm.warranty,
    proposalSummary: quoteSummaryFrom(quote.technicalResponse),
    commercialNotes: quote.commercialNotes || '',
  };
}

export default function SupplierRfqDetail() {
  const params = useParams<{ id: string }>();
  const rfqId = params.id;
  const { session } = useSession();
  const canUseQuoteWorkflow = Boolean(session?.features.includes('quote_comparison'));
  const [rfq, setRfq] = useState<SupplierRfqDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<'DRAFT' | 'SUBMITTED' | ''>('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [success, setSuccess] = useState('');
  const [quoteForm, setQuoteForm] = useState<QuoteForm>(emptyQuoteForm);
  const [quoteDocuments, setQuoteDocuments] = useState<RfqDocument[]>([]);
  const [documentCategory, setDocumentCategory] = useState('Technical Proposal');
  const [documentUrl, setDocumentUrl] = useState('');
  const quotePreviewRef = useRef<HTMLDivElement>(null);

  const documents = useMemo(() => documentsFrom(rfq?.supportingDocuments), [rfq?.supportingDocuments]);
  const quoteDocumentCount = quoteDocuments.length;
  const quoteReference = rfq ? `Q-${rfq.reference.replace(/^TDH-RFQ-/, '')}` : 'Q-RFQ';
  const quoteStatus = rfq?.quote?.status || null;
  const totalQuoteValue = formatMoney(quoteForm.totalAmount, quoteForm.currency);
  const requestedItems = rfq?.lineItems.length
    ? rfq.lineItems.map((item) => item.name).join(', ')
    : 'No line items provided by the buyer.';

  useEffect(() => {
    if (!session || !rfqId) return;

    let cancelled = false;

    async function loadRfq() {
      setLoading(true);
      setError('');
      setSuccess('');

      try {
        const response = await apiFetch(`/rfqs/supplier/${rfqId}`, { method: 'GET' });
        if (!response.ok) {
          throw new Error(await apiErrorMessage(response, `Unable to load this RFQ right now. Status ${response.status}.`));
        }

        const data = await response.json() as SupplierRfqDetail;
        if (!cancelled) {
          setRfq(data);
          setQuoteForm(formFromQuote(data));
          setQuoteDocuments(documentsFrom(data.quote?.supportingDocuments));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load this RFQ right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRfq();

    return () => {
      cancelled = true;
    };
  }, [rfqId, session]);

  function updateQuoteForm(field: keyof QuoteForm, value: string) {
    setQuoteForm((current) => ({ ...current, [field]: value }));
  }

  function addQuoteFiles(files: FileList | null) {
    if (!files?.length) return;

    const additions = Array.from(files).slice(0, 10 - quoteDocuments.length).map((file) => ({
      type: documentTypeFrom(file.name, file.type),
      name: file.name,
      size: formatFileSize(file.size),
      category: documentCategory,
      url: documentUrl.trim() || null,
      file,
    }));

    setQuoteDocuments((current) => [...current, ...additions].slice(0, 10));
    setDocumentUrl('');
  }

  function addDocumentLink() {
    const url = documentUrl.trim();
    if (!url) {
      setError('Enter a document link before adding it.');
      return;
    }

    let name = 'Linked quote document';
    try {
      const parsed = new URL(url);
      name = decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() || parsed.hostname);
    } catch {
      name = url;
    }

    setError('');
    setQuoteDocuments((current) => [...current, {
      type: documentTypeFrom(name, ''),
      name,
      size: 'Link',
      category: documentCategory,
      url,
    }].slice(0, 10));
    setDocumentUrl('');
  }

  function removeQuoteDocument(index: number) {
    setQuoteDocuments((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function previewQuote() {
    setError('');
    setSuccess('Review the pricing summary and compliance checklist before submitting.');
    quotePreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function saveQuote(status: 'DRAFT' | 'SUBMITTED') {
    if (!rfq) return;
    setError('');
    setSuccess('');

    const totalAmount = Number(quoteForm.totalAmount);
    const deliveryDays = Number(quoteForm.deliveryDays);
    const validityDays = Number(quoteForm.validityDays);

    if (!rfq.canQuote) {
      setError('This RFQ is not open for quote submission.');
      return;
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      setError('Enter a valid total quote value before saving.');
      return;
    }

    if (!Number.isFinite(deliveryDays) || deliveryDays < 1 || !Number.isFinite(validityDays) || validityDays < 1) {
      setError('Enter valid delivery and quote validity days before saving.');
      return;
    }

    setSaving(status);

    try {
      const uploadedQuoteDocuments = await Promise.all(quoteDocuments.map(async (document) => {
        if (!document.file || document.storageKey) return document;
        const uploaded = await uploadDocument(document.file, document.category || 'Quote Document');
        return {
          ...document,
          type: documentTypeFrom(uploaded.name, uploaded.type),
          name: uploaded.name,
          size: formatFileSize(uploaded.size),
          storageKey: uploaded.storageKey,
          url: uploaded.url,
          file: undefined,
        };
      }));
      setQuoteDocuments(uploadedQuoteDocuments);
      const supportingDocuments = uploadedQuoteDocuments.map(({ file, ...document }) => document);

      const response = await apiFetch(`/rfqs/${rfq.id}/quotes`, {
        method: 'POST',
        body: JSON.stringify({
          totalAmount,
          currency: quoteForm.currency,
          deliveryDays,
          validityDays,
          warranty: quoteForm.warranty,
          commercialNotes: quoteForm.commercialNotes,
          technicalResponse: { summary: quoteForm.proposalSummary },
          supportingDocuments,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, `Unable to ${status === 'DRAFT' ? 'save draft' : 'submit quote'}. Status ${response.status}.`));
      }

      const quote = await response.json() as SupplierQuote;
      setRfq((current) => current ? { ...current, quote } : current);
      setQuoteDocuments(documentsFrom(quote.supportingDocuments));
      setSuccess(status === 'DRAFT' ? 'Draft saved.' : 'Quote submitted.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this quote right now.');
    } finally {
      setSaving('');
    }
  }

  async function sendMessage() {
    if (!rfq) return;
    const body = messageText.trim();
    if (!body) {
      setError('Enter a message before sending.');
      return;
    }

    setError('');
    setSuccess('');
    setMessageSending(true);

    try {
      const response = await apiFetch(`/rfqs/${rfq.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, `Unable to send message. Status ${response.status}.`));
      }

      const message = await response.json() as RfqMessage;
      setRfq((current) => current ? { ...current, messages: [...(current.messages || []), message] } : current);
      setMessageText('');
      setSuccess('Message sent to the buyer.');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send this message right now.');
    } finally {
      setMessageSending(false);
    }
  }

  if (!canUseQuoteWorkflow) {
    return (
      <AppShell
        nav={nav}
        search="Search RFQs, buyers, categories, or anything..."
        sidebarCard={<CompleteProfileCard />}
        requiredOrganizationTypes={['SUPPLIER']}
        requiredRoles={['SUPPLIER_OWNER', 'SUPPLIER_MANAGER', 'SUPPLIER_STAFF']}
      >
        <PlanAccessCard className="mb-5" activeHref="/supplier" />
        <Card className="p-5 sm:p-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[.16em] text-[#155EEF]">Plan access required</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-.03em]">Quote preparation is available after plan approval.</h1>
            <p className="mt-3 text-sm font-bold leading-7 text-slate-600">
              Your current access lets you preview sample opportunities. Request full access to prepare and submit live quotes.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/samples" className="rounded-xl border border-[#DFE9F7] bg-white px-5 py-3 text-sm font-black text-[#155EEF]">
                View Samples
              </Link>
              <Link href="/subscribe" className="rounded-xl bg-[#155EEF] px-5 py-3 text-sm font-black text-white">
                Request Full Access
              </Link>
            </div>
          </div>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      nav={nav}
      search="Search RFQs, buyers, categories, or anything..."
      sidebarCard={<CompleteProfileCard />}
      requiredOrganizationTypes={['SUPPLIER']}
      requiredRoles={['SUPPLIER_OWNER', 'SUPPLIER_MANAGER', 'SUPPLIER_STAFF']}
    >
      <div className="mb-5 flex flex-col items-start justify-between gap-5 sm:flex-row">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-[#0B1744]">RFQ Detail & Prepare Quote</h1>
          <p className="mt-2 text-slate-600">Review the buyer&apos;s request for quotation and submit your best offer.</p>
        </div>

        <Link
          href="/supplier"
          className="inline-flex items-center gap-2 rounded-xl border border-[#DFE9F7] bg-white px-5 py-3 text-sm font-black text-[#0B1744] shadow-sm"
        >
          <ArrowLeft size={16} />
          Back to Opportunities
        </Link>
      </div>

      {loading && (
        <Card className="p-5 sm:p-8">
          <p className="text-sm font-black text-slate-600">Loading RFQ details...</p>
        </Card>
      )}

      {!loading && error && !rfq && (
        <Card className="p-5 sm:p-8">
          <p className="text-sm font-black text-red-600">{error}</p>
          <Link href="/supplier" className="mt-5 inline-flex rounded-xl bg-[#155EEF] px-5 py-3 text-sm font-black text-white">
            Back to Opportunities
          </Link>
        </Card>
      )}

      {!loading && rfq && (
        <>
          <Card className="mb-5 grid grid-cols-1 gap-0 p-5 sm:grid-cols-2 xl:grid-cols-[1.25fr_1fr_.75fr_.8fr_.9fr_.9fr_.65fr]">
            <InfoMetric label="RFQ ID" value={rfq.reference}>
              {rfq.title} <Pill tone={statusTone(rfq.status)}>{statusLabel(rfq.status)}</Pill>
            </InfoMetric>
            <InfoMetric label="Buyer" value={rfq.buyerOrganization.name}>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={13} />
                {rfq.buyerOrganization.status === 'ACTIVE' ? 'Verified buyer' : statusLabel(rfq.buyerOrganization.status)}
              </span>
            </InfoMetric>
            <InfoMetric label="Match Score" value={`${rfq.match?.score || 0}%`}>
              <span className="text-emerald-600">{(rfq.match?.score || 0) >= 85 ? 'Excellent Match' : 'Matched Opportunity'}</span>
            </InfoMetric>
            <InfoMetric label="Deadline" value={formatDate(rfq.closingDate)}>
              <span className={daysLeft(rfq.closingDate) === 'Closed' ? 'text-slate-500' : 'text-red-500'}>{daysLeft(rfq.closingDate)}</span>
            </InfoMetric>
            <InfoMetric label="Category" value={rfq.category}>{rfq.estimatedBudget ? `Budget ${formatMoney(rfq.estimatedBudget, rfq.currency)}` : 'Buyer category'}</InfoMetric>
            <InfoMetric label="Location" value={rfq.deliveryLocation || rfq.country}>{rfq.country}</InfoMetric>
            <InfoMetric label="Status" value={rfq.canQuote ? 'Open' : statusLabel(rfq.status)}>{quoteStatus ? `Quote ${statusLabel(quoteStatus)}` : 'Public RFQ'}</InfoMetric>
          </Card>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.06fr]">
            <div className="space-y-5">
              <Card className="p-5">
                <div className="mb-2 flex items-center gap-3">
                  <FileText className="text-[#155EEF]" size={20} />
                  <h2 className="text-xl font-black">1. RFQ Overview</h2>
                </div>
                <OverviewRow
                  icon={<ClipboardCheck size={17} />}
                  title="Scope Summary"
                  body={rfq.description}
                />
                <OverviewRow
                  icon={<FileText size={17} />}
                  title="Requested Services / Items"
                  body={requestedItems}
                />
                <OverviewRow
                  icon={<MapPin size={17} />}
                  title="Delivery Requirements"
                  body={rfq.deliveryLocation || rfq.country}
                />
                <OverviewRow icon={<Clock3 size={17} />} title="Timeline" body={`Quote closes ${formatDate(rfq.closingDate)}.`} />
                <OverviewRow
                  icon={<MessageSquare size={17} />}
                  title="Buyer Notes"
                  body={rfq.technicalNotes || 'No additional notes were provided by the buyer.'}
                />
              </Card>

              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Folder className="text-[#155EEF]" size={20} />
                    <h2 className="text-xl font-black">2. Specifications & Documents</h2>
                    <span className="text-sm text-slate-500">Attachments provided by the buyer for reference.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Pill>{documents.length} files</Pill>
                    <span className="text-sm font-black text-slate-500">All visible</span>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-[#DFE9F7] px-4">
                  <div className="grid min-w-[720px] grid-cols-[1fr_90px_100px_130px_90px] border-b border-[#DFE9F7] py-3 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                    <span>File Name</span>
                    <span>Type</span>
                    <span>Size</span>
                    <span>Uploaded On</span>
                    <span>Actions</span>
                  </div>
                  {documents.length === 0 && (
                    <p className="py-6 text-sm font-bold text-slate-500">No supporting documents were attached to this RFQ.</p>
                  )}
                  {documents.map((document) => (
                    <FileRow key={`${document.name}-${document.size}`} {...document} />
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <div className="mb-4 flex items-center gap-3">
                  <MessageSquare className="text-[#155EEF]" size={20} />
                  <h2 className="text-xl font-black">3. Clarifications & Messages</h2>
                </div>
                <div className="space-y-3">
                  {(rfq.messages || []).length === 0 && (
                    <div className="rounded-2xl border border-[#DFE9F7] bg-blue-50/40 p-4">
                      <div className="flex gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">RFQ</div>
                        <div>
                          <p className="text-sm font-black">{rfq.buyerOrganization.name} <Pill tone="green">Buyer</Pill></p>
                          <p className="mt-1 text-sm text-slate-600">Use this thread to ask RFQ clarification questions before submitting your quote.</p>
                          <p className="mt-1 text-xs font-bold text-slate-400">{formatDate(rfq.closingDate)} deadline</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {(rfq.messages || []).map((message) => {
                    const mine = message.senderOrganizationId === session?.activeOrganization.id;
                    return (
                      <div key={message.id} className={`rounded-2xl border p-4 ${mine ? 'border-blue-100 bg-blue-50/70' : 'border-[#DFE9F7] bg-white'}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-black text-[#0B1744]">
                            {message.senderOrganizationName}
                            <Pill tone={message.senderOrganizationType === 'BUYER' ? 'green' : 'blue'}>{message.senderOrganizationType === 'BUYER' ? 'Buyer' : 'Supplier'}</Pill>
                          </p>
                          <p className="text-xs font-bold text-slate-400">{formatMessageTime(message.createdAt)}</p>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{message.body}</p>
                      </div>
                    );
                  })}
                  <div className="rounded-2xl border border-[#DFE9F7] bg-white p-3">
                    <textarea
                      className="h-24 w-full resize-none bg-transparent px-2 text-sm outline-none placeholder:text-slate-400"
                      placeholder="Ask the buyer a clarification question about scope, documents, delivery, or quote requirements."
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      maxLength={4000}
                    />
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Paperclip className="text-slate-300" size={17} />
                        Attachments will follow the document workflow.
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#155EEF] px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                        disabled={messageSending || !messageText.trim()}
                        onClick={sendMessage}
                      >
                        {messageSending ? 'Sending' : 'Send Message'} <Send size={15} />
                      </button>
                    </div>
                    <p className="mt-2 text-right text-xs font-bold text-slate-400">{messageText.length}/4000 characters</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-5">
              <Card className="p-5">
                <div className="mb-4 flex items-center gap-3">
                  <Target className="text-[#155EEF]" size={20} />
                  <h2 className="text-xl font-black">4. Prepare Quote</h2>
                  <span className="text-sm text-slate-500">Provide your pricing and terms for this RFQ.</span>
                  {quoteStatus && <Pill tone={statusTone(quoteStatus)}>{statusLabel(quoteStatus)}</Pill>}
                </div>
                {!rfq.canQuote && (
                  <div className="mb-4 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
                    This RFQ is not currently open for quote submission.
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <label className="text-sm font-black">
                    Quote Reference *
                    <input className="mt-2 w-full rounded-xl border border-[#DFE9F7] px-4 py-3 font-bold outline-none" value={quoteReference} readOnly />
                  </label>
                  <label className="text-sm font-black">
                    Total Quote Value *
                    <input
                      className="mt-2 w-full rounded-xl border border-[#DFE9F7] px-4 py-3 font-bold outline-none"
                      inputMode="decimal"
                      value={quoteForm.totalAmount}
                      onChange={(event) => updateQuoteForm('totalAmount', event.target.value)}
                      placeholder="125000"
                    />
                  </label>
                  <label className="text-sm font-black">
                    Currency *
                    <select
                      className="mt-2 w-full rounded-xl border border-[#DFE9F7] px-4 py-3 font-bold outline-none"
                      value={quoteForm.currency}
                      onChange={(event) => updateQuoteForm('currency', event.target.value)}
                    >
                      {['USD', 'GHS', 'GBP', 'EUR', 'ZAR', 'NGN', 'KES'].map((currency) => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-black">
                    Delivery Days *
                    <input
                      className="mt-2 w-full rounded-xl border border-[#DFE9F7] px-4 py-3 font-bold outline-none"
                      inputMode="numeric"
                      value={quoteForm.deliveryDays}
                      onChange={(event) => updateQuoteForm('deliveryDays', event.target.value)}
                    />
                  </label>
                  <label className="text-sm font-black">
                    Validity Days *
                    <input
                      className="mt-2 w-full rounded-xl border border-[#DFE9F7] px-4 py-3 font-bold outline-none"
                      inputMode="numeric"
                      value={quoteForm.validityDays}
                      onChange={(event) => updateQuoteForm('validityDays', event.target.value)}
                    />
                  </label>
                  <label className="text-sm font-black">
                    Warranty / Support *
                    <input
                      className="mt-2 w-full rounded-xl border border-[#DFE9F7] px-4 py-3 font-bold outline-none"
                      value={quoteForm.warranty}
                      onChange={(event) => updateQuoteForm('warranty', event.target.value)}
                    />
                  </label>
                </div>
                <label className="mt-4 block text-sm font-black">
                  Proposal Summary *
                  <textarea
                    className="mt-2 h-24 w-full rounded-xl border border-[#DFE9F7] p-4 text-sm outline-none"
                    value={quoteForm.proposalSummary}
                    onChange={(event) => updateQuoteForm('proposalSummary', event.target.value)}
                    maxLength={1000}
                    placeholder="Summarize your technical approach, delivery plan, and support model."
                  />
                </label>
                <p className="text-right text-xs font-bold text-slate-400">{quoteForm.proposalSummary.length}/1000 characters</p>
                <label className="mt-4 block text-sm font-black">
                  Commercial Notes
                  <textarea
                    className="mt-2 h-20 w-full rounded-xl border border-[#DFE9F7] p-4 text-sm outline-none"
                    value={quoteForm.commercialNotes}
                    onChange={(event) => updateQuoteForm('commercialNotes', event.target.value)}
                    placeholder="Payment terms, exclusions, assumptions, or optional notes."
                  />
                </label>
                <div className="mt-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <UploadCloud className="text-[#155EEF]" size={26} />
                        <div>
                          <p className="text-sm font-black">Quote Attachments (Optional)</p>
                          <p className="text-xs text-slate-500">Add proposal, pricing, compliance, and certification documents for buyer review.</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[190px_1fr]">
                        <select
                          className="rounded-xl border border-[#DFE9F7] bg-white px-4 py-3 text-sm font-bold outline-none"
                          value={documentCategory}
                          onChange={(event) => setDocumentCategory(event.target.value)}
                        >
                          {['Technical Proposal', 'Pricing Sheet', 'Compliance Document', 'Certification', 'Commercial Terms', 'Other'].map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                        <input
                          className="rounded-xl border border-[#DFE9F7] bg-white px-4 py-3 text-sm font-bold outline-none"
                          value={documentUrl}
                          onChange={(event) => setDocumentUrl(event.target.value)}
                          placeholder="Optional document review link"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#155EEF] px-5 py-3 text-sm font-black text-white">
                        Choose Files
                        <input
                          className="hidden"
                          type="file"
                          multiple
                          onChange={(event) => {
                            addQuoteFiles(event.target.files);
                            event.currentTarget.value = '';
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="rounded-xl border border-[#DFE9F7] bg-white px-5 py-3 text-sm font-black text-[#155EEF]"
                        onClick={addDocumentLink}
                      >
                        Add Link
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {quoteDocuments.length === 0 && (
                      <p className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-500">No quote documents added yet.</p>
                    )}
                    {quoteDocuments.map((document, index) => (
                      <QuoteDocumentRow
                        key={`${document.name}-${index}`}
                        document={document}
                        onRemove={() => removeQuoteDocument(index)}
                      />
                    ))}
                  </div>
                </div>
              </Card>

              <div ref={quotePreviewRef}>
                <Card className="p-5">
                  <h2 className="mb-3 text-xl font-black">5. Pricing Summary</h2>
                  <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-[#DFE9F7] text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                    <tr>
                      <th>#</th>
                      <th>Item / Service</th>
                      <th>Description</th>
                      <th>Qty</th>
                      <th className="text-right">Unit</th>
                      <th className="text-right">Quote Basis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfq.lineItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center font-bold text-slate-500">No buyer line items are attached to this RFQ.</td>
                      </tr>
                    )}
                    {rfq.lineItems.map((item, index) => (
                      <PricingRow
                        key={item.id}
                        index={String(index + 1)}
                        item={item.name}
                        description={item.description || 'Buyer requested item'}
                        qty={item.quantity}
                        unit={item.unit}
                      />
                    ))}
                  </tbody>
                </table>
                  </div>
                  <div className="mt-4 space-y-1 text-right text-sm font-bold text-slate-600">
                    <p>Delivery <span className="ml-10 text-[#0B1744]">{quoteForm.deliveryDays || '-'} days</span></p>
                    <p>Validity <span className="ml-10 text-[#0B1744]">{quoteForm.validityDays || '-'} days</span></p>
                    <p className="rounded-xl bg-blue-50 px-4 py-3 text-lg font-black text-[#155EEF]">
                      Total Quote Value ({quoteForm.currency}) <span className="ml-8">{totalQuoteValue}</span>
                    </p>
                  </div>
                </Card>
              </div>

              <Card className="p-5">
                <h2 className="mb-3 text-xl font-black">6. Compliance Checklist</h2>
                {[
                  'I have read and understood all RFQ requirements.',
                  'Technical requirements and scope have been reviewed.',
                  quoteDocumentCount > 0 ? `${quoteDocumentCount} quote document${quoteDocumentCount === 1 ? '' : 's'} added for buyer review.` : 'Quote documents are optional but recommended for buyer review.',
                ].map((item) => (
                  <p key={item} className="mb-2 flex items-center gap-3 text-sm font-bold text-slate-600">
                    <CheckCircle2 className="text-[#155EEF]" size={18} />
                    {item}
                  </p>
                ))}
                {(error || success) && (
                  <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-black ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {error || success}
                  </p>
                )}
              </Card>
            </div>
          </div>

          <div className="sticky bottom-0 -mx-4 mt-5 flex flex-col gap-3 border-t border-[#DFE9F7] bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <Link href="/supplier" className="inline-flex items-center gap-2 rounded-xl border border-[#DFE9F7] bg-white px-6 py-3 text-sm font-black">
              <ArrowLeft size={16} />
              Back to Opportunities
            </Link>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-[#DFE9F7] bg-white px-7 py-3 text-sm font-black disabled:opacity-60"
                disabled={!rfq.canQuote || Boolean(saving)}
                onClick={() => saveQuote('DRAFT')}
              >
                <Save size={16} />
                {saving === 'DRAFT' ? 'Saving Draft' : 'Save Draft'}
              </button>
              <button
                type="button"
                className="rounded-xl border border-[#DFE9F7] bg-white px-7 py-3 text-sm font-black"
                onClick={previewQuote}
              >
                Preview Quote
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#155EEF] px-8 py-3 text-sm font-black text-white shadow-[0_12px_30px_rgba(21,94,239,.18)] disabled:opacity-60"
                disabled={!rfq.canQuote || Boolean(saving)}
                onClick={() => saveQuote('SUBMITTED')}
              >
                {saving === 'SUBMITTED' ? 'Submitting Quote' : 'Submit Quote ->'}
              </button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
