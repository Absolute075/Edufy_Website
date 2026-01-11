"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import wordsData from "@/lib/typingWords.en.json";

type Wordlist = {
  name: string;
  words: string[];
};

type TestState = "idle" | "running" | "finished";

type TokenEval = {
  expected: string;
  typed: string;
  correct: boolean;
};

function pickRandomWords(words: string[], count: number) {
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(words[Math.floor(Math.random() * words.length)]);
  }
  return out;
}

function countCorrectChars(expected: string, typed: string) {
  const len = Math.min(expected.length, typed.length);
  let correct = 0;
  for (let i = 0; i < len; i += 1) {
    if (expected[i] === typed[i]) correct += 1;
  }
  return correct;
}

function calcWpm(correctChars: number, elapsedSeconds: number) {
  if (elapsedSeconds <= 0) return 0;
  const minutes = elapsedSeconds / 60;
  // Monkeytype-like: 5 chars = 1 word
  return Math.round((correctChars / 5) / minutes);
}

export default function PracticePage() {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";

  const resourcesHref = `${userPrefix}/resources`;

  const wordlist = wordsData as Wordlist;

  const [duration, setDuration] = useState<15 | 30 | 60>(30);
  const [state, setState] = useState<TestState>("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  const [words, setWords] = useState<string[]>(() => pickRandomWords(wordlist.words, 60));
  const expectedText = useMemo(() => words.join(" "), [words]);

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const elapsedSeconds = useMemo(() => {
    if (!startedAt) return 0;
    const delta = Math.floor((now - startedAt) / 1000);
    return Math.max(0, delta);
  }, [now, startedAt]);

  const remainingSeconds = useMemo(() => {
    if (state === "idle") return duration;
    const left = duration - elapsedSeconds;
    return Math.max(0, left);
  }, [duration, elapsedSeconds, state]);

  useEffect(() => {
    if (state !== "running") return;

    const t = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(t);
  }, [state]);

  useEffect(() => {
    if (state !== "running") return;
    if (remainingSeconds > 0) return;
    setState("finished");
  }, [remainingSeconds, state]);

  const tokens = useMemo<TokenEval[]>(() => {
    const expectedTokens = expectedText.split(" ");
    const typedTokens = input.trimEnd().split(" ");

    return expectedTokens.map((expected, idx) => {
      const typed = typedTokens[idx] ?? "";
      const correct = typed.length > 0 && typed === expected;
      return { expected, typed, correct };
    });
  }, [expectedText, input]);

  const correctWords = useMemo(() => tokens.filter((t) => t.correct).length, [tokens]);
  const totalTypedWords = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [input]);

  const correctChars = useMemo(() => {
    // only evaluate up to expected length
    return countCorrectChars(expectedText, input);
  }, [expectedText, input]);

  const totalTypedChars = useMemo(() => input.length, [input]);

  const accuracy = useMemo(() => {
    if (totalTypedChars === 0) return 100;
    const pct = (correctChars / totalTypedChars) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }, [correctChars, totalTypedChars]);

  const wpm = useMemo(() => {
    const seconds = state === "idle" ? 0 : Math.min(duration, elapsedSeconds);
    return calcWpm(correctChars, seconds);
  }, [correctChars, duration, elapsedSeconds, state]);

  function startIfNeeded(nextInput: string) {
    if (state !== "idle") return;
    if (!nextInput) return;
    setStartedAt(Date.now());
    setNow(Date.now());
    setState("running");
  }

  function reset(nextDuration?: 15 | 30 | 60) {
    const d = nextDuration ?? duration;
    setDuration(d);
    setState("idle");
    setStartedAt(null);
    setNow(Date.now());
    setInput("");
    setWords(pickRandomWords(wordlist.words, 60));

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const canType = state !== "finished";

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <div className="text-xs text-slate-400">
            <Link href={resourcesHref} className="hover:text-slate-200">
              Resources
            </Link>
            <span className="mx-2 text-slate-600">/</span>
            <span className="text-slate-200">Practice</span>
          </div>
          <h1 className="text-2xl font-semibold">Typing Practice</h1>
          <p className="text-sm text-slate-400">
            Train your typing speed and accuracy with a short English word test.
          </p>
        </div>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {([15, 30, 60] as const).map((sec) => {
                const active = duration === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => reset(sec)}
                    className={`rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                      active
                        ? "border-white/60 bg-white text-black"
                        : "border-neutral-700 bg-neutral-950 text-slate-200 hover:border-white/60 hover:bg-neutral-900"
                    }`}
                  >
                    {sec}s
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => reset()}
                className="rounded-full border border-neutral-700 bg-neutral-950 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-200 transition-colors hover:border-white/60 hover:bg-neutral-900"
              >
                Restart
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1">
                Time: <span className="text-slate-100">{remainingSeconds}s</span>
              </span>
              <span className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1">
                WPM: <span className="text-slate-100">{wpm}</span>
              </span>
              <span className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1">
                Accuracy: <span className="text-slate-100">{accuracy}%</span>
              </span>
              <span className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1">
                Words: <span className="text-slate-100">{correctWords}</span>
                <span className="text-slate-500">/{totalTypedWords}</span>
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-neutral-800 bg-black/20 px-5 py-4">
            <div className="flex flex-wrap gap-2 text-sm leading-relaxed">
              {tokens.map((t, idx) => {
                const typedTokens = input.trimEnd().split(" ");
                const hasTyped = idx < typedTokens.length;
                const isCurrent = idx === typedTokens.length;

                const base = "rounded px-1";
                const color = !hasTyped
                  ? "text-slate-400"
                  : t.correct
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-red-500/10 text-red-300";

                const ring = isCurrent && state !== "finished" ? " ring-1 ring-white/30" : "";

                return (
                  <span key={`${t.expected}-${idx}`} className={base + " " + color + ring}>
                    {t.expected}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <input
              ref={inputRef}
              type="text"
              value={input}
              disabled={!canType}
              onChange={(e) => {
                const next = e.target.value;
                startIfNeeded(next);
                setInput(next);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  reset();
                }
              }}
              className={`w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 ease-out focus:outline-none focus:ring-1 focus:ring-white/40 ${
                canType
                  ? "border-neutral-800 bg-neutral-950 text-slate-100 placeholder:text-slate-500 hover:border-white/60 focus:border-white"
                  : "border-neutral-900 bg-neutral-950 text-slate-500"
              }`}
              placeholder={
                state === "finished"
                  ? "Test finished. Press Restart or Enter."
                  : "Start typing here..."
              }
            />
            <div className="mt-2 text-xs text-slate-500">
              Tip: typing starts the timer. Press <span className="text-slate-300">Enter</span> to restart.
            </div>
          </div>

          {state === "finished" ? (
            <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 px-5 py-4">
              <div className="text-sm text-slate-200">Result</div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-300">
                <span className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1">
                  WPM: <span className="text-slate-100">{wpm}</span>
                </span>
                <span className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1">
                  Accuracy: <span className="text-slate-100">{accuracy}%</span>
                </span>
                <span className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1">
                  Correct words: <span className="text-slate-100">{correctWords}</span>
                </span>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </DashboardShell>
  );
}
