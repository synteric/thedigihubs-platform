'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  Award,
  BarChart3,
  Building2,
  Check,
  ChevronRight,
  FileText,
  FolderArchive,
  Save,
  Settings,
  Trash2,
  UploadCloud,
  UsersRound,
} from 'lucide-react';
import { AppShell } from '../../../components/app-shell';
import { PlanAccessCard } from '../../../components/plan-access-card';
import { Card, Pill } from '../../../components/ui';
import { apiFetch } from '../../../lib/api';
import { useSession } from '../../../lib/session';

const nav = [
  { label: 'Overview', icon: <Building2 size={20} /> },
  { label: 'RFQs', icon: <FileText size={20} />, active: true },
  { label: 'Quotes', icon: <FileText size={20} /> },
  { label: 'Suppliers', icon: <UsersRound size={20} /> },
  { label: 'Awards', icon: <Award size={20} /> },
  { label: 'Contracts', icon: <FileText size={20} /> },
  { label: 'Analytics', icon: <BarChart3 size={20} /> },
  { label: 'Records', icon: <FolderArchive size={20} /> },
  { label: 'Settings', icon: <Settings size={20} /> },
];

const steps = [
  'RFQ Details',
  'Items & Services',
  'Requirements',
  'Specifications & Documents',
  'Suppliers',
  'External Invites',
  'Review & Publish',
];

const initialFiles = [
  { name: 'Technical_Specification.pdf', size: 2450000, label: '2.45 MB', type: 'application/pdf', badge: 'PDF' },
  { name: 'Scope_of_Work.docx', size: 1280000, label: '1.28 MB', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', badge: 'W' },
  { name: 'Reference_Drawings.zip', size: 18760000, label: '18.76 MB', type: 'application/zip', badge: 'ZIP' },
];

const initialNotes = `Please review the attached documents for detailed specifications and scope of work.
Kindly ensure compliance with the technical standards mentioned.
Contact us if any clarifications are needed before submitting your quote.`;

type WorkflowFile = {
  name: string;
  size: number;
  label: string;
  type: string;
  badge: string;
};

type SaveState = 'idle' | 'saving' | 'matching' | 'saved' | 'matched' | 'error';

function InviteCard() {
  return (
    <Card className="p-5">
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-[#155EEF]">
        <UsersRound />
      </div>
      <p className="text-lg font-black">Invite external suppliers</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">Grow your network and get more competitive quotes.</p>
      <Link href="#supplier-invites" className="mt-5 block w-full rounded-xl bg-[#155EEF] py-3 text-center text-sm font-black text-white">
        Invite Suppliers
      </Link>
    </Card>
  );
}

function formatFileSize(size: number) {
  if (size >= 1000000) return `${(size / 1000000).toFixed(2)} MB`;
  if (size >= 1000) return `${Math.ceil(size / 1000)} KB`;
  return `${size} B`;
}

function fileBadge(file: File) {
  const extension = file.name.split('.').pop()?.toUpperCase();
  return extension?.slice(0, 4) || 'FILE';
}

function rfqClosingDate() {
  const closingDate = new Date();
  closingDate.setDate(closingDate.getDate() + 21);
  closingDate.setHours(22, 0, 0, 0);
  return closingDate;
}

function rfqClosingDateLabel() {
  return rfqClosingDate().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function payloadFor(files: WorkflowFile[], notes: string, externalInvites: string[], autoMatch: boolean) {
  return {
    title: 'Industrial Pumps Procurement',
    description: 'Industrial pumps procurement with attached specifications and supplier response requirements.',
    category: 'Machinery & Equipment',
    country: 'United States',
    deliveryLocation: 'Houston, Texas, USA',
    currency: 'USD',
    estimatedBudget: 250000,
    closingDate: rfqClosingDate().toISOString(),
    technicalNotes: notes,
    autoMatch,
    supportingDocuments: files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    })),
    externalInvites: externalInvites.map((email) => ({ email })),
    lineItems: [
      {
        name: 'Industrial Pumps',
        description: 'Industrial pump equipment and related services per the attached specifications.',
        quantity: 12,
        unit: 'items',
      },
    ],
  };
}

