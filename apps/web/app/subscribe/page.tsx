'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Crown, Layers3, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { PublicHeader } from '../../components/public-header';
import { Card } from '../../components/ui';
import { apiFetch } from '../../lib/api';

type PlanKey = 'STARTER' | 'GROWTH' | 'PROFESSIONAL' | 'ENTERPRISE';
type OrganizationType = 'BUYER' | 'SUPPLIER';

type PlanCard = {
  key: PlanKey;
  name: string;
  audience: string;
  button: string;
  icon: LucideIcon;
  features: string[];
  popular?: boolean;
};

type ApiPlan = {
  key: PlanKey;
  name: string;
  description: string | null;
  features: string[];
};

type SubscriptionForm = {
  name: string;
  email: string;
  organizationName: string;
  phone: string;
  country: string;
  website: string;
  organizationType: OrganizationType;
  category: string;
  estimatedUsers: string;
  notes: string;
};

const planIcons: Record<PlanKey, LucideIcon> = {
  STARTER: Sparkles,
  GROWTH: Layers3,
  PROFESSIONAL: ShieldCheck,
  ENTERPRISE: Crown,
};

const fallbackPlans: PlanCard[] = [
  {
    key: 'STARTER',
    name: 'Starter',
    audience: 'For early marketplace access',
    button: 'Choose Starter',
    icon: Sparkles,
    features: ['Free sample access', 'Basic discovery previews', 'RFQ workspace preview', 'Upgrade request support'],
  },
  {
    key: 'GROWTH',
    name: 'Growth',
    audience: 'For active sourcing teams',
    button: 'Choose Growth',
    icon: Layers3,
    popular: true,
    features: ['RFQ workflow access', 'Matched supplier opportunities', 'Quote comparison', 'Team collaboration'],
  },
  {
    key: 'PROFESSIONAL',
    name: 'Professional',
    audience: 'For governed operations',
    button: 'Choose Professional',
    icon: ShieldCheck,
    features: ['Quote Evaluation', 'Advanced roles', 'Audit visibility', 'Supplier performance insights'],
  },
  {
    key: 'ENTERPRISE',
    name: 'Enterprise',
    audience: 'For larger procurement networks',
    button: 'Choose Enterprise',
    icon: Crown,
    features: ['Multi-organization access', 'Membership controls', 'Priority support', 'Custom onboarding'],
  },
];

function featureLabel(feature: string) {
  if (feature === 'quote_comparison') return 'Quote Evaluation';
  return feature
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .replace(/\bRfq\b/g, 'RFQ')
    .replace(/\bApi\b/g, 'API');
}

function planAudience(plan: ApiPlan) {
  const fallback = fallbackPlans.find((item) => item.key === plan.key);
  return plan.description || fallback?.audience || 'Reviewed access for your organization';
}

const emptyForm: SubscriptionForm = {
  name: '',
  email: '',
  organizationName: '',
  phone: '',
  country: '',
  website: '',
  organizationType: 'BUYER',
  category: '',
  estimatedUsers: '',
  notes: '',
};

