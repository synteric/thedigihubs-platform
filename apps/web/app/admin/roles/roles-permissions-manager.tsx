'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  RefreshCcw,
  Search,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { AppShell } from '../../../components/app-shell';
import { Card, Kpi, Pill } from '../../../components/ui';
import { apiFetch } from '../../../lib/api';
import { adminNav } from '../admin-nav';

type RoleKey =
  | 'PLATFORM_ADMIN'
  | 'PLATFORM_SUPPORT'
  | 'BUYER_OWNER'
  | 'BUYER_MANAGER'
  | 'BUYER_EVALUATOR'
  | 'SUPPLIER_OWNER'
  | 'SUPPLIER_MANAGER'
  | 'SUPPLIER_STAFF'
  | 'VIEWER';

type Domain = 'Platform' | 'Buyer' | 'Supplier' | 'General' | string;

type PermissionItem = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  domain: string;
  roles: Array<{
    id: string;
    key: RoleKey;
    name: string;
    domain: Domain;
  }>;
};

type RoleItem = {
  id: string;
  key: RoleKey;
  name: string;
  description: string | null;
  domain: Domain;
  createdAt: string;
  updatedAt: string;
  totalMemberships: number;
  membershipStats: {
    active: number;
    suspended: number;
    invited: number;
    total: number;
  };
  legacyUserStats: {
    active: number;
    suspended: number;
    invited: number;
    total: number;
  };
  permissions: Array<{
    id: string;
    key: string;
    label: string;
    description: string | null;
    domain: string;
  }>;
};

type MatrixRow = {
  key: string;
  label: string;
  domain: string;
  roles: Array<{
    key: RoleKey;
    enabled: boolean;
  }>;
};

type RolesResponse = {
  summary: {
    totalRoles: number;
    totalPermissions: number;
    activeMemberships: number;
    platformRoles: number;
    buyerRoles: number;
    supplierRoles: number;
  };
  roles: RoleItem[];
  permissions: PermissionItem[];
  matrix: MatrixRow[];
};

