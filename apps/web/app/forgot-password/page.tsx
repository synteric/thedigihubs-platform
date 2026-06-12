'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { PublicHeader } from '../../components/public-header';
import { Card } from '../../components/ui';
import { apiFetch } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [devToken, setDevToken] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setDevToken('');

    try {
      const response = await apiFetch('/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      const payload = await response.json().catch(() => null);
      setMessage(payload?.message || 'If an active account exists, password reset instructions will be sent.');
      if (payload?.devToken) setDevToken(payload.devToken);
    } catch {
      setMessage('If an active account exists, password reset instructions will be sent.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FBFF] text-[#0B1744]">
      <PublicHeader />
      <section className="mx-auto grid max-w-[1080px] items-center gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[.9fr_.75fr] lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[.18em] text-[#155EEF]">Account recovery</p>
          <h1 className="mt-5 max-w-xl text-3xl font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl">Reset access to your workspace.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Enter your work email and TheDigiHubs will send a secure reset link when the account is active.
          </p>
        </div>

        <Card className="p-7">
          <form onSubmit={submit}>
            <h2 className="text-2xl font-black tracking-[-0.03em]">Forgot password</h2>
            <label className="mt-7 block text-sm font-black">Work email</label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#DFE9F7] bg-white px-4 py-3">
              <Mail size={18} className="text-[#155EEF]" />
              <input
                required
                type="email"
                className="w-full bg-transparent text-sm font-bold outline-none"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
            {message && <p className="mt-5 rounded-xl bg-blue-50 p-3 text-sm font-bold text-[#155EEF]">{message}</p>}
            {devToken && (
              <Link href={`/reset-password?token=${encodeURIComponent(devToken)}`} className="mt-3 block rounded-xl border border-blue-100 bg-white p-3 text-sm font-black text-[#155EEF]">
                Open local reset link
              </Link>
            )}
            <button disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#155EEF] px-6 py-3 text-sm font-black text-white disabled:opacity-60">
              {loading ? 'Sending reset link' : 'Send reset link'} <ArrowRight size={16} />
            </button>
            <p className="mt-5 text-center text-sm font-bold text-slate-500">
              Remembered it? <Link href="/login" className="font-black text-[#155EEF]">Log In</Link>
            </p>
          </form>
        </Card>
      </section>
    </main>
  );
}
