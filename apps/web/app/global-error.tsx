'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Logo } from '../components/brand';
import './globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('TheDigiHubs global error', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center bg-[#F8FBFF] px-4 py-10 text-[#0B1744]">
          <section className="w-full max-w-[720px] rounded-[28px] border border-[#DFE9F7] bg-white p-6 text-center shadow-[0_22px_60px_rgba(16,33,63,.08)] sm:p-10">
            <div className="mx-auto flex justify-center">
              <Logo compact />
            </div>
            <div className="mx-auto mt-8 grid h-16 w-16 place-items-center rounded-full bg-orange-50 text-orange-600">
              <AlertTriangle size={30} />
            </div>
            <h1 className="mt-6 text-3xl font-black tracking-[-0.04em] sm:text-4xl">TheDigiHubs needs to reload.</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm font-bold leading-7 text-slate-600">
              The workspace hit an unexpected issue. Reload the page to continue.
            </p>
            <button
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[#155EEF] px-6 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(21,94,239,.18)]"
              onClick={reset}
              type="button"
            >
              Reload Workspace <RefreshCcw size={16} />
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
