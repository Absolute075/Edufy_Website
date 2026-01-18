import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FooterPagesHeader } from "@/components/FooterPagesHeader";

interface BlogPostPageProps {
  params: { slug: string };
}

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

type MediaType = "image" | "video";

interface BlogPostData {
  title: string;
  category: string;
  date: string;
  description: string;
  tags: TagName[];
  mediaType: MediaType;
  mediaSrc: string;
}

const postsBySlug: Record<string, BlogPostData> = {
  "understand-define-deal": {
    title: "Understand, Define, Deal.",
    category: "Education • SAT",
    date: "Nov 21, 2025",
    description:
      "Don’t focus on getting every question right on your first attempt. Instead, focus on understanding why the SAT asks certain types of questions and recognizing the patterns behind them.",
    tags: ["Education", "SAT"],
    mediaType: "image",
    mediaSrc: "https://resources.edufyuzbekistan.com/storage/images/photo_2025-12-04_16-07-25.jpg",
  },
  "shadow-yourself": {
    title: "Shadow yourself",
    category: "Skills",
    date: "Nov 21, 2025",
    description:
      "Record yourself speaking on any topic, then listen carefully and imitate your own pronunciation, intonation, and pacing.",
    tags: ["Skills", "Life"],
    mediaType: "image",
    mediaSrc: "https://resources.edufyuzbekistan.com/storage/images/photo_2025-12-04_16-07-17.jpg",
  },
  "launch-of-our-website": {
    title: "Launch of our Website!",
    category: "Updates",
    date: "Nov 14, 2025",
    description: "This day has come...",
    tags: ["Updates", "Life"],
    mediaType: "video",
    mediaSrc: "https://resources.edufyuzbekistan.com/storage/videos/wow.mp4",
  },
};

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = postsBySlug[params.slug];

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen text-white legal-page-main">
      <FooterPagesHeader />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <header className="mb-10 legal-hero-block">
          <div className="mb-6">
            <Link href="/blog">
              <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                <span className="text-base">&larr;</span>
                <span className="uppercase tracking-[0.2em]">Back to blog</span>
              </span>
            </Link>
          </div>

          <div className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-2">
            {post.category}
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bebas tracking-[0.35em] uppercase text-white mb-4 text-left">
            {post.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">{post.date}</p>
        </header>

        <article className="legal-content-block space-y-8">
          <div
            className="relative w-full overflow-hidden rounded-2xl border border-white/15 bg-black/40"
            style={{ aspectRatio: "16 / 9" }}
          >
            {post.mediaType === "image" ? (
              <Image
                src={post.mediaSrc}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 66vw, 100vw"
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

          <div className="space-y-4 text-sm md:text-base text-gray-200 leading-relaxed">
            {params.slug === "understand-define-deal" && (
              <>
                <p>
                  Don’t focus on getting every question right on your first attempt. Instead, focus on understanding why
                  the SAT asks certain types of questions and recognizing the patterns behind them. The SAT is not about
                  advanced difficulty — it’s about testing the same recurring structures in grammar, reading logic, and
                  math reasoning.
                </p>
                <p>
                  When you can identify a pattern, you can solve a question faster, more confidently, and with a much
                  higher accuracy rate. You’re no longer guessing — you’re responding to a familiar structure.
                </p>
                <p>Train yourself to:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Understand the logic behind each question type.</li>
                  <li>Define which rule or pattern it belongs to.</li>
                  <li>Deal with it using a clear, repeatable strategy.</li>
                </ul>
                <p>
                  At the same time, learn to quickly notice which questions are designed to be time traps. If a question
                  feels like it will take too long, skip it immediately and return later. This single habit saves minutes,
                  reduces stress, and keeps you in control of your pacing.
                </p>
                <p>
                  Over time, you stop seeing the SAT as a long, stressful exam — you see it as a predictable system. And
                  once you see the system, you can beat it consistently.
                </p>
              </>
            )}

            {params.slug === "shadow-yourself" && (
              <>
                <p>
                  Record yourself speaking on any topic — it can be a personal story, a description, or an opinion. Then
                  listen attentively to the recording and imitate your own voice: copy your pronunciation, intonation,
                  pauses, and emotional tone. Try doing it slightly faster or slightly slower to challenge your rhythm and
                  control.
                </p>
                <p>
                  After shadowing, immediately repeat the same topic again without looking at any notes. Your task is to
                  sound smoother, clearer, and more confident than in the first attempt. Focus on keeping a natural flow,
                  connecting ideas logically, and reducing unnecessary pauses or fillers.
                </p>
                <p>This technique trains several skills at the same time:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <span className="font-semibold">Fluency:</span> You learn to speak without stopping, because your
                    brain gets used to the rhythm and structure of your own speech.
                  </li>
                  <li>
                    <span className="font-semibold">Coherence:</span> Repeating the same idea helps you organize your
                    thoughts more logically each time.
                  </li>
                  <li>
                    <span className="font-semibold">Pronunciation &amp; Intonation:</span> By shadowing yourself, you
                    notice your weak spots and automatically adjust them.
                  </li>
                  <li>
                    <span className="font-semibold">Rhythm &amp; Confidence:</span> Mimicking your own voice helps you
                    develop a more stable speaking pattern and reduces nervousness.
                  </li>
                </ul>
              </>
            )}

            {params.slug === "launch-of-our-website" && (
              <>
                <p>
                  What we see from thousands of attempts inside Edufy and how to build a routine that actually sticks.
                </p>
                <p>
                  Long weekend marathons look productive from the outside, but your brain quickly burns through focus and
                  retention. Short, frequent sessions give your memory time to consolidate, while still keeping the
                  material fresh.
                </p>
                <p>
                  Inside Edufy, we design practice blocks so that you can combine 20–30 minute focused attempts with clear
                  feedback, instead of relying on one big weekly session that you instantly forget.
                </p>
                <p>
                  In this post, we break down how to structure your week, what to do on light days, and how to recover
                  when you inevitably miss a session so that your progress line keeps going up.
                </p>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em] text-gray-400">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full border border-white/20 bg-white/5"
              >
                #{tag}
              </span>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
