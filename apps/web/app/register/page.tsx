'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CheckCircle2, FileSearch, Globe2, ShieldCheck, Store, UsersRound } from 'lucide-react';
import { PublicHeader } from '../../components/public-header';
import { Card } from '../../components/ui';
import { apiFetch } from '../../lib/api';
import { useSession } from '../../lib/session';

type RegistrationType = 'buyer' | 'supplier';
type RegistrationFieldName =
  | 'email'
  | 'name'
  | 'organizationName'
  | 'country'
  | 'category'
  | 'countriesServed'
  | 'phoneCode'
  | 'phone'
  | 'website';
type RegistrationForm = Record<RegistrationFieldName | 'password' | 'confirmPassword', string>;

type SampleAccessConfig = {
  label: string;
  title: string;
  subtitle: string;
  organizationLabel: string;
  categoryLabel: string;
  categoryPlaceholder: string;
  countryLabel: string;
  icon: LucideIcon;
};

const sampleAccess: Record<RegistrationType, SampleAccessConfig> = {
  buyer: {
    label: 'Buyer sample access',
    title: 'Register to Access Free Sourcing Samples',
    subtitle: 'Preview sample RFQs, supplier discovery, and quote evaluation workflows before choosing a subscription plan.',
    organizationLabel: 'Organization name',
    categoryLabel: 'Primary sourcing category',
    categoryPlaceholder: 'IT services, facilities, logistics...',
    countryLabel: 'Country or region',
    icon: UsersRound,
  },
  supplier: {
    label: 'Supplier sample access',
    title: 'Register to Access Free Opportunity Samples',
    subtitle: 'Preview matched RFQ opportunities and quote preparation workflows before choosing a subscription plan.',
    organizationLabel: 'Company name',
    categoryLabel: 'Primary service category',
    categoryPlaceholder: 'IT services, manufacturing, logistics...',
    countryLabel: 'Countries served',
    icon: Store,
  },
};

const benefits = [
  {
    title: 'Free sample RFQs and opportunities',
    body: 'Explore how requirements, timelines, and categories are organized inside TheDigiHubs.',
    icon: FileSearch,
  },
  {
    title: 'Verified marketplace signals',
    body: 'Preview supplier and buyer activity by category, country, and fit.',
    icon: Globe2,
  },
  {
    title: 'Quote Evaluation previews',
    body: 'See how quotes are compared through pricing, delivery, risk, and supplier fit.',
    icon: ShieldCheck,
  },
  {
    title: 'Upgrade only when ready',
    body: 'Choose a subscription plan later and submit it for admin review.',
    icon: CheckCircle2,
  },
];

