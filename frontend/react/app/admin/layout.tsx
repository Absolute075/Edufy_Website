'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/payments', label: 'Payments' },
  { href: '/admin/subscriptions', label: 'Subscriptions' },
  { href: '/admin/monitoring', label: 'Monitoring' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    try {
      localStorage.removeItem('admin_token');
    } catch {}
    router.push('/admin/login');
  }

  const isLoginPage = pathname === '/admin/login';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-black/80 backdrop-blur-sm">
        <div className="flex items-baseline gap-2">
          <span className="font-ptserif tracking-[0.35em] text-sm text-white/80">EDUFY</span>
          <span className="text-xs uppercase tracking-[0.25em] text-gray-400">Admin Panel</span>
        </div>
        {!isLoginPage && (
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-3 text-xs">
              {navItems.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`uppercase tracking-[0.18em] ${
                      active
                        ? 'text-white'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={handleLogout}
              className="text-[10px] uppercase tracking-[0.22em] text-gray-300 border border-white/20 rounded-full px-3 py-1 hover:bg-white hover:text-black transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </header>
      <main className="flex-1 px-6 py-6 max-w-5xl w-full mx-auto">{children}</main>
    </div>
  );
}
