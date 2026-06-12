'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Mail, MessageSquareText, ShieldCheck } from 'lucide-react';
import { PublicHeader } from '../../components/public-header';
import { Card } from '../../components/ui';
import { apiFetch } from '../../lib/api';

const initialForm = {
  name: '',
  email: '',
  organization: '',
  phone: '',
  subject: '',
  message: '',
};

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setReference('');
    try {
      const response = await apiFetch('/contact', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        setMessage('Your message could not be submitted. Please check the form and try again.');
        return;
      }

      const payload = (await response.json()) as { reference: string; supportEmail: string };
      setReference(payload.reference);
      setForm(initialForm);
      setMessage(`Your message has been sent to ${payload.supportEmail}.`);
    } catch {
      setMessage('Your message could not be submitted. Please try again shortly.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FBFF] text-[#0B1744]">
      <PublicHeader />

      <section className="px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
        <div className="mx-auto grid max-w-[1240px] gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div className="pt-6">
            <p className="text-xs font-black uppercase tracking-[.22em] text-[#155EEF]">Contact TheDigiHubs</p>
            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight tracking-[-.04em] text-[#0B1744] sm:text-5xl">
              Speak with the team about your procurement platform needs.
            </h1>
            <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-slate-600">
              Send a question, subscription request, partnership note, or support issue. Your message goes directly to the TheDigiHubs support inbox for review.
            </p>

            <div className="mt-8 space-y-4">
              {[
                ['Support inbox', 'support@thedigihubs.com', <Mail key="mail" size={20} />],
                ['Admin review', 'Every submission is recorded for follow-up', <ShieldCheck key="shield" size={20} />],
                ['Response context', 'Include your organization and request details', <MessageSquareText key="message" size={20} />],
              ].map(([title, body, icon]) => (
                <div key={title as string} className="flex gap-4 rounded-2xl border border-[#DFE9F7] bg-white p-4 shadow-[0_12px_34px_rgba(16,33,63,.05)]">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 text-[#155EEF]">{icon}</div>
                  <div>
                    <p className="font-black">{title}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-[#DFE9F7] bg-white p-6">
              <p className="text-xs font-black uppercase tracking-[.2em] text-[#155EEF]">Send a message</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-.03em] sm:text-3xl">Contact form</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">All contact form information routes to support@thedigihubs.com.</p>
            </div>

            <form onSubmit={submitContact} className="grid gap-4 p-6">
              {message && (
                <p className={`rounded-2xl px-5 py-3 text-sm font-bold ${reference ? 'border border-emerald-100 bg-emerald-50 text-emerald-700' : 'border border-red-100 bg-red-50 text-red-700'}`}>
                  {reference && <CheckCircle2 className="mr-2 inline" size={16} />}
                  {message} {reference ? `Reference: ${reference}` : ''}
                </p>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="text-sm font-black">Full name *</span>
                  <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Enter your name" className="mt-2 h-12 w-full rounded-xl border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
                </label>
                <label>
                  <span className="text-sm font-black">Business email *</span>
                  <input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="name@company.com" className="mt-2 h-12 w-full rounded-xl border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="text-sm font-black">Organization</span>
                  <input value={form.organization} onChange={(event) => updateField('organization', event.target.value)} placeholder="Company or institution" className="mt-2 h-12 w-full rounded-xl border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
                </label>
                <label>
                  <span className="text-sm font-black">Phone</span>
                  <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="+1 555 000 0000" className="mt-2 h-12 w-full rounded-xl border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
                </label>
              </div>

              <label>
                <span className="text-sm font-black">Subject</span>
                <input value={form.subject} onChange={(event) => updateField('subject', event.target.value)} placeholder="What can we help with?" className="mt-2 h-12 w-full rounded-xl border border-[#DCE6F3] bg-[#FAFCFF] px-4 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
              </label>

              <label>
                <span className="text-sm font-black">Message *</span>
                <textarea required value={form.message} onChange={(event) => updateField('message', event.target.value)} placeholder="Share the details your team wants us to review." rows={7} className="mt-2 w-full resize-none rounded-xl border border-[#DCE6F3] bg-[#FAFCFF] px-4 py-3 text-sm font-bold outline-none transition placeholder:text-slate-400 focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100" />
              </label>

              <button disabled={submitting} className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#155EEF] px-6 text-sm font-black text-white shadow-[0_14px_30px_rgba(21,94,239,.18)] transition hover:bg-[#0f49c7] disabled:opacity-60">
                {submitting ? 'Sending message...' : 'Send Message'} <ArrowRight size={17} />
              </button>

              <p className="text-center text-xs font-semibold text-slate-500">
                Prefer to start with access? <Link href="/register" className="font-black text-[#155EEF]">Register for free samples</Link>
              </p>
            </form>
          </Card>
        </div>
      </section>
    </main>
  );
}
