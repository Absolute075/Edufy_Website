"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ARTICLES_BASE_URL, articlesRegistry, type ArticleTag } from "@/lib/articlesRegistry";

function articleUrl(file: string) {
  return `${ARTICLES_BASE_URL}/${file}`;
}

const ARTICLES_PREVIEW_BASE_URL =
  "https://resources.edufyuzbekistan.com/storage/articles-preview";

function articlePreviewUrl(file: string, preview?: string) {
  const previewFile = preview ?? file.replace(/\.pdf$/i, ".jpg");
  return `${ARTICLES_PREVIEW_BASE_URL}/${previewFile}`;
}

const TAG_LABELS: Record<ArticleTag, string> = {
  education: "Education",
  environment: "Environment",
  science: "Science",
  lifestyle: "Lifestyle",
  technology: "Technology",
  wellbeing: "Wellbeing",
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => {
            const pdfUrl = articleUrl(a.file);
            const previewUrl = articlePreviewUrl(a.file, a.preview);
            const metaParts = [
              ...(a.tags?.length ? a.tags.map((t) => TAG_LABELS[t]) : []),
              ...(a.pages ? [`${a.pages} pages`] : []),
            ];
            const meta = metaParts.join(" • ");
            return (
              <article
                key={a.id}
                className="relative min-h-[22rem] overflow-hidden rounded-3xl border border-neutral-800 bg-black p-10 flex flex-col gap-6"
              >
                {meta ? (
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">
                    {meta}
                  </div>
                ) : null}

                <div
                  className="relative w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950"
                  style={{ aspectRatio: "16 / 9" }}
                >
                  <img
                    alt={`Preview: ${a.title}`}
                    src={previewUrl}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <h2 className="text-lg md:text-xl font-semibold text-slate-100">{a.title}</h2>
                {a.description ? <p className="text-sm text-slate-400">{a.description}</p> : null}

                <div className="mt-auto flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-neutral-800">
                  <span>{a.source ? `Source: ${a.source}` : ""}</span>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] uppercase tracking-[0.2em] text-slate-200 hover:text-white"
                  >
                    Read
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
