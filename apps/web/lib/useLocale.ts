'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getLocaleFromSearchParams, translations } from './language';

export function useLocale() {
    const searchParams = useSearchParams();
    const locale = useMemo(() => getLocaleFromSearchParams(searchParams), [searchParams]);
    return {
        locale,
        t: translations[locale],
    };
}
