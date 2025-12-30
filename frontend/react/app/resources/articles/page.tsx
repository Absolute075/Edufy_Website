"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ARTICLES_BASE_URL, articlesRegistry, type ArticleTag } from "@/lib/articlesRegistry";

function articleUrl(file: string) {
  return `${ARTICLES_BASE_URL}/${file}`;
}

const TAG_LABELS: Record<ArticleTag, string> = {
  education: "Education",
  environment: "Environment",
  technology: "Technology",
  health: "Health",
  magazine: "Magazine",
  general: "General",
};

export default function ArticlesPage() {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";

  const resourcesHref = `${userPrefix}/resources`;

  const items = useMemo(() => {
    return Object.entries(articlesRegistry).map(([id, rule]) => ({ id, ...rule }));
  }, []);

  const allTags = useMemo(() => {
    const s = new Set<ArticleTag>();
    items.forEach((i) => i.tags.forEach((t) => s.add(t)));
    return Array.from(s);
  }, [items]);

  const [activeTag, setActiveTag] = useState<ArticleTag | "all">("all");

  const filtered = useMemo(() => {
    if (activeTag === "all") return items;
    return items.filter((i) => i.tags.includes(activeTag));
  }, [activeTag, items]);

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <div className="text-xs text-slate-400">
            <Link href={resourcesHref} className="hover:text-slate-200">
              Resources
            </Link>
            <span className="mx-2 text-slate-600">/</span>
            <span className="text-slate-200">Articles &amp; Magazines</span>
          </div>
          <h1 className="text-2xl font-semibold">Articles &amp; Magazines</h1>
          <p className="text-sm text-slate-400">
            Read topic-based PDFs and open the full document in one click.
          </p>
        </div>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-xl border px-3 py-1.5 text-sm transition-colors ${
                activeTag === "all"
                  ? "border-slate-400 bg-neutral-900 text-slate-100"
                  : "border-neutral-700 bg-black text-slate-300 hover:bg-neutral-900"
              }`}
              onClick={() => setActiveTag("all")}
            >
              All
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                type="button"
                className={`rounded-xl border px-3 py-1.5 text-sm transition-colors ${
                  activeTag === t
                    ? "border-slate-400 bg-neutral-900 text-slate-100"
                    : "border-neutral-700 bg-black text-slate-300 hover:bg-neutral-900"
                }`}
                onClick={() => setActiveTag(t)}
              >
                {TAG_LABELS[t]}
              </button>
            ))}
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((a) => {
            const pdfUrl = articleUrl(a.file);
            return (
              <article key={a.id} className="rounded-2xl border border-neutral-800 bg-black p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-100">{a.title}</h2>
                    {a.description ? (
                      <p className="mt-1 text-sm text-slate-400">{a.description}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {a.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1 text-xs text-slate-300"
                        >
                          {TAG_LABELS[t]}
                        </span>
                      ))}
                      {a.minutes ? (
                        <span className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1 text-xs text-slate-300">
                          ~{a.minutes} min
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-slate-100 hover:bg-neutral-900"
                  >
                    Open PDF
                  </a>
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
                  <iframe
                    title={`Preview: ${a.title}`}
                    src={pdfUrl}
                    className="h-[420px] w-full"
                  />
                </div>

                {a.source ? <div className="mt-3 text-xs text-slate-500">Source: {a.source}</div> : null}
              </article>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={resourcesHref}
            className="inline-flex items-center rounded-xl border border-neutral-700 bg-black px-4 py-2 text-sm text-slate-100 hover:bg-neutral-900"
          >
            Back to Resources
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
