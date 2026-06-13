'use client';

import { useEffect, useRef, useState } from 'react';
import { Globe2, ChevronDown } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
];

export function LanguageSelector({ inMobileMenu }: { inMobileMenu?: boolean }) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const pathname = usePathname() || '/';
    const searchParams = useSearchParams();
    const router = useRouter();

    const selectedLanguage = languages.find((language) => language.code === searchParams?.get('lang')) ?? languages[0];

    useEffect(() => {
        if (!open) return undefined;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                panelRef.current &&
                buttonRef.current &&
                !panelRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const handleLanguageSelect = (code: string) => {
        if (!searchParams) return;

        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set('lang', code);

        const queryString = nextParams.toString();
        router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
        setOpen(false);
    };

    return (
        <div className={`${inMobileMenu ? 'block' : 'relative inline-block'}`}>
            <button
                type="button"
                ref={buttonRef}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-controls="language-selector-menu"
                className={`relative z-20 inline-flex items-center gap-2 rounded-full border border-[#DFE9F7] bg-white px-4 py-3 text-sm font-extrabold text-[#0B1744] transition hover:border-[#BFD7FF] hover:bg-[#F8FBFF] ${inMobileMenu ? 'w-full justify-between' : ''}`}
                onClick={() => setOpen((current) => !current)}
            >
                <Globe2 size={18} />
                <span className="hidden sm:inline">{selectedLanguage.label}</span>
                <ChevronDown size={16} className={`transition ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    id="language-selector-menu"
                    ref={panelRef}
                    className={`language-selector-panel ${inMobileMenu ? 'mt-3' : 'absolute right-0 top-full mt-2'} overflow-hidden rounded-3xl border border-[#DFE9F7] bg-white text-left shadow-[0_18px_45px_rgba(16,33,63,.12)] ${inMobileMenu ? '' : 'min-w-[160px]'}`}
                    role="menu"
                    aria-label="Select language"
                    onClick={(event) => event.stopPropagation()}
                >
                    {languages.map((language) => (
                        <button
                            key={language.code}
                            type="button"
                            className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-black text-[#0B1744] transition hover:bg-blue-50 ${selectedLanguage.code === language.code ? 'bg-blue-50' : ''}`}
                            role="menuitem"
                            onClick={() => handleLanguageSelect(language.code)}
                        >
                            {language.label}
                            {selectedLanguage.code === language.code ? <span className="text-[#155EEF]">✓</span> : null}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
