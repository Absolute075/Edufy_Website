"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Roboto_Mono } from "next/font/google";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import baseWordsData from "@/lib/typingWords.en.json";

const monkeytypeMono = Roboto_Mono({ subsets: ["latin"], display: "swap" });

type Wordlist = {
  name: string;
  words: string[];
};

type WordlistId =
  | "english"
  | "english_1k"
  | "english_5k"
  | "english_10k"
  | "english_25k"
  | "english_450k"
  | "english_commonly_misspelled"
  | "english_contractions"
  | "english_doubleletter"
  | "english_shakespearean"
  | "english_old"
  | "english_medical";

const WORDLIST_OPTIONS: Array<{ id: WordlistId; label: string }> = [
  { id: "english", label: "english" },
  { id: "english_1k", label: "english 1k" },
  { id: "english_5k", label: "english 5k" },
  { id: "english_10k", label: "english 10k" },
  { id: "english_25k", label: "english 25k" },
  { id: "english_450k", label: "english 450k" },
  { id: "english_commonly_misspelled", label: "english commonly misspelled" },
  { id: "english_contractions", label: "english contractions" },
  { id: "english_doubleletter", label: "english doubleletter" },
  { id: "english_shakespearean", label: "english shakespearean" },
  { id: "english_old", label: "english old" },
  { id: "english_medical", label: "english medical" },
];

async function loadWordlist(id: WordlistId): Promise<Wordlist> {
  if (id === "english") return baseWordsData as Wordlist;

  const mod = await (id === "english_1k"
    ? import("@/lib/typingWords.english_1k.json")
    : id === "english_5k"
      ? import("@/lib/typingWords.english_5k.json")
      : id === "english_10k"
        ? import("@/lib/typingWords.english_10k.json")
        : id === "english_25k"
          ? import("@/lib/typingWords.english_25k.json")
          : id === "english_450k"
            ? import("@/lib/typingWords.english_450k.json")
            : id === "english_commonly_misspelled"
              ? import("@/lib/typingWords.english_commonly_misspelled.json")
              : id === "english_contractions"
                ? import("@/lib/typingWords.english_contractions.json")
                : id === "english_doubleletter"
                  ? import("@/lib/typingWords.english_doubleletter.json")
                  : id === "english_shakespearean"
                    ? import("@/lib/typingWords.english_shakespearean.json")
                    : id === "english_old"
                      ? import("@/lib/typingWords.english_old.json")
                      : import("@/lib/typingWords.english_medical.json"));

  return (mod as unknown as { default: Wordlist }).default;
}

type TestState = "idle" | "running" | "finished";

type Mode = "time" | "words";

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

function buildEnglishText(args: {
  words: string[];
  count: number;
  punctuation: boolean;
  numbers: boolean;
}) {
  const { words, count, punctuation, numbers } = args;
  const base = pickRandomWords(words, count);

  const p = [",", ".", "?", "!", ";", ":"];

  const out = base.map((w) => {
    let next = w;
    if (numbers && Math.random() < 0.06) {
      next = String(Math.floor(Math.random() * 100)) + next;
    }
    if (punctuation && Math.random() < 0.18) {
      next = next + p[Math.floor(Math.random() * p.length)];
    }
    return next;
  });

  return out;
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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17h4V11H8.5A3.5 3.5 0 0 1 12 7.5V7" />
      <path d="M13 17h4V11h-2.5A3.5 3.5 0 0 1 18 7.5V7" />
    </svg>
  );
}

function ToolsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 7.5a5.3 5.3 0 0 1-6.7 5.1l-6.6 6.6a2 2 0 0 1-2.8-2.8l6.6-6.6A5.3 5.3 0 0 1 16.5 3l-2.2 2.2L16 6.9 18.7 4.2 21 7.5Z" />
      <path d="M14 14l6 6" />
      <path d="M16 20l4-4" />
    </svg>
  );
}

function formatDurationHuman(seconds: number): string {
  if (seconds === 0) return "infinite";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (h > 0) parts.push(`${h} ${h === 1 ? "hour" : "hours"}`);
  if (m > 0) parts.push(`${m} ${m === 1 ? "minute" : "minutes"}`);
  if (s > 0 && h === 0) parts.push(`${s} ${s === 1 ? "second" : "seconds"}`);
  return parts.length ? parts.join(" ") : "0 seconds";
}

function formatDurationHumanFull(seconds: number): string {
  if (seconds === 0) return "infinite";
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const parts: string[] = [];
  if (h > 0) parts.push(`${h} ${h === 1 ? "hour" : "hours"}`);
  if (m > 0) parts.push(`${m} ${m === 1 ? "minute" : "minutes"}`);
  if (s > 0 || parts.length === 0) parts.push(`${s} ${s === 1 ? "second" : "seconds"}`);
  return parts.join(" ");
}

function formatDurationInput(seconds: number): string {
  if (seconds === 0) return "0";
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  let out = "";
  if (h > 0) out += `${h}h`;
  if (m > 0) out += `${m}m`;
  if (s > 0 || !out) out += `${s}s`;
  return out;
}

function formatTimerDisplay(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return String(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h >= 1) {
    return `${h}:${String(m).padStart(2, "0")}`;
  }
  return `${m}:${String(ss).padStart(2, "0")}`;
}

function parseDurationSeconds(input: string): number | null {
  const rawWithSpaces = input.trim().toLowerCase();
  const raw = rawWithSpaces.replace(/\s+/g, "");
  if (!raw) return null;
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const asNumber = Number(raw);
    if (!Number.isFinite(asNumber) || asNumber < 0) return null;
    return Math.round(asNumber);
  }

  const normalized = raw.replace(/hm(?=\d)/g, "h");

  const tokenRe = /(\d+(?:\.\d+)?)([hms])/g;
  let totalSeconds = 0;
  let matchedAny = false;

  let lastEnd = 0;
  for (;;) {
    const m = tokenRe.exec(normalized);
    if (m === null) break;
    matchedAny = true;
    if (m.index !== lastEnd) return null;
    lastEnd = tokenRe.lastIndex;
    const value = Number(m[1]);
    const unit = m[2];
    if (!Number.isFinite(value) || value < 0) return null;
    if (unit === "h") totalSeconds += value * 3600;
    else if (unit === "m") totalSeconds += value * 60;
    else totalSeconds += value;
  }

  if (!matchedAny) return null;
  if (lastEnd !== normalized.length) return null;

  return Math.round(totalSeconds);
}

