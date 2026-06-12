'use client';

import type { ReactNode } from 'react';
import { SessionProvider } from '../lib/session';
import { NavigationFeedback } from './navigation-feedback';

export default function ClientShell({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <NavigationFeedback />
            {children}
        </SessionProvider>
    );
}
