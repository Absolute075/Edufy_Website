"use client";

import { useEffect, useMemo, useState } from "react";

type Catalog = "ielts" | "sat";

export function ProtectedPdfChromeViewer({ catalog, id }: { catalog: Catalog; id: string }) {
  const [fitWidth, setFitWidth] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1);

  const src = useMemo(() => {
    const base = `/api/lessons-reports/pdf?catalog=${encodeURIComponent(catalog)}&id=${encodeURIComponent(id)}`;
    const clampedZoom = Math.max(0.5, Math.min(3, zoom));
    const zoomParam = fitWidth ? "page-width" : String(Math.round(clampedZoom * 100));
    return `${base}#toolbar=0&navpanes=0&scrollbar=1&zoom=${encodeURIComponent(zoomParam)}`;
  }, [catalog, fitWidth, id, zoom]);

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
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-800 px-4 py-3">
        <div className="min-w-0 text-sm text-slate-200">PDF</div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFitWidth((v) => !v)}
            className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-200 hover:border-white/60 hover:bg-neutral-900"
          >
            {fitWidth ? "Fit" : "Actual"}
          </button>

          <button
            type="button"
            onClick={() => {
              setFitWidth(false);
              setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10));
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-slate-200 hover:border-white/60 hover:bg-neutral-900"
            aria-label="Zoom out"
          >
            <span className="text-lg leading-none">−</span>
          </button>

          <div className="w-16 text-center text-xs font-semibold text-slate-200">
            {Math.round(Math.max(0.5, Math.min(3, zoom)) * 100)}%
          </div>

          <button
            type="button"
            onClick={() => {
              setFitWidth(false);
              setZoom((z) => Math.min(3, Math.round((z + 0.1) * 10) / 10));
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-slate-200 hover:border-white/60 hover:bg-neutral-900"
            aria-label="Zoom in"
          >
            <span className="text-lg leading-none">+</span>
          </button>
        </div>
      </div>

      <iframe
        title="PDF"
        src={src}
        className="pdfChromeFrame h-[75vh] w-full"
        onContextMenu={(e) => e.preventDefault()}
      />

      <style jsx>{`
        .pdfChromeFrame {
          scrollbar-color: rgba(156, 163, 175, 0.7) rgba(17, 24, 39, 0.4);
        }
        .pdfChromeFrame::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .pdfChromeFrame::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.4);
        }
        .pdfChromeFrame::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.55);
          border-radius: 999px;
        }
        .pdfChromeFrame::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.75);
        }
      `}</style>
    </div>
  );
}
