"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";

type Catalog = "ielts" | "sat";

export function ProtectedPdfViewer({ catalog, id }: { catalog: Catalog; id: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pdfRef = useRef<any>(null);
  const renderingRef = useRef<Map<number, boolean>>(new Map());

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1);
  const [fitWidth, setFitWidth] = useState<boolean>(true);
  const [basePageWidth, setBasePageWidth] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const pdfUrl = useMemo(() => {
    return `/api/lessons-reports/pdf?catalog=${encodeURIComponent(catalog)}&id=${encodeURIComponent(id)}`;
  }, [catalog, id]);

  const effectiveScale = useMemo(() => {
    const base = fitWidth && basePageWidth && containerWidth > 0 ? containerWidth / basePageWidth : 1;
    const clampedZoom = Math.max(0.5, Math.min(3, zoom));
    return base * clampedZoom;
  }, [basePageWidth, containerWidth, fitWidth, zoom]);

  const ensurePageRendered = useCallback(
    async (pageNumber: number) => {
      if (!pdfRef.current) return;
      const canvas = canvasesRef.current.get(pageNumber);
      if (!canvas) return;

      if (renderingRef.current.get(pageNumber)) return;
      renderingRef.current.set(pageNumber, true);

      try {
        const page = await pdfRef.current.getPage(pageNumber);
        const viewport = page.getViewport({ scale: effectiveScale });

        const outputScale = window.devicePixelRatio || 1;
        const w = Math.floor(viewport.width);
        const h = Math.floor(viewport.height);

        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        canvas.width = Math.floor(w * outputScale);
        canvas.height = Math.floor(h * outputScale);

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;
        ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        const renderTask = page.render({ canvasContext: ctx as any, viewport });
        await renderTask.promise;
      } catch {
        // ignore
      } finally {
        renderingRef.current.set(pageNumber, false);
      }
    },
    [effectiveScale]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const next = Math.max(320, Math.floor(rect.width - 32));
      setContainerWidth(next);
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    return () => {
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);
    setNumPages(0);
    setCurrentPage(1);
    setBasePageWidth(null);
    pdfRef.current = null;
    canvasesRef.current.clear();

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        const res = await api(pdfUrl, {
          method: "GET",
          headers: { Accept: "application/pdf" },
        });

        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `request_failed_${res.status}`);
        }

        const data = await res.arrayBuffer();
        const doc = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return;

        pdfRef.current = doc;
        setNumPages(doc.numPages || 0);

        try {
          const p1 = await doc.getPage(1);
          const v = p1.getViewport({ scale: 1 });
          setBasePageWidth(v.width || null);
        } catch {
          // ignore
        }

        setLoading(false);

        const first = Math.min(4, doc.numPages || 0);
        for (let i = 1; i <= first; i++) {
          void ensurePageRendered(i);
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(String(err?.message ?? err ?? "Failed to load PDF").slice(0, 200));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ensurePageRendered, pdfUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!numPages) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => Number((e.target as HTMLElement).dataset.page || "0"))
          .filter((n) => n > 0)
          .sort((a, b) => a - b);
        if (visible.length > 0) setCurrentPage(visible[0]);

        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const n = Number((e.target as HTMLElement).dataset.page || "0");
          if (n > 0) void ensurePageRendered(n);
        }
      },
      { root: null, rootMargin: "200px 0px", threshold: 0.01 }
    );

    const nodes: HTMLElement[] = [];
    for (let i = 1; i <= numPages; i++) {
      const node = el.querySelector(`[data-page='${i}']`) as HTMLElement | null;
      if (node) {
        nodes.push(node);
        obs.observe(node);
      }
    }

    return () => {
      for (const n of nodes) obs.unobserve(n);
      obs.disconnect();
    };
  }, [ensurePageRendered, numPages]);

  useEffect(() => {
    if (!numPages) return;
    for (let i = 1; i <= Math.min(3, numPages); i++) {
      void ensurePageRendered(i);
    }
  }, [effectiveScale, ensurePageRendered, numPages]);

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
        <div className="min-w-0 text-sm text-slate-200">
          Page <span className="tabular-nums">{currentPage}</span>
          {numPages ? (
            <>
              {" "}/ <span className="tabular-nums">{numPages}</span>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFitWidth((v) => {
                const next = !v;
                setZoom(1);
                return next;
              });
            }}
            className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-200 hover:border-white/60 hover:bg-neutral-900"
          >
            {fitWidth ? "Fit" : "Actual"}
          </button>

          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}
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
            onClick={() => setZoom((z) => Math.min(3, Math.round((z + 0.1) * 10) / 10))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-slate-200 hover:border-white/60 hover:bg-neutral-900"
            aria-label="Zoom in"
          >
            <span className="text-lg leading-none">+</span>
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="pdfScroll max-h-[75vh] overflow-auto px-4 py-4"
        onContextMenu={(e) => e.preventDefault()}
      >
        {loading ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-4 text-sm text-slate-400">
            Loading PDF...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-4 text-sm text-red-200">
            {error}
          </div>
        ) : numPages ? (
          <div className="space-y-6">
            {Array.from({ length: numPages }).map((_, idx) => {
              const pageNumber = idx + 1;
              return (
                <div
                  key={pageNumber}
                  data-page={pageNumber}
                  className="flex justify-center"
                  style={{ minHeight: 140 }}
                >
                  <canvas
                    ref={(node) => {
                      if (!node) {
                        canvasesRef.current.delete(pageNumber);
                        return;
                      }
                      canvasesRef.current.set(pageNumber, node);
                      void ensurePageRendered(pageNumber);
                    }}
                    className="rounded-lg bg-white shadow-[0_10px_50px_rgba(0,0,0,0.45)]"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-4 text-sm text-slate-400">
            Empty document.
          </div>
        )}
      </div>

      <style jsx>{`
        .pdfScroll {
          scrollbar-color: rgba(156, 163, 175, 0.75) transparent;
          scrollbar-width: thin;
        }
        .pdfScroll::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .pdfScroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .pdfScroll::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.55);
          border-radius: 999px;
          border: 3px solid transparent;
          background-clip: content-box;
        }
        .pdfScroll::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.8);
          border: 2px solid transparent;
          background-clip: content-box;
        }
      `}</style>
    </div>
  );
}
