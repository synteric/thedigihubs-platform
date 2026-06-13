'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiErrorMessage, apiFetch } from './api';

export type OrganizationType = 'BUYER' | 'SUPPLIER' | 'PLATFORM';
export type RoleKey =
  | 'PLATFORM_ADMIN'
  | 'PLATFORM_SUPPORT'
  | 'BUYER_OWNER'
  | 'BUYER_MANAGER'
  | 'BUYER_EVALUATOR'
  | 'SUPPLIER_OWNER'
  | 'SUPPLIER_MANAGER'
  | 'SUPPLIER_STAFF'
  | 'VIEWER';

export type SessionPayload = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  activeOrganization: {
    id: string;
    name: string;
    type: OrganizationType;
    status: string;
    plan?: string;
  };
  memberships: Array<{
    id: string;
    organization: {
      id: string;
      name: string;
      type: OrganizationType;
      status: string;
      plan?: string;
    };
    role: RoleKey;
    status: string;
    isDefault: boolean;
  }>;
  role: RoleKey;
  permissions: string[];
  plan?: string;
  features: string[];
};

type SessionContextValue = {
  session: SessionPayload | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<SessionPayload | null>;
  logout: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
  hasRole: (roles: RoleKey[]) => boolean;
  hasOrganizationType: (types: OrganizationType[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasFeature: (feature: string) => boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);
const sessionAwarePrefixes = ['/buyer', '/supplier', '/admin', '/rfq', '/samples', '/access-denied'];

function needsSessionBootstrap(pathname: string | null) {
  if (!pathname) return false;
  return sessionAwarePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedPathname, setCheckedPathname] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const shouldLoadSession = needsSessionBootstrap(pathname);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/auth/me', { method: 'GET' });
      if (!response.ok) {
        setSession(null);
        return null;
      }
      const payload = await response.json() as SessionPayload;
      setSession(payload);
      return payload;
    } catch {
      setSession(null);
      setError('Unable to load session');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!shouldLoadSession) {
      setLoading(false);
      setError(null);
      setCheckedPathname(pathname);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void refresh().finally(() => {
      if (!cancelled) setCheckedPathname(pathname);
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, refresh, shouldLoadSession]);

  const sessionLoading = shouldLoadSession ? loading || checkedPathname !== pathname : false;

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
    } finally {
      setSession(null);
      router.replace('/login');
    }
  }, [router]);

  const switchOrganization = useCallback(async (organizationId: string) => {
    const response = await apiFetch('/auth/switch-organization', {
      method: 'POST',
      body: JSON.stringify({ organizationId }),
    });
    if (!response.ok) {
      throw new Error(await apiErrorMessage(response, 'Unable to switch organization'));
    }
    const payload = await response.json() as SessionPayload;
    setSession(payload);
  }, []);

  const value = useMemo<SessionContextValue>(() => ({
    session,
    loading: sessionLoading,
    error,
    refresh,
    logout,
    switchOrganization,
    hasRole: (roles) => Boolean(session?.role && roles.includes(session.role)),
    hasOrganizationType: (types) => Boolean(session?.activeOrganization.type && types.includes(session.activeOrganization.type)),
    hasPermission: (permission) => Boolean(session?.permissions.includes(permission)),
    hasFeature: (feature) => Boolean(session?.features.includes(feature)),
  }), [error, logout, refresh, session, sessionLoading, switchOrganization]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return context;
}

export function useCurrentUser() {
  return useSession().session?.user || null;
}

export function useActiveOrganization() {
  return useSession().session?.activeOrganization || null;
}

export function usePermissions() {
  return useSession().session?.permissions || [];
}

export function dashboardFor(session: SessionPayload) {
  if (session.role === 'PLATFORM_ADMIN' || session.role === 'PLATFORM_SUPPORT' || session.activeOrganization.type === 'PLATFORM') return '/admin';
  if (session.activeOrganization.type === 'SUPPLIER') return '/supplier';
  return '/buyer';
}

export function formatRole(role: string) {
  return role.split('_').map((part) => part[0] + part.slice(1).toLowerCase()).join(' ');
}