const emptyForm: RegistrationForm = {
  email: '',
  name: '',
  organizationName: '',
  country: '',
  category: '',
  countriesServed: '',
  phoneCode: '+1',
  phone: '',
  website: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const [selectedType, setSelectedType] = useState<RegistrationType>('buyer');
  const [form, setForm] = useState<RegistrationForm>(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const selected = sampleAccess[selectedType];
  const SelectedIcon = selected.icon;
  const switchType: RegistrationType = selectedType === 'buyer' ? 'supplier' : 'buyer';

  function updateField(name: keyof RegistrationForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          registrationType: selectedType,
          email: form.email,
          password: form.password,
          name: form.name,
          organizationName: form.organizationName,
          country: selectedType === 'buyer' ? form.country : '',
          category: form.category,
          countriesServed: selectedType === 'supplier' ? form.countriesServed : form.country,
          phone: [form.phoneCode, form.phone].filter(Boolean).join(' '),
          website: form.website,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = Array.isArray(payload?.message) ? payload.message.join(' ') : payload?.message;
        setError(message || 'Unable to complete sample access registration.');
        return;
      }

      await response.json();
      await refresh();
      router.replace('/samples');
    } catch {
      setError('Unable to complete sample access registration. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F8FC] text-[#0B1744]">
      <PublicHeader />

      <section className="mx-auto max-w-[1260px] px-6 py-7 lg:px-8">
        <div className="mb-5 text-xs font-bold text-slate-500">
          Home <span className="mx-2 text-slate-300">/</span> Free sample access
        </div>

        <Card className="overflow-hidden p-0">
          <div className="grid lg:grid-cols-[.51fr_.49fr]">
            <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-50 text-[#155EEF]">
                  <SelectedIcon size={23} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-[#155EEF]">{selected.label}</p>
                  <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] sm:text-3xl">{selected.title}</h1>
                  <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-600">{selected.subtitle}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3.5">
                <label className="block">
                  <span className="text-sm font-black">Full name *</span>
                  <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Please enter your name" className="mt-2 h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
                </label>
                <label className="block">
                  <span className="text-sm font-black">Business email *</span>
                  <input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="Enter business email" className="mt-2 h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
                </label>
                <label className="block">
                  <span className="text-sm font-black">{selected.countryLabel}</span>
                  <input value={selectedType === 'supplier' ? form.countriesServed : form.country} onChange={(event) => updateField(selectedType === 'supplier' ? 'countriesServed' : 'country', event.target.value)} placeholder={selectedType === 'supplier' ? 'United States, Canada, Ghana...' : 'United States'} className="mt-2 h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
                </label>
                <label className="block">
                  <span className="text-sm font-black">Mobile number</span>
                  <div className="mt-2 grid grid-cols-[92px_1fr] gap-2">
                    <input value={form.phoneCode} onChange={(event) => updateField('phoneCode', event.target.value)} placeholder="+1" className="h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-3 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
                    <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="Mobile number" className="h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
                  </div>
                </label>
                <label className="block">
                  <span className="text-sm font-black">{selected.organizationLabel} *</span>
                  <input required value={form.organizationName} onChange={(event) => updateField('organizationName', event.target.value)} placeholder="Enter organization name" className="mt-2 h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-black">{selected.categoryLabel}</span>
                  <input value={form.category} onChange={(event) => updateField('category', event.target.value)} placeholder={selected.categoryPlaceholder} className="mt-2 h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-black">Website URL</span>
                  <input type="url" value={form.website} onChange={(event) => updateField('website', event.target.value)} placeholder="https://www.example.com" className="mt-2 h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
                </label>
                <label className="block">
                  <span className="text-sm font-black">Password *</span>
                  <input required minLength={8} type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} autoComplete="new-password" className="mt-2 h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
                </label>
                <label className="block">
                  <span className="text-sm font-black">Confirm password *</span>
                  <input required minLength={8} type="password" value={form.confirmPassword} onChange={(event) => updateField('confirmPassword', event.target.value)} autoComplete="new-password" className="mt-2 h-11 w-full rounded-lg border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
                </label>
              </div>

              {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">{error}</p>}

              <button type="submit" disabled={loading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#155EEF] px-6 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(21,94,239,.16)] transition hover:bg-[#0f49c7] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Opening sample access' : 'Get Free Samples'} <ArrowRight size={16} />
              </button>

              <div className="mt-5 text-center text-sm font-bold text-slate-500">
                <p>
                  {selectedType === 'buyer' ? 'Need supplier sample access?' : 'Need buyer sample access?'}{' '}
                  <button type="button" onClick={() => { setError(''); setSelectedType(switchType); }} className="font-black text-[#155EEF]">
                    Switch here
                  </button>
                </p>
                <p className="mt-2">
                  Already have an account? <Link href="/login" className="font-black text-[#155EEF]">Log In</Link>
                </p>
              </div>
            </form>

            <aside className="relative overflow-hidden bg-[#061F46] p-6 text-white sm:p-8">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.75) 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
              <div className="relative flex h-full flex-col">
                <p className="text-sm font-black text-white">Start with <span className="text-[#FFCF4D]">free sample access</span> related to your sourcing needs.</p>
                <h2 className="mt-4 text-2xl font-black tracking-[-0.03em]">Explore TheDigiHubs before you subscribe.</h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-blue-100">
                  Get a guided preview of the marketplace experience, then move into a reviewed subscription plan when your organization is ready.
                </p>

                <div className="mt-7 space-y-0">
                  {benefits.map(({ title, body, icon: Icon }) => (
                    <div key={title} className="flex gap-3 border-t border-white/15 py-4 first:border-t-0 first:pt-0">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#FFCF4D]/15 text-[#FFCF4D]">
                        <Icon size={17} />
                      </div>
                      <div>
                        <p className="text-sm font-black">{title}</p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-blue-100">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto rounded-2xl border border-white/20 bg-white/10 p-4">
                  <p className="text-sm font-black text-[#FFCF4D]">Next step after samples</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-blue-100">
                    When your team is ready, choose a subscription plan and submit it for admin review.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </Card>
      </section>
    </main>
  );
}
