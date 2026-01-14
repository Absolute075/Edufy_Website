"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";

type Catalog = "ielts" | "sat";

export function ProtectedPdfViewer({ catalog, id }: { catalog: Catalog; id: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pdfRef = useRef<any>(null);
  const renderingRef = useRef<Map<number, boolean>>(new Map());
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const shieldTimerRef = useRef<number | null>(null);
  const devtoolsIntervalRef = useRef<number | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1);
  const [renderScale, setRenderScale] = useState<number>(1);
  const [pageSizes, setPageSizes] = useState<Record<number, { w: number; h: number }>>({});
  const [shielded, setShielded] = useState<boolean>(false);
  const [watermarkText, setWatermarkText] = useState<string>("edufyuzbekistan.com");
  const [watermarkNonce, setWatermarkNonce] = useState<number>(0);

  const pdfUrl = useMemo(() => {
    return `/api/lessons-reports/pdf?catalog=${encodeURIComponent(catalog)}&id=${encodeURIComponent(id)}`;
  }, [catalog, id]);

  const clampedZoom = useMemo(() => {
    return Math.max(0.5, Math.min(3, zoom));
  }, [zoom]);

  const clampedRenderScale = useMemo(() => {
    return Math.max(0.5, Math.min(3, renderScale));
  }, [renderScale]);

  const displayRatio = useMemo(() => {
    return clampedZoom / clampedRenderScale;
  }, [clampedRenderScale, clampedZoom]);

  const watermarkBg = useMemo(() => {
    const t = String(watermarkText || "edufyuzbekistan.com");
    const nonce = Number.isFinite(watermarkNonce) ? watermarkNonce : 0;
    const x = 40 + (nonce % 80);
    const y = 30 + ((nonce * 7) % 90);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="520" height="320">
  <rect width="100%" height="100%" fill="transparent"/>
  <g transform="translate(${x},${y}) rotate(-28)">
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="22" fill="rgba(255,255,255,0.10)">${t}</text>
    <text x="0" y="48" font-family="Arial, sans-serif" font-size="16" fill="rgba(255,255,255,0.08)">protected content</text>
  </g>
</svg>`;
    const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    return `url('${url}')`;
  }, [watermarkNonce, watermarkText]);

  const sideBg = useMemo(() => {
    const t = String(watermarkText || "edufyuzbekistan.com");
    const nonce = Number.isFinite(watermarkNonce) ? watermarkNonce : 0;
    const x = 10 + (nonce % 40);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="260" height="520">
  <rect width="100%" height="100%" fill="rgba(0,0,0,0.15)"/>
  <g transform="translate(${x},30) rotate(-90)">
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="rgba(255,255,255,0.55)">${t}</text>
    <text x="0" y="40" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="rgba(255,255,255,0.45)">PROTECTED CONTENT</text>
    <text x="0" y="78" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.35)">edufyuzbekistan.com</text>
  </g>
</svg>`;
    const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    return `url('${url}')`;
  }, [watermarkNonce, watermarkText]);

  const setZoomAnchored = useCallback(
    (next: number, anchor?: { x: number; y: number } | null) => {
      const el = containerRef.current;
      const prevZoom = Math.max(0.5, Math.min(3, zoom));
      const nextZoom = Math.max(0.5, Math.min(3, next));

      if (!el || prevZoom === nextZoom) {
        setZoom(nextZoom);
        return;
      }

      const rect = el.getBoundingClientRect();
      const ax = anchor?.x ?? rect.left + rect.width / 2;
      const ay = anchor?.y ?? rect.top + rect.height / 2;

      const vx = ax - rect.left;
      const vy = ay - rect.top;

      const contentX = el.scrollLeft + vx;
      const contentY = el.scrollTop + vy;
      const ratio = nextZoom / prevZoom;

      setZoom(nextZoom);

      requestAnimationFrame(() => {
        const el2 = containerRef.current;
        if (!el2) return;
        el2.scrollLeft = contentX * ratio - vx;
        el2.scrollTop = contentY * ratio - vy;
      });
    },
    [zoom]
  );

  useEffect(() => {
    const next = clampedZoom;
    const current = clampedRenderScale;
    if (Math.abs(next - current) < 0.12) return;

    const t = window.setTimeout(() => {
      setRenderScale(next);
    }, 220);

    return () => {
      window.clearTimeout(t);
    };
  }, [clampedRenderScale, clampedZoom]);

  const ensurePageRendered = useCallback(
    async (pageNumber: number) => {
      if (!pdfRef.current) return;
      const canvas = canvasesRef.current.get(pageNumber);
      if (!canvas) return;

      if (renderingRef.current.get(pageNumber)) return;
      renderingRef.current.set(pageNumber, true);

      try {
        const page = await pdfRef.current.getPage(pageNumber);
        const viewport = page.getViewport({ scale: clampedRenderScale });

        const outputScale = window.devicePixelRatio || 1;
        const w = Math.floor(viewport.width);
        const h = Math.floor(viewport.height);

        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        canvas.width = Math.floor(w * outputScale);
        canvas.height = Math.floor(h * outputScale);

        setPageSizes((prev) => {
          const cur = prev[pageNumber];
          if (cur && cur.w === w && cur.h === h) return prev;
          return { ...prev, [pageNumber]: { w, h } };
        });

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
    [clampedRenderScale]
  );

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);
    setNumPages(0);
    setCurrentPage(1);
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
    const from = Math.max(1, currentPage - 1);
    const to = Math.min(numPages, currentPage + 2);
    for (let i = from; i <= to; i++) {
      void ensurePageRendered(i);
    }
  }, [clampedRenderScale, currentPage, ensurePageRendered, numPages]);

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

  useEffect(() => {
    const clearShieldTimer = () => {
      if (shieldTimerRef.current) {
        window.clearTimeout(shieldTimerRef.current);
        shieldTimerRef.current = null;
      }
    };

    const activateTempShield = (ms: number) => {
      clearShieldTimer();
      setShielded(true);
      shieldTimerRef.current = window.setTimeout(() => {
        shieldTimerRef.current = null;
        if (!document.hidden) setShielded(false);
      }, ms);
    };

    const isDevtoolsShortcut = (e: KeyboardEvent) => {
      const key = String(e.key || "");
      const lower = key.toLowerCase();
      if (key === "F12") return true;
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (lower === "i" || lower === "j" || lower === "c")) return true;
      if ((e.ctrlKey || e.metaKey) && lower === "u") return true;
      return false;
    };

    const isPrintScreenLike = (e: KeyboardEvent) => {
      const key = String(e.key || "");
      const lower = key.toLowerCase();
      if (key === "PrintScreen") return true;
      if (lower === "prtsc" || lower === "prtscn") return true;
      // Some browsers report empty key but still provide keyCode 44
      if ((e as any).keyCode === 44) return true;

      // Best-effort: Windows Snipping Tool shortcut (if browser receives it)
      if (e.metaKey && e.shiftKey && lower === "s") return true;
      // Some users use Ctrl+Shift+S for screenshot tools
      if (e.ctrlKey && e.shiftKey && lower === "s") return true;

      return false;
    };

    const onVisibility = () => {
      clearShieldTimer();
      setShielded(document.hidden);
    };

    const onBlur = () => {
      clearShieldTimer();
      setShielded(true);
    };

    const onFocus = () => {
      clearShieldTimer();
      if (!document.hidden) setShielded(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (isPrintScreenLike(e)) {
        // Try to cover both keydown and keyup capture timings.
        activateTempShield(2200);
        return;
      }

      if (isDevtoolsShortcut(e)) {
        e.preventDefault();
        e.stopPropagation();
        activateTempShield(2500);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (isPrintScreenLike(e)) {
        activateTempShield(2200);
      }
    };

    const onBeforePrint = () => {
      clearShieldTimer();
      setShielded(true);
    };

    const onAfterPrint = () => {
      clearShieldTimer();
      if (!document.hidden) setShielded(false);
    };

    const mql = typeof window !== "undefined" && "matchMedia" in window ? window.matchMedia("print") : null;
    const onPrintMediaChange = () => {
      if (!mql) return;
      if (mql.matches) onBeforePrint();
      else onAfterPrint();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("keydown", onKey, { capture: true });
    window.addEventListener("keyup", onKeyUp, { capture: true });
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    if (mql) {
      mql.addEventListener?.("change", onPrintMediaChange as any);
    }

    if (!devtoolsIntervalRef.current) {
      devtoolsIntervalRef.current = window.setInterval(() => {
        const dx = Math.abs((window.outerWidth || 0) - (window.innerWidth || 0));
        const dy = Math.abs((window.outerHeight || 0) - (window.innerHeight || 0));
        const suspected = dx > 180 || dy > 220;
        if (suspected) {
          setShielded(true);
          return;
        }

        if (!document.hidden && !shieldTimerRef.current) {
          setShielded(false);
        }
      }, 800);
    }

    onVisibility();

    return () => {
      clearShieldTimer();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("keydown", onKey, { capture: true } as any);
      window.removeEventListener("keyup", onKeyUp, { capture: true } as any);
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
      if (mql) {
        mql.removeEventListener?.("change", onPrintMediaChange as any);
      }
      if (devtoolsIntervalRef.current) {
        window.clearInterval(devtoolsIntervalRef.current);
        devtoolsIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api("/auth/me")
      .then(async (res) => {
        if (!res.ok) return null;
        return await res.json().catch(() => null);
      })
      .then((me: any) => {
        if (cancelled) return;
        const idVal = me?.id ?? me?.user?.id ?? me?.data?.id ?? me?.username ?? me?.user?.username ?? me?.email;
        const userKey = String(idVal ?? "").trim();
        setWatermarkText(userKey ? `edufyuzbekistan.com • ${userKey}` : "edufyuzbekistan.com");
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => {
      setWatermarkNonce((n) => (n + 1) % 10_000);
    }, 12_000);
    return () => window.clearInterval(t);
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
            onClick={() => setZoomAnchored(zoom - 0.05, lastPointerRef.current)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-slate-200 hover:border-white/60 hover:bg-neutral-900"
            aria-label="Zoom out"
          >
            <span className="text-lg leading-none">−</span>
          </button>

          <div className="w-16 text-center text-xs font-semibold text-slate-200">
            {Math.round(clampedZoom * 100)}%
          </div>

          <button
            type="button"
            onClick={() => setZoomAnchored(zoom + 0.05, lastPointerRef.current)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-slate-200 hover:border-white/60 hover:bg-neutral-900"
            aria-label="Zoom in"
          >
            <span className="text-lg leading-none">+</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          className="pdfScroll max-h-[75vh] overflow-auto px-4 py-4"
          style={{ filter: shielded ? "blur(12px)" : "none" }}
          onMouseMove={(e) => {
            lastPointerRef.current = { x: e.clientX, y: e.clientY };
          }}
          onMouseLeave={() => {
            lastPointerRef.current = null;
          }}
          onWheel={(e) => {
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            const delta = e.deltaY;
            const step = 0.05;
            setZoomAnchored(zoom + (delta > 0 ? -step : step), { x: e.clientX, y: e.clientY });
          }}
          onContextMenu={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
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
          <div className="flex flex-col" style={{ gap: `${24 * clampedZoom}px` }}>
            {Array.from({ length: numPages }).map((_, idx) => {
              const pageNumber = idx + 1;
              const size = pageSizes[pageNumber];
              const boxW = size ? size.w * displayRatio : 0;
              const boxH = size ? size.h * displayRatio : 0;
              return (
                <div
                  key={pageNumber}
                  data-page={pageNumber}
                  className="flex justify-center"
                  style={{ minHeight: 140 * clampedZoom }}
                >
                  <div
                    className="relative"
                    style={{ width: boxW ? `${boxW}px` : undefined, height: boxH ? `${boxH}px` : undefined }}
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
                      className="absolute left-0 top-0 rounded-lg bg-white shadow-[0_10px_50px_rgba(0,0,0,0.45)]"
                      style={{
                        transform: `scale(${displayRatio})`,
                        transformOrigin: "0 0",
                      }}
                    />
                  </div>
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

        {!shielded && (
          <>
            <div
              className="pointer-events-none absolute left-0 top-0 bottom-0 z-[6]"
              style={{
                width: "86px",
                backgroundImage: sideBg,
                backgroundRepeat: "repeat",
                backgroundSize: "260px 520px",
                opacity: 1,
              }}
            />
            <div
              className="pointer-events-none absolute right-0 top-0 bottom-0 z-[6]"
              style={{
                width: "86px",
                backgroundImage: sideBg,
                backgroundRepeat: "repeat",
                backgroundSize: "260px 520px",
                opacity: 1,
              }}
            />
          </>
        )}

        {!shielded && (
          <div
            className="pointer-events-none absolute inset-0 z-[5]"
            style={{
              backgroundImage: watermarkBg,
              backgroundRepeat: "repeat",
              backgroundSize: "520px 320px",
              mixBlendMode: "normal",
            }}
          />
        )}

        {shielded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="rounded-2xl border border-neutral-700 bg-neutral-950/80 px-6 py-5 text-center">
              <div className="text-sm font-semibold text-slate-100">Protected content</div>
              <div className="mt-1 text-xs text-slate-400">Return to this tab to continue viewing.</div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .pdfScroll {
          scrollbar-color: rgba(156, 163, 175, 0.75) transparent;
          scrollbar-width: thin;
          overscroll-behavior: contain;
          user-select: none;
          -webkit-user-select: none;
          -ms-user-select: none;
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
