'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AlertTriangle, ArrowRight, RefreshCcw } from 'lucide-react';
import { Logo } from '../components/brand';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('TheDigiHubs route error', error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#F8FBFF] px-4 py-10 text-[#0B1744]">
      <section className="w-full max-w-[760px] rounded-[28px] border border-[#DFE9F7] bg-white p-6 text-center shadow-[0_22px_60px_rgba(16,33,63,.08)] sm:p-10">
        <div className="mx-auto flex justify-center">
          <Logo compact />
        </div>
        <div className="mx-auto mt-8 grid h-16 w-16 place-items-center rounded-full bg-orange-50 text-orange-600">
          <AlertTriangle size={30} />
        </div>
        <p className="mt-6 text-sm font-black uppercase tracking-[.16em] text-[#155EEF]">Something needs a refresh</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
          This page could not finish loading.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm font-bold leading-7 text-slate-600">
          Please try again. If it continues, contact TheDigiHubs support and include the page you were opening.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#155EEF] px-6 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(21,94,239,.18)]"
            onClick={reset}
            type="button"
          >
            Try Again <RefreshCcw size={16} />
          </button>
          <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#BFD7FF] bg-white px-6 py-3 text-sm font-black text-[#155EEF]">
            Contact Support <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
