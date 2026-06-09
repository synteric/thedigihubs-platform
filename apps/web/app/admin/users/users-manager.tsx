'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Search, ShieldCheck, UserCheck, UserRoundCog, UsersRound } from 'lucide-react';
import { AppShell } from '../../../components/app-shell';
import { Card, Kpi, Pill } from '../../../components/ui';
import { apiFetch } from '../../../lib/api';
import { adminNav } from '../admin-nav';

type OrganizationType = 'BUYER' | 'SUPPLIER' | 'PLATFORM';
type OrganizationStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'INVITED';
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
type PlanKey = 'STARTER' | 'GROWTH' | 'PROFESSIONAL' | 'ENTERPRISE';

type RoleOption = {
  id: string;
  key: RoleKey;
  name: string;
  permissions: string[];
};

type UserItem = {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  legacyRole: RoleKey;
  sessions: number;
  createdRfqs: number;
  createdAt: string;
  updatedAt: string;
  primaryMembership: null | {
    id: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'INVITED';
    isDefault: boolean;
    role: {
      key: RoleKey;
      name: string;
      permissions: string[];
    };
    organization: {
      id: string;
      name: string;
      type: OrganizationType;
      status: OrganizationStatus;
      plan: null | {
        key: PlanKey;
        name: string;
        features: string[];
      };
    };
  };
};

type UsersResponse = {
  total: number;
  summary: {
    active: number;
    suspended: number;
    invited: number;
  };
  roles: RoleOption[];
  users: UserItem[];
};

const userStatuses: Array<'ALL' | UserStatus> = ['ALL', 'ACTIVE', 'INVITED', 'SUSPENDED'];
const organizationTypes: Array<'ALL' | OrganizationType> = ['ALL', 'BUYER', 'SUPPLIER', 'PLATFORM'];

function numberText(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function readable(value?: string | null) {
  if (!value) return 'Not assigned';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function statusTone(status: UserStatus | OrganizationStatus): 'green' | 'orange' | 'red' {
  if (status === 'ACTIVE') return 'green';
  if (status === 'SUSPENDED') return 'red';
  return 'orange';
}

function typeTone(type?: OrganizationType): 'blue' | 'orange' | 'purple' | 'gray' {
  if (type === 'BUYER') return 'blue';
  if (type === 'SUPPLIER') return 'orange';
  if (type === 'PLATFORM') return 'purple';
  return 'gray';
}

function roleAllowedForOrganization(role: RoleKey, organizationType?: OrganizationType) {
  if (role === 'VIEWER') return true;
  if (organizationType === 'PLATFORM') return role === 'PLATFORM_ADMIN' || role === 'PLATFORM_SUPPORT';
  if (organizationType === 'BUYER') return role === 'BUYER_OWNER' || role === 'BUYER_MANAGER' || role === 'BUYER_EVALUATOR';
  if (organizationType === 'SUPPLIER') return role === 'SUPPLIER_OWNER' || role === 'SUPPLIER_MANAGER' || role === 'SUPPLIER_STAFF';
  return false;
}

function buildQuery(filters: {
  search: string;
  status: 'ALL' | UserStatus;
  role: 'ALL' | RoleKey;
  organizationType: 'ALL' | OrganizationType;
}) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.status !== 'ALL') params.set('status', filters.status);
  if (filters.role !== 'ALL') params.set('role', filters.role);
  if (filters.organizationType !== 'ALL') params.set('organizationType', filters.organizationType);
  const query = params.toString();
  return query ? `/admin/users?${query}` : '/admin/users';
}

function UsersGovernanceCard({ active, suspended }: { active: number; suspended: number }) {
  return (
    <Card className="p-5">
      <div className="flex gap-3">
        <UserRoundCog className="text-[#155EEF]" />
        <div>
          <p className="font-black">User Governance</p>
          <p className="text-xs text-slate-500">Role changes are recorded in audit logs.</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm font-bold">
        <p>Active <span className="float-right text-emerald-600">{numberText(active)}</span></p>
        <p>Suspended <span className="float-right text-red-600">{numberText(suspended)}</span></p>
      </div>
    </Card>
  );
}

