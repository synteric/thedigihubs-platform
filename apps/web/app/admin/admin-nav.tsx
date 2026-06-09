import {
  BarChart3,
  Building2,
  FileSearch,
  FileText,
  KeyRound,
  Settings,
  Ticket,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import type { NavItem } from '../../components/app-shell';

const adminItems = [
  { label: 'Overview', href: '/admin', icon: <Building2 size={20} /> },
  { label: 'Organizations', href: '/admin/organizations', icon: <Building2 size={20} /> },
  { label: 'Users', href: '/admin/users', icon: <UsersRound size={20} /> },
  { label: 'RFQs', href: '/admin/rfqs', icon: <FileText size={20} /> },
  { label: 'Membership Plans', href: '/admin/membership-plans', icon: <WalletCards size={20} /> },
  { label: 'Roles & Permissions', href: '/admin/roles', icon: <KeyRound size={20} /> },
  { label: 'Support Tickets', href: '/admin/support', icon: <Ticket size={20} /> },
  { label: 'Revenue', href: '/admin/revenue', icon: <BarChart3 size={20} /> },
  { label: 'Analytics', icon: <BarChart3 size={20} /> },
  { label: 'Audit Logs', href: '/admin/audit', icon: <FileSearch size={20} /> },
  { label: 'Settings', icon: <Settings size={20} /> },
];

export function adminNav(activeLabel: string): NavItem[] {
  return adminItems.map((item) => ({
    ...item,
    active: item.label === activeLabel,
  }));
}
