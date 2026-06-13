'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, Building2, ChevronDown, ChevronsLeft, ChevronsRight, HelpCircle, LogOut, Mail, Menu, Search, Settings, User, X } from 'lucide-react';
import { Logo } from './brand';
import { formatRole, useSession } from '../lib/session';
import type { OrganizationType, RoleKey } from '../lib/session';

export type NavItem = { label: string; icon: React.ReactNode; active?: boolean; href?: string };

export function AccountDropdown({ name, role, onLogout }: { name: string; role: string; onLogout: () => void }) {
  const initials = name.split(' ').map((v) => v[0]).join('').slice(0, 2);
  return (
    <div className="absolute right-0 top-14 z-30 max-h-[calc(100vh-6rem)] w-[calc(100vw-2rem)] max-w-72 overflow-y-auto rounded-[20px] border border-[#DFE9F7] bg-white p-4 shadow-[0_18px_50px_rgba(16,33,63,.14)] sm:w-72">
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
      <button type="button" className="flex w-full gap-3 rounded-xl px-2 py-3 text-left text-red-600 hover:bg-red-50" onClick={onLogout}>
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
  const [collapsed, setCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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

  useEffect(() => {
    setAccountOpen(false);
    setMobileNavOpen(false);
  }, [pathname]);

  const mobilePrimaryNav = nav.filter((item) => item.href || item.active || item.label === active).slice(0, 4);

  function navClasses(isActive: boolean, compact = false, disabled = false) {
    return `flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-extrabold transition ${compact ? 'justify-center' : ''} ${
      isActive
        ? 'bg-blue-50 text-[#155EEF] ring-1 ring-blue-100'
        : disabled
          ? 'cursor-default text-slate-400'
          : 'text-[#0B1744] hover:bg-blue-50 hover:text-[#155EEF]'
    }`;
  }

  return (
    <div className="min-h-screen bg-[#F8FBFF] text-[#0B1744]">
      <header className="fixed inset-x-0 top-0 z-40 flex h-[68px] items-center border-b border-[#DFE9F7] bg-white/95 px-4 backdrop-blur lg:h-[76px] lg:px-7">
        <Link href="/" className={`${collapsed ? 'lg:w-[72px]' : 'lg:w-[250px]'} transition-[width]`}>
          <Logo className="hidden lg:flex" markOnly={collapsed} />
          <Logo className="lg:hidden" markOnly />
        </Link>
        <button
          className="mr-8 hidden h-10 w-10 place-items-center rounded-xl border border-[#DFE9F7] bg-white text-[#0B1744] shadow-sm transition hover:bg-blue-50 lg:grid"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
          onClick={() => setCollapsed((current) => !current)}
        >
          {collapsed ? <ChevronsRight size={18}/> : <ChevronsLeft size={18}/>}
        </button>
        <div className="mx-auto hidden h-12 w-full max-w-[620px] items-center gap-3 rounded-2xl border border-[#CFE0FA] bg-white px-5 shadow-sm md:flex">
          <Search className="text-[#0B1744]" size={20}/>
          <input className="w-full border-0 bg-transparent text-sm font-medium outline-none placeholder:text-slate-500" placeholder={search}/>
        </div>
        <div className="ml-auto flex items-center gap-3 pl-3 lg:gap-5 lg:pl-8">
          <div className="hidden items-center gap-5 lg:flex"><Bell size={22}/><Mail size={22}/><HelpCircle size={22}/></div>
          <div className="relative border-l border-[#DFE9F7] pl-3 lg:pl-5">
            <button
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-2xl px-1 py-1 text-left transition hover:bg-blue-50 sm:gap-3 sm:px-2"
              type="button"
              onClick={() => setAccountOpen((current) => !current)}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#155EEF] text-sm font-black text-white">{initials}</div>
              <div className="hidden sm:block">
                <p className="max-w-[150px] truncate text-sm font-black">{sessionName}</p>
                <p className="max-w-[150px] truncate text-xs font-semibold text-slate-500">{roleLabel}</p>
              </div>
              <ChevronDown className={`transition ${accountOpen ? 'rotate-180' : ''}`} size={16}/>
            </button>
            {showDropdown && accountOpen && <AccountDropdown name={sessionName} role={roleLabel} onLogout={logout}/>}          
          </div>
        </div>
      </header>
      <aside className={`fixed bottom-0 left-0 top-[76px] z-30 hidden border-r border-[#DFE9F7] bg-white py-6 transition-[width] lg:block ${collapsed ? 'w-[82px] px-3' : 'w-[250px] px-5'}`}>
        <nav className="space-y-2">
          {nav.map((item) => {
            const isActive = item.active || item.label === active || Boolean(item.href && pathname === item.href);
            const itemClassName = navClasses(isActive, collapsed, !item.href);
            const content = (
              <>
                <span className={isActive ? 'text-[#155EEF]' : 'text-[#1F3767]'}>{item.icon}</span>{!collapsed && item.label}
              </>
            );
            if (!item.href) {
              return (
                <div key={item.label} title={collapsed ? item.label : undefined} className={itemClassName} aria-disabled="true">
                  {content}
                </div>
              );
            }
            return (
              <Link key={item.label} href={item.href} title={collapsed ? item.label : undefined} className={itemClassName}>
                {content}
              </Link>
            );
          })}
        </nav>
        {!collapsed && sidebarCard && <div className="absolute bottom-8 left-6 right-6">{sidebarCard}</div>}
      </aside>
      <main className={`pt-[68px] transition-[padding] lg:pt-[76px] ${collapsed ? 'lg:pl-[82px]' : 'lg:pl-[250px]'}`}>
        <div className="px-4 py-5 pb-24 sm:px-6 lg:px-10 lg:py-7 lg:pb-7">
          {loading && <div className="rounded-2xl border border-[#DFE9F7] bg-white p-6 text-sm font-black text-slate-600">Loading workspace...</div>}
          {!loading && allowed && children}
        </div>
      </main>
      {mobileNavOpen && (
        <>
          <button
            type="button"
            aria-label="Close workspace menu overlay"
            className="fixed inset-0 z-30 bg-[#0B1744]/10 backdrop-blur-[1px] lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 rounded-[24px] border border-[#DFE9F7] bg-white p-3 shadow-[0_-18px_54px_rgba(16,33,63,.16)] lg:hidden">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-xs font-black uppercase tracking-[.16em] text-slate-400">Workspace Menu</p>
              <button type="button" aria-label="Close workspace menu" className="grid h-9 w-9 place-items-center rounded-full bg-slate-50 text-[#0B1744]" onClick={() => setMobileNavOpen(false)}>
                <X size={17} />
              </button>
            </div>
            <div className="grid max-h-[52vh] gap-1 overflow-y-auto pr-1">
              {nav.map((item) => {
                const isActive = item.active || item.label === active || Boolean(item.href && pathname === item.href);
                const className = `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black ${isActive ? 'bg-blue-50 text-[#155EEF]' : item.href ? 'text-[#0B1744]' : 'text-slate-400'}`;
                const content = (
                  <>
                    <span className={isActive ? 'text-[#155EEF]' : 'text-[#1F3767]'}>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </>
                );
                return item.href ? (
                  <Link key={item.label} href={item.href} className={className}>
                    {content}
                  </Link>
                ) : (
                  <div key={item.label} className={className} aria-disabled="true">
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-[#DFE9F7] bg-white/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-14px_34px_rgba(16,33,63,.08)] backdrop-blur lg:hidden">
        {mobilePrimaryNav.map((item) => {
          const isActive = item.active || item.label === active || Boolean(item.href && pathname === item.href);
          const className = `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-black ${isActive ? 'bg-blue-50 text-[#155EEF]' : item.href ? 'text-slate-600' : 'text-slate-400'}`;
          const content = (
            <>
              <span className={isActive ? 'text-[#155EEF]' : 'text-[#1F3767]'}>{item.icon}</span>
              <span className="max-w-full truncate">{item.label}</span>
            </>
          );
          return item.href ? (
            <Link key={item.label} href={item.href} className={className}>
              {content}
            </Link>
          ) : (
            <div key={item.label} className={className} aria-disabled="true">
              {content}
            </div>
          );
        })}
        <button type="button" aria-expanded={mobileNavOpen} aria-label="Open workspace menu" className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-black ${mobileNavOpen ? 'bg-blue-50 text-[#155EEF]' : 'text-slate-600'}`} onClick={() => setMobileNavOpen((current) => !current)}>
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}
