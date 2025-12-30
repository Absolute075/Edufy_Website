"use client";

import Link from "next/link";
import { useMemo, useEffect, useState } from "react";
import { usePathname, useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { usePageTitle } from "../../lib/usePageTitle";

type MethodKey =
  | "sq3r"
  | "pomodoro"
  | "feynman"
  | "active-recall"
  | "mind-mapping"
  | "leitner"
  | "kaizen"
  | "spaced-repetition";

type MethodData = {
  title: string;
  tagline: string;
  vibe: {
    from: string;
    via: string;
    to: string;
  };
  sections: Array<{
    title: string;
    body: string;
  }>;
  steps: string[];
  quickTemplate: string[];
  bestFor: string[];
  mistakes: string[];
};

const METHODS: Record<MethodKey, MethodData> = {
  sq3r: {
    title: "SQ3R",
    tagline: "Make reading active: ask questions first, then hunt answers.",
    vibe: { from: "from-cyan-500/20", via: "via-sky-500/10", to: "to-transparent" },
    sections: [
      {
        title: "What it is",
        body: "SQ3R is a 5-step routine that turns reading into an active process. You preview the material, write questions, read with purpose, recite key points, then review to lock in memory.",
      },
      {
        title: "Why it works",
        body: "It forces your brain to predict, retrieve, and summarize. Those three actions create stronger memory than passive highlighting.",
      },
    ],
    steps: [
      "Survey: skim headings, charts, keywords, and the summary.",
      "Question: turn headings into questions (What? Why? How?).",
      "Read: read to answer your questions, not to ‘finish the page’.",
      "Recite: close the text and explain the answer in your own words.",
      "Review: revisit notes after 10–20 minutes and again the next day.",
    ],
    quickTemplate: [
      "Topic/Chapter:",
      "Survey notes (2–3 bullet points):",
      "Questions:",
      "Answers (in your words):",
      "Review: 3 key takeaways + 1 confusion point:",
    ],
    bestFor: ["Reading passages", "Textbook chapters", "Long articles"],
    mistakes: [
      "Skipping the Question step (it’s the engine).",
      "Writing long notes instead of short answers.",
      "Reviewing only once (spaced review matters).",
    ],
  },
  pomodoro: {
    title: "Pomodoro",
    tagline: "Short sprints. Clean breaks. High consistency.",
    vibe: { from: "from-rose-500/20", via: "via-orange-500/10", to: "to-transparent" },
    sections: [
      {
        title: "What it is",
        body: "Pomodoro is timed focus. You pick one task, work intensely for a fixed duration, then take a short break. This reduces procrastination and protects your energy.",
      },
      {
        title: "How to use it with IELTS prep",
        body: "Use a sprint for one micro-goal: 1 reading passage, 20 listening questions, or 15 new words with recall. The timer is there to create urgency — not stress.",
      },
    ],
    steps: [
      "Choose one clear task (make it small).",
      "Start a focus session.",
      "When time ends: stop, write 1 line ‘What’s next?’.",
      "Take a short break (walk, water, breathe).",
      "Repeat. Keep the streak, not perfection.",
    ],
    quickTemplate: [
      "Task:",
      "Success criteria (done when…):",
      "Distractions list (write, don’t follow):",
      "After session: 1 win + 1 improvement:",
    ],
    bestFor: ["Building consistency", "Fighting procrastination", "Heavy workloads"],
    mistakes: [
      "Starting without a clear task.",
      "Letting breaks turn into phone scrolling.",
      "Trying to do 5 things in one session.",
    ],
  },
  feynman: {
    title: "Feynman Technique",
    tagline: "If you can’t explain it simply — you don’t know it yet.",
    vibe: { from: "from-violet-500/20", via: "via-fuchsia-500/10", to: "to-transparent" },
    sections: [
      {
        title: "What it is",
        body: "A loop: explain a concept in simple words, find gaps, go back to the source, then simplify again. It’s the fastest way to turn ‘I kind of get it’ into mastery.",
      },
      {
        title: "When to use",
        body: "Perfect for grammar rules, writing structures, or any topic you tend to ‘memorize’ without understanding.",
      },
    ],
    steps: [
      "Pick one concept (e.g., ‘cohesion in Task 2’).",
      "Explain it as if teaching a beginner.",
      "Mark gaps: where you hesitate or use vague words.",
      "Study the gap (notes/video/book), then retry.",
      "Simplify: make it shorter and clearer each time.",
    ],
    quickTemplate: [
      "Concept:",
      "My explanation (simple):",
      "Gaps (what I couldn’t explain):",
      "New understanding:",
      "Final 3-sentence explanation:",
    ],
    bestFor: ["Deep understanding", "Fixing weak areas", "Teaching others"],
    mistakes: [
      "Writing fancy explanations (simplicity is the goal).",
      "Not identifying the exact gap.",
      "Skipping the second explanation pass.",
    ],
  },
  "active-recall": {
    title: "Active Recall",
    tagline: "The brain learns by retrieving — not by re-reading.",
    vibe: { from: "from-emerald-500/20", via: "via-lime-500/10", to: "to-transparent" },
    sections: [
      {
        title: "What it is",
        body: "Instead of reviewing notes, you force your brain to produce the answer: questions, flashcards, blurting, practice tests. Retrieval strengthens memory.",
      },
      {
        title: "A simple rule",
        body: "If you’re not trying to remember something, you’re probably not learning it.",
      },
    ],
    steps: [
      "Convert content into questions.",
      "Hide the source.",
      "Answer from memory.",
      "Check and correct.",
      "Repeat later using spaced repetition.",
    ],
    quickTemplate: [
      "Topic:",
      "5 questions:",
      "My answers (no notes):",
      "Corrections:",
      "Next review date:",
    ],
    bestFor: ["Vocabulary", "Grammar", "Facts & definitions"],
    mistakes: [
      "Looking too early (struggle is part of learning).",
      "Making questions too easy.",
      "Not scheduling reviews.",
    ],
  },
  "mind-mapping": {
    title: "Mind Mapping",
    tagline: "See the structure. Then remember it.",
    vibe: { from: "from-amber-500/20", via: "via-yellow-500/10", to: "to-transparent" },
    sections: [
      {
        title: "What it is",
        body: "A mind map is a visual network: one central topic, branches for key ideas, sub-branches for examples. Great for seeing relationships.",
      },
      {
        title: "How to use with writing",
        body: "Build a Task 2 plan: topic in the center, 2–3 main arguments as branches, examples & vocabulary as sub-branches.",
      },
    ],
    steps: [
      "Write the topic in the center.",
      "Add 3–5 main branches (big ideas).",
      "Add sub-branches: examples, causes, effects, vocab.",
      "Highlight links between branches.",
      "Use the map to speak/write without notes.",
    ],
    quickTemplate: [
      "Center topic:",
      "Branch 1 + example:",
      "Branch 2 + example:",
      "Branch 3 + example:",
      "Useful vocabulary:",
    ],
    bestFor: ["Essay planning", "Speaking ideas", "Big topics"],
    mistakes: [
      "Making it too detailed (keep it readable).",
      "Copying from a textbook instead of generating your own structure.",
      "Not using the map for recall (it’s not just art).",
    ],
  },
  leitner: {
    title: "Leitner System",
    tagline: "Flashcards with a built-in schedule that adapts to you.",
    vibe: { from: "from-blue-500/20", via: "via-indigo-500/10", to: "to-transparent" },
    sections: [
      {
        title: "What it is",
        body: "A spaced repetition method using ‘boxes’. If you answer a card correctly, it moves to a less frequent box. If wrong, it returns to the frequent box.",
      },
      {
        title: "Why it’s powerful",
        body: "It automatically focuses your time on weak cards, while still revisiting strong ones just enough to keep them.",
      },
    ],
    steps: [
      "Create flashcards (Q on front, A on back).",
      "Box 1: review daily (hard).",
      "Box 2: review every 2–3 days.",
      "Box 3: review weekly.",
      "Wrong answer → move card back to Box 1.",
    ],
    quickTemplate: [
      "Card front (question):",
      "Card back (answer + example sentence):",
      "Box number:",
      "Next review date:",
    ],
    bestFor: ["Vocabulary", "Collocations", "Grammar forms"],
    mistakes: [
      "Making cards too big (one fact per card).",
      "Not adding an example sentence.",
      "Reviewing randomly without the box rules.",
    ],
  },
  kaizen: {
    title: "Kaizen",
    tagline: "Improve by 1% daily. Consistency beats intensity.",
    vibe: { from: "from-teal-500/20", via: "via-cyan-500/10", to: "to-transparent" },
    sections: [
      {
        title: "What it is",
        body: "Kaizen is a mindset: small continuous improvements. It’s perfect for long goals like IELTS because it reduces overwhelm.",
      },
      {
        title: "How to apply",
        body: "Don’t aim for a perfect week. Aim for a tiny win today: 10 minutes of review, 1 writing correction, 5 new words + recall.",
      },
    ],
    steps: [
      "Choose one small habit.",
      "Make it easy (2 minutes is valid).",
      "Track the streak.",
      "Every week: adjust by +1 step.",
      "Keep it sustainable.",
    ],
    quickTemplate: [
      "Today’s micro-goal:",
      "When/where will I do it?",
      "How small is small enough?",
      "Proof of done (checkbox):",
      "Next tiny upgrade:",
    ],
    bestFor: ["Habit building", "Long prep periods", "Avoiding burnout"],
    mistakes: [
      "Choosing goals that are too big.",
      "Not tracking progress at all.",
      "Trying to improve everything at once.",
    ],
  },
  "spaced-repetition": {
    title: "Spaced Repetition",
    tagline: "Repeat at the right time — right before forgetting.",
    vibe: { from: "from-slate-500/20", via: "via-neutral-500/10", to: "to-transparent" },
    sections: [
      {
        title: "What it is",
        body: "A review schedule where intervals grow over time. This is how you move knowledge into long-term memory efficiently.",
      },
      {
        title: "How to start today",
        body: "Create a simple schedule: review after 1 day, 3 days, 7 days, 14 days. Combine with active recall (questions/flashcards).",
      },
    ],
    steps: [
      "Learn the material once (short + focused).",
      "Test yourself (active recall).",
      "Schedule the next review.",
      "Increase the interval each time you succeed.",
      "If you fail: shorten the interval.",
    ],
    quickTemplate: [
      "Item (word/concept):",
      "Recall question:",
      "Example:",
      "Review schedule (1d / 3d / 7d / 14d):",
    ],
    bestFor: ["Vocabulary", "Definitions", "Mistake logs"],
    mistakes: [
      "Reviewing too late (letting items fully fade).",
      "Reviewing too soon (wasting time).",
      "No recall — only re-reading.",
    ],
  },
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function PomodoroTimer() {
  const presets = [15, 30, 60] as const;
  const [durationSec, setDurationSec] = useState(15 * 60);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setIsRunning(false);
          setIsDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

  const pct = durationSec > 0 ? Math.min(1, Math.max(0, 1 - timeLeft / durationSec)) : 0;
  const ringStyle: React.CSSProperties = {
    background: `conic-gradient(rgba(244,63,94,0.95) ${pct * 360}deg, rgba(255,255,255,0.08) 0deg)`,
  };

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pomodoro Timer</h2>
          <p className="mt-1 text-sm text-slate-400">Choose a focus duration and start a clean sprint.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {presets.map((m) => (
            <button
              key={m}
              type="button"
              className={`rounded-xl border px-3 py-1.5 text-sm transition-colors ${
                durationSec === m * 60
                  ? "border-rose-400/70 bg-rose-500/10 text-slate-100"
                  : "border-neutral-700 bg-black text-slate-300 hover:bg-neutral-900"
              }`}
              onClick={() => {
                setDurationSec(m * 60);
                setTimeLeft(m * 60);
                setIsRunning(false);
                setIsDone(false);
              }}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="flex items-center justify-center">
          <div className="relative h-52 w-52 rounded-full p-2" style={ringStyle}>
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-black">
              <div className="text-4xl font-semibold tracking-tight">{formatTime(timeLeft)}</div>
              <div className="mt-1 text-xs text-slate-400">Focus session</div>
              {isDone ? <div className="mt-2 text-xs font-medium text-rose-300">Time is up</div> : null}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl border border-neutral-700 bg-black px-4 py-2 text-sm font-medium text-slate-100 hover:bg-neutral-900"
              onClick={() => {
                if (timeLeft <= 0) return;
                setIsRunning(true);
                setIsDone(false);
              }}
              disabled={isRunning || timeLeft <= 0}
            >
              Start
            </button>
            <button
              type="button"
              className="rounded-xl border border-neutral-700 bg-black px-4 py-2 text-sm font-medium text-slate-100 hover:bg-neutral-900"
              onClick={() => setIsRunning(false)}
              disabled={!isRunning}
            >
              Pause
            </button>
            <button
              type="button"
              className="rounded-xl border border-neutral-700 bg-black px-4 py-2 text-sm font-medium text-slate-100 hover:bg-neutral-900"
              onClick={() => {
                setIsRunning(false);
                setTimeLeft(durationSec);
                setIsDone(false);
              }}
            >
              Reset
            </button>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-black p-4 text-sm text-slate-300">
            <div className="font-medium text-slate-100">Pro tip</div>
            <div className="mt-2 text-slate-400">
              Before starting, write one sentence: <span className="text-slate-200">"Done means…"</span>. When the
              timer ends, stop immediately and write the next action.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function MethodPage() {
  const params = useParams<{ method?: string }>();
  const methodRaw = (params?.method ?? "").toLowerCase();
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";

  const methodKey = useMemo(() => {
    const allowed = new Set(Object.keys(METHODS) as MethodKey[]);
    return allowed.has(methodRaw as MethodKey) ? (methodRaw as MethodKey) : null;
  }, [methodRaw]);

  const data = methodKey ? METHODS[methodKey] : null;

  usePageTitle(data ? `Edufy – ${data.title}` : "Edufy – Study Method");

  if (!data) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
            <h1 className="text-xl font-semibold">Method not found</h1>
            <p className="mt-2 text-sm text-slate-400">This study method does not exist.</p>
            <Link
              href={`${userPrefix}/methods`}
              className="mt-4 inline-flex items-center rounded-xl border border-neutral-700 bg-black px-4 py-2 text-sm text-slate-100 hover:bg-neutral-900"
            >
              Back to Study Methods
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className={`rounded-2xl border border-neutral-800 bg-gradient-to-b ${data.vibe.from} ${data.vibe.via} ${data.vibe.to} p-6`}>
          <div className="flex flex-col gap-2">
            <div className="text-xs text-slate-400">
              <Link href={`${userPrefix}/methods`} className="hover:text-slate-200">
                Study Methods
              </Link>
              <span className="mx-2 text-slate-600">/</span>
              <span className="text-slate-200">{data.title}</span>
            </div>
            <h1 className="text-2xl font-semibold">{data.title}</h1>
            <p className="text-sm text-slate-300">{data.tagline}</p>
          </div>
        </div>

        {methodKey === "pomodoro" ? <PomodoroTimer /> : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold">Overview</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
              {data.sections.map((s) => (
                <div key={s.title}>
                  <div className="font-medium text-slate-100">{s.title}</div>
                  <div className="mt-1 text-slate-400">{s.body}</div>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-2xl border border-neutral-800 bg-black p-6">
            <div className="text-sm font-semibold">Best for</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.bestFor.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1 text-xs text-slate-300"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-6 text-sm font-semibold">Avoid these mistakes</div>
            <ul className="mt-3 space-y-2 text-xs text-slate-400">
              {data.mistakes.map((m) => (
                <li key={m} className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 flex-none rounded-full bg-rose-400/70" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-neutral-800 bg-black p-6">
            <h2 className="text-lg font-semibold">Step-by-step</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-300">
              {data.steps.map((step, idx) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg border border-neutral-700 bg-neutral-950 text-xs text-slate-200">
                    {idx + 1}
                  </span>
                  <span className="text-slate-400">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
            <h2 className="text-lg font-semibold">Quick template</h2>
            <p className="mt-2 text-sm text-slate-400">Copy this into your notes and use it immediately.</p>
            <div className="mt-4 rounded-2xl border border-neutral-800 bg-black p-4">
              <ul className="space-y-2 text-sm text-slate-300">
                {data.quickTemplate.map((line) => (
                  <li key={line} className="text-slate-400">
                    <span className="text-slate-200">•</span> {line}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`${userPrefix}/dashboard`}
            className="inline-flex items-center rounded-xl border border-neutral-700 bg-black px-4 py-2 text-sm text-slate-100 hover:bg-neutral-900"
          >
            Back to Dashboard
          </Link>
          <Link
            href={`${userPrefix}/methods`}
            className="inline-flex items-center rounded-xl border border-neutral-700 bg-black px-4 py-2 text-sm text-slate-100 hover:bg-neutral-900"
          >
            Browse Methods
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
