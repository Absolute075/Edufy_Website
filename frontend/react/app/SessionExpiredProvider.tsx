"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type Props = {
  children: ReactNode;
};

export function SessionExpiredProvider({ children }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const w = window as any;
    const handler = () => {
      setOpen(true);
    };
    w.__onSessionExpired = handler;
    return () => {
      if (w.__onSessionExpired === handler) {
        delete w.__onSessionExpired;
      }
    };
  }, []);

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
