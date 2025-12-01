"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function SettingsPage() {
  const handleLogout = async () => {
    try {
      await fetch("/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {
      // ignore
    }
    window.location.href = "https://access.edufyuzbekistan.com/login";
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Security & Privacy */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
          <div className="mb-4 flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-slate-200"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="10"
                    rx="2"
                    className="fill-none stroke-current"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M8 11V8a4 4 0 0 1 8 0v3"
                    className="stroke-current"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold">Security &amp; Privacy</h1>
                <p className="text-sm text-slate-400">Manage your security settings</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800/80 bg-neutral-950/60 px-4 py-3">
              <div>
                <h4 className="text-sm font-medium">Change Password</h4>
                <p className="text-xs text-slate-400">
                  Update your password regularly to keep your account secure.
                </p>
              </div>
              <a
                href="/reset-password"
                className="inline-flex items-center rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-neutral-500 hover:bg-neutral-900/80"
              >
                Change
              </a>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800/80 bg-neutral-950/60 px-4 py-3">
              <div>
                <h4 className="text-sm font-medium">Sign out</h4>
                <p className="text-xs text-slate-400">
                  Sign out of your account on this device.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center rounded-lg border border-red-500/60 bg-red-900/30 px-3 py-1.5 text-xs font-medium text-red-300 hover:border-red-400 hover:bg-red-900/60"
              >
                Sign out
              </button>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
          <div className="mb-4 flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-slate-200"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3a7 7 0 0 0-7 7v2.5A3.5 3.5 0 0 0 8.5 16H9l.5 3 2.5-3H12a7 7 0 0 0 7-7 7 7 0 0 0-7-7Z"
                    className="fill-none stroke-current"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Support</h2>
                <p className="text-sm text-slate-400">We are here to help</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium">Contact Support</h3>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href="mailto:support@edufyuzbekistan.com"
                  className="inline-flex items-center gap-2 rounded-full border border-violet-400/60 bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-violet-300 shadow-sm hover:border-violet-300 hover:bg-neutral-900"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <rect
                      x="4"
                      y="5"
                      width="16"
                      height="14"
                      rx="2"
                      className="fill-none stroke-current"
                      strokeWidth="1.6"
                    />
                    <path
                      d="m4 7 8 6 8-6"
                      className="stroke-current"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  support@edufyuzbekistan.com
                </a>

                <a
                  href="tel:+998771102339"
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-emerald-300 shadow-sm hover:border-emerald-300 hover:bg-neutral-900"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.11 4.18 2 2 0 0 1 5.11 2h3a2 2 0 0 1 2 1.72 12.44 12.44 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.44 12.44 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"
                      className="fill-none stroke-current"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  +998 77 110 23 39
                </a>

                <a
                  href="https://t.me/edufysupport"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-sky-400/60 bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-sky-300 shadow-sm hover:border-sky-300 hover:bg-neutral-900"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      d="M22 2 11 13"
                      className="stroke-current"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M22 2 15 22 11 13 2 9Z"
                      className="stroke-current"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  @edufysupport
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800/80 bg-neutral-950/60 px-4 py-3">
              <div>
                <h4 className="text-sm font-medium">Report Bug</h4>
                <p className="text-xs text-slate-400">
                  Found an issue? Let us know so we can fix it.
                </p>
              </div>
              <a
                href="/report"
                className="inline-flex items-center rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-neutral-500 hover:bg-neutral-900/80"
              >
                Report
              </a>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
