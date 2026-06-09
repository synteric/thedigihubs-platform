'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { Card, Pill } from '../../components/ui';

type SubscriptionRequestStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

type SubscriptionRequestItem = {
  id: string;
  selectedPlan: 'STARTER' | 'GROWTH' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: SubscriptionRequestStatus;
  name: string;
  email: string;
  organizationName: string;
  organizationType?: 'BUYER' | 'SUPPLIER';
  phone?: string;
  country?: string;
  website?: string;
  category?: string;
  estimatedUsers?: string;
  notes?: string;
  createdAt: string;
  assignmentApplied?: boolean;
};

const statusTone: Record<SubscriptionRequestStatus, 'blue' | 'green' | 'red'> = {
  PENDING_REVIEW: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
};

function formatStatus(status: SubscriptionRequestStatus) {
  return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function SubscriptionRequestQueue() {
  const [requests, setRequests] = useState<SubscriptionRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [message, setMessage] = useState('');
  const pendingCount = useMemo(() => requests.filter((request) => request.status === 'PENDING_REVIEW').length, [requests]);

  async function loadRequests() {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiFetch('/subscription-requests', { method: 'GET' });
      if (!response.ok) {
        setMessage('Subscription requests could not be loaded.');
        return;
      }
      setRequests(await response.json());
    } catch {
      setMessage('Subscription requests could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  async function updateRequest(id: string, status: SubscriptionRequestStatus) {
    setUpdatingId(id);
    setMessage('');
    try {
      const response = await apiFetch(`/subscription-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        setMessage('Unable to update subscription request.');
        return;
      }
      const updated = (await response.json()) as SubscriptionRequestItem;
      setRequests((current) => current.map((request) => (request.id === id ? updated : request)));
      if (status === 'APPROVED') {
        setMessage(updated.assignmentApplied ? 'Request approved and plan access assigned.' : 'Request approved. No matching sample-access organization was found yet.');
      } else {
        setMessage('Request rejected.');
      }
    } catch {
      setMessage('Unable to update subscription request.');
    } finally {
      setUpdatingId('');
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <Card className="mt-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[.16em] text-[#155EEF]">Membership review</p>
          <h2 className="mt-2 text-xl font-black">Subscription Request Queue</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">{pendingCount} request{pendingCount === 1 ? '' : 's'} pending admin review</p>
        </div>
        <button onClick={loadRequests} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-[#DFE9F7] bg-white px-4 py-2 text-sm font-black text-[#155EEF] disabled:opacity-60">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {message && <p className="mt-4 rounded-2xl bg-blue-50 p-3 text-sm font-bold text-[#155EEF]">{message}</p>}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-xs font-black uppercase tracking-[.08em] text-slate-500">
            <tr>
              <th className="py-3">Organization</th>
              <th>Contact</th>
              <th>Plan</th>
              <th>Category</th>
              <th>Submitted</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody className="font-bold">
            {requests.slice(0, 6).map((request) => (
              <tr key={request.id} className="border-t border-[#DFE9F7] align-top">
                <td className="py-4">
                  {request.organizationName}
                  <br />
                  <span className="text-xs text-slate-500">{request.organizationType || 'Not selected'}{request.country ? ` - ${request.country}` : ''}</span>
                </td>
                <td className="py-4">
                  {request.name}
                  <br />
                  <span className="text-xs text-slate-500">{request.email}</span>
                </td>
                <td className="py-4">{request.selectedPlan}</td>
                <td className="max-w-[180px] py-4 text-slate-600">{request.category || request.estimatedUsers || 'Not provided'}</td>
                <td className="py-4 text-slate-600">{new Date(request.createdAt).toLocaleDateString()}</td>
                <td className="py-4"><Pill tone={statusTone[request.status]}>{formatStatus(request.status)}</Pill></td>
                <td className="py-4 text-right">
                  {request.status === 'PENDING_REVIEW' ? (
                    <div className="inline-flex gap-2">
                      <button disabled={updatingId === request.id} onClick={() => updateRequest(request.id, 'APPROVED')} className="inline-flex items-center gap-1 rounded-xl bg-[#155EEF] px-3 py-2 text-xs font-black text-white disabled:opacity-60">
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button disabled={updatingId === request.id} onClick={() => updateRequest(request.id, 'REJECTED')} className="inline-flex items-center gap-1 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-red-600 disabled:opacity-60">
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-black text-slate-400">Reviewed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && requests.length === 0 && (
          <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">No subscription requests yet.</p>
        )}
      </div>
    </Card>
  );
}
