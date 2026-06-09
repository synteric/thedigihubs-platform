'use client';

import Link from 'next/link';
import { BriefcaseBusiness, ChevronDown, UsersRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const solutionLinks = [
  { label: 'For Buyers', href: '/solutions/buyers', icon: BriefcaseBusiness },
  { label: 'For Suppliers', href: '/solutions/suppliers', icon: UsersRound },
];

export function SolutionsDropdown({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={`inline-flex items-center gap-1 font-extrabold text-[#0B1744] ${compact ? 'text-text' : ''}`}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        Solutions <ChevronDown className={`transition ${open ? 'rotate-180' : ''}`} size={15} strokeWidth={2.5} />
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-50 w-44 rounded-lg border border-[#DFE9F7] bg-white p-2 text-[#0B1744] shadow-[0_18px_45px_rgba(16,33,63,.12)]" role="menu">
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
      )}
    </div>
  );
}
