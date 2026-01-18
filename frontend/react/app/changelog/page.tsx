"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FooterPagesHeader } from "@/components/FooterPagesHeader";

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

type PublicationBlock = { title: string; items: string[] };

type Publication = {
  id: string;
  type: "changelog";
  title: string;
  date: string;
  imageUrl?: string;
  blocks: PublicationBlock[];
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
      <FooterPagesHeader />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-24 pb-20">
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

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
                  {p.imageUrl ? (
                    <div className="relative w-full overflow-hidden rounded-2xl border border-white/15 bg-black/40 mb-6" style={{ aspectRatio: "16 / 9" }}>
                      <Image
                        src={p.imageUrl}
                        alt={p.title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 768px) 66vw, 100vw"
                      />
                    </div>
                  ) : null}

                  <div className="space-y-6">
                    {p.blocks.map((block, idx) => (
                      <div key={`${p.id}-${idx}`}>
                        <div className="font-semibold text-white">{block.title}</div>
                        <div className="mt-2 space-y-2 text-sm sm:text-base text-gray-300 leading-relaxed">
                          {block.items.map((line, j) => (
                            <div key={`${p.id}-${idx}-${j}`}>{line}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
