"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import wordsData from "@/lib/typingWords.en.json";

type Wordlist = {
  name: string;
  words: string[];
};

type TestState = "idle" | "running" | "finished";

type CharCount = {
  spaces: number;
  correctWordChars: number;
  allCorrectChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  correctSpaces: number;
};

function pickRandomWords(words: string[], count: number) {
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(words[Math.floor(Math.random() * words.length)]);
  }
  return out;
}

function splitWordsKeepTrailingSpace(text: string) {
  if (!text) return [""];
  return text.split(" ");
}

function countChars(args: {
  inputWords: string[];
  targetWords: string[];
  final: boolean;
  isTimedTest: boolean;
}): CharCount {
  const { inputWords, targetWords, final, isTimedTest } = args;

  let correctWordChars = 0;
  let correctChars = 0;
  let incorrectChars = 0;
  let extraChars = 0;
  let missedChars = 0;
  let spaces = 0;
  let correctSpaces = 0;

  const shouldCountPartialLastWord = !final || (final && isTimedTest);

  for (let i = 0; i < inputWords.length; i += 1) {
    const inputWord = inputWords[i] ?? "";
    const targetWord = targetWords[i] ?? "";

    if (inputWord === targetWord) {
      correctWordChars += targetWord.length;
      correctChars += targetWord.length;
      if (i < inputWords.length - 1) {
        correctSpaces += 1;
      }
    } else if (inputWord.length >= targetWord.length) {
      for (let c = 0; c < inputWord.length; c += 1) {
        if (c < targetWord.length) {
          if (inputWord[c] === targetWord[c]) {
            correctChars += 1;
          } else {
            incorrectChars += 1;
          }
        } else {
          extraChars += 1;
        }
      }
    } else {
      let partialCorrect = 0;
      let partialIncorrect = 0;
      let partialMissed = 0;

      for (let c = 0; c < targetWord.length; c += 1) {
        if (c < inputWord.length) {
          if (inputWord[c] === targetWord[c]) {
            partialCorrect += 1;
          } else {
            partialIncorrect += 1;
          }
        } else {
          partialMissed += 1;
        }
      }

      correctChars += partialCorrect;
      incorrectChars += partialIncorrect;

      if (i === inputWords.length - 1 && shouldCountPartialLastWord) {
        if (partialIncorrect === 0) {
          correctWordChars += partialCorrect;
        }
      } else {
        missedChars += partialMissed;
      }
    }

    if (i < inputWords.length - 1) {
      spaces += 1;
    }
  }

  return {
    spaces,
    correctWordChars,
    allCorrectChars: correctChars,
    incorrectChars,
    extraChars,
    missedChars,
    correctSpaces,
  };
}

