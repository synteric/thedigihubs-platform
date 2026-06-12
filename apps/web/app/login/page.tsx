'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { PublicHeader } from '../../components/public-header';
import { Button, Card } from '../../components/ui';
import { apiFetch } from '../../lib/api';
import { dashboardFor, useSession } from '../../lib/session';
import type { SessionPayload } from '../../lib/session';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setError('Invalid email or password.');
        return;
      }

      const session = await response.json() as SessionPayload;
      await refresh();
      const nextPath = new URLSearchParams(window.location.search).get('next');
      router.replace(nextPath || dashboardFor(session));
    } catch {
      setError('Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FBFF] text-[#0B1744]">
      <PublicHeader />

      <section className="mx-auto grid max-w-[1180px] items-center gap-10 px-4 py-10 sm:px-8 sm:py-16 lg:grid-cols-[.95fr_.85fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[.18em] text-[#155EEF]">Secure workspace access</p>
          <h1 className="mt-5 max-w-xl text-3xl font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl">
            Sign in to your TheDigiHubs workspace.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Access buyer and supplier workspaces with organization-scoped permissions.
          </p>
          <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-3">
            {['Tenant scoped', 'Role based', 'Plan aware'].map((item) => (
              <div key={item} className="rounded-2xl border border-[#DFE9F7] bg-white p-4 text-sm font-black shadow-sm">{item}</div>
            ))}
          </div>
        </div>

        <Card className="p-5 sm:p-7">
          <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-black tracking-[-0.03em]">Sign in</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Enter your workspace credentials to continue.</p>

            <label className="mt-7 block text-sm font-black">Email</label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#DFE9F7] bg-white px-4 py-3">
              <Mail size={18} className="text-[#155EEF]" />
              <input
                className="w-full bg-transparent text-sm font-bold outline-none"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>

            <label className="mt-5 block text-sm font-black">Password</label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#DFE9F7] bg-white px-4 py-3">
              <Lock size={18} className="text-[#155EEF]" />
              <input
                className="w-full bg-transparent text-sm font-bold outline-none"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-sm font-bold">
              <span className="text-red-600">{error}</span>
              <Link href="/forgot-password" className="text-[#155EEF]">Forgot password?</Link>
            </div>

            <Button className="mt-7 w-full" type="submit" disabled={loading}>
              {loading ? 'Signing in' : 'Sign in'} <ArrowRight size={16} />
            </Button>
          </form>
        </Card>
      </section>
    </main>
  );
}