export function RfqWorkflow() {
  const { session } = useSession();
  const [files, setFiles] = useState<WorkflowFile[]>(initialFiles);
  const [notes, setNotes] = useState(initialNotes);
  const [externalInvites, setExternalInvites] = useState([
    'procurement@mechworks.com',
    'info@industrialparts.co',
    'purchasing@globalfab.com',
  ]);
  const [newInvite, setNewInvite] = useState('');
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');
  const [createdRfqId, setCreatedRfqId] = useState('');
  const [matchedSupplierCount, setMatchedSupplierCount] = useState(18);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canCreateRfq = Boolean(session?.features.includes('rfq_creation'));

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;

    const selectedFiles = Array.from(fileList).map((file) => ({
      name: file.name,
      size: file.size,
      label: formatFileSize(file.size),
      type: file.type || 'application/octet-stream',
      badge: fileBadge(file),
    }));

    setFiles((currentFiles) => {
      if (replaceIndex === null) return [...currentFiles, ...selectedFiles];
      const nextFiles = [...currentFiles];
      nextFiles.splice(replaceIndex, 1, selectedFiles[0]);
      return nextFiles;
    });
    setReplaceIndex(null);
  }

  function addInvite() {
    const email = newInvite.trim();
    if (!email || externalInvites.includes(email)) return;
    setExternalInvites((currentInvites) => [...currentInvites, email]);
    setNewInvite('');
  }

  async function createRfq(mode: 'draft' | 'matching') {
    setSaveState(mode === 'draft' ? 'saving' : 'matching');
    setMessage('');
    setCreatedRfqId('');

    try {
      const response = await apiFetch('/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadFor(files, notes, externalInvites, mode === 'matching')),
      });

      if (!response.ok) {
        throw new Error(`RFQ request failed with status ${response.status}`);
      }

      const rfq = await response.json();
      setCreatedRfqId(rfq.id);

      if (mode === 'matching') {
        const publishResponse = await apiFetch(`/rfqs/${rfq.id}/publish`, {
          method: 'PATCH',
          body: JSON.stringify({}),
        });

        if (!publishResponse.ok) {
          throw new Error(`RFQ publish failed with status ${publishResponse.status}`);
        }

        const matchedSuppliers = rfq.matching?.matches?.length || 0;
        setMatchedSupplierCount(matchedSuppliers);
        setSaveState('matched');
        setMessage(`${rfq.reference} published with ${matchedSuppliers} matched supplier opportunities.`);
        return;
      }

      setSaveState('saved');
      setMessage(`${rfq.reference} saved as a draft.`);
    } catch (error) {
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : 'Unable to save this RFQ right now.');
    }
  }

  if (!canCreateRfq) {
    return (
      <AppShell
        nav={nav}
        sidebarCard={<InviteCard />}
        requiredOrganizationTypes={['BUYER']}
        requiredRoles={['BUYER_OWNER', 'BUYER_MANAGER']}
      >
        <PlanAccessCard className="mb-5" activeHref="/buyer" />
        <Card className="p-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[.16em] text-[#155EEF]">Plan access required</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-.03em]">RFQ creation is available after plan approval.</h1>
            <p className="mt-3 text-sm font-bold leading-7 text-slate-600">
              Your current access lets you preview sample workflows. Request full access to create and publish live RFQs.
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
      sidebarCard={<InviteCard />}
      requiredOrganizationTypes={['BUYER']}
      requiredRoles={['BUYER_OWNER', 'BUYER_MANAGER']}
    >
      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        multiple
        onChange={(event) => addFiles(event.target.files)}
      />

      <div>
        <h1 className="text-3xl font-black tracking-[-.03em]">Create New RFQ</h1>
        <p className="mt-2 text-slate-600">Fill in the details to create and publish your RFQ.</p>
      </div>

      <div className="mt-8 overflow-x-auto pb-2">
        <div className="grid min-w-[760px] grid-cols-7 gap-2">
          {steps.map((step, index) => (
            <div key={step} className="text-center">
              <div className={`mx-auto grid h-10 w-10 place-items-center rounded-full border-2 text-sm font-black ${index < 3 ? 'border-emerald-500 bg-emerald-500 text-white' : index === 3 ? 'border-[#155EEF] bg-white text-[#155EEF]' : 'border-[#DFE9F7] bg-white text-slate-500'}`}>
                {index < 3 ? <Check size={16} /> : index + 1}
              </div>
              <p className={`mt-2 text-xs font-black ${index === 3 ? 'text-[#155EEF]' : 'text-[#0B1744]'}`}>{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black">Specifications & Documents</h2>
              <Pill>Optional</Pill>
            </div>
            <p className="mt-2 text-sm text-slate-600">Add any specifications, drawings, or supporting documents to help suppliers respond accurately.</p>
            <div
              className="mt-6 cursor-pointer rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-8 text-center"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addFiles(event.dataTransfer.files);
              }}
            >
              <UploadCloud className="mx-auto text-[#155EEF]" size={34} />
              <p className="mt-3 font-black">Add specifications or supporting documents (optional)</p>
              <p className="text-sm text-slate-600">Drag and drop files here or <span className="font-black text-[#155EEF]">browse</span></p>
            </div>

            <p className="mt-6 text-sm font-black">Uploaded Files ({files.length})</p>
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="mt-3 flex items-center gap-4 rounded-xl border border-[#DFE9F7] p-4">
                <div className={`grid h-10 w-10 place-items-center rounded-lg text-xs font-black text-white ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-blue-500' : 'bg-orange-400'}`}>
                  {file.badge}
                </div>
                <div className="mr-auto">
                  <p className="font-black">{file.name}</p>
                  <p className="text-xs text-slate-500">{file.label}</p>
                </div>
                <button
                  className="text-sm font-black text-[#155EEF]"
                  onClick={() => {
                    setReplaceIndex(index);
                    fileInputRef.current?.click();
                  }}
                >
                  Replace
                </button>
                <button
                  className="text-slate-500"
                  title="Remove file"
                  onClick={() => setFiles((currentFiles) => currentFiles.filter((_, fileIndex) => fileIndex !== index))}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <label className="mt-6 block text-sm font-black">Additional instructions or technical notes</label>
            <textarea
              className="mt-2 h-28 w-full rounded-xl border border-[#DFE9F7] p-4 text-sm outline-none"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card className="scroll-mt-28 p-5" id="rfq-preview">
              <div className="flex justify-between">
                <h3 className="font-black">RFQ Summary</h3>
                <span className="text-sm font-black text-[#155EEF]">Edit</span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <p><b>RFQ Title</b><br />Industrial Pumps Procurement</p>
                <p><b>Deadline</b><br />{rfqClosingDateLabel()} • 10:00 PM</p>
                <p><b>Category</b><br />Machinery & Equipment</p>
                <p><b>Items & Services</b><br />12 Items</p>
                <p><b>Delivery Location</b><br />Houston, Texas, USA</p>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex justify-between">
                <h3 className="font-black">Supplier Strategy</h3>
                <span className="text-sm font-black text-[#155EEF]">Edit</span>
              </div>
              {[
                ['Matched suppliers', String(matchedSupplierCount)],
                ['Selected suppliers', '6'],
                ['External invitations', String(externalInvites.length)],
              ].map((row) => (
                <p key={row[0]} className="flex justify-between border-b border-[#DFE9F7] py-4 text-sm font-bold last:border-0">
                  <span>{row[0]}</span>
                  <span>{row[1]}</span>
                </p>
              ))}
            </Card>
          </div>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-3 flex justify-between">
              <h3 className="font-black">RFQ Progress</h3>
              <span className="text-sm font-black text-slate-500">4 of 7 completed</span>
            </div>
            {steps.map((step, index) => (
              <p key={step} className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm font-black ${index === 3 ? 'bg-blue-50 text-[#155EEF]' : ''}`}>
                <span>
                  <span className={`mr-3 inline-grid h-6 w-6 place-items-center rounded-full text-xs ${index < 3 ? 'bg-emerald-500 text-white' : index === 3 ? 'bg-[#155EEF] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {index < 3 ? '✓' : index + 1}
                  </span>
                  {step}
                </span>
                {index > 3 && <span className="text-xs text-slate-500">Pending</span>}
              </p>
            ))}
          </Card>

          <Card className="p-5">
            <div className="flex justify-between">
              <h3 className="font-black">Selected Suppliers (6)</h3>
              <span className="text-sm font-black text-[#155EEF]">View all</span>
            </div>
            {['Alpha Solutions', 'BlueWave Tech', 'Vertex Systems', 'Global Industrial Co.', 'Precision Equipments'].map((supplier) => (
              <p key={supplier} className="flex justify-between border-b border-[#DFE9F7] py-3 text-sm font-bold last:border-0">
                {supplier}
                <Pill tone="green">Matched</Pill>
              </p>
            ))}
          </Card>

          <Card className="scroll-mt-28 p-5" id="supplier-invites">
            <div className="flex justify-between">
              <h3 className="font-black">External Supplier Invites ({externalInvites.length})</h3>
              <span className="text-sm font-black text-[#155EEF]">Add more</span>
            </div>
            {externalInvites.map((email) => (
              <button
                key={email}
                className="mt-3 block w-full rounded-lg bg-blue-50 px-3 py-2 text-left text-sm font-bold text-[#155EEF]"
                onClick={() => setExternalInvites((currentInvites) => currentInvites.filter((invite) => invite !== email))}
              >
                {email} ×
              </button>
            ))}
            <input
              className="mt-3 w-full rounded-xl border border-[#DFE9F7] p-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-500"
              placeholder="+ Add email address"
              value={newInvite}
              onChange={(event) => setNewInvite(event.target.value)}
              onBlur={addInvite}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addInvite();
                }
              }}
            />
          </Card>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-4 border-t border-[#DFE9F7] pt-5 lg:flex-row lg:items-center lg:justify-between">
        <button className="rounded-xl border border-[#DFE9F7] bg-white px-6 py-3 font-black" onClick={() => window.history.back()}>← Back</button>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {message && (
            <div className={`max-w-[420px] text-left text-sm font-bold sm:text-right ${saveState === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>
              <p>{message}</p>
              {createdRfqId && saveState !== 'error' && (
                <Link href={`/buyer/rfq/${createdRfqId}/evaluation`} className="mt-1 inline-flex text-[#155EEF]">
                  Open Quote Evaluation -&gt;
                </Link>
              )}
            </div>
          )}
          <button
            className="rounded-xl border border-[#DFE9F7] bg-white px-6 py-3 font-black disabled:opacity-60"
            disabled={saveState === 'saving' || saveState === 'matching'}
            onClick={() => createRfq('draft')}
          >
            <Save className="mr-2 inline" size={16} />
            {saveState === 'saving' ? 'Saving Draft' : 'Save Draft'}
          </button>
          <Link href="#rfq-preview" className="rounded-xl border border-[#DFE9F7] bg-white px-6 py-3 font-black">
            Preview RFQ
          </Link>
          <button
            className="rounded-xl bg-[#155EEF] px-7 py-3 font-black text-white disabled:opacity-60"
            disabled={saveState === 'saving' || saveState === 'matching'}
            onClick={() => createRfq('matching')}
          >
            {saveState === 'matching' ? 'Publishing RFQ' : 'Publish to Suppliers'} <ChevronRight className="inline" size={18} />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
