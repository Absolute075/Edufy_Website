"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { FooterPagesHeader } from "@/components/FooterPagesHeader";

type TagName =
  | "Education"
  | "Skills"
  | "Life"
  | "Updates"
  | "SAT"
  | "IELTS"
  | "TOEFL"
  | "AP"
  | "ACT";

type TagFilter = "All" | TagName;

interface BlogPost {
  slug: string;
  title: string;
  category: string;
  date: string;
  description: string;
  tags: TagName[];
   mediaType: "image" | "video";
   mediaSrc: string;
}

const posts: BlogPost[] = [
  {
    slug: "understand-define-deal",
    title: "Understand, Define, Deal.",
    category: "Education • SAT",
    date: "Nov 21, 2025",
    description:
      "Don’t focus on getting every question right on your first attempt. Instead, focus on understanding why the SAT asks certain types of questions and recognizing the patterns behind them.",
    tags: ["Education", "SAT"],
    mediaType: "image",
    mediaSrc: "https://resources.edufyuzbekistan.com/storage/images/photo_2025-12-04_16-07-17.jpg",
  },
  {
    slug: "shadow-yourself",
    title: "Shadow yourself",
    category: "Skills",
    date: "Nov 21, 2025",
    description:
      "Record yourself speaking on any topic, then listen carefully and imitate your own pronunciation, intonation, and pacing.",
    tags: ["Skills", "Life"],
    mediaType: "image",
    mediaSrc: "https://resources.edufyuzbekistan.com/storage/images/photo_2025-12-04_16-07-25.jpg",
  },
  {
    slug: "launch-of-our-website",
    title: "Launch of our Website!",
    category: "Updates",
    date: "Nov 14, 2025",
    description: "This day has come...",
    tags: ["Updates", "Life"],
    mediaType: "video",
    mediaSrc: "https://resources.edufyuzbekistan.com/storage/videos/wow.mp4",
  },
];

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<TagFilter>("All");

  const tagOptions: TagFilter[] = [
    "All",
    "Education",
    "Skills",
    "Life",
    "Updates",
    "SAT",
    "IELTS",
    "TOEFL",
    "AP",
    "ACT",
  ];

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredPosts = posts.filter((post) => {
    const matchesTag =
      activeTag === "All" || post.tags.includes(activeTag as TagName);
    const matchesSearch =
      normalizedQuery === "" ||
      `${post.title} ${post.description}`.toLowerCase().includes(normalizedQuery);

    return matchesTag && matchesSearch;
  });

  return (
    <main className="min-h-screen text-white legal-page-main">
      <FooterPagesHeader />
      <div className="flex min-h-screen">
        {/* Левый сайдбар на всю высоту */}
        <aside className="hidden md:flex w-72 lg:w-80 xl:w-96 border-r border-white/10 bg-white/5 px-5 sm:px-6 pt-24 pb-8 space-y-5 flex-col">
          <div className="mb-4">
            <Link href="/">
              <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                <span className="text-base">&larr;</span>
                <span className="uppercase tracking-[0.2em]">Back</span>
              </span>
            </Link>
          </div>

          <div>
            <h2 className="text-xs sm:text-xl font-semibold uppercase tracking-[0.25em] text-gray-300">
              Filter
            </h2>
          </div>

          <div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40"
            />
          </div>

          <div className="pt-1 flex flex-wrap gap-2">
            {tagOptions.map((tag) => {
              const isActive = activeTag === tag;
              const label = tag === "All" ? "All" : tag;

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-[0.65rem] sm:text-xs uppercase tracking-[0.22em] border transition-colors ${
                    isActive
                      ? "bg-white text-black border-white"
                      : "bg-black/40 text-gray-300 border-white/20 hover:border-white/60"
                  }`}
                >
                  {label === "All" ? "All" : `#${label}`}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Правая область: header + карточки в центрированном контейнере */}
        <div className="flex-1">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-24 pb-20">
            <header className="mb-12 legal-hero-block">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bebas tracking-[0.35em] uppercase text-white mb-4 text-left">
                <span className="mr-3">Edufy</span>
                <span>Blog &amp; News</span>
              </h1>
              <p className="text-gray-300 max-w-2xl text-left">
                Stories, updates and ideas from the Edufy team about exams, learning and the product.
              </p>
            </header>

            <section className="legal-content-block grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.length === 0 ? (
                <p className="text-sm text-gray-400 col-span-full">
                  No posts match your filters yet.
                </p>
              ) : (
                filteredPosts.map((post) => (
                  <article
                    key={post.slug}
                    className="relative min-h-[30rem] md:min-h-[34rem] lg:min-h-[38rem] rounded-3xl border border-white/10 bg-white/5 p-8 sm:p-10 flex flex-col gap-7 hover:border-white/30 hover:bg-white/10 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">
                        <span>{post.category}</span>
                        <span className="text-[0.6rem] sm:text-[0.65rem] tracking-[0.18em]">
                          {post.date}
                        </span>
                      </div>

                      <div
                        className="relative w-full overflow-hidden rounded-2xl border border-white/15 bg-black/40"
                        style={{ aspectRatio: "4 / 3" }}
                      >
                        {post.mediaType === "image" ? (
                          <Image
                            src={post.mediaSrc}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(min-width: 768px) 33vw, 100vw"
                          />
                        ) : (
                          <video
                            src={post.mediaSrc}
                            preload="metadata"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <h2 className="text-xl sm:text-2xl font-semibold text-white">
                        {post.title}
                      </h2>
                      <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                        {post.description}
                      </p>
                    </div>

                    <div className="mt-auto flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-white/10">
                      <span className="text-gray-400">{post.date}</span>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-1 text-white/80 hover:text-white transition-colors"
                      >
                        <span className="uppercase tracking-[0.2em] text-[0.65rem] sm:text-[0.7rem]">
                          Read more
                        </span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
