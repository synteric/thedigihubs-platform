'use client';

import Link from 'next/link';
import { ArrowRight, ChevronDown, Globe2, Search } from 'lucide-react';
import { Logo } from './brand';
import { PromoBanner } from './promo-banner';
import { SolutionsDropdown } from './solutions-dropdown';
import { Button } from './ui';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E7EEF9] bg-white/95 backdrop-blur">
      <PromoBanner />
      <div className="mx-auto flex h-24 max-w-[1540px] items-center gap-7 px-10">
        <Link href="/" aria-label="TheDigiHubs home">
          <Logo size="large" />
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
            <div className="flex h-12 w-52 items-center gap-2 rounded-full border border-[#DFE9F7] px-5 text-base">
              <span className="text-slate-400">Search...</span>
              <Search size={22} className="ml-auto text-[#0B1744]" />
            </div>
            <Globe2 size={24} />
            <Button className="px-6 py-3 text-sm">Why TheDigiHubs <ChevronDown size={16} /></Button>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#121D4D] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#0D1538]">
              Contact Us <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
