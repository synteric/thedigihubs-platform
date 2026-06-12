'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    setPending(false);
    setShowMessage(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      if (target.target && target.target !== '_self') return;
      if (target.hasAttribute('download')) return;

      const nextUrl = new URL(target.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;
      if (nextUrl.pathname === window.location.pathname && nextUrl.search === window.location.search && nextUrl.hash) return;
      if (nextUrl.href === window.location.href) return;

      setPending(true);
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  useEffect(() => {
    if (!pending) return;
    document.documentElement.dataset.navigationPending = 'true';
    const messageTimeout = window.setTimeout(() => setShowMessage(true), 220);
    const safetyTimeout = window.setTimeout(() => {
      setPending(false);
      setShowMessage(false);
    }, 6500);

    return () => {
      delete document.documentElement.dataset.navigationPending;
      window.clearTimeout(messageTimeout);
      window.clearTimeout(safetyTimeout);
    };
  }, [pending]);

  if (!pending) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-[#D8EAFF]" aria-hidden="true">
        <div className="tdh-navigation-progress h-full w-1/2 rounded-r-full bg-gradient-to-r from-[#155EEF] via-[#13B6D8] to-[#FFB000]" />
      </div>
      {showMessage && (
        <div className="pointer-events-none fixed left-1/2 top-4 z-[101] -translate-x-1/2 rounded-full border border-[#BFD7FF] bg-white/95 px-4 py-2 text-xs font-black text-[#155EEF] shadow-[0_12px_34px_rgba(16,33,63,.14)] backdrop-blur" role="status" aria-live="polite">
          Opening page...
        </div>
      )}
    </>
  );
}
