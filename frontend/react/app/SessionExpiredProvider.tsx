"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function isProtectedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return false; // "/"

  const protectedRoots = new Set([
    "dashboard",
    "billing",
    "profile",
    "settings",
    "notifications",
    "schedule",
    "leaderboard",
    "resources",
    "report",
    "mentor",
    "payment",
  ]);

  const first = segments[0];

  // Маршруты вида /123/dashboard/...
  if (/^\d+$/.test(first)) {
    const second = segments[1];
    if (!second) return false;
    return protectedRoots.has(second);
  }

  return protectedRoots.has(first);
}

type Props = {
  children: ReactNode;
};

export function SessionExpiredProvider({ children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const handler = useCallback(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as any;

    const protectedPath = isProtectedPath(pathname);

    // На публичных страницах не регистрируем обработчик и закрываем модалку
    if (!protectedPath) {
      if (w.__onSessionExpired === handler) {
        delete w.__onSessionExpired;
      }
      setOpen(false);
      return;
    }

    w.__onSessionExpired = handler;

    return () => {
      if (w.__onSessionExpired === handler) {
        delete w.__onSessionExpired;
      }
    };
  }, [pathname, handler]);

  return (
    <>
      {children}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#0f172a",
              border: "1px solid rgba(148,163,184,.2)",
              borderRadius: 12,
              width: "min(92%, 420px)",
              padding: 20,
              boxShadow: "0 10px 30px rgba(0,0,0,.35)",
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: 18,
                marginBottom: 8,
              }}
            >
              Session has expired.
            </div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: 14,
                marginBottom: 16,
              }}
            >
              Please sign in again. A new tab will open, then return here.
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <a
                href="https://access.edufyuzbekistan.com/login"
                target="_blank"
                rel="noopener"
                style={{
                  padding: "8px 14px",
                  border: "1px solid rgba(148,163,184,.3)",
                  borderRadius: 8,
                  background: "#0b1220",
                  color: "#e2e8f0",
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