export default function SubscribePage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('GROWTH');
  const [plans, setPlans] = useState<PlanCard[]>(fallbackPlans);
  const [form, setForm] = useState<SubscriptionForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const selected = useMemo(() => plans.find((plan) => plan.key === selectedPlan) || plans[1] || fallbackPlans[1], [plans, selectedPlan]);

  useEffect(() => {
    let cancelled = false;
    async function loadPlans() {
      try {
        const response = await apiFetch('/subscription-requests/plans', { method: 'GET' });
        if (!response.ok) return;
        const payload = (await response.json()) as ApiPlan[];
        if (!payload.length || cancelled) return;
        setPlans(payload.map((plan) => {
          const fallback = fallbackPlans.find((item) => item.key === plan.key);
          return {
            key: plan.key,
            name: plan.name,
            audience: planAudience(plan),
            button: `Choose ${plan.name}`,
            icon: planIcons[plan.key],
            popular: plan.key === 'GROWTH',
            features: plan.features.length ? plan.features.map(featureLabel) : (fallback?.features || []),
          };
        }));
      } catch {
        // Keep the local fallback plan cards if the API is unavailable.
      }
    }

    void loadPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField<K extends keyof SubscriptionForm>(field: K, value: SubscriptionForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!confirmed) {
      setError('Please confirm admin review before submitting.');
      return;
    }
    setLoading(true);

    try {
      const response = await apiFetch('/subscription-requests', {
        method: 'POST',
        body: JSON.stringify({ ...form, selectedPlan }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message;
        setError(message || 'Unable to submit subscription request.');
        return;
      }

      setSuccess('Your subscription request has been submitted for admin review.');
      setForm(emptyForm);
      setConfirmed(false);
    } catch {
      setError('Unable to submit subscription request. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F8FC] text-[#0B1744]">
      <PublicHeader />

      <section className="bg-[#061F46] text-white">
        <div className="mx-auto max-w-[1320px] px-6 py-8 lg:px-8">
          <p className="inline-flex rounded-full border border-[#FFCF4D]/40 bg-[#FFCF4D]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[.14em] text-[#FFCF4D]">
            Save 30% when you subscribe for 12 months
          </p>
          <div className="mt-4">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Membership Options</h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-blue-100">
                Choose a plan below, then submit the selected plan form for TheDigiHubs admin review and access assignment.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-6 py-8 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-[-0.03em]">Choose Your Plan</h2>
          <p className="mt-2 text-sm font-bold text-slate-500">All plan requests are reviewed by admin before access is assigned.</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map(({ key, name, audience, button, features, icon: Icon, popular }) => {
            const active = selectedPlan === key;
            return (
              <Card key={key} className={`relative flex min-h-[220px] flex-col p-4 ${active ? 'border-[#155EEF] ring-4 ring-blue-100' : ''}`}>
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FFCF4D] px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] text-[#0B1744]">
                    Most popular
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-[#155EEF]">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="font-black">{name}</h3>
                    <p className="mt-1 text-xs font-bold text-slate-500">{audience}</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setSelectedPlan(key); setError(''); setSuccess(''); }} className={`mt-4 w-full rounded-md px-4 py-2 text-xs font-black ${active ? 'bg-[#155EEF] text-white' : 'bg-[#061F46] text-white'}`}>
                  {active ? 'Selected Plan' : button}
                </button>
                <div className="mt-4 space-y-1.5 border-t border-[#DFE9F7] pt-3">
                  {features.map((feature) => (
                    <p key={feature} className="flex gap-2 text-xs font-bold leading-5 text-slate-600">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={14} />
                      {feature}
                    </p>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="mx-auto mt-8 max-w-[1120px] p-5 sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="text-center">
              <h2 className="text-xl font-black tracking-[-0.03em]">Register for Your Selected Plan</h2>
              <p className="mt-1 text-xs font-bold text-slate-500">
                You selected <span className="text-[#155EEF]">{selected.name}</span>. Admin will review and assign access based on your plan.
              </p>
              <p className="mx-auto mt-4 inline-flex rounded-md border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black text-[#155EEF]">
                Plan request selected: {selected.name}
              </p>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black">Full name *</span>
                <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Please enter your name" className="mt-2 h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block">
                <span className="text-sm font-black">Business email *</span>
                <input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="Please enter your email" className="mt-2 h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block">
                <span className="text-sm font-black">Organization name *</span>
                <input required value={form.organizationName} onChange={(event) => updateField('organizationName', event.target.value)} placeholder="Name of your organization" className="mt-2 h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block">
                <span className="text-sm font-black">Phone</span>
                <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="Please enter your phone" className="mt-2 h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block">
                <span className="text-sm font-black">City / Country</span>
                <input value={form.country} onChange={(event) => updateField('country', event.target.value)} placeholder="Please enter your city or country" className="mt-2 h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block">
                <span className="text-sm font-black">Organization type *</span>
                <select value={form.organizationType} onChange={(event) => updateField('organizationType', event.target.value as OrganizationType)} className="mt-2 h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100">
                  <option value="BUYER">Buyer organization</option>
                  <option value="SUPPLIER">Supplier organization</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-black">Website URL</span>
                <input type="url" value={form.website} onChange={(event) => updateField('website', event.target.value)} placeholder="https://www.example.com" className="mt-2 h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block">
                <span className="text-sm font-black">Category / CPV</span>
                <input value={form.category} onChange={(event) => updateField('category', event.target.value)} placeholder="Tell us your main category" className="mt-2 h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-black">Estimated users or team size</span>
                <input value={form.estimatedUsers} onChange={(event) => updateField('estimatedUsers', event.target.value)} placeholder="Example: 12 users across 3 teams" className="mt-2 h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-black">Plan requirements</span>
                <textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Please mention any access, roles, countries, categories, or onboarding requirements." rows={3} className="mt-2 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 py-3 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
              </label>
            </div>

            <label className="mt-4 flex gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs font-bold leading-5 text-slate-600">
              <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#155EEF]" />
              <span>I understand this request will be reviewed by TheDigiHubs admin before plan access is assigned.</span>
            </label>

            {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">{error}</p>}
            {success && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{success}</p>}

            <button type="submit" disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#155EEF] px-6 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(21,94,239,.16)] transition hover:bg-[#0f49c7] disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Submitting request' : 'Register for Selected Plan'} <Send size={16} />
            </button>
          </form>
        </Card>
      </section>
    </main>
  );
}