export function UsersManager() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | UserStatus>('ALL');
  const [role, setRole] = useState<'ALL' | RoleKey>('ALL');
  const [organizationType, setOrganizationType] = useState<'ALL' | OrganizationType>('ALL');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [updating, setUpdating] = useState('');

  const filters = useMemo(() => ({ search, status, role, organizationType }), [search, status, role, organizationType]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiFetch(buildQuery(filters), { method: 'GET' });
      if (!response.ok) {
        setMessage('Users could not be loaded.');
        return;
      }
      setData((await response.json()) as UsersResponse);
    } catch {
      setMessage('Users could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function replaceUser(updated: UserItem) {
    setData((current) => current ? {
      ...current,
      users: current.users.map((user) => user.id === updated.id ? updated : user),
    } : current);
  }

  async function updateStatus(user: UserItem, nextStatus: UserStatus) {
    if (user.status === nextStatus) return;
    setUpdating(`${user.id}:status`);
    setMessage('');
    try {
      const response = await apiFetch(`/admin/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        setMessage('User status could not be updated.');
        return;
      }
      replaceUser((await response.json()) as UserItem);
      await loadUsers();
      setMessage(`${user.name} status updated to ${readable(nextStatus)}.`);
    } catch {
      setMessage('User status could not be updated.');
    } finally {
      setUpdating('');
    }
  }

  async function updateRole(user: UserItem, nextRole: RoleKey) {
    if (!user.primaryMembership || user.primaryMembership.role.key === nextRole) return;
    setUpdating(`${user.id}:role`);
    setMessage('');
    try {
      const response = await apiFetch(`/admin/users/${user.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({
          membershipId: user.primaryMembership.id,
          roleKey: nextRole,
        }),
      });
      if (!response.ok) {
        setMessage('User role could not be updated.');
        return;
      }
      replaceUser((await response.json()) as UserItem);
      await loadUsers();
      setMessage(`${user.name} role updated to ${readable(nextRole)}.`);
    } catch {
      setMessage('User role could not be updated.');
    } finally {
      setUpdating('');
    }
  }

  const roles = data?.roles || [];
  const total = data?.total || 0;
  const active = data?.summary.active || 0;
  const invited = data?.summary.invited || 0;
  const suspended = data?.summary.suspended || 0;

  return (
    <AppShell
      nav={adminNav('Users')}
      search="Search users, organizations, plans, roles, or permissions..."
      sidebarCard={<UsersGovernanceCard active={active} suspended={suspended} />}
      requiredOrganizationTypes={['PLATFORM']}
      requiredRoles={['PLATFORM_ADMIN', 'PLATFORM_SUPPORT']}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-.03em]">Users & Roles</h1>
          <p className="mt-2 text-slate-600">Manage user status, workspace roles, and access governance.</p>
        </div>
        <button onClick={loadUsers} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-[#155EEF] px-6 py-3 text-sm font-black text-white disabled:opacity-50">
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {message && <p className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-bold text-[#155EEF]">{message}</p>}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<UsersRound />} label="Matching Users" value={numberText(total)} change="Current filtered result" />
        <Kpi icon={<UserCheck />} label="Active Users" value={numberText(active)} change="Can access assigned workspaces" tone="green" />
        <Kpi icon={<ShieldCheck />} label="Invited Users" value={numberText(invited)} change="Awaiting activation" tone="orange" />
        <Kpi icon={<UserRoundCog />} label="Suspended Users" value={numberText(suspended)} change="Access restricted" tone="purple" />
      </div>

      <Card className="mt-5 p-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_180px_220px_210px]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by user, email, or organization"
              className="h-12 w-full rounded-xl border border-[#DFE9F7] bg-white pl-11 pr-4 text-sm font-bold outline-none focus:border-[#155EEF]"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value as 'ALL' | UserStatus)} className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]">
            {userStatuses.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All statuses' : readable(item)}</option>)}
          </select>
          <select value={organizationType} onChange={(event) => setOrganizationType(event.target.value as 'ALL' | OrganizationType)} className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]">
            {organizationTypes.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All workspace types' : readable(item)}</option>)}
          </select>
          <select value={role} onChange={(event) => setRole(event.target.value as 'ALL' | RoleKey)} className="h-12 rounded-xl border border-[#DFE9F7] bg-white px-4 text-sm font-bold outline-none focus:border-[#155EEF]">
            <option value="ALL">All roles</option>
            {roles.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}
          </select>
        </div>
      </Card>

      <Card className="mt-5 overflow-hidden p-0">
        <div className="border-b border-[#DFE9F7] p-5">
          <h2 className="text-xl font-black">User Access Table</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">Status and role changes apply immediately and are recorded in audit logs.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[.12em] text-slate-500">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Workspace</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Plan</th>
                <th className="px-5 py-4">Sessions</th>
                <th className="px-5 py-4">RFQs</th>
              </tr>
            </thead>
            <tbody className="font-bold">
              {loading && !data ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">Loading users...</td>
                </tr>
              ) : data?.users.length ? data.users.map((user) => {
                const membership = user.primaryMembership;
                const compatibleRoles = roles.filter((item) => roleAllowedForOrganization(item.key, membership?.organization.type));
                return (
                  <tr key={user.id} className="border-t border-[#DFE9F7] align-top">
                    <td className="px-5 py-4">
                      <p className="font-black">{user.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      {membership ? (
                        <>
                          <p className="font-black">{membership.organization.name}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Pill tone={typeTone(membership.organization.type)}>{readable(membership.organization.type)}</Pill>
                            <Pill tone={statusTone(membership.organization.status)}>{readable(membership.organization.status)}</Pill>
                          </div>
                        </>
                      ) : (
                        <Pill tone="gray">No workspace</Pill>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={membership?.role.key || ''}
                        disabled={!membership || updating === `${user.id}:role`}
                        onChange={(event) => updateRole(user, event.target.value as RoleKey)}
                        className="h-11 w-52 rounded-xl border border-[#DFE9F7] bg-white px-3 text-sm font-black outline-none focus:border-[#155EEF] disabled:opacity-60"
                      >
                        <option value="" disabled>Select role</option>
                        {compatibleRoles.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}
                      </select>
                      <p className="mt-2 text-xs font-bold text-slate-500">{membership?.role.permissions.length || 0} permissions</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-2">
                        <Pill tone={statusTone(user.status)}>{readable(user.status)}</Pill>
                        <select
                          value={user.status}
                          disabled={updating === `${user.id}:status`}
                          onChange={(event) => updateStatus(user, event.target.value as UserStatus)}
                          className="h-10 w-40 rounded-xl border border-[#DFE9F7] bg-white px-3 text-xs font-black outline-none focus:border-[#155EEF] disabled:opacity-60"
                        >
                          {userStatuses.filter((item) => item !== 'ALL').map((item) => <option key={item} value={item}>{readable(item)}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-5 py-4">{readable(membership?.organization.plan?.key)}</td>
                    <td className="px-5 py-4">{numberText(user.sessions)}</td>
                    <td className="px-5 py-4">{numberText(user.createdRfqs)}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">No users match these filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
