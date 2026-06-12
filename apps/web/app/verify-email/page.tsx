'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { PublicHeader } from '../../components/public-header';
import { Card } from '../../components/ui';
import { apiFetch } from '../../lib/api';

export default function VerifyEmailPage() {
  const [state, setState] = useState<'checking' | 'verified' | 'error'>('checking');
  const [message, setMessage] = useState('Checking your verification link...');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token') || '';
    if (!token) {
      setState('error');
      setMessage('Verification link is missing or invalid.');
      return;
    }

    async function verify() {
      try {
        const response = await apiFetch('/auth/email-verification/confirm', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          setState('error');
          setMessage(payload?.message || 'Verification link is invalid or expired.');
          return;
        }
        setState('verified');
        setMessage(payload?.message || 'Email address verified.');
      } catch {
        setState('error');
        setMessage('Unable to verify this email address right now.');
      }
    }

    void verify();
  }, []);

  const Icon = state === 'verified' ? CheckCircle2 : state === 'error' ? XCircle : ShieldCheck;

  return (
    <main className="min-h-screen bg-[#F8FBFF] text-[#0B1744]">
      <PublicHeader />
      <section className="mx-auto flex max-w-[820px] items-center px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <Card className="w-full p-8 text-center">
          <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${state === 'verified' ? 'bg-emerald-50 text-emerald-600' : state === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-[#155EEF]'}`}>
            <Icon size={30} />
          </div>
          <p className="mt-6 text-sm font-black uppercase tracking-[.18em] text-[#155EEF]">Email verification</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.03em]">{state === 'verified' ? 'Your email is verified.' : state === 'error' ? 'Verification needs attention.' : 'Verifying your email.'}</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm font-bold leading-7 text-slate-600">{message}</p>
          <div className="mt-7 flex justify-center gap-3">
            <Link href="/login" className="rounded-xl bg-[#155EEF] px-5 py-3 text-sm font-black text-white">Log In</Link>
            <Link href="/contact" className="rounded-xl border border-[#DFE9F7] bg-white px-5 py-3 text-sm font-black text-[#155EEF]">Contact Support</Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
