"use client";

import { useEffect, useMemo } from "react";

type Catalog = "ielts" | "sat";

export function ProtectedPdfChromeViewer({ catalog, id }: { catalog: Catalog; id: string }) {
  const src = useMemo(() => {
    const base = `/api/lessons-reports/pdf?catalog=${encodeURIComponent(catalog)}&id=${encodeURIComponent(id)}`;
    return `${base}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
  }, [catalog, id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = String(e.key || "").toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (!ctrlOrCmd) return;
      if (key === "s" || key === "p") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/80">
      <div className="absolute left-0 right-0 top-0 z-10 h-12 bg-neutral-950/95" />
      <iframe
        title="PDF"
        src={src}
        className="relative z-0 h-[75vh] w-full"
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