function numberText(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function readable(value?: string | null) {
  if (!value) return 'Not set';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .replace(/\bRfq\b/g, 'RFQ')
    .replace(/\bApi\b/g, 'API');
}

function domainTone(domain: Domain): 'blue' | 'green' | 'orange' | 'purple' | 'gray' {
  if (domain === 'Platform') return 'purple';
  if (domain === 'Buyer') return 'blue';
  if (domain === 'Supplier') return 'orange';
  if (domain === 'General') return 'gray';
  return 'green';
}

function permissionTone(domain: string): 'blue' | 'green' | 'orange' | 'purple' | 'gray' {
  if (domain === 'RFQs') return 'blue';
  if (domain === 'Quotes') return 'orange';
  if (domain === 'Users' || domain === 'Roles') return 'purple';
  if (domain === 'Dashboard') return 'green';
  return 'gray';
}

function RolesSidebarCard({ data }: { data: RolesResponse | null }) {
  return (
    <Card className="p-5">
      <div className="flex gap-3">
        <KeyRound className="text-[#155EEF]" />
        <div>
          <p className="font-black">Role Governance</p>
          <p className="text-xs text-slate-500">Review role coverage before editing access.</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm font-bold">
        <p>Roles <span className="float-right text-[#155EEF]">{numberText(data?.summary.totalRoles || 0)}</span></p>
        <p>Permissions <span className="float-right text-purple-600">{numberText(data?.summary.totalPermissions || 0)}</span></p>
        <p>Active users <span className="float-right text-emerald-600">{numberText(data?.summary.activeMemberships || 0)}</span></p>
      </div>
    </Card>
  );
}

export function RolesPermissionsManager() {
  const [data, setData] = useState<RolesResponse | null>(null);
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiFetch('/admin/roles', { method: 'GET' });
      if (!response.ok) {
        setMessage('Roles and permissions could not be loaded.');
        return;
      }
      setData((await response.json()) as RolesResponse);
    } catch {
      setMessage('Roles and permissions could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const domains = useMemo(() => {
    const values = new Set<string>();
    data?.roles.forEach((role) => values.add(role.domain));
    data?.permissions.forEach((permission) => values.add(permission.domain));
    return ['ALL', ...Array.from(values).sort()];
  }, [data]);

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.roles || []).filter((role) => {
      const matchesSearch = !q
        || role.name.toLowerCase().includes(q)
        || role.key.toLowerCase().includes(q)
        || role.permissions.some((permission) => permission.key.toLowerCase().includes(q) || permission.label.toLowerCase().includes(q));
      const matchesDomain = domain === 'ALL' || role.domain === domain || role.permissions.some((permission) => permission.domain === domain);
      return matchesSearch && matchesDomain;
    });
  }, [data, domain, search]);

  const filteredPermissions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.permissions || []).filter((permission) => {
      const matchesSearch = !q
        || permission.key.toLowerCase().includes(q)
        || permission.label.toLowerCase().includes(q)
        || Boolean(permission.description?.toLowerCase().includes(q));
      const matchesDomain = domain === 'ALL' || permission.domain === domain;
      return matchesSearch && matchesDomain;
    });
  }, [data, domain, search]);

  const filteredMatrix = useMemo(() => {
    const permissionKeys = new Set(filteredPermissions.map((permission) => permission.key));
    return (data?.matrix || []).filter((row) => permissionKeys.has(row.key));
  }, [data, filteredPermissions]);

  const totalRoles = data?.summary.totalRoles || 0;
  const totalPermissions = data?.summary.totalPermissions || 0;
  const activeMemberships = data?.summary.activeMemberships || 0;
  const platformRoles = data?.summary.platformRoles || 0;

  return (
    <AppShell
      nav={adminNav('Roles & Permissions')}
      search="Search roles, permissions, access areas, and governance coverage..."
      sidebarCard={<RolesSidebarCard data={data} />}
      requiredOrganizationTypes={['PLATFORM']}
      requiredRoles={['PLATFORM_ADMIN', 'PLATFORM_SUPPORT']}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-.03em]">Roles & Permissions</h1>
          <p className="mt-2 text-slate-600">Inspect platform, buyer, supplier, and general access rules across the system.</p>
        </div>
        <button onClick={loadRoles} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-[#155EEF] px-6 py-3 text-sm font-black text-white disabled:opacity-50">
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {message && <p className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-bold text-[#155EEF]">{message}</p>}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<KeyRound />} label="Configured Roles" value={numberText(totalRoles)} change="Role records in database" />
        <Kpi icon={<LockKeyhole />} label="Permissions" value={numberText(totalPermissions)} change="Access rules configured" tone="purple" />
        <Kpi icon={<UsersRound />} label="Active Memberships" value={numberText(activeMemberships)} change="Users assigned through workspaces" tone="green" />
        <Kpi icon={<ShieldCheck />} label="Platform Roles" value={numberText(platformRoles)} change="Admin and support access" tone="orange" />
      </div>

      <Card className="mt-5 p-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_240px]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search role, permission, or access area"
              className="h-12 w-full rounded-xl border border-[#DFE9F7] bg-white pl-11 pr-4 text-sm font-bold outline-none focus:border-[#155EEF]"
            />
          </label>
          <select value={domain} onChange={(event) => setDomain(event.target.value)} className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]">
            {domains.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All access areas' : item}</option>)}
          </select>
        </div>
      </Card>

      <div className="mt-5 rounded-2xl border border-[#DFE9F7] bg-[#F8FBFF] p-5">
        <p className="font-black text-[#0B1744]">Permission editing is intentionally locked for this pass.</p>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
          Role assignments can already be changed from Users. This page verifies the permission model before deeper role editing is introduced.
        </p>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        {loading && !data ? (
          <Card className="p-8 text-center font-bold text-slate-500 xl:col-span-3">Loading roles and permissions...</Card>
        ) : filteredRoles.map((role) => (
          <Card key={role.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black">{role.name}</h2>
                  <Pill tone={domainTone(role.domain)}>{role.domain}</Pill>
                </div>
                <p className="mt-1 text-xs font-bold text-slate-500">{readable(role.key)}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-[#155EEF]">{numberText(role.membershipStats.active)}</p>
                <p className="text-xs font-bold text-slate-500">active</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-[#DFE9F7] bg-[#F8FBFF] p-3 text-center text-xs font-bold text-slate-500">
              <p>Total <span className="block text-base font-black text-[#0B1744]">{numberText(role.membershipStats.total)}</span></p>
              <p>Invited <span className="block text-base font-black text-orange-600">{numberText(role.membershipStats.invited)}</span></p>
              <p>Suspended <span className="block text-base font-black text-red-600">{numberText(role.membershipStats.suspended)}</span></p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {role.permissions.map((permission) => (
                <Pill key={permission.key} tone={permissionTone(permission.domain)}>{permission.label}</Pill>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-[#DFE9F7] p-5">
            <h2 className="text-xl font-black">Permission Catalog</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">Each permission is shown with the roles that currently receive it.</p>
          </div>
          <div className="max-h-[620px] overflow-auto p-5">
            <div className="space-y-3">
              {filteredPermissions.map((permission) => (
                <div key={permission.id} className="rounded-2xl border border-[#DFE9F7] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-black">{permission.label}</p>
                      <p className="mt-1 font-mono text-xs font-bold text-slate-500">{permission.key}</p>
                    </div>
                    <Pill tone={permissionTone(permission.domain)}>{permission.domain}</Pill>
                  </div>
                  {permission.description && <p className="mt-3 text-sm font-bold leading-6 text-slate-500">{permission.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {permission.roles.map((role) => <Pill key={role.key} tone={domainTone(role.domain)}>{role.name}</Pill>)}
                  </div>
                </div>
              ))}
              {!loading && filteredPermissions.length === 0 && <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">No permissions match these filters.</p>}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-[#DFE9F7] p-5">
            <h2 className="text-xl font-black">Permission Matrix</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">Read-only map of permissions across roles.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-4">Permission</th>
                  {(data?.roles || []).map((role) => <th key={role.key} className="px-3 py-4 text-center">{role.name}</th>)}
                </tr>
              </thead>
              <tbody className="font-bold">
                {filteredMatrix.map((row) => (
                  <tr key={row.key} className="border-t border-[#DFE9F7]">
                    <td className="px-4 py-3">
                      <p className="font-black">{row.label}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">{row.key}</p>
                    </td>
                    {row.roles.map((role) => (
                      <td key={`${row.key}:${role.key}`} className="px-3 py-3 text-center">
                        {role.enabled ? (
                          <CheckCircle2 className="mx-auto text-emerald-600" size={18} />
                        ) : (
                          <span className="mx-auto block h-2 w-2 rounded-full bg-slate-200" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
