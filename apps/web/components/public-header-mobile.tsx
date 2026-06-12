'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Menu, Search, X } from 'lucide-react';
import { Logo } from './brand';
import { LanguageSelector } from './language-selector';
import { useLocale } from '../lib/useLocale';

export default function PublicHeaderMobile() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const closeMobile = () => setMobileOpen(false);
    const { t } = useLocale();

    return (
        <>
            <div className="ml-auto flex items-center gap-2 lg:hidden">
                <Link href="/subscribe" onClick={closeMobile} className="hidden rounded-full border border-[#BFD7FF] px-3 py-2 text-xs font-black text-[#155EEF] sm:inline-flex">
                    Subscribe
                </Link>
                <Link href="/login" onClick={closeMobile} className="hidden rounded-full border border-[#DFE9F7] px-3 py-2 text-xs font-black text-[#0B1744] sm:inline-flex">
                    Log In
                </Link>
                <Link href="/register" onClick={closeMobile} className="rounded-full bg-[#155EEF] px-4 py-2.5 text-xs font-black text-white shadow-[0_10px_24px_rgba(21,94,239,.18)]">
                    Register
                </Link>
                <button
                    aria-expanded={mobileOpen}
                    aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    className="grid h-10 w-10 place-items-center rounded-full border border-[#DFE9F7] bg-white text-[#0B1744] shadow-sm"
                    type="button"
                    onClick={() => setMobileOpen((current) => !current)}
                >
                    {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
            </div>

            {mobileOpen && (
                <div className="border-t border-[#E7EEF9] bg-white px-4 pb-4 pt-3 shadow-[0_18px_40px_rgba(16,33,63,.08)] sm:px-6 lg:hidden">
                    <div className="mx-auto max-w-[720px]">
                        <div className="grid grid-cols-3 gap-2">
                            <Link href="/subscribe" onClick={closeMobile} className="rounded-full border border-[#BFD7FF] px-3 py-2 text-center text-xs font-black text-[#155EEF]">
                                {t.subscribe}
                            </Link>
                            <Link href="/login" onClick={closeMobile} className="rounded-full border border-[#DFE9F7] px-3 py-2 text-center text-xs font-black text-[#0B1744]">
                                {t.login}
                            </Link>
                            <Link href="/contact" onClick={closeMobile} className="rounded-full bg-[#121D4D] px-3 py-2 text-center text-xs font-black text-white">
                                {t.contact}
                            </Link>
                        </div>
                        <div className="mt-4">
                            <LanguageSelector />
                        </div>
                        <div className="mt-4 grid gap-2 text-sm font-black text-[#0B1744]">
                            <p className="px-3 pt-2 text-[11px] uppercase tracking-[.18em] text-slate-400">Solutions</p>
                            <Link href="/solutions/buyers" onClick={closeMobile} className="rounded-xl px-3 py-2.5 hover:bg-blue-50">
                                {t.forBuyers}
                            </Link>
                            <Link href="/solutions/suppliers" onClick={closeMobile} className="rounded-xl px-3 py-2.5 hover:bg-blue-50">
                                {t.forSuppliers}
                            </Link>
                            <div className="my-1 border-t border-[#EEF3FA]" />
                            <Link href="/platform" onClick={closeMobile} className="rounded-xl px-3 py-2.5 hover:bg-blue-50">
                                {t.platform}
                            </Link>
                            <Link href="/resources" onClick={closeMobile} className="rounded-xl px-3 py-2.5 hover:bg-blue-50">
                                {t.resources}
                            </Link>
                            <Link href="/partners" onClick={closeMobile} className="rounded-xl px-3 py-2.5 hover:bg-blue-50">
                                {t.partners}
                            </Link>
                            <Link href="/marketplace" onClick={closeMobile} className="rounded-xl px-3 py-2.5 hover:bg-blue-50">
                                {t.searchMarketplace}
                            </Link>
                            <Link href="/#why" onClick={closeMobile} className="rounded-xl px-3 py-2.5 hover:bg-blue-50">
                                {t.whyTheDigiHubs}
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
