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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/publications?type=changelog", { cache: "no-store" });
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

  return (
    <main className="min-h-screen text-white legal-page-main">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
        <header className="mb-12 legal-hero-block">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bebas tracking-[0.35em] uppercase text-left text-white">
            Changelog
          </h1>
          <p className="mt-3 text-gray-300 max-w-2xl text-left">
            Weekly updates and product improvements.
          </p>
        </header>

        <section className="legal-content-block space-y-10">
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
                <div className="md:sticky md:top-24 self-start">
                  <div className="text-lg font-semibold text-white">{p.title}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-400">
                    {formatDate(p.date)}
                  </div>
                </div>

                <div>
                  {p.mediaUrls?.length ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                      {p.mediaUrls.slice(0, 5).map((src, idx) => (
                        <div key={`${p.id}-m-${idx}`} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                          <img src={src} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div
                    className="text-sm sm:text-base text-gray-300 leading-relaxed space-y-3"
                    dangerouslySetInnerHTML={{ __html: p.contentHtml || "" }}
                  />
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
