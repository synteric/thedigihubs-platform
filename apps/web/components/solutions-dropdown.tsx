'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BriefcaseBusiness, ChevronDown, UsersRound } from 'lucide-react';

const solutionLinks = [
  { label: 'For Buyers', href: '/solutions/buyers', icon: BriefcaseBusiness },
  { label: 'For Suppliers', href: '/solutions/suppliers', icon: UsersRound },
];

export function SolutionsDropdown({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

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

  return (
    <div className="relative">
      <button
        type="button"
        ref={buttonRef}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-1 font-extrabold text-[#0B1744] cursor-pointer ${compact ? 'text-text' : ''}`}
        onClick={() => setOpen((current) => !current)}
      >
        Solutions
        <ChevronDown className={`transition ${open ? 'rotate-180' : ''}`} size={15} strokeWidth={2.5} />
      </button>
      <div
        ref={panelRef}
        className={`dropdown-panel absolute left-0 top-full mt-2 z-50 w-44 rounded-lg border border-[#DFE9F7] bg-white p-2 text-[#0B1744] shadow-[0_18px_45px_rgba(16,33,63,.12)] ${open ? 'block' : 'hidden'}`}
        role="menu"
        aria-label="Solutions"
      >
        {solutionLinks.map(({ href, icon: Icon, label }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-black hover:bg-blue-50"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Icon size={15} className="text-[#155EEF]" strokeWidth={2.4} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
