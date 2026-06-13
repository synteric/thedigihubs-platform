"use client";

import Link from 'next/link';
import { ArrowRight, ChevronDown, Menu, Search } from 'lucide-react';
import { Logo } from './brand';
import { PromoBanner } from './promo-banner';
import { SolutionsDropdown } from './solutions-dropdown';
import { LanguageSelector } from './language-selector';
import PublicHeaderMobile from './public-header-mobile';
import { useLocale } from '../lib/useLocale';

export function PublicHeader() {
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-[#E7EEF9] bg-white/95 backdrop-blur">
      <PromoBanner />
      <div className="mx-auto flex min-h-[72px] max-w-[1540px] items-center gap-3 px-4 py-3 sm:px-6 lg:h-24 lg:gap-7 lg:px-10 lg:py-0">
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
            <Link href="/subscribe" className="transition hover:text-[#155EEF]">{t.subscribe}</Link>
            <Link href="/login" className="transition hover:text-[#155EEF]">{t.login}</Link>
            <Link href="/register" className="rounded-full border border-[#BFD7FF] px-4 py-1.5 text-[#155EEF] transition hover:bg-[#EFF6FF]">{t.register}</Link>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/marketplace" className="flex h-12 w-52 items-center gap-2 rounded-full border border-[#DFE9F7] px-5 text-base transition hover:border-[#BFD7FF] hover:bg-[#F8FBFF]" aria-label="Search supplier marketplace">
              <span className="text-slate-400">{t.searchPlaceholder}</span>
              <Search size={22} className="ml-auto text-[#0B1744]" />
            </Link>
            <LanguageSelector />
            <Link href="/#why" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#155EEF] px-6 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(21,94,239,.18)] transition hover:bg-[#0f49c7]">
              {t.whyTheDigiHubs} <ChevronDown size={16} />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#121D4D] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#0D1538]">
              {t.contactUs} <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div className="ml-auto lg:hidden">
          <PublicHeaderMobile />
        </div>
      </div>
    </header>
  );
}
