'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Bell, Building2, ChevronDown, ChevronsLeft, HelpCircle, LogOut, Mail, Search, Settings, User } from 'lucide-react';
import { Logo } from './brand';
import { formatRole, useSession } from '../lib/session';
import type { OrganizationType, RoleKey } from '../lib/session';

export type NavItem = { label: string; icon: React.ReactNode; active?: boolean; href?: string };

export function AccountDropdown({ name, role, onLogout }: { name: string; role: string; onLogout: () => void }) {
  const initials = name.split(' ').map((v) => v[0]).join('').slice(0, 2);
  return (
    <div className="absolute right-0 top-14 z-30 w-72 rounded-[20px] border border-[#DFE9F7] bg-white p-4 shadow-[0_18px_50px_rgba(16,33,63,.14)]">
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-[#155EEF] text-sm font-black text-white">{initials}</div>
        <div>
          <p className="font-black text-[#0B1744]">{name}</p>
          <p className="text-xs font-semibold text-slate-500">{role}</p>
        </div>
      </div>
      {[
        ['Profile', 'View and edit your profile', <User size={18} key="i" />],
        ['Settings', 'Account and preferences', <Settings size={18} key="i" />],
        ['Company Profile', role.includes('Admin') ? 'Manage platform details' : 'Manage company details', <Building2 size={18} key="i" />],
        ['Notifications', 'Manage notification settings', <Bell size={18} key="i" />],
        ['Help Center', 'Get help and support', <HelpCircle size={18} key="i" />],
      ].map(([title, desc, icon]) => (
        <div key={title as string} className="flex gap-3 rounded-xl px-2 py-3 text-[#0B1744] hover:bg-blue-50">
          <div className="mt-0.5 text-[#155EEF]">{icon}</div>
          <div>
            <p className="text-sm font-extrabold">{title}</p>
            <p className="text-xs text-slate-500">{desc}</p>
          </div>
        </div>
      ))}
      <div className="my-2 border-t border-[#DFE9F7]" />
      <button className="flex w-full gap-3 rounded-xl px-2 py-3 text-left text-red-600 hover:bg-red-50" onClick={onLogout}>
        <LogOut size={18}/><p className="text-sm font-extrabold">Sign out</p>
      </button>
    </div>
  );
}

export function AppShell({
  children,
  nav,
  active,
  name = 'Loading User',
  role = 'Workspace',
  search = 'Search RFQs, suppliers, contracts, and more...',
  sidebarCard,
  showDropdown = true,
  requiredOrganizationTypes,
  requiredRoles,
}: {
  children: React.ReactNode;
  nav: NavItem[];
  active?: string;
  name?: string;
  role?: string;
  search?: string;
  sidebarCard?: React.ReactNode;
  showDropdown?: boolean;
  requiredOrganizationTypes?: OrganizationType[];
  requiredRoles?: RoleKey[];
}) {
  const { session, loading, logout, hasOrganizationType, hasRole } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const sessionName = session?.user.name || name;
  const roleLabel = session ? formatRole(session.role) : role;
  const initials = sessionName.split(' ').map((v) => v[0]).join('').slice(0,2);
  const organizationAllowed = !requiredOrganizationTypes?.length || hasOrganizationType(requiredOrganizationTypes);
  const roleAllowed = !requiredRoles?.length || hasRole(requiredRoles);
  const allowed = Boolean(session && organizationAllowed && roleAllowed);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!organizationAllowed || !roleAllowed) {
      router.replace('/access-denied');
    }
  }, [loading, organizationAllowed, pathname, roleAllowed, router, session]);

  return (
    <div className="min-h-screen bg-[#F8FBFF] text-[#0B1744]">
      <header className="fixed inset-x-0 top-0 z-40 flex h-[76px] items-center border-b border-[#DFE9F7] bg-white/95 px-7 backdrop-blur">
        <Link href="/" className="w-[250px]"><Logo /></Link>
        <button className="mr-8 grid h-10 w-10 place-items-center rounded-xl border border-[#DFE9F7] bg-white text-[#0B1744] shadow-sm" title="Collapse sidebar"><ChevronsLeft size={18}/></button>
        <div className="mx-auto flex h-12 w-full max-w-[620px] items-center gap-3 rounded-2xl border border-[#CFE0FA] bg-white px-5 shadow-sm">
          <Search className="text-[#0B1744]" size={20}/>
          <input className="w-full border-0 bg-transparent text-sm font-medium outline-none placeholder:text-slate-500" placeholder={search}/>
        </div>
        <div className="ml-auto flex items-center gap-5 pl-8">
          <Bell size={22}/><Mail size={22}/><HelpCircle size={22}/>
          <div className="relative flex items-center gap-3 border-l border-[#DFE9F7] pl-5">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#155EEF] text-sm font-black text-white">{initials}</div>
            <div className="hidden sm:block">
              <p className="text-sm font-black">{sessionName}</p>
              <p className="text-xs font-semibold text-slate-500">{roleLabel}</p>
            </div>
            <ChevronDown size={16}/>
            {showDropdown && <AccountDropdown name={sessionName} role={roleLabel} onLogout={logout}/>}          
          </div>
        </div>
      </header>
      <aside className="fixed bottom-0 left-0 top-[76px] z-30 w-[250px] border-r border-[#DFE9F7] bg-white px-5 py-6">
        <nav className="space-y-2">
          {nav.map((item) => {
            const itemHref = item.href || '#';
            const isActive = item.active || item.label === active || Boolean(item.href && pathname === item.href);
            return (
              <Link key={item.label} href={itemHref} className={`flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-extrabold transition ${isActive ? 'bg-blue-50 text-[#155EEF] ring-1 ring-blue-100' : 'text-[#0B1744] hover:bg-blue-50 hover:text-[#155EEF]'}`}>
                <span className={isActive ? 'text-[#155EEF]' : 'text-[#1F3767]'}>{item.icon}</span>{item.label}
              </Link>
            );
          })}
        </nav>
        {sidebarCard && <div className="absolute bottom-8 left-6 right-6">{sidebarCard}</div>}
      </aside>
      <main className="pl-[250px] pt-[76px]">
        <div className="px-10 py-7">
          {loading && <div className="rounded-2xl border border-[#DFE9F7] bg-white p-6 text-sm font-black text-slate-600">Loading workspace...</div>}
          {!loading && allowed && children}
        </div>
      </main>
    </div>
  );
}
