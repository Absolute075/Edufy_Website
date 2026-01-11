'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/subscriptions', label: 'Subscriptions' },
  { href: '/admin/monitoring', label: 'Monitoring' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function getLoginHref() {
    try {
      if (typeof window !== 'undefined' && window.location.hostname.startsWith('admin.')) {
        return '/login';
      }
    } catch {}
    return '/admin/login';
  }

  function clearAdminTokenCookie() {
    try {
      const isProd = window.location.hostname.endsWith('edufyuzbekistan.com');
      const secure = window.location.protocol === 'https:';
      const domain = isProd ? '; Domain=.edufyuzbekistan.com' : '';
      const sameSite = '; SameSite=Lax';
      const securePart = secure ? '; Secure' : '';
      document.cookie = `admin_token=; Path=/; Max-Age=0${domain}${sameSite}${securePart}`;
      document.cookie = `admin_token=; Path=/; Max-Age=0${sameSite}${securePart}`;
    } catch {}
  }

  function handleLogout() {
    clearAdminTokenCookie();
    router.push(getLoginHref());
  }

  const isLoginPage = pathname === '/admin/login' || pathname === '/login';

  return (
    <div className="min-h-screen bg-black text-white">
      {isLoginPage ? (
        <main className="px-6 py-6 max-w-5xl w-full mx-auto">{children}</main>
      ) : (
        <div className="h-screen overflow-hidden">
          <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r border-white/10 bg-black/80 backdrop-blur-sm px-5 py-6 flex flex-col">
            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="font-ptserif tracking-[0.35em] text-sm text-white/80">EDUFY</span>
                <span className="text-xs uppercase tracking-[0.25em] text-gray-400">Admin Panel</span>
              </div>
            </div>

            <nav className="flex flex-col gap-1 text-xs flex-1 overflow-y-auto pr-1">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-2 uppercase tracking-[0.18em] transition-colors ${
                      active ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-6">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-[10px] uppercase tracking-[0.22em] text-gray-300 border border-white/20 rounded-full px-3 py-2 hover:bg-white hover:text-black transition-colors"
              >
                Logout
              </button>
            </div>
          </aside>

          <main className="ml-64 h-screen overflow-y-auto px-6 py-6">
            <div className="max-w-5xl w-full mx-auto">{children}</div>
          </main>
        </div>
      )}
    </div>
  );
}
