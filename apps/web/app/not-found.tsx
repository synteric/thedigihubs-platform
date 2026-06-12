import Link from 'next/link';
import { ArrowRight, Home, Search } from 'lucide-react';
import { PublicHeader } from '../components/public-header';
import { Logo } from '../components/brand';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F8FBFF] text-[#0B1744]">
      <PublicHeader />
      <section className="mx-auto grid max-w-[980px] place-items-center px-4 py-14 text-center sm:px-8 sm:py-20">
        <div className="rounded-[30px] border border-[#DFE9F7] bg-white p-6 shadow-[0_22px_60px_rgba(16,33,63,.08)] sm:p-10">
          <div className="mx-auto flex justify-center">
            <Logo compact />
          </div>
          <div className="mx-auto mt-8 grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-[#155EEF]">
            <Search size={30} />
          </div>
          <p className="mt-6 text-sm font-black uppercase tracking-[.16em] text-[#155EEF]">Page not found</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
            This page is not available.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm font-bold leading-7 text-slate-600">
            The link may have changed, or the page may require workspace access.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#155EEF] px-6 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(21,94,239,.18)]">
              Home <Home size={16} />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#BFD7FF] bg-white px-6 py-3 text-sm font-black text-[#155EEF]">
              Contact Support <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