function SettingsModal(props: {
  mode: Mode;
  duration: number;
  wordsLimit: number;
  strict: boolean;
  onClose: () => void;
  onApplyWords: (words: number) => void;
  onApplyDuration: (seconds: number) => void;
  onToggleStrict: () => void;
}) {
  const { mode, duration, wordsLimit, strict, onClose, onApplyWords, onApplyDuration, onToggleStrict } = props;

  const [customWordsValue, setCustomWordsValue] = useState<string>(String(wordsLimit));
  const [customTimeValue, setCustomTimeValue] = useState<string>(() => formatDurationInput(duration));
  const [settingsError, setSettingsError] = useState<string>("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-semibold text-slate-100">
          {mode === "words" ? "Custom Word Amount" : "Test duration"}
        </div>
        {mode === "time" ? (
          <div className="mt-1 text-xs text-slate-500">
            <div>
              Current: {duration === 0 ? "infinite" : formatDurationHumanFull(duration)}
            </div>
            <div>
              Input: {(() => {
                const parsed = parseDurationSeconds(customTimeValue);
                if (parsed === null) return "invalid";
                if (parsed !== 0 && parsed > 24 * 3600) return "max 24h";
                return formatDurationHumanFull(parsed);
              })()}
            </div>
          </div>
        ) : null}

        <div className="mt-4">
          <input
            value={mode === "words" ? customWordsValue : customTimeValue}
            onChange={(e) => {
              setSettingsError("");
              if (mode === "words") setCustomWordsValue(e.target.value);
              else setCustomTimeValue(e.target.value);
            }}
            className="w-full rounded-xl border border-neutral-800 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none focus:border-neutral-500"
            placeholder={mode === "words" ? "25" : "30"}
            autoFocus
          />
        </div>

        <div className="mt-3 text-xs text-slate-500">
          {mode === "words" ? (
            <>You can start an infinite test by inputting 0. Then, to stop the test, use esc</>
          ) : (
            <>
              Formats: 30 (seconds), 1h, 30m, 120m (2h), 1h30m, 15h47m. Max 24h.
              <div className="mt-2">You can start an infinite test by inputting 0. Then, to stop the test, use esc</div>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-neutral-900 bg-black/20 px-4 py-3">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">strict</div>
          <button
            type="button"
            onClick={onToggleStrict}
            className={`rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              strict
                ? "border-neutral-500 bg-black/30 text-white"
                : "border-neutral-800 bg-black/20 text-slate-300 hover:border-neutral-600 hover:text-white"
            }`}
          >
            {strict ? "on" : "off"}
          </button>
        </div>

        {settingsError ? <div className="mt-3 text-xs text-red-300">{settingsError}</div> : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-full border border-neutral-800 bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition-colors hover:text-white"
            onClick={onClose}
          >
            cancel
          </button>
          <button
            type="button"
            className="rounded-full border border-neutral-700 bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition-colors hover:border-neutral-500 hover:text-white"
            onClick={() => {
              if (mode === "words") {
                const n = Number(customWordsValue.trim());
                if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
                  setSettingsError("Enter a non-negative integer.");
                  return;
                }
                onApplyWords(n);
                return;
              }

              const parsed = parseDurationSeconds(customTimeValue);
              if (parsed === null) {
                setSettingsError("Enter seconds (e.g. 30) or use h/m (e.g. 1h30m). Max 24h.");
                return;
              }
              if (parsed !== 0 && parsed > 24 * 3600) {
                setSettingsError("Max duration is 24h.");
                return;
              }
              onApplyDuration(parsed);
            }}
          >
            apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PracticePage() {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";

  const [wordlistId, setWordlistId] = useState<WordlistId>("english");
  const [wordlist, setWordlist] = useState<Wordlist>(() => baseWordsData as Wordlist);
  const pendingWordlistResetRef = useRef(false);

  const [mode, setMode] = useState<Mode>("time");
  const [duration, setDuration] = useState<number>(30);
  const [wordsLimit, setWordsLimit] = useState<number>(25);
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [strict, setStrict] = useState<boolean>(false);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [state, setState] = useState<TestState>("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => performance.now());

  const generatedWordCount = useMemo(() => {
    if (mode === "words") return wordsLimit === 0 ? 200 : wordsLimit;
    const seconds = duration === 0 ? 30 : duration;
    return Math.max(200, Math.min(5000, seconds * 10));
  }, [duration, mode, wordsLimit]);

  const [words, setWords] = useState<string[]>(() =>
    buildEnglishText({ words: wordlist.words, count: 300, punctuation: false, numbers: false }),
  );
  const expectedText = useMemo(() => words.join(" "), [words]);

  const [historyWords, setHistoryWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string>("");
  const [correctedCount, setCorrectedCount] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const caretTargetRef = useRef<HTMLSpanElement | null>(null);
  const textAreaRef = useRef<HTMLDivElement | null>(null);
  const wordlistDropdownRef = useRef<HTMLDivElement | null>(null);
  const lastSampleSecondRef = useRef<number>(-1);
  const lastNowUpdateRef = useRef<number>(0);
  const skipIdleRegenRef = useRef<boolean>(false);
  const burstStartRef = useRef<number | null>(null);
  const lastBurstWpmRef = useRef<number>(0);
  const [caretStyle, setCaretStyle] = useState<{ x: number; y: number; h: number } | null>(
    null,
  );
  const [lineHeightPx, setLineHeightPx] = useState<number>(44);
  const [textOffsetY, setTextOffsetY] = useState<number>(0);

  const [samples, setSamples] = useState<
    Array<{ t: number; wpm: number; raw: number; burst: number; errors: number }>
  >([]);

  const [isWordlistOpen, setIsWordlistOpen] = useState(false);
  const currentWordlistLabel = useMemo(() => {
    return WORDLIST_OPTIONS.find((o) => o.id === wordlistId)?.label ?? wordlistId;
  }, [wordlistId]);

  useEffect(() => {
    if (!isWordlistOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest(".rounded-dropdown")) setIsWordlistOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsWordlistOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isWordlistOpen]);

  useEffect(() => {
    let alive = true;
    if (wordlistId === "english") {
      setWordlist(baseWordsData as Wordlist);
      return;
    }

    loadWordlist(wordlistId)
      .then((wl) => {
        if (!alive) return;
        setWordlist(wl);
      })
      .catch(() => {
        if (!alive) return;
        setWordlist(baseWordsData as Wordlist);
        setWordlistId("english");
      });

    return () => {
      alive = false;
    };
  }, [wordlistId]);

  const [chartVisibility, setChartVisibility] = useState<{
    scale: boolean;
    pbLine: boolean;
    raw: boolean;
    burst: boolean;
    errors: boolean;
  }>({
    scale: true,
    pbLine: true,
    raw: true,
    burst: true,
    errors: true,
  });

  const [pbWpm, setPbWpm] = useState<number>(0);
  const [useSmoothedBurst, setUseSmoothedBurst] = useState<boolean>(true);
  const [chartHover, setChartHover] = useState<{ index: number; xPx: number; yPx: number } | null>(
    null,
  );
  const chartWrapRef = useRef<HTMLDivElement | null>(null);

  const elapsedSeconds = useMemo(() => {
    if (!startedAt) return 0;
    const delta = (now - startedAt) / 1000;
    return Math.max(0, delta);
  }, [now, startedAt]);

  const remainingSeconds = useMemo(() => {
    if (mode !== "time") return 0;
    if (duration === 0) return 0;
    if (state === "idle") return duration;
    const left = duration - elapsedSeconds;
    return Math.max(0, Math.ceil(left));
  }, [duration, elapsedSeconds, mode, state]);

  const bumpNow = (ts: number = performance.now()) => {
    if (ts - lastNowUpdateRef.current < 50) return;
    lastNowUpdateRef.current = ts;
    setNow(ts);
  };

  useEffect(() => {
    if (state !== "running") return;
    if (mode !== "time") return;

    const t = window.setInterval(() => {
      setNow(performance.now());
    }, 1000);

    return () => window.clearInterval(t);
  }, [mode, state]);

  useEffect(() => {
    if (state !== "running") return;
    if (mode !== "time") return;
    if (duration === 0) return;
    if (remainingSeconds > 0) return;
    setState("finished");
  }, [duration, mode, remainingSeconds, state]);

  const inputWordIndex = historyWords.length;

  const inputWordsForStats = useMemo(() => {
    if (!currentWord) return historyWords;
    return [...historyWords, currentWord];
  }, [currentWord, historyWords]);

  useEffect(() => {
    if (state !== "running") return;
    if (mode !== "words") return;
    if (wordsLimit === 0) return;
    const typedLen =
      historyWords.join(" ").length +
      (historyWords.length > 0 && currentWord ? 1 : 0) +
      currentWord.length;
    if (typedLen < expectedText.length) return;
    setState("finished");
  }, [currentWord, expectedText.length, historyWords, mode, state, wordsLimit]);

  const targetWords = useMemo(() => words, [words]);

  useEffect(() => {
    if (state !== "running") return;
    if (mode !== "time") return;

    const remaining = words.length - inputWordIndex;
    if (remaining > 120) return;

    const extra = buildEnglishText({
      words: wordlist.words,
      count: 500,
      punctuation,
      numbers,
    });
    setWords((prev) => [...prev, ...extra]);
  }, [inputWordIndex, mode, numbers, punctuation, state, wordlist.words, words.length]);

  const chars = useMemo(() => {
    return countChars({
      inputWords: inputWordsForStats,
      targetWords,
      final: state === "finished",
      isTimedTest: mode === "time",
    });
  }, [inputWordsForStats, mode, state, targetWords]);

  const testSeconds = useMemo(() => {
    if (!startedAt) return 0;
    const s = mode === "time" && duration > 0 ? Math.min(duration, elapsedSeconds) : elapsedSeconds;
    return s <= 0 ? 0 : s;
  }, [duration, elapsedSeconds, mode, startedAt]);

  const wpmFloat = useMemo(() => {
    if (!startedAt || testSeconds <= 0) return 0;
    return calcWpmFromChars(chars.correctWordChars + chars.correctSpaces, testSeconds);
  }, [chars.correctSpaces, chars.correctWordChars, startedAt, testSeconds]);

  const wpm = useMemo(() => {
    return Math.round(wpmFloat);
  }, [wpmFloat]);

  const rawWpmFloat = useMemo(() => {
    if (!startedAt || testSeconds <= 0) return 0;
    return calcWpmFromChars(
      chars.allCorrectChars + chars.spaces + chars.incorrectChars + chars.extraChars,
      testSeconds,
    );
  }, [chars.allCorrectChars, chars.extraChars, chars.incorrectChars, chars.spaces, startedAt, testSeconds]);

  const rawWpm = useMemo(() => {
    return Math.round(rawWpmFloat);
  }, [rawWpmFloat]);

  const burstFloat = useMemo(() => {
    if (!startedAt) return lastBurstWpmRef.current;
    if (state !== "running") return lastBurstWpmRef.current;
    const start = burstStartRef.current ?? startedAt;
    const delta = (now - start) / 1000;
    if (delta <= 0) return 0;
    return calcWpmFromChars(currentWord.length, delta);
  }, [currentWord.length, now, startedAt, state]);

  const accuracy = useMemo(() => {
    const correct = chars.allCorrectChars;
    const incorrect = chars.incorrectChars + chars.extraChars;
    const acc = (correct / (correct + incorrect)) * 100;
    return Number.isFinite(acc) ? Math.max(0, Math.min(100, Math.round(acc))) : 100;
  }, [chars.allCorrectChars, chars.extraChars, chars.incorrectChars]);

  const correctWords = useMemo(() => {
    let count = 0;
    for (let i = 0; i < inputWordsForStats.length; i += 1) {
      if (inputWordsForStats[i] && inputWordsForStats[i] === targetWords[i]) count += 1;
    }
    return count;
  }, [inputWordsForStats, targetWords]);

  const totalTypedWords = useMemo(() => {
    return historyWords.length + (currentWord.trim() ? 1 : 0);
  }, [currentWord, historyWords.length]);

  useEffect(() => {
    if (state !== "running") return;
    if (!startedAt) return;
    const sec = Math.floor(testSeconds);
    if (sec < 0) return;
    if (sec === lastSampleSecondRef.current) return;
    lastSampleSecondRef.current = sec;
    setSamples((prev) => {
      if (prev.length > 0 && prev[prev.length - 1]?.t === sec) return prev;
      return [
        ...prev,
        {
          t: sec,
          wpm: wpmFloat,
          raw: rawWpmFloat,
          burst: burstFloat,
          errors: chars.incorrectChars + chars.extraChars,
        },
      ];
    });
  }, [
    burstFloat,
    chars.extraChars,
    chars.incorrectChars,
    rawWpmFloat,
    startedAt,
    state,
    testSeconds,
    wpmFloat,
  ]);

  const consistency = useMemo(() => {
    const values = samples.map((s) => s.wpm).filter((v) => Number.isFinite(v) && v > 0);
    if (values.length < 2) return 100;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean <= 0) return 100;
    const variance = values.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / values.length;
    const sd = Math.sqrt(variance);
    const score = 100 - (sd / mean) * 100;
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [samples]);

  const pbKey = useMemo(() => {
    return `edufy_practice_pb_${mode}_${mode === "time" ? duration : wordsLimit}_${punctuation ? 1 : 0}_${
      numbers ? 1 : 0
    }`;
  }, [duration, mode, numbers, punctuation, wordsLimit]);

  const smoothedBurstSamples = useMemo(() => {
    if (!useSmoothedBurst) return samples;
    if (samples.length < 3) return samples;

    const maxBurst = Math.max(0, ...samples.map((s) => s.burst));
    const valueWindow = maxBurst * 0.25;

    function smooth(arr: number[]) {
      const out: number[] = [];
      for (let i = 0; i < arr.length; i += 1) {
        const cur = arr[i] ?? 0;
        const a = arr[i - 1];
        const b = arr[i];
        const c = arr[i + 1];
        const vals = [a, b, c].filter((v): v is number => typeof v === "number" && Math.abs(v - cur) <= valueWindow);
        const avg = vals.length ? vals.reduce((p, q) => p + q, 0) / vals.length : cur;
        out.push(avg);
      }
      return out;
    }

    const burstArr = samples.map((s) => s.burst);
    const smoothed = smooth(burstArr);
    return samples.map((s, i) => ({ ...s, burst: smoothed[i] ?? s.burst }));
  }, [samples, useSmoothedBurst]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("edufy_practice_chart_visibility");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<typeof chartVisibility>;
      setChartVisibility((prev) => ({
        ...prev,
        ...parsed,
      }));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("edufy_practice_chart_visibility", JSON.stringify(chartVisibility));
    } catch {
      // ignore
    }
  }, [chartVisibility]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(pbKey);
      const n = raw ? Number(raw) : 0;
      setPbWpm(Number.isFinite(n) ? n : 0);
    } catch {
      setPbWpm(0);
    }
  }, [pbKey]);

  useEffect(() => {
    if (state !== "finished") return;
    if (wpm <= 0) return;
    if (wpm <= pbWpm) return;
    setPbWpm(wpm);
    try {
      window.localStorage.setItem(pbKey, String(wpm));
    } catch {
      // ignore
    }
  }, [pbKey, pbWpm, state, wpm]);

  function appendWords(extraCount: number) {
    if (extraCount <= 0) return;
    setWords((prev) => [
      ...prev,
      ...buildEnglishText({
        words: wordlist.words,
        count: extraCount,
        punctuation,
        numbers,
      }),
    ]);
  }

  function startIfNeeded(nextInput: string) {
    if (state !== "idle") return;
    if (!nextInput) return;
    const start = performance.now();
    setStartedAt(start);
    setNow(start);
    setState("running");
    burstStartRef.current = start;
    lastBurstWpmRef.current = 0;
  }

  function reset(nextDuration?: number, nextWordsLimit?: number) {
    const d = nextDuration ?? duration;
    const wl = nextWordsLimit ?? wordsLimit;

    setDuration(d);
    setWordsLimit(wl);
    setState("idle");
    setStartedAt(null);
    setNow(performance.now());
    setHistoryWords([]);
    setCurrentWord("");
    setCorrectedCount(0);
    setSamples([]);
    lastSampleSecondRef.current = -1;
    setTextOffsetY(0);
    burstStartRef.current = null;
    lastBurstWpmRef.current = 0;
    setWords(
      buildEnglishText({
        words: wordlist.words,
        count:
          mode === "words"
            ? wl === 0
              ? 200
              : wl
            : Math.max(200, Math.min(5000, (d === 0 ? 30 : d) * 10)),
        punctuation,
        numbers,
      }),
    );

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }

  useEffect(() => {
    if (!pendingWordlistResetRef.current) return;
    pendingWordlistResetRef.current = false;
    reset(duration, wordsLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordlist]);

  function repeatSameWordset() {
    skipIdleRegenRef.current = true;
    setState("idle");
    setStartedAt(null);
    setNow(performance.now());
    setHistoryWords([]);
    setCurrentWord("");
    setCorrectedCount(0);
    setSamples([]);
    lastSampleSecondRef.current = -1;
    setTextOffsetY(0);
    burstStartRef.current = null;
    lastBurstWpmRef.current = 0;

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Regenerate prompt when mode/options change.
    if (state !== "idle") return;
    if (skipIdleRegenRef.current) {
      skipIdleRegenRef.current = false;
      return;
    }
    setWords(
      buildEnglishText({
        words: wordlist.words,
        count: generatedWordCount,
        punctuation,
        numbers,
      }),
    );
  }, [generatedWordCount, numbers, punctuation, state, wordlist.words]);

  const canType = state !== "finished" && !settingsOpen;

  const renderedNodes = useMemo((): ReactNode[] => {
    const out: ReactNode[] = [];
    const caretWordIndex = inputWordIndex;
    const caretCharIndex = currentWord.length;

    const windowBefore = 30;
    const windowAfter = 120;
    const startWi = Math.max(0, caretWordIndex - windowBefore);
    const endWi = Math.min(targetWords.length, caretWordIndex + windowAfter);

    for (let wi = startWi; wi < endWi; wi += 1) {
      const expWord = targetWords[wi] ?? "";
      const typedCommitted = historyWords[wi] ?? "";
      const isCommitted = wi < historyWords.length;
      const isCurrent = wi === caretWordIndex;

      if (!isCommitted && !isCurrent) {
        out.push(
          <span key={`w-${wi}`} className="text-slate-500">
            {expWord}
          </span>,
        );
      } else {
        const typedWord = isCommitted ? typedCommitted : currentWord;
        const maxLen = Math.max(expWord.length, typedWord.length);

        for (let ci = 0; ci < maxLen; ci += 1) {
          const expCh = expWord[ci] ?? "";
          const typedCh = typedWord[ci];
          const hasTyped = ci < typedWord.length;
          const isExtra = ci >= expWord.length && hasTyped;
          const isMissed = isCommitted && ci >= typedWord.length && ci < expWord.length;

          const isCorrect = hasTyped && !isExtra && typedCh === expCh;

          const color = !hasTyped && !isMissed
            ? "text-slate-500"
            : isExtra
              ? "bg-red-500/10 text-red-300"
              : isCorrect
                ? "text-slate-100"
                : "text-red-300";

          const show = isExtra
            ? typedCh ?? ""
            : hasTyped
              ? isCorrect
                ? expCh
                : typedCh ?? ""
              : expCh;
          const caretHere = isCurrent && ci === caretCharIndex;

          out.push(
            <span
              key={`c-${wi}-${ci}`}
              ref={caretHere ? caretTargetRef : undefined}
              className={`relative ${color}`}
            >
              {show || (caretHere ? "\u200b" : "")}
            </span>,
          );
        }

        if (isCurrent && caretCharIndex === maxLen) {
          out.push(
            <span key={`caret-end-${wi}`} ref={caretTargetRef} className="relative text-slate-500">
              {"\u200b"}
            </span>,
          );
        }
      }

      if (wi < endWi - 1) {
        out.push(
          <span key={`sp-${wi}`} className="text-slate-500">
            {" "}
          </span>,
        );
      }
    }

    return out;
  }, [currentWord, historyWords, inputWordIndex, targetWords]);

  useEffect(() => {
    let raf = 0;

    raf = window.requestAnimationFrame(() => {
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
      setLineHeightPx((prev) => (h > 0 ? h : prev));
    });

    return () => window.cancelAnimationFrame(raf);
  }, [renderedNodes.length, state, currentWord, historyWords.length]);

  useEffect(() => {
    if (!caretStyle) return;

    const viewportLines = 3;
    const lh = lineHeightPx > 0 ? lineHeightPx : caretStyle.h || 44;

    // caretStyle.y is relative to the visible viewport; add current offset back to get the
    // caret position in the unshifted text flow.
    const caretYUnshifted = caretStyle.y - textOffsetY;
    const lineIndex = Math.floor(caretYUnshifted / lh);

    const desiredOffset = -Math.max(0, lineIndex - (viewportLines - 1)) * lh;
    if (Math.abs(desiredOffset - textOffsetY) < 0.5) return;
    setTextOffsetY(desiredOffset);
  }, [caretStyle, lineHeightPx, textOffsetY]);

  useEffect(() => {
    function onResize() {
      setNow(performance.now());
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <DashboardShell>
      <style jsx global>{`
        .practice-root .rounded-dropdown {
          position: relative;
          width: 100%;
          max-width: 100%;
        }

        .practice-root .rounded-dropdown.rounded-dropdown--inline {
          display: inline-block;
          width: 160px;
          margin: 0;
          vertical-align: middle;
        }

        .practice-root .rounded-dropdown.rounded-dropdown--inline .rounded-dropdown-trigger {
          padding: 6px 9px;
          border-radius: 9999px;
          font-size: 13px;
        }

        .practice-root .rounded-dropdown-trigger span:first-child {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .practice-root .rounded-dropdown-trigger {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid rgba(38, 38, 38, 1);
          background: rgba(0, 0, 0, 0.2);
          color: rgb(226, 232, 240);
          cursor: pointer;
        }

        .practice-root .rounded-dropdown-trigger:hover {
          border-color: rgba(64, 64, 64, 1);
        }

        .practice-root .rounded-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          bottom: auto;
          left: 0;
          width: 240px;
          max-height: 280px;
          overflow: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.55) transparent;
          padding: 8px;
          border-radius: 14px;
          border: 1px solid rgba(38, 38, 38, 1);
          background: rgba(3, 7, 18, 0.95);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65);
          opacity: 0;
          transform: translateY(-6px);
          pointer-events: none;
          transition: opacity 180ms ease, transform 180ms ease;
          z-index: 50;
        }

        .practice-root .rounded-dropdown-menu::-webkit-scrollbar {
          width: 8px;
        }

        .practice-root .rounded-dropdown-menu::-webkit-scrollbar-track {
          background: transparent;
        }

        .practice-root .rounded-dropdown-menu::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.55);
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .practice-root .rounded-dropdown-menu::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.75);
          background-clip: padding-box;
        }

        .practice-root .rounded-dropdown-menu.is-open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .practice-root .rounded-dropdown-item {
          width: 100%;
          border: none;
          background: transparent;
          padding: 8px 10px;
          border-radius: 10px;
          text-align: left;
          cursor: pointer;
          color: rgb(226, 232, 240);
        }

        .practice-root .rounded-dropdown-item:hover {
          background: rgba(255, 255, 255, 0.06);
        }
      `}</style>

      <div className={`practice-root ${monkeytypeMono.className} flex w-full flex-col gap-5`}>
        <div className="flex w-full items-center justify-center">
          {mode === "time" ? (
            <div className="select-none text-5xl font-semibold tracking-tight text-white">
              {duration === 0
                ? formatTimerDisplay(elapsedSeconds)
                : state === "idle"
                  ? formatTimerDisplay(duration)
                  : formatTimerDisplay(remainingSeconds)}
            </div>
          ) : null}
        </div>

        {state === "idle" ? (
          <div className="flex w-full flex-wrap items-center gap-3 text-sm text-slate-400">
            <button
              type="button"
              onClick={() => setPunctuation((v) => !v)}
              className={`group inline-flex items-center gap-2 transition-colors ${
                punctuation ? "text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="text-inherit">@</span>
              <span>punctuation</span>
            </button>

            <button
              type="button"
              onClick={() => setNumbers((v) => !v)}
              className={`group inline-flex items-center gap-2 transition-colors ${
                numbers ? "text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="text-inherit">#</span>
              <span>numbers</span>
            </button>

            <div className="text-slate-600">|</div>

            <button
              type="button"
              onClick={() => {
                setMode("time");
                reset(duration, wordsLimit);
              }}
              className={`inline-flex items-center gap-2 transition-colors ${
                mode === "time" ? "text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <ClockIcon className="h-4 w-4" />
              <span>time</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("words");
                reset(duration, wordsLimit);
              }}
              className={`inline-flex items-center gap-2 transition-colors ${
                mode === "words" ? "text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="text-inherit"><strong>A</strong></span>
              <span>words</span>
            </button>

            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 text-slate-600"
              aria-disabled="true"
            >
              <QuoteIcon className="h-4 w-4" />
              <span>quote</span>
            </button>

            <div className="text-slate-600">|</div>
            {mode === "time" ? (
              ([15, 30, 60, 120] as const).map((sec) => {
                const active = duration === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => reset(sec, wordsLimit)}
                    className={`text-sm transition-colors ${
                      active ? "text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {sec}
                  </button>
                );
              })
            ) : (
              ([10, 25, 50, 100] as const).map((cnt) => {
                const active = wordsLimit === cnt;
                return (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => reset(duration, cnt)}
                    className={`text-sm transition-colors ${
                      active ? "text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {cnt}
                  </button>
                );
              })
            )}

            <button
              type="button"
              onClick={() => {
                setSettingsOpen(true);
              }}
              className="inline-flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
              aria-label="custom settings"
            >
              <ToolsIcon className="h-5 w-5" />
            </button>

            <div
              ref={wordlistDropdownRef}
              className="rounded-dropdown rounded-dropdown--inline"
            >
              <button
                type="button"
                className="rounded-dropdown-trigger"
                onClick={() => setIsWordlistOpen((v) => !v)}
                aria-label="wordlist"
              >
                <span>{currentWordlistLabel}</span>
                <span aria-hidden="true" className="text-slate-400">
                  ▾
                </span>
              </button>

              <div
                className={`rounded-dropdown-menu${isWordlistOpen ? " is-open" : ""}`}
                role="listbox"
                aria-label="Select wordlist"
              >
                {WORDLIST_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className="rounded-dropdown-item"
                    onClick={() => {
                      pendingWordlistResetRef.current = true;
                      setIsWordlistOpen(false);
                      setWordlistId(opt.id);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {!settingsOpen ? (
          <>
            <div
              className="px-1"
              onMouseDown={(e) => {
                e.preventDefault();
                inputRef.current?.focus();
              }}
            >
              <div
                ref={textAreaRef}
                className="relative overflow-hidden whitespace-pre-wrap break-words text-2xl leading-[2.7rem] text-slate-400 selection:bg-white/20"
                style={{ height: `${lineHeightPx * 3}px` }}
              >
                {caretStyle && state !== "finished" ? (
                  <div
                    className="pointer-events-none absolute top-0 left-0 w-[2px] bg-white transition-transform duration-150 ease-out"
                    style={{
                      height: `${caretStyle.h}px`,
                      transform: `translate(${caretStyle.x}px, ${caretStyle.y}px)`,
                    }}
                  />
                ) : null}

                <div
                  className="relative transform-gpu transition-transform duration-300 ease-out will-change-transform"
                  style={{ transform: `translateY(${textOffsetY}px)` }}
                >
                  {renderedNodes}
                </div>
              </div>

              <div className="mt-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={currentWord}
                  disabled={!canType}
                  onChange={(e) => {
                    if (state === "finished") return;
                    const next = e.target.value;
                    startIfNeeded(next);
                    bumpNow();

                    if (next.includes(" ")) {
                      const parts = next.split(" ");
                      const committed = parts.slice(0, -1).filter((p) => p.length > 0);
                      const last = parts[parts.length - 1] ?? "";
                      if (committed.length > 0) {
                        setHistoryWords((prev) => [...prev, ...committed]);
                      }
                      setCurrentWord(last);
                      return;
                    }

                    setCurrentWord(next);
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
                      if (currentWord) {
                        const expectedWord = targetWords[inputWordIndex] ?? "";
                        const deleteIndex = currentWord.length - 1;
                        const deleted = currentWord[deleteIndex] ?? "";
                        const expected = expectedWord[deleteIndex] ?? "";
                        const wasExtra = deleteIndex >= expectedWord.length;
                        const wasIncorrect = wasExtra || deleted !== expected;
                        if (wasIncorrect) {
                          setCorrectedCount((v) => v + 1);
                        }
                        setCurrentWord((prev) => prev.slice(0, -1));
                        bumpNow();
                        return;
                      }
                      if (historyWords.length === 0) return;
                      const last = historyWords[historyWords.length - 1] ?? "";
                      setHistoryWords((prev) => prev.slice(0, -1));
                      setCurrentWord(last);
                      bumpNow();
                      return;
                    }

                    if (e.key === " ") {
                      e.preventDefault();
                      if (!currentWord) return;

                      const expectedWord = targetWords[inputWordIndex] ?? "";
                      if (strict && currentWord !== expectedWord) return;

                      startIfNeeded(currentWord);

                      const nowTs = performance.now();
                      bumpNow(nowTs);
                      const burstStart = burstStartRef.current ?? nowTs;
                      const burstSeconds = Math.max(0.001, (nowTs - burstStart) / 1000);
                      const burstChars = currentWord.length + 1;
                      lastBurstWpmRef.current = calcWpmFromChars(burstChars, burstSeconds);
                      burstStartRef.current = nowTs;

                      const nextTypedLen = [...historyWords, currentWord].join(" ").length;

                      setHistoryWords((prev) => [...prev, currentWord]);
                      setCurrentWord("");

                      if (
                        nextTypedLen + 30 > expectedText.length &&
                        (mode === "time" || wordsLimit === 0)
                      ) {
                        appendWords(50);
                      }
                      if (mode === "words" && wordsLimit !== 0 && nextTypedLen >= expectedText.length) {
                        setState("finished");
                      }
                      return;
                    }

                    if (e.key.length === 1) {
                      e.preventDefault();
                      const nowTs = performance.now();
                      bumpNow(nowTs);
                      const expectedWord = targetWords[inputWordIndex] ?? "";
                      const charIndex = currentWord.length;
                      const expectedCh = expectedWord[charIndex] ?? "";
                      const rawChar = e.key;
                      const nextChar =
                        expectedCh && expectedCh.toLowerCase() === expectedCh ? rawChar.toLowerCase() : rawChar;
                      const nextWord = currentWord + nextChar;
                      startIfNeeded(nextWord);
                      setCurrentWord(nextWord);

                      const typedLen =
                        historyWords.join(" ").length +
                        (historyWords.length > 0 ? 1 : 0) +
                        nextWord.length;

                      if (
                        typedLen + 30 > expectedText.length &&
                        (mode === "time" || wordsLimit === 0)
                      ) {
                        appendWords(50);
                      }
                      if (mode === "words" && wordsLimit !== 0 && typedLen >= expectedText.length) {
                        setState("finished");
                      }
                    }
                  }}
                  className="absolute left-[-9999px] top-auto h-px w-px opacity-0"
                  aria-label="Typing input"
                />
                <div className="mt-2 text-xs text-slate-600">
                  Press <span className="text-slate-400">Esc</span> to restart.
                </div>
              </div>
            </div>

            <div
              className={`overflow-hidden transition-all duration-500 ease-out transform-gpu ${
                state === "finished"
                  ? "max-h-[1400px] opacity-100 translate-y-0"
                  : "max-h-0 opacity-0 translate-y-8"
              }`}
            >
          <div className="pt-6">
            <div className="rounded-2xl border border-neutral-900 bg-neutral-950/40 px-5 py-4">
              <div className="grid gap-6 lg:grid-cols-[220px_260px_1fr]">
                <div className="grid gap-6">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-500">wpm</div>
                    <div className="mt-1 flex items-end gap-3">
                      <div className="text-6xl font-semibold text-white">{wpm}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-500">acc</div>
                    <div className="mt-2 text-4xl font-semibold text-white">{accuracy}%</div>
                  </div>
                </div>

                <div className="grid gap-4 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-500">test type</div>
                    <div className="mt-2 text-slate-100">
                      {mode} {mode === "time" ? (duration === 0 ? "infinite" : `${duration}`) : wordsLimit === 0 ? "infinite" : `${wordsLimit}`}
                      {punctuation ? " +punc" : ""}
                      {numbers ? " +numbers" : ""}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-500">other</div>
                    <div className="mt-2 text-slate-100">
                      errors {chars.incorrectChars + chars.extraChars}
                      <span className="text-slate-500"> / </span>
                      corrected {correctedCount}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-slate-500">raw</div>
                      <div className="mt-1 text-slate-100">{rawWpm}</div>
                    </div>
                    <div className="group relative">
                      <div className="text-xs uppercase tracking-[0.22em] text-slate-500">characters</div>
                      <div className="mt-1 text-slate-100">
                        {chars.allCorrectChars}/{chars.incorrectChars}/{chars.extraChars}/{chars.missedChars}
                      </div>

                      <div className="pointer-events-none invisible absolute left-0 top-full z-20 mt-2 min-w-[180px] translate-y-2 rounded-md border border-neutral-700 bg-neutral-950/95 px-3 py-2 text-xs text-slate-200 opacity-0 shadow-lg backdrop-blur transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                        <div className="flex items-center justify-between gap-6">
                          <span className="text-slate-400">correct</span>
                          <span className="text-slate-100">{chars.allCorrectChars}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-6">
                          <span className="text-slate-400">incorrect</span>
                          <span className="text-slate-100">{chars.incorrectChars}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-6">
                          <span className="text-slate-400">extra</span>
                          <span className="text-slate-100">{chars.extraChars}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-6">
                          <span className="text-slate-400">missed</span>
                          <span className="text-slate-100">{chars.missedChars}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-slate-500">consistency</div>
                      <div className="mt-1 text-slate-100">{consistency}%</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-slate-500">time</div>
                      <div className="mt-1 text-slate-100">{Math.round(testSeconds * 10) / 10}s</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {(
                      [
                        { id: "scale", label: "scale" },
                        { id: "pbLine", label: "pb" },
                        { id: "raw", label: "raw" },
                        { id: "burst", label: "burst" },
                        { id: "errors", label: "errors" },
                      ] as const
                    ).map((b) => {
                      const active = chartVisibility[b.id];
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() =>
                            setChartVisibility((prev) => ({
                              ...prev,
                              [b.id]: !prev[b.id],
                            }))
                          }
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 transition-colors ${
                            active
                              ? "border-neutral-600 bg-black/30 text-white"
                              : "border-neutral-900 bg-black/10 text-slate-500 hover:border-neutral-700 hover:text-slate-200"
                          }`}
                        >
                          {b.label}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setUseSmoothedBurst((v) => !v)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 transition-colors ${
                        useSmoothedBurst
                          ? "border-neutral-600 bg-black/30 text-white"
                          : "border-neutral-900 bg-black/10 text-slate-500 hover:border-neutral-700 hover:text-slate-200"
                      }`}
                    >
                      smooth
                    </button>
                  </div>

                  <div
                    ref={chartWrapRef}
                    className="relative mt-3 rounded-xl border border-neutral-900 bg-black/20 p-3"
                    onMouseLeave={() => setChartHover(null)}
                    onMouseMove={(e) => {
                      const el = chartWrapRef.current;
                      if (!el) return;
                      const rect = el.getBoundingClientRect();
                      const xPx = e.clientX - rect.left;
                      const yPx = e.clientY - rect.top;

                      const width = 760;
                      const padX = 12;
                      const innerW = width - padX * 2;

                      const list = smoothedBurstSamples;
                      if (list.length === 0) return;
                      const maxT = Math.max(1, ...(list.map((s) => s.t) || [1]));
                      const xRel = (xPx / rect.width) * width;
                      const approxT = ((xRel - padX) / innerW) * maxT;

                      let best = 0;
                      let bestDist = Infinity;
                      for (let i = 0; i < list.length; i += 1) {
                        const d = Math.abs((list[i]?.t ?? 0) - approxT);
                        if (d < bestDist) {
                          bestDist = d;
                          best = i;
                        }
                      }

                      setChartHover({ index: best, xPx, yPx });
                    }}
                  >
                    {(() => {
                      const width = 760;
                      const height = 220;
                      const padX = 12;
                      const padY = 12;
                      const innerW = width - padX * 2;
                      const innerH = height - padY * 2;

                      const visibleRaw = chartVisibility.raw;
                      const visibleBurst = chartVisibility.burst;
                      const visibleErrors = chartVisibility.errors;
                      const visiblePb = chartVisibility.pbLine && pbWpm > 0;

                      const list = smoothedBurstSamples;
                      const maxT = Math.max(1, ...(list.map((s) => s.t) || [1]));

                      const seriesValues: number[] = [];
                      seriesValues.push(...list.map((s) => s.wpm));
                      if (visibleRaw) seriesValues.push(...list.map((s) => s.raw));
                      if (visibleBurst) seriesValues.push(...list.map((s) => s.burst));
                      if (visiblePb) seriesValues.push(pbWpm);

                      const maxY = Math.max(10, ...seriesValues);
                      const minY = chartVisibility.scale
                        ? Math.max(0, Math.floor((Math.min(...seriesValues) || 0) / 10) * 10)
                        : 0;
                      const ySpan = Math.max(10, maxY - minY);

                      function toX(t: number) {
                        return padX + (t / maxT) * innerW;
                      }

                      function toY(v: number) {
                        const clamped = Math.max(minY, Math.min(minY + ySpan, v));
                        return padY + (1 - (clamped - minY) / ySpan) * innerH;
                      }

                      const gridLines = 4;
                      const grid: ReactNode[] = [];
                      for (let i = 0; i <= gridLines; i += 1) {
                        const y = padY + (i / gridLines) * innerH;
                        grid.push(
                          <path
                            key={`g-${i}`}
                            d={`M${padX} ${y} H${width - padX}`}
                            stroke="rgba(148,163,184,0.10)"
                          />,
                        );
                      }

                      const wpmD = list
                        .map((s, i) => `${i === 0 ? "M" : "L"}${toX(s.t)} ${toY(s.wpm)}`)
                        .join(" ");
                      const rawD = list
                        .map((s, i) => `${i === 0 ? "M" : "L"}${toX(s.t)} ${toY(s.raw)}`)
                        .join(" ");
                      const burstD = list
                        .map((s, i) => `${i === 0 ? "M" : "L"}${toX(s.t)} ${toY(s.burst)}`)
                        .join(" ");

                      const errorMarks: ReactNode[] = [];
                      if (visibleErrors) {
                        for (let i = 1; i < list.length; i += 1) {
                          const prev = list[i - 1];
                          const cur = list[i];
                          if (!prev || !cur) continue;
                          if (cur.errors <= prev.errors) continue;
                          const x = toX(cur.t);
                          const y = height - padY - 2;
                          errorMarks.push(
                            <circle
                              key={`e-${i}`}
                              cx={x}
                              cy={y}
                              r={3}
                              fill="rgba(248,113,113,0.9)"
                            />,
                          );
                        }
                      }

                      const hover =
                        chartHover && chartHover.index >= 0 && chartHover.index < list.length
                          ? list[chartHover.index]
                          : null;
                      const hoverX = hover ? toX(hover.t) : null;

                      return (
                        <svg
                          viewBox={`0 0 ${width} ${height}`}
                          className="h-52 w-full"
                          aria-label="WPM graph"
                          role="img"
                        >
                          {grid}
                          <path
                            d={`M${padX} ${height - padY} H${width - padX}`}
                            stroke="rgba(148,163,184,0.18)"
                          />
                          <path d={`M${padX} ${padY} V${height - padY}`} stroke="rgba(148,163,184,0.18)" />

                          {visiblePb ? (
                            <path
                              d={`M${padX} ${toY(pbWpm)} H${width - padX}`}
                              stroke="rgba(234,179,8,0.6)"
                              strokeWidth="2"
                              strokeDasharray="4 4"
                            />
                          ) : null}

                          {visibleRaw ? (
                            <path
                              d={rawD}
                              stroke="rgba(148,163,184,0.55)"
                              strokeDasharray="6 5"
                              strokeWidth="2"
                              fill="none"
                            />
                          ) : null}
                          {visibleBurst ? (
                            <path d={burstD} stroke="rgba(148,163,184,0.28)" strokeWidth="2" fill="none" />
                          ) : null}
                          <path d={wpmD} stroke="rgba(255,255,255,0.95)" strokeWidth="2" fill="none" />
                          {errorMarks}

                          {hoverX !== null ? (
                            <path
                              d={`M${hoverX} ${padY} V${height - padY}`}
                              stroke="rgba(148,163,184,0.25)"
                              strokeDasharray="3 3"
                            />
                          ) : null}

                          {hover ? (
                            <>
                              <circle cx={hoverX ?? 0} cy={toY(hover.wpm)} r={4} fill="rgba(255,255,255,0.95)" />
                              {visibleRaw ? (
                                <circle cx={hoverX ?? 0} cy={toY(hover.raw)} r={4} fill="rgba(148,163,184,0.7)" />
                              ) : null}
                              {visibleBurst ? (
                                <circle cx={hoverX ?? 0} cy={toY(hover.burst)} r={4} fill="rgba(148,163,184,0.4)" />
                              ) : null}
                            </>
                          ) : null}
                        </svg>
                      );
                    })()}

                    {(() => {
                      if (!chartHover) return null;
                      const list = smoothedBurstSamples;
                      const s = list[chartHover.index];
                      if (!s) return null;

                      const pbText = pbWpm > 0 ? `pb ${pbWpm}` : "";

                      const left = Math.min(
                        Math.max(8, chartHover.xPx + 12),
                        (chartWrapRef.current?.clientWidth ?? 0) - 180,
                      );
                      const top = Math.max(8, chartHover.yPx - 44);

                      return (
                        <div
                          className="pointer-events-none absolute z-10 w-[172px] rounded-lg border border-neutral-800 bg-black/90 px-3 py-2 text-[11px] text-slate-200 shadow-lg"
                          style={{ left, top }}
                        >
                          <div className="flex items-center justify-between text-slate-400">
                            <div>{s.t}s</div>
                            <div>{pbText}</div>
                          </div>
                          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                            <div className="text-slate-400">wpm</div>
                            <div className="text-right">{Math.round(s.wpm)}</div>
                            {chartVisibility.raw ? (
                              <>
                                <div className="text-slate-400">raw</div>
                                <div className="text-right">{Math.round(s.raw)}</div>
                              </>
                            ) : null}
                            {chartVisibility.burst ? (
                              <>
                                <div className="text-slate-400">burst</div>
                                <div className="text-right">{Math.round(s.burst)}</div>
                              </>
                            ) : null}
                            {chartVisibility.errors ? (
                              <>
                                <div className="text-slate-400">errors</div>
                                <div className="text-right">{Math.round(s.errors)}</div>
                              </>
                            ) : null}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => reset(duration, wordsLimit)}
                      className="rounded-full border border-neutral-700 bg-black/20 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-200 transition-colors hover:border-neutral-500 hover:text-white"
                    >
                      next
                    </button>
                    <button
                      type="button"
                      onClick={repeatSameWordset}
                      className="rounded-full border border-neutral-800 bg-black/20 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-300 transition-colors hover:border-neutral-600 hover:text-white"
                    >
                      repeat
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPunctuation(false);
                        setNumbers(false);
                        reset(duration, wordsLimit);
                      }}
                      className="rounded-full border border-neutral-800 bg-black/20 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-300 transition-colors hover:border-neutral-600 hover:text-white"
                    >
                      reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
            </div>
          </>
        ) : null}

          {settingsOpen ? (
            <SettingsModal
              mode={mode}
              duration={duration}
              wordsLimit={wordsLimit}
              strict={strict}
              onClose={() => setSettingsOpen(false)}
              onToggleStrict={() => setStrict((v) => !v)}
              onApplyWords={(n) => {
                setWordsLimit(n);
                setSettingsOpen(false);
                reset(duration, n);
              }}
              onApplyDuration={(parsed) => {
                setDuration(parsed);
                setSettingsOpen(false);
                reset(parsed, wordsLimit);
              }}
            />
          ) : null}
      </div>
    </DashboardShell>
  );
}
