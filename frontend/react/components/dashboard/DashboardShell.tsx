"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  icon:
    | "dashboard"
    | "profile"
    | "resources"
    | "notifications"
    | "schedule"
    | "leaderboard"
    | "mentor"
    | "billing"
    | "settings";
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/profile", label: "Profile", icon: "profile" },
  { href: "/resources", label: "Resources", icon: "resources" },
  { href: "/notifications", label: "Notifications", icon: "notifications" },
  { href: "/schedule", label: "Schedule", icon: "schedule" },
  { href: "/leaderboard", label: "Leaderboard", icon: "leaderboard" },
  { href: "/mentor", label: "Mentor AI", icon: "mentor" },
  { href: "/billing", label: "Billing", icon: "billing" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

function NavIcon({ icon }: { icon: NavItem["icon"] }) {
  switch (icon) {
    case "dashboard":
      // 4 квадратика
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" className="fill-current" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" className="fill-current" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" className="fill-current" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" className="fill-current" />
        </svg>
      );
    case "profile":
      // Иконка пользователя
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="3.5" className="fill-current" />
          <path
            d="M5 19.5C5.8 16.5 8.6 15 12 15s6.2 1.5 7 4.5"
            className="fill-none stroke-current"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "resources":
      // Коробка
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <rect
            x="4"
            y="6"
            width="16"
            height="12"
            rx="2"
            className="fill-none stroke-current"
            strokeWidth="1.6"
          />
          <path
            d="M4 10h16"
            className="stroke-current"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "notifications":
      // Колокольчик
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
            className="fill-none stroke-current"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.5 20.5a2 2 0 0 1-3 0"
            className="fill-none stroke-current"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "schedule":
      // Календарь
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <rect
            x="4"
            y="5"
            width="16"
            height="15"
            rx="2"
            className="fill-none stroke-current"
            strokeWidth="1.6"
          />
          <path
            d="M8 3v4M16 3v4M4 10h16"
            className="stroke-current"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "leaderboard":
      // Bar chart
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <rect x="4" y="11" width="3" height="8" rx="1" className="fill-current" />
          <rect x="10" y="8" width="3" height="11" rx="1" className="fill-current" />
          <rect x="16" y="5" width="3" height="14" rx="1" className="fill-current" />
        </svg>
      );
    case "mentor":
      // Чат-бабл с звездой (Mentor AI)
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            d="M5 5h14a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2H11l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
            className="fill-none stroke-current"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M12 8.5 12.7 10h1.6l-1.3.9.5 1.5L12 11.3l-1.5 1.1.5-1.5L9.7 10h1.6z"
            className="fill-current"
          />
        </svg>
      );
    case "billing":
      // Кошелёк
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <rect
            x="3"
            y="6"
            width="18"
            height="12"
            rx="2"
            className="fill-none stroke-current"
            strokeWidth="1.6"
          />
          <path
            d="M15 12h4"
            className="stroke-current"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "settings":
      // Шестеренка
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            d="M19.4 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l1.76-1.37a.6.6 0 0 0 .15-.77l-1.66-2.88a.6.6 0 0 0-.74-.26l-2.07.83a6 6 0 0 0-1.62-.94l-.31-2.18A.6.6 0 0 0 14.3 3h-4.6a.6.6 0 0 0-.59.49l-.31 2.18a6 6 0 0 0-1.62.94l-2.07-.83a.6.6 0 0 0-.74.26L2.7 8.92a.6.6 0 0 0 .15.77L4.6 11.06c-.04.31-.06.63-.06.94s.02.63.06.94l-1.76 1.37a.6.6 0 0 0-.15.77l1.66 2.88a.6.6 0 0 0 .74.26l2.07-.83a6 6 0 0 0 1.62.94l.31 2.18a.6.6 0 0 0 .59.49h4.6a.6.6 0 0 0 .59-.49l.31-2.18a6 6 0 0 0 1.62-.94l2.07.83a.6.6 0 0 0 .74-.26l1.66-2.88a.6.6 0 0 0-.15-.77l-1.76-1.37ZM12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
            className="fill-none stroke-current"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/80" />;
  }
}

type Props = {
  children: ReactNode;
  studentName?: string;
};

export function DashboardShell({ children, studentName }: Props) {
  const pathname = usePathname() || "/";
  const headerName = studentName || "Student";

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";

  return (
    <div className="relative min-h-screen bg-neutral-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/90 via-black to-black" />
        <div className="particle absolute h-1 w-1 rounded-full bg-cyan-400/70 shadow-[0_0_25px_rgba(34,211,238,0.8)]" style={{ top: "20%", left: "10%" }} />
        <div className="particle absolute h-1 w-1 rounded-full bg-cyan-400/70 shadow-[0_0_25px_rgba(34,211,238,0.8)]" style={{ top: "60%", left: "80%" }} />
        <div className="particle absolute h-1 w-1 rounded-full bg-cyan-400/70 shadow-[0_0_25px_rgba(34,211,238,0.8)]" style={{ top: "40%", left: "50%" }} />
        <div className="particle absolute h-1 w-1 rounded-full bg-cyan-400/70 shadow-[0_0_25px_rgba(34,211,238,0.8)]" style={{ top: "80%", left: "30%" }} />
        <div className="particle absolute h-1 w-1 rounded-full bg-cyan-400/70 shadow-[0_0_25px_rgba(34,211,238,0.8)]" style={{ top: "10%", left: "70%" }} />
      </div>

      {/* Fixed sidebar on the left */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-neutral-800 bg-neutral-950 px-4 py-6 shadow-xl">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <img
              src="https://resources.edufyuzbekistan.com/storage/images/favicon.png"
              alt="Edufy"
              className="h-8 w-8 rounded-xl shadow-md"
            />
            <span className="text-lg font-semibold tracking-tight">Edufy</span>
          </div>
        </div>

        <nav className="mt-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const targetHref = `${userPrefix}${item.href}`;
            const active = pathname === targetHref || pathname.startsWith(targetHref + "/");
            return (
              <Link
                key={item.href}
                href={targetHref}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-neutral-900/90 text-slate-50"
                    : "text-slate-300 hover:bg-neutral-900/70 hover:text-slate-50"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center">
                  <NavIcon icon={item.icon} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content shifted to the right of fixed sidebar */}
      <main className="ml-64 min-h-screen flex flex-col">

          <header
            className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur"
            aria-label={headerName ? `Dashboard for ${headerName}` : "Dashboard"}
          >
            <div className="flex items-center justify-between px-4 py-3 md:px-8">
              <div className="flex items-center gap-3 md:hidden">
                <button
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80"
                  aria-label="Open menu"
                >
                  <span className="block h-0.5 w-4 rounded bg-slate-200" />
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 px-4 py-6 md:px-8">{children}</div>

          <footer className="border-t border-neutral-800 py-6 px-4 md:px-8 text-center text-sm text-slate-500">
            ©2025-2026 Edufy. Keep Learning.
          </footer>
        </main>
    </div>
  );
}
