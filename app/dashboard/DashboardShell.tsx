import Link from 'next/link';
import LogoutButton from './LogoutButton';
import type { AuthUser } from '@/lib/api';

interface NavItem {
  label: string;
  href: string;
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Sales', href: '/dashboard/sales' },
  { label: 'Sanction', href: '/dashboard/sanction' },
  { label: 'Disbursement', href: '/dashboard/disbursement' },
  { label: 'Collection', href: '/dashboard/collection' },
];

const ROLE_NAV: Record<string, NavItem[]> = {
  Admin: ADMIN_NAV,
  Sales: [{ label: 'Leads', href: '/dashboard/sales' }],
  Sanction: [{ label: 'Pending Loans', href: '/dashboard/sanction' }],
  Disbursement: [{ label: 'Sanctioned Loans', href: '/dashboard/disbursement' }],
  Collection: [{ label: 'Disbursed Loans', href: '/dashboard/collection' }],
};

export default function DashboardShell({
  user,
  children,
  current,
}: {
  user: AuthUser;
  children: React.ReactNode;
  current?: string;
}) {
  const nav = ROLE_NAV[user.role] ?? [];
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              LMS
            </Link>
            {nav.length > 0 && (
              <nav className="hidden items-center gap-1 sm:flex">
                {nav.map((item) => {
                  const active = current === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                          : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-zinc-500 sm:inline dark:text-zinc-400">
              {user.name} · {user.role}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
