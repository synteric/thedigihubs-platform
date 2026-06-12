'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { PublicHeader } from '../../components/public-header';
import { Card } from '../../components/ui';
import { apiFetch } from '../../lib/api';

function strongPassword(value: string) {
  return value.length >= 10 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value);
}

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') || '');
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Reset link is missing or invalid.');
      return;
    }
    if (!strongPassword(password)) {
      setError('Password must include at least 10 characters, uppercase, lowercase, number, and symbol.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch('/auth/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.message || 'Unable to reset password.');
        return;
      }
      setMessage(payload?.message || 'Password updated. Please log in again.');
      setPassword('');
      setConfirmPassword('');
    } catch {
      setError('Unable to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FBFF] text-[#0B1744]">
      <PublicHeader />
      <section className="mx-auto grid max-w-[1080px] items-center gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[.9fr_.75fr] lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[.18em] text-[#155EEF]">Secure reset</p>
          <h1 className="mt-5 max-w-xl text-3xl font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl">Create a new password.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Use a strong password to protect your buyer, supplier, or admin workspace.
          </p>
        </div>

        <Card className="p-7">
          <form onSubmit={submit}>
            <h2 className="text-2xl font-black tracking-[-0.03em]">Reset password</h2>
            <label className="mt-7 block text-sm font-black">New password</label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#DFE9F7] bg-white px-4 py-3">
              <Lock size={18} className="text-[#155EEF]" />
              <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-transparent text-sm font-bold outline-none" autoComplete="new-password" />
            </div>
            <label className="mt-5 block text-sm font-black">Confirm password</label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#DFE9F7] bg-white px-4 py-3">
              <Lock size={18} className="text-[#155EEF]" />
              <input required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full bg-transparent text-sm font-bold outline-none" autoComplete="new-password" />
            </div>
            {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">{error}</p>}
            {message && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p>}
            <button disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#155EEF] px-6 py-3 text-sm font-black text-white disabled:opacity-60">
              {loading ? 'Updating password' : 'Update password'} <ArrowRight size={16} />
            </button>
            <p className="mt-5 text-center text-sm font-bold text-slate-500">
              Ready to continue? <Link href="/login" className="font-black text-[#155EEF]">Log In</Link>
            </p>
          </form>
        </Card>
      </section>
    </main>
  );
}
