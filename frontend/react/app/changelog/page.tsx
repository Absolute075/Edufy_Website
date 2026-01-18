"use client";

import { useEffect, useState } from "react";

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(d);
}

type Publication = {
  id: string;
  type: "changelog";
  title: string;
  date: string;
  mediaUrls?: string[];
  contentHtml: string;
};

export default function ChangelogPage() {
  const [items, setItems] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/publications?type=changelog&t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`load_failed_${res.status}`);
        const data: any = await res.json().catch(() => null);
        const pubs: Publication[] = Array.isArray(data?.publications) ? data.publications : [];
        if (!cancelled) setItems(pubs);
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || e || "Failed to load").slice(0, 200));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!lightboxSrc) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLightboxSrc(null);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxSrc]);

  return (
    <main className="min-h-screen text-white legal-page-main">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <header className="mb-12 legal-hero-block">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bebas tracking-[0.35em] uppercase text-left text-white">
            Changelog
          </h1>
          <p className="mt-3 text-white/90 max-w-2xl text-left">
            Weekly updates and product improvements.
          </p>
        </header>

        <section className="legal-content-block space-y-14">
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400">No updates yet.</p>
          ) : (
            items.map((p) => (
              <article
                key={p.id}
                className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]"
              >
                <div className="sticky top-24 self-start">
                  <div className="text-lg font-semibold text-white">{p.title}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-400">
                    {formatDate(p.date)}
                  </div>
                </div>

                <div>
                  {p.mediaUrls?.length ? (
                    <div className="space-y-6 mb-8">
                      {p.mediaUrls.slice(0, 5).map((src, idx) => (
                        <div
                          key={`${p.id}-m-${idx}`}
                          className="relative overflow-hidden rounded-2xl border border-white/10"
                        >
                          <img
                            src={src}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover blur-2xl scale-110 opacity-60"
                            aria-hidden="true"
                          />
                          <img
                            src={src}
                            alt={p.title}
                            className="relative z-10 w-full h-[320px] sm:h-[420px] lg:h-[520px] object-contain cursor-zoom-in"
                            loading="lazy"
                            onClick={() => setLightboxSrc(src)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div
                    className="text-sm sm:text-base text-white leading-[1.32] [&_p]:my-0 [&_div]:my-0 [&_ul]:my-0.5 [&_ol]:my-0.5 [&_li]:my-0 [&_h2]:my-2 [&_h3]:my-1.5 [&_a]:text-blue-400 [&_a]:underline [&_a:hover]:text-blue-300"
                    dangerouslySetInnerHTML={{ __html: p.contentHtml || "" }}
                  />
                </div>
              </article>
            ))
          )}
        </section>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/70 backdrop-blur-md py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-white/60">
        ©2025-2026 Edufy. Keep Learning.
      </footer>

      {lightboxSrc ? (
        <div
          className="fixed inset-0 z-[80] bg-black/90"
          onMouseDown={() => setLightboxSrc(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <img
              src={lightboxSrc}
              alt=""
              className="max-h-[92vh] max-w-[92vw] object-contain"
              onMouseDown={(e) => e.stopPropagation()}
              draggable={false}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
