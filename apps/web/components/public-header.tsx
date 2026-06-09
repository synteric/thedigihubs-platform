'use client';

import Link from 'next/link';
import { ArrowRight, ChevronDown, Globe2, Search } from 'lucide-react';
import { Logo } from './brand';
import { PromoBanner } from './promo-banner';
import { SolutionsDropdown } from './solutions-dropdown';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E7EEF9] bg-white/95 backdrop-blur">
      <PromoBanner />
      <div className="mx-auto flex min-h-20 max-w-[1540px] flex-wrap items-center gap-4 px-4 py-3 sm:px-6 lg:h-24 lg:flex-nowrap lg:gap-7 lg:px-10 lg:py-0">
        <Link href="/" aria-label="TheDigiHubs home">
          <Logo className="sm:hidden" markOnly />
          <Logo className="hidden sm:flex lg:hidden" compact />
          <Logo className="hidden lg:flex" size="large" />
        </Link>
        <nav className="ml-auto hidden items-center gap-8 text-base font-extrabold text-[#0B1744] lg:flex">
          <SolutionsDropdown />
          <Link href="/platform">Platform</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/partners">Partners</Link>
        </nav>
        <div className="hidden flex-col items-end gap-2 lg:flex">
          <div className="flex items-center gap-5 text-sm font-black text-[#0B1744]">
            <Link href="/subscribe" className="transition hover:text-[#155EEF]">Subscribe</Link>
            <Link href="/login" className="transition hover:text-[#155EEF]">Log In</Link>
            <Link href="/register" className="rounded-full border border-[#BFD7FF] px-4 py-1.5 text-[#155EEF] transition hover:bg-[#EFF6FF]">Register</Link>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/marketplace" className="flex h-12 w-52 items-center gap-2 rounded-full border border-[#DFE9F7] px-5 text-base transition hover:border-[#BFD7FF] hover:bg-[#F8FBFF]" aria-label="Search supplier marketplace">
              <span className="text-slate-400">Search...</span>
              <Search size={22} className="ml-auto text-[#0B1744]" />
            </Link>
            <Globe2 size={24} />
            <Link href="/#why" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#155EEF] px-6 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(21,94,239,.18)] transition hover:bg-[#0f49c7]">
              Why TheDigiHubs <ChevronDown size={16} />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#121D4D] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#0D1538]">
              Contact Us <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <Link href="/subscribe" className="rounded-full border border-[#BFD7FF] px-3 py-2 text-xs font-black text-[#155EEF]">
            Subscribe
          </Link>
          <Link href="/login" className="rounded-full border border-[#DFE9F7] px-3 py-2 text-xs font-black text-[#0B1744]">
            Log In
          </Link>
          <Link href="/register" className="rounded-full bg-[#155EEF] px-3 py-2 text-xs font-black text-white">
            Register
          </Link>
        </div>
        <nav className="flex w-full flex-wrap items-center gap-3 pb-1 text-sm font-black text-[#0B1744] lg:hidden">
          <SolutionsDropdown compact />
          <Link href="/platform" className="whitespace-nowrap">Platform</Link>
          <Link href="/resources" className="whitespace-nowrap">Resources</Link>
          <Link href="/partners" className="whitespace-nowrap">Partners</Link>
          <Link href="/marketplace" className="whitespace-nowrap">Search</Link>
          <Link href="/contact" className="ml-auto whitespace-nowrap rounded-full bg-[#121D4D] px-4 py-2 text-white">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