function calcWpmFromChars(chars: number, elapsedSeconds: number) {
  if (elapsedSeconds <= 0) return 0;
  const minutes = elapsedSeconds / 60;
  // Monkeytype-like: 5 chars = 1 word
  return (chars / 5) / minutes;
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
  const [now, setNow] = useState<number>(() => performance.now());

  const [words, setWords] = useState<string[]>(() => pickRandomWords(wordlist.words, 200));
  const expectedText = useMemo(() => words.join(" "), [words]);

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const caretTargetRef = useRef<HTMLSpanElement | null>(null);
  const textAreaRef = useRef<HTMLDivElement | null>(null);
  const [caretStyle, setCaretStyle] = useState<{ x: number; y: number; h: number } | null>(
    null,
  );

  const elapsedSeconds = useMemo(() => {
    if (!startedAt) return 0;
    const delta = (now - startedAt) / 1000;
    return Math.max(0, delta);
  }, [now, startedAt]);

  const remainingSeconds = useMemo(() => {
    if (state === "idle") return duration;
    const left = duration - elapsedSeconds;
    return Math.max(0, Math.ceil(left));
  }, [duration, elapsedSeconds, state]);

  useEffect(() => {
    if (state !== "running") return;

    const t = window.setInterval(() => setNow(performance.now()), 100);
    return () => window.clearInterval(t);
  }, [state]);

  useEffect(() => {
    if (state !== "running") return;
    if (remainingSeconds > 0) return;
    setState("finished");
  }, [remainingSeconds, state]);

  const inputWords = useMemo(() => splitWordsKeepTrailingSpace(input), [input]);
  const targetWords = useMemo(() => splitWordsKeepTrailingSpace(expectedText), [expectedText]);

  const chars = useMemo(() => {
    return countChars({ inputWords, targetWords, final: state === "finished", isTimedTest: true });
  }, [inputWords, state, targetWords]);

  const testSeconds = useMemo(() => {
    if (!startedAt) return 0;
    const s = Math.min(duration, elapsedSeconds);
    return s <= 0 ? 0 : s;
  }, [duration, elapsedSeconds, startedAt]);

  const wpm = useMemo(() => {
    if (!startedAt || testSeconds <= 0) return 0;
    const value = calcWpmFromChars(chars.correctWordChars + chars.correctSpaces, testSeconds);
    return Math.round(value);
  }, [chars.correctSpaces, chars.correctWordChars, startedAt, testSeconds]);

  const rawWpm = useMemo(() => {
    if (!startedAt || testSeconds <= 0) return 0;
    const value = calcWpmFromChars(
      chars.allCorrectChars + chars.spaces + chars.incorrectChars + chars.extraChars,
      testSeconds,
    );
    return Math.round(value);
  }, [chars.allCorrectChars, chars.extraChars, chars.incorrectChars, chars.spaces, startedAt, testSeconds]);

  const accuracy = useMemo(() => {
    const correct = chars.allCorrectChars;
    const incorrect = chars.incorrectChars + chars.extraChars;
    const acc = (correct / (correct + incorrect)) * 100;
    return Number.isFinite(acc) ? Math.max(0, Math.min(100, Math.round(acc))) : 100;
  }, [chars.allCorrectChars, chars.extraChars, chars.incorrectChars]);

  const correctWords = useMemo(() => {
    let count = 0;
    for (let i = 0; i < inputWords.length; i += 1) {
      if (inputWords[i] && inputWords[i] === targetWords[i]) count += 1;
    }
    return count;
  }, [inputWords, targetWords]);

  const totalTypedWords = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [input]);

  function startIfNeeded(nextInput: string) {
    if (state !== "idle") return;
    if (!nextInput) return;
    setStartedAt(performance.now());
    setNow(performance.now());
    setState("running");
  }

  function reset(nextDuration?: 15 | 30 | 60) {
    const d = nextDuration ?? duration;
    setDuration(d);
    setState("idle");
    setStartedAt(null);
    setNow(performance.now());
    setInput("");
    setWords(pickRandomWords(wordlist.words, 200));

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const canType = state !== "finished";

  const expectedChars = useMemo(() => expectedText.split(""), [expectedText]);
  const typedChars = useMemo(() => input.split(""), [input]);

  const renderedChars = useMemo(() => {
    const maxLen = Math.max(expectedChars.length, typedChars.length);
    const out: Array<{
      exp: string;
      typed?: string;
      isExtra: boolean;
      isTyped: boolean;
      isCorrect: boolean;
      index: number;
      isCaret: boolean;
    }> = [];

    for (let i = 0; i < maxLen; i += 1) {
      const exp = expectedChars[i] ?? "";
      const typed = typedChars[i];
      const isTyped = i < typedChars.length;
      const isExtra = i >= expectedChars.length && isTyped;
      const isCorrect = isTyped && !isExtra && typed === exp;
      const isCaret = i === typedChars.length;
      out.push({ exp, typed, isExtra, isTyped, isCorrect, index: i, isCaret });
    }

    if (typedChars.length === expectedChars.length) {
      out.push({
        exp: "",
        typed: undefined,
        isExtra: false,
        isTyped: false,
        isCorrect: false,
        index: maxLen,
        isCaret: true,
      });
    }

    return out;
  }, [expectedChars, typedChars]);

  useLayoutEffect(() => {
    const el = caretTargetRef.current;
    const area = textAreaRef.current;
    if (!el || !area) {
      setCaretStyle(null);
      return;
    }

    const areaRect = area.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const x = elRect.left - areaRect.left;
    const y = elRect.top - areaRect.top;
    const h = elRect.height || 20;
    setCaretStyle({ x, y, h });

    const wantsScroll = area.scrollHeight > area.clientHeight;
    if (wantsScroll) {
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [renderedChars.length, state, input]);

  useEffect(() => {
    function onResize() {
      setNow(performance.now());
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
                Raw: <span className="text-slate-100">{rawWpm}</span>
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

          <div
            className="mt-6 rounded-2xl border border-neutral-800 bg-black/20 px-5 py-4"
            onMouseDown={(e) => {
              e.preventDefault();
              inputRef.current?.focus();
            }}
          >
            <div
              ref={textAreaRef}
              className="relative h-40 overflow-y-auto text-2xl leading-relaxed text-slate-400 whitespace-pre-wrap break-words"
            >
              {caretStyle && state !== "finished" ? (
                <div
                  className="pointer-events-none absolute top-0 left-0 w-[2px] bg-slate-100/90 transition-transform duration-75 animate-pulse"
                  style={{
                    height: `${caretStyle.h}px`,
                    transform: `translate(${caretStyle.x}px, ${caretStyle.y}px)`,
                  }}
                />
              ) : null}

              {renderedChars.map((ch) => {
                const show = ch.isTyped ? (ch.typed ?? "") : ch.exp;

                const color = !ch.isTyped
                  ? "text-slate-500"
                  : ch.isExtra
                    ? "bg-red-500/10 text-red-300"
                    : ch.isCorrect
                      ? "text-slate-100"
                      : "text-red-300";

                const needsCaretRef = ch.isCaret;

                return (
                  <span
                    key={`c-${ch.index}`}
                    ref={needsCaretRef ? caretTargetRef : undefined}
                    className={`relative ${color}`}
                  >
                    {show}
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
                if (state === "finished") return;
                const next = e.target.value;
                startIfNeeded(next);
                setInput(next);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  reset();
                  return;
                }

                if (state === "finished") {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    reset();
                  }
                  return;
                }

                if (e.ctrlKey || e.metaKey || e.altKey) return;

                if (e.key === "Enter") {
                  e.preventDefault();
                  return;
                }

                if (e.key === "Tab") {
                  e.preventDefault();
                  return;
                }

                if (e.key === "Backspace") {
                  e.preventDefault();
                  if (!input) return;
                  const next = input.slice(0, -1);
                  setInput(next);
                  return;
                }

                if (e.key === " ") {
                  e.preventDefault();
                  if (!input) return;
                  if (input.endsWith(" ")) return;
                  const next = input + " ";
                  startIfNeeded(next);
                  setInput(next);
                  return;
                }

                if (e.key.length === 1) {
                  e.preventDefault();
                  const next = input + e.key;
                  startIfNeeded(next);
                  setInput(next);
                }
              }}
              className="absolute left-[-9999px] top-auto h-px w-px opacity-0"
              aria-label="Typing input"
              />
            <div className="mt-2 text-xs text-slate-500">
              Click the text area and start typing. Press <span className="text-slate-300">Esc</span> to restart.
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
                  Raw: <span className="text-slate-100">{rawWpm}</span>
                </span>
                <span className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1">
                  Accuracy: <span className="text-slate-100">{accuracy}%</span>
                </span>
                <span className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1">
                  Correct words: <span className="text-slate-100">{correctWords}</span>
                </span>
                <span className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1">
                  Errors: <span className="text-slate-100">{chars.incorrectChars + chars.extraChars}</span>
                </span>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </DashboardShell>
  );
}
