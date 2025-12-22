"use client";

import Head from "next/head";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const correctAnswers: Record<number, string> = {
  1: "southeast",
  2: "washing machine",
  3: "15th May",
  4: "employer",
  5: "675",
  6: "translator",
  7: "bank statement",
  8: "Ainsworth",
  9: "telephone",
  10: "bus stop",
  11: "B",
  12: "C",
  13: "C",
  14: "C",
  15: "A",
  16: "A",
  17: "C",
  18: "B",
  19: "A",
  20: "C",
  21: "B",
  22: "C",
  23: "H",
  24: "D",
  25: "G",
  26: "A",
  27: "C",
  28: "A",
  29: "B",
  30: "A",
  31: "coconut",
  32: "stones",
  33: "belt",
  34: "sour",
  35: "biscuits",
  36: "fertiliser",
  37: "celebration",
  38: "harp",
  39: "ropes",
  40: "houses",
};

const progressNumbers = Array.from({ length: 40 }, (_, i) => i + 1);
const letterOnlyQuestions = new Set<number>([
  11, 12, 13, 14,
  15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25,
  26, 27, 28, 29, 30,
]);

export default function ListeningPage() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";

  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notes, setNotes] = useState<Array<{ quote: string; text: string; createdAt: number }>>([]);
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [copiedSupportKey, setCopiedSupportKey] = useState<"visa" | "uzcard" | null>(null);
  const supportCopyTimeoutRef = useRef<{ visa: number | null; uzcard: number | null }>({ visa: null, uzcard: null });
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const questionsRef = useRef<HTMLDivElement | null>(null);
  const selectionRangeRef = useRef<Range | null>(null);
  const selectedSelectableIndicesRef = useRef<number[]>([]);
  const [selectionToolbar, setSelectionToolbar] = useState<{
    open: boolean;
    top: number;
    left: number;
    text: string;
  }>({ open: false, top: 0, left: 0, text: "" });
  const [highlightMarks, setHighlightMarks] = useState<
    Record<number, { type: "yellow" | "green" | "note"; noteId?: number }>
  >({});

  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    return () => {
      const t = supportCopyTimeoutRef.current;
      if (t.visa !== null) window.clearTimeout(t.visa);
      if (t.uzcard !== null) window.clearTimeout(t.uzcard);
    };
  }, []);

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    onFullscreenChange();
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isSubmitConfirmOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSubmitConfirmOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isSubmitConfirmOpen]);

  useEffect(() => {
    if (!isResultsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsResultsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isResultsOpen]);

  useEffect(() => {
    if (!isSupportOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSupportOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isSupportOpen]);

  useEffect(() => {
    if (!selectionToolbar.open) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest(".selection-toolbar")) {
        setSelectionToolbar((s) => ({ ...s, open: false }));
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectionToolbar((s) => ({ ...s, open: false }));
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selectionToolbar.open]);

  useEffect(() => {
    const root = questionsRef.current;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll(".selectable-text")) as HTMLElement[];
    nodes.forEach((el, idx) => {
      el.classList.remove("hl", "hl-yellow", "hl-green", "hl-note");
      el.removeAttribute("data-hl");
      el.removeAttribute("data-note-id");

      const mark = highlightMarks[idx];
      if (!mark) return;

      el.setAttribute("data-hl", "1");
      el.classList.add("hl");
      if (mark.type === "note") {
        el.classList.add("hl-note");
        if (typeof mark.noteId === "number") el.setAttribute("data-note-id", String(mark.noteId));
      } else {
        el.classList.add(mark.type === "yellow" ? "hl-yellow" : "hl-green");
      }
    });
  }, [highlightMarks]);

  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  const dashboardHref = `${userPrefix}/dashboard`;
  const listeningTestsHref = `${userPrefix}/resources/listening`;
  const reviewHref = pathname;
  const feedbackHasWord = /\S+/.test(feedbackText.trim());

  const normalizeAnswer = (q: number, v: string) => {
    const raw = v;
    if (letterOnlyQuestions.has(q)) return raw.toUpperCase().trim().slice(0, 1);
    return raw;
  };

  const setAnswer = (q: number, v: string) => {
    setAnswers((prev) => ({
      ...prev,
      [q]: normalizeAnswer(q, v),
    }));
  };

  const getTextInputClassName = (q: number, extra?: string) => {
    const v = (answers[q] ?? "").toString();
    const base = `listen-input${extra ? ` ${extra}` : ""}`;
    if (!submitted) return base;
    if (!v.trim()) return base;
    return `${base} ${isCorrect(q, v) ? "is-correct" : "is-wrong"}`;
  };

  const getSelectableIndicesInRange = (range: Range) => {
    const root = questionsRef.current;
    if (!root) return [] as number[];
    const nodes = Array.from(root.querySelectorAll(".selectable-text")) as HTMLElement[];
    const indices: number[] = [];
    nodes.forEach((n, idx) => {
      try {
        if (range.intersectsNode(n)) indices.push(idx);
      } catch {
        // ignore
      }
    });
    return indices;
  };

  const applyHighlight = (color: "yellow" | "green") => {
    const indices = selectedSelectableIndicesRef.current;
    if (indices.length === 0) return;

    setHighlightMarks((prev) => {
      const next = { ...prev };
      indices.forEach((idx) => {
        next[idx] = { type: color };
      });
      return next;
    });

    const sel = window.getSelection();
    sel?.removeAllRanges();
    setSelectionToolbar((s) => ({ ...s, open: false }));
  };

  const clearHighlight = () => {
    const indices = selectedSelectableIndicesRef.current;
    if (indices.length === 0) return;

    setHighlightMarks((prev) => {
      const next = { ...prev };
      indices.forEach((idx) => {
        delete next[idx];
      });
      return next;
    });

    const sel = window.getSelection();
    sel?.removeAllRanges();
    setSelectionToolbar((s) => ({ ...s, open: false }));
  };

  const applyNoteMarkWithId = (noteId: number) => {
    const indices = selectedSelectableIndicesRef.current;
    if (indices.length === 0) return;

    setHighlightMarks((prev) => {
      const next = { ...prev };
      indices.forEach((idx) => {
        next[idx] = { type: "note", noteId };
      });
      return next;
    });

    const sel = window.getSelection();
    sel?.removeAllRanges();
    setSelectionToolbar((s) => ({ ...s, open: false }));
  };

  const addNoteFromSelection = () => {
    const quote = selectionToolbar.text.trim();
    if (!quote) return;
    const createdAt = Date.now();
    applyNoteMarkWithId(createdAt);
    setNotes((prev) => [{ quote, text: "", createdAt }, ...prev]);
    setActiveNoteId(createdAt);
    setIsNotesOpen(true);
  };

  const removeNoteMarksById = (noteId: number) => {
    setHighlightMarks((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        const idx = Number(k);
        const m = next[idx];
        if (m?.type === "note" && m.noteId === noteId) delete next[idx];
      });
      return next;
    });
  };

  const deleteNote = (id: number) => {
    removeNoteMarksById(id);
    setNotes((prev) => prev.filter((n) => n.createdAt !== id));
    setActiveNoteId((prev) => (prev === id ? null : prev));
  };

  const handleQuestionsMouseUp = () => {
    const sel = window.getSelection();
    const root = questionsRef.current;
    if (!sel || sel.rangeCount === 0 || !root) {
      setSelectionToolbar((s) => ({ ...s, open: false }));
      return;
    }

    const text = sel.toString();
    if (!text || !text.trim()) {
      setSelectionToolbar((s) => ({ ...s, open: false }));
      return;
    }

    const range = sel.getRangeAt(0);

    const startNode = range.startContainer;
    const endNode = range.endContainer;
    if (!root.contains(startNode) || !root.contains(endNode)) {
      setSelectionToolbar((s) => ({ ...s, open: false }));
      return;
    }

    const anchorEl = (sel.anchorNode instanceof HTMLElement ? sel.anchorNode : sel.anchorNode?.parentElement) as HTMLElement | null;
    const focusEl = (sel.focusNode instanceof HTMLElement ? sel.focusNode : sel.focusNode?.parentElement) as HTMLElement | null;
    const forbidden = (el: HTMLElement | null) => Boolean(el?.closest("input, textarea, button, select"));
    if (forbidden(anchorEl) || forbidden(focusEl)) {
      setSelectionToolbar((s) => ({ ...s, open: false }));
      return;
    }

    const indices = getSelectableIndicesInRange(range);
    if (indices.length === 0) {
      setSelectionToolbar((s) => ({ ...s, open: false }));
      return;
    }

    selectionRangeRef.current = range.cloneRange();
    selectedSelectableIndicesRef.current = indices;
    const rect = range.getBoundingClientRect();
    const top = Math.max(10, rect.top - 44);
    const left = Math.min(window.innerWidth - 260, Math.max(10, rect.left));
    setSelectionToolbar({ open: true, top, left, text });
  };

  const isCorrect = (q: number, userRaw: string) => {
    const user = (userRaw ?? "").trim();
    const correct = (correctAnswers[q] ?? "").trim();
    if (!user) return false;

    if (letterOnlyQuestions.has(q)) {
      return user.toUpperCase() === correct.toUpperCase();
    }

    return user.toLowerCase() === correct.toLowerCase();
  };

  const handleSubmit = () => {
    if (submitted) return;

    let s = 0;
    progressNumbers.forEach((q) => {
      if (isCorrect(q, answers[q] ?? "")) s++;
    });

    setIsRunning(false);
    setScore(s);
    setSubmitted(true);
    setIsResultsOpen(true);
  };

  const answerSheet = useMemo(() => {
    const computeIsCorrect = (q: number, userRaw: string) => {
      const user = (userRaw ?? "").trim();
      const correct = (correctAnswers[q] ?? "").trim();
      if (!user) return false;
      if (letterOnlyQuestions.has(q)) return user.toUpperCase() === correct.toUpperCase();
      return user.toLowerCase() === correct.toLowerCase();
    };

    return progressNumbers.map((num) => {
      const correct = correctAnswers[num] ?? "";
      const userRaw = (answers[num] ?? "").toString().trim();
      const userDisplay = userRaw ? userRaw : "N/A";
      return {
        num,
        userDisplay,
        correct,
        isCorrect: userDisplay !== "N/A" && computeIsCorrect(num, userRaw),
      };
    });
  }, [answers]);

  const totalQuestions = progressNumbers.length;
  const scoreLabel = `${score ?? 0}/${totalQuestions}`;

  const activeNote = activeNoteId === null ? null : (notes.find((n) => n.createdAt === activeNoteId) ?? null);
  const notesList = activeNoteId === null ? notes : notes.filter((n) => n.createdAt !== activeNoteId);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // ignore
    }
  };

  const copySupportCard = async (key: "visa" | "uzcard", rawNumber: string) => {
    const number = rawNumber.trim();
    if (!number) return;

    try {
      await navigator.clipboard.writeText(number);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = number;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        return;
      }
    }

    setCopiedSupportKey(key);
    const prev = supportCopyTimeoutRef.current[key];
    if (prev !== null) window.clearTimeout(prev);
    supportCopyTimeoutRef.current[key] = window.setTimeout(() => {
      setCopiedSupportKey((cur) => (cur === key ? null : cur));
      supportCopyTimeoutRef.current[key] = null;
    }, 2000);
  };

  return (
    <div>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>IELTS Listening Test</title>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </Head>

      <style jsx global>{`
        .page-root {
          --bg: #f5f5f5;
          --card: #ffffff;
          --text: #000000;
          --text-soft: #2d3748;
          --muted: #4a5568;
          --border: #cbd5e0;
          --subtle: #f9f9f9;
          --hover: #edf2f7;
          --chip-bg: #e2e8f0;
          --chip-text: #2d3748;
          --scrollbar-thumb: #a0aec0;
          --submit-bg: #48bb78;
          --submit-bg-disabled: #9ae6b4;
          --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.08);
          --shadow-menu: 0 10px 25px rgba(0, 0, 0, 0.12);
        }

        .page-root[data-theme="dark"] {
          --bg: #0b1220;
          --card: #0f172a;
          --text: #e2e8f0;
          --text-soft: #e2e8f0;
          --muted: #a0aec0;
          --border: #334155;
          --subtle: #0b162a;
          --hover: #1e293b;
          --chip-bg: #111c33;
          --chip-text: #e2e8f0;
          --scrollbar-thumb: #64748b;
          --submit-bg: #48bb78;
          --submit-bg-disabled: #2f855a;
          --shadow-card: 0 6px 16px rgba(0, 0, 0, 0.55);
          --shadow-menu: 0 16px 40px rgba(0, 0, 0, 0.65);
        }

        .passage-card::-webkit-scrollbar,
        .questions-card::-webkit-scrollbar,
        .results-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .passage-card::-webkit-scrollbar-track,
        .questions-card::-webkit-scrollbar-track,
        .results-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .passage-card::-webkit-scrollbar-thumb,
        .questions-card::-webkit-scrollbar-thumb,
        .results-scroll::-webkit-scrollbar-thumb {
          background-color: var(--scrollbar-thumb);
          border-radius: 4px;
        }

        .passage-card,
        .questions-card,
        .results-scroll {
          scrollbar-width: thin;
          scrollbar-color: var(--scrollbar-thumb) transparent;
        }

        .confirm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 300;
        }

        .confirm-modal {
          position: fixed;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 360px;
          max-width: calc(100vw - 32px);
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: var(--shadow-menu);
          z-index: 301;
          padding: 16px;
          color: var(--text);
        }

        .confirm-title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .confirm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 14px;
        }

        .confirm-btn {
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text);
        }

        .confirm-btn-primary {
          background: var(--submit-bg);
          border-color: transparent;
          color: #fff;
        }

        .results-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          z-index: 400;
        }

        .results-modal {
          position: fixed;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 860px;
          max-width: calc(100vw - 32px);
          max-height: calc(100vh - 32px);
          overflow: hidden;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: var(--shadow-menu);
          z-index: 401;
          display: flex;
          flex-direction: column;
        }

        .results-scroll {
          padding: 18px;
          overflow: auto;
        }

        .results-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 14px;
        }

        .results-close {
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text);
          height: 36px;
          width: 36px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        }

        .results-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 0 14px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 14px;
        }

        .complete-badge {
          width: 70px;
          height: 70px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(72, 187, 120, 0.16);
          border: 1px solid rgba(72, 187, 120, 0.40);
          box-shadow: 0 20px 35px rgba(72, 187, 120, 0.10);
          margin-bottom: 8px;
        }

        .complete-title {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.2px;
          margin-bottom: 4px;
          color: var(--text);
        }

        .complete-sub {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 10px;
        }

        .score-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .score-label {
          color: var(--muted);
          font-size: 13px;
          font-weight: 700;
        }

        .score-value {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -0.3px;
          color: var(--text);
        }

        .section-title {
          font-size: 14px;
          font-weight: 900;
          margin-top: 14px;
          margin-bottom: 10px;
          color: var(--text);
        }

        .answer-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        @media (max-width: 720px) {
          .answer-grid { grid-template-columns: 1fr; }
          .results-modal { width: 560px; }
        }

        .answer-item {
          border: 1px solid var(--border);
          background: var(--subtle);
          border-radius: 14px;
          padding: 10px 12px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .answer-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .answer-q {
          font-weight: 900;
          font-size: 13px;
          color: var(--text);
        }

        .answer-line {
          font-size: 12px;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .answer-line strong {
          color: var(--text);
          font-weight: 900;
        }

        .answer-icon {
          flex: 0 0 auto;
          width: 34px;
          height: 34px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          background: var(--card);
        }

        .support-btn {
          width: 100%;
          margin-top: 14px;
          padding: 10px 12px;
          border-radius: 14px;
          font-weight: 900;
          border: 1px solid var(--border);
          background: var(--subtle);
          color: var(--text);
          cursor: pointer;
          transition: background-color 160ms ease, transform 160ms ease;
        }

        .support-btn:hover {
          background: var(--hover);
        }

        .support-btn:active {
          transform: translateY(1px);
        }

        .support-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.25);
        }

        .feedback-box {
          margin-top: 14px;
          border: 1px solid var(--border);
          background: var(--subtle);
          border-radius: 14px;
          padding: 12px;
        }

        .feedback-input {
          width: 100%;
          min-height: 90px;
          resize: vertical;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text);
          outline: none;
        }

        .feedback-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
          gap: 10px;
          align-items: center;
        }

        .feedback-submit {
          padding: 9px 12px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text);
          cursor: pointer;
          font-weight: 900;
        }

        .feedback-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .nav-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid var(--border);
        }

        @media (max-width: 520px) {
          .nav-row { grid-template-columns: 1fr; }
        }

        .nav-btn {
          width: 100%;
          padding: 9px 12px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text);
          cursor: pointer;
          font-weight: 800;
          font-size: 12px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .nav-btn i {
          font-size: 13px;
          line-height: 1;
        }

        .support-modal {
          position: fixed;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 520px;
          max-width: calc(100vw - 32px);
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: var(--shadow-menu);
          z-index: 501;
          padding: 16px;
        }

        .support-card {
          border-radius: 16px;
          padding: 14px;
          background: var(--subtle);
          border: 1px solid var(--border);
          margin-bottom: 12px;
        }

        .support-card-num {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 1px;
          color: var(--text);
        }

        .support-thanks {
          margin-top: 10px;
          text-align: center;
          font-size: 13px;
          font-weight: 800;
          color: var(--muted);
        }

        .support-card-name {
          margin-top: 10px;
          font-size: 12px;
          color: var(--muted);
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .support-card-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: flex-end;
        }

        .support-copy-btn {
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text);
          border-radius: 10px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .support-copy-btn:hover {
          background: var(--hover);
        }

        .support-copy-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.25);
        }

        .submit-button {
          transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
          will-change: transform;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.16);
          filter: brightness(1.03);
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 5px 12px rgba(0, 0, 0, 0.14);
          filter: brightness(1.01);
        }

        .listen-block {
          border: 1px solid var(--border);
          background: var(--subtle);
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 14px;
        }

        .listen-p {
          margin: 0;
          color: var(--text);
          font-size: 13px;
          line-height: 1.45;
        }

        .listen-p + .listen-p {
          margin-top: 10px;
        }

        .listen-ul {
          margin: 10px 0 0;
          padding-left: 18px;
          color: var(--text);
          font-size: 13px;
          line-height: 1.45;
        }

        .listen-q {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 10px;
          font-size: 13px;
          color: var(--text);
          line-height: 1.45;
        }

        .listen-input {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 6px 8px;
          font-size: 13px;
          color: var(--text-soft);
          width: 140px;
        }

        .listen-input.small {
          width: 64px;
          text-transform: uppercase;
        }

        .listen-input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.25);
        }

        .listen-input.is-correct {
          border-color: rgba(72, 187, 120, 0.8);
          box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.18);
        }

        .listen-input.is-wrong {
          border-color: rgba(239, 68, 68, 0.85);
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.16);
        }

        .listen-mc {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .listen-choice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px;
          border: 1px solid var(--border);
          background: var(--card);
          border-radius: 12px;
          cursor: pointer;
        }

        .listen-choice.is-correct {
          border-color: rgba(72, 187, 120, 0.70);
          background: rgba(72, 187, 120, 0.14);
        }

        .listen-choice.is-wrong {
          border-color: rgba(239, 68, 68, 0.75);
          background: rgba(239, 68, 68, 0.10);
        }

        .listen-choice input {
          margin-top: 2px;
        }

        .notes-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.35);
          z-index: 180;
        }

        .notes-sidebar {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: 360px;
          background: var(--card);
          border-left: 1px solid var(--border);
          box-shadow: var(--shadow-menu);
          transform: translateX(105%);
          transition: transform 240ms ease;
          z-index: 200;
          display: flex;
          flex-direction: column;
        }

        .notes-sidebar.is-open {
          transform: translateX(0);
        }

        .notes-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-bottom: 1px solid var(--border);
          font-weight: 700;
        }

        .notes-body {
          padding: 12px 14px;
          overflow: auto;
          flex: 1;
          color: var(--text);
        }

        .note-editor {
          border: 1px solid var(--border);
          background: var(--subtle);
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .note-editor-quote {
          margin: 0 0 10px;
          color: var(--text);
          font-size: 13px;
          line-height: 1.35;
          word-break: break-word;
        }

        .note-editor-input {
          width: 100%;
          resize: vertical;
          min-height: 74px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text);
          border-radius: 12px;
          padding: 10px;
          font-size: 13px;
          outline: none;
        }

        .note-editor-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 10px;
        }

        .note-editor-delete {
          border: 1px solid var(--border);
          background: transparent;
          color: var(--muted);
          border-radius: 12px;
          padding: 8px 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .note-item {
          padding: 10px 12px;
          border: 1px solid var(--border);
          background: var(--subtle);
          border-radius: 12px;
          margin-bottom: 10px;
          font-size: 13px;
          line-height: 1.4;
        }

        .selection-toolbar {
          position: fixed;
          z-index: 220;
          background: var(--card);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-menu);
          border-radius: 14px;
          padding: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          user-select: none;
        }

        .selection-toolbar .toolbar-title {
          display: flex;
          align-items: center;
          flex-direction: column;
          justify-content: center;
          border: none;
          background: transparent;
          cursor: pointer;
          color: var(--text);
          font-weight: 800;
          padding: 4px 6px;
          min-width: 48px;
        }

        .selection-toolbar .toolbar-icon {
          font-size: 18px;
          line-height: 1;
        }

        .selection-toolbar .toolbar-label {
          font-size: 12px;
          line-height: 1;
        }

        .selection-toolbar .toolbar-sep {
          width: 1px;
          height: 18px;
          background: var(--border);
        }

        .color-dot {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          cursor: pointer;
          transition: transform 120ms ease;
        }

        .color-dot:active {
          transform: scale(0.96);
        }

        .dot-yellow { background: #ffeb3b; }
        .dot-green { background: rgba(0, 255, 90, 0.30); }
        .dot-white { background: var(--card); }

        .hl { padding: 0; border-radius: 3px; }
        .hl-yellow { background: #ffeb3b; }
        .hl-green { background: rgba(0, 255, 90, 0.30); }
        .hl-note { background: rgba(41, 98, 255, 0.26); }
      `}</style>

      <div
        className="page-root"
        data-theme={isDarkMode ? "dark" : "light"}
        style={{
          padding: "20px 20px 12px",
          backgroundColor: "var(--bg)",
          color: "var(--text)",
          transition: "background-color 220ms ease, color 220ms ease",
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => window.history.back()}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--text-soft)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 16 }}>←</span>
              <span>Back</span>
            </button>

            <img
              src="https://resources.edufyuzbekistan.com/storage/images/8a999eb865ef1034bd572f35fe16a512.png"
              alt="IELTS"
              style={{
                height: 56,
                width: "auto",
                display: "block",
                flexShrink: 0,
              }}
              draggable={false}
            />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <i className="fas fa-clock" style={{ color: "var(--muted)" }} />
            <span style={{ fontWeight: 600, color: "var(--text)" }}>
              {minutes}:{seconds}
            </span>
            <button
              type="button"
              onClick={() => setIsRunning((v) => !v)}
              disabled={timeLeft === 0}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
                cursor: timeLeft === 0 ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-soft)",
              }}
            >
              {isRunning ? "Pause" : "Start"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              onClick={toggleFullscreen}
              style={{
                border: "none",
                backgroundColor: "transparent",
                padding: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
                lineHeight: 1,
              }}
            >
              {isFullscreen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                  <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                  <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                  <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                  <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                  <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                  <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                </svg>
              )}
            </button>

            <button
              type="button"
              aria-label="Notes"
              onClick={() => {
                setActiveNoteId(null);
                setIsNotesOpen(true);
              }}
              style={{
                border: "none",
                backgroundColor: "transparent",
                padding: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
                fontSize: 20,
                lineHeight: 1,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="-0.5 0 25 25"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M18.6375 9.04176L13.3875 14.2418C13.3075 14.3218 13.1876 14.3718 13.0676 14.3718H10.1075V11.3118C10.1075 11.1918 10.1575 11.0818 10.2375 11.0018L15.4376 5.84176"
                  strokeMiterlimit="10"
                />
                <path
                  d="M18.7076 11.9818V21.6618C18.7076 21.9018 18.5176 22.0918 18.2776 22.0918H2.84756C2.60756 22.0918 2.41754 21.9018 2.41754 21.6618V6.23176C2.41754 5.99176 2.60756 5.80176 2.84756 5.80176H12.4875"
                  strokeMiterlimit="10"
                />
                <path
                  d="M18.3863 2.90824L16.859 4.43558L20.0551 7.63167L21.5824 6.10433L18.3863 2.90824Z"
                  strokeMiterlimit="10"
                />
              </svg>
            </button>

            <button
              type="button"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setIsDarkMode((v) => !v)}
              style={{
                border: "none",
                backgroundColor: "transparent",
                padding: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
                lineHeight: 1,
              }}
            >
              <span style={{ position: "relative", width: 28, height: 28, display: "block" }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: isDarkMode ? 0 : 1,
                    transform: isDarkMode ? "rotate(-90deg) scale(0.6)" : "rotate(0deg) scale(1)",
                    transition: "opacity 220ms ease, transform 220ms ease",
                  }}
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="M4.93 4.93l1.41 1.41" />
                  <path d="M17.66 17.66l1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="M4.93 19.07l1.41-1.41" />
                  <path d="M17.66 6.34l1.41-1.41" />
                </svg>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: isDarkMode ? 1 : 0,
                    transform: isDarkMode ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0.6)",
                    transition: "opacity 220ms ease, transform 220ms ease",
                  }}
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
                </svg>
              </span>
            </button>
          </div>
        </header>

        {isNotesOpen ? (
          <div
            className="notes-overlay"
            role="presentation"
            onClick={() => {
              setIsNotesOpen(false);
              setActiveNoteId(null);
            }}
          />
        ) : null}

        <aside className={`notes-sidebar${isNotesOpen ? " is-open" : ""}`}>
          <div className="notes-header">
            <div>Your notes</div>
            <button
              type="button"
              onClick={() => {
                setIsNotesOpen(false);
                setActiveNoteId(null);
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--muted)",
                cursor: "pointer",
                fontSize: 24,
                lineHeight: 1,
                padding: 6,
              }}
              aria-label="Close notes"
            >
              ×
            </button>
          </div>
          <div className="notes-body">
            {activeNote ? (
              <div className="note-editor">
                <div className="note-editor-quote">
                  <em>
                    <strong>{activeNote.quote}</strong>
                  </em>
                </div>
                <textarea
                  className="note-editor-input"
                  value={activeNote.text}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNotes((prev) => prev.map((n) => (n.createdAt === activeNote.createdAt ? { ...n, text: v } : n)));
                  }}
                  placeholder="Write a note..."
                />
                <div className="note-editor-actions">
                  <button type="button" className="note-editor-delete" onClick={() => deleteNote(activeNote.createdAt)}>
                    Delete
                  </button>
                </div>
              </div>
            ) : null}

            {notesList.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>No notes yet.</div>
            ) : (
              notesList.map((n) => (
                <div key={n.createdAt} className="note-item">
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ marginBottom: 6, flex: 1 }}>
                      <em>
                        <strong>{n.quote}</strong>
                      </em>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteNote(n.createdAt)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "var(--muted)",
                        cursor: "pointer",
                        fontSize: 14,
                        lineHeight: 1,
                        padding: 2,
                      }}
                      aria-label="Delete note"
                    >
                      ×
                    </button>
                  </div>
                  <div>{n.text}</div>
                </div>
              ))
            )}
          </div>
        </aside>

        {isSubmitConfirmOpen ? (
          <>
            <div className="confirm-overlay" onClick={() => setIsSubmitConfirmOpen(false)} />
            <div className="confirm-modal" role="dialog" aria-modal="true">
              <div className="confirm-title">Are you sure you want to submit the test?</div>
              <div className="confirm-actions">
                <button type="button" className="confirm-btn" onClick={() => setIsSubmitConfirmOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="confirm-btn confirm-btn-primary"
                  onClick={() => {
                    setIsSubmitConfirmOpen(false);
                    handleSubmit();
                  }}
                >
                  Yes
                </button>
              </div>
            </div>
          </>
        ) : null}

        {selectionToolbar.open ? (
          <div className="selection-toolbar" style={{ top: selectionToolbar.top, left: selectionToolbar.left }}>
            <button type="button" className="toolbar-title" onClick={addNoteFromSelection}>
              <span className="toolbar-icon">&quot;</span>
              <span className="toolbar-label">Note</span>
            </button>
            <span className="toolbar-sep" />
            <span className="color-dot dot-yellow" role="button" tabIndex={0} onClick={() => applyHighlight("yellow")} />
            <span className="color-dot dot-green" role="button" tabIndex={0} onClick={() => applyHighlight("green")} />
            <span className="color-dot dot-white" role="button" tabIndex={0} onClick={clearHighlight} />
          </div>
        ) : null}

        {isResultsOpen ? (
          <>
            <div className="results-overlay" onClick={() => setIsResultsOpen(false)} />
            <div className="results-modal" role="dialog" aria-modal="true">
              <div className="results-scroll">
                <div className="results-top">
                  <div style={{ fontWeight: 900, fontSize: 14 }}>Results</div>
                  <button type="button" className="results-close" onClick={() => setIsResultsOpen(false)} aria-label="Close results">
                    ×
                  </button>
                </div>

                <div className="results-hero">
                  <div className="complete-badge" aria-hidden="true">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                      <path d="M20 7 10.5 16.5 4 10" stroke="#48bb78" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="complete-title">Test Complete</div>
                  <div className="complete-sub">Answer sheet is ready</div>
                  <div className="score-row">
                    <div className="score-label">Your Score</div>
                    <div className="score-value">{scoreLabel}</div>
                  </div>
                </div>

                <div className="section-title">Answer Sheet</div>
                <div className="answer-grid">
                  {answerSheet.map((a) => (
                    <div key={a.num} className="answer-item">
                      <div className="answer-left">
                        <div className="answer-q">{a.num}</div>
                        <div className="answer-line">
                          Answer: <strong>{a.userDisplay}</strong>
                        </div>
                        <div className="answer-line">
                          Correct: <strong>{a.correct}</strong>
                        </div>
                      </div>
                      <div className="answer-icon" aria-hidden="true">
                        {a.isCorrect ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M20 7 10.5 16.5 4 10" stroke="#48bb78" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6 6 18" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M6 6 18 18" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" className="support-btn" onClick={() => { setIsSupportOpen(true); setFeedbackSubmitted(false); }}>
                  Support Our Project
                </button>

                <div className="feedback-box">
                  <div className="section-title" style={{ marginTop: 0 }}>Leave Your Feedback</div>
                  <textarea
                    className="feedback-input"
                    value={feedbackText}
                    onChange={(e) => { setFeedbackText(e.target.value); setFeedbackSubmitted(false); }}
                    placeholder="Write your feedback..."
                  />
                  <div className="feedback-actions">
                    {feedbackSubmitted ? (
                      <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>Thanks for your feedback!</div>
                    ) : null}
                    <button
                      type="button"
                      className="feedback-submit"
                      disabled={!feedbackHasWord}
                      onClick={() => {
                        if (!feedbackHasWord) return;
                        setFeedbackSubmitted(true);
                      }}
                    >
                      Submit Feedback
                    </button>
                  </div>
                </div>

                <div className="nav-row">
                  <button type="button" className="nav-btn" onClick={() => router.push(dashboardHref)}>
                    <i className="fa-solid fa-house" aria-hidden="true" />
                    <span>Back to Dashboard</span>
                  </button>
                  <button type="button" className="nav-btn" onClick={() => router.push(listeningTestsHref)}>
                    <i className="fa-solid fa-headphones" aria-hidden="true" />
                    <span>Listening Tests</span>
                  </button>
                  <button type="button" className="nav-btn" onClick={() => { setIsResultsOpen(false); router.push(reviewHref); }}>
                    <i className="fa-solid fa-clipboard-check" aria-hidden="true" />
                    <span>Review Test</span>
                  </button>
                  <button type="button" className="nav-btn" onClick={() => window.location.reload()}>
                    <i className="fa-solid fa-rotate-right" aria-hidden="true" />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {isSupportOpen ? (
          <>
            <div className="results-overlay" style={{ zIndex: 500 }} onClick={() => setIsSupportOpen(false)} />
            <div className="support-modal" role="dialog" aria-modal="true">
              <div className="results-top" style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 14 }}>Support Our Project</div>
                <button type="button" className="results-close" onClick={() => setIsSupportOpen(false)} aria-label="Close support">
                  ×
                </button>
              </div>

              <div className="support-card">
                <div className="support-card-num">
                  4023 0601 0538 4175
                </div>
                <div className="support-card-name">
                  <div>
                    Cardholder: <strong style={{ color: "var(--text)" }}>Saparov Anvar</strong>
                  </div>
                  <div className="support-card-actions">
                    <div>
                      <strong style={{ color: "var(--text)" }}>VISA</strong>
                    </div>
                    <button
                      type="button"
                      className="support-copy-btn"
                      onClick={() => copySupportCard("visa", "4023 0601 0538 4175")}
                    >
                      {copiedSupportKey === "visa" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="support-card">
                <div className="support-card-num">
                  8600 1402 8071 0535
                </div>
                <div className="support-card-name">
                  <div>
                    Cardholder: <strong style={{ color: "var(--text)" }}>Saparov Anvar</strong>
                  </div>
                  <div className="support-card-actions">
                    <div>
                      <strong style={{ color: "var(--text)" }}>UzCard</strong>
                    </div>
                    <button
                      type="button"
                      className="support-copy-btn"
                      onClick={() => copySupportCard("uzcard", "8600 1402 8071 0535")}
                    >
                      {copiedSupportKey === "uzcard" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="support-thanks">Thanks for your support ❤</div>
            </div>
          </>
        ) : null}

        <div
          style={{
            height: 2,
            backgroundColor: "var(--border)",
            marginLeft: -20,
            marginRight: -20,
            marginBottom: 16,
          }}
        />

        <div
          style={{
            marginBottom: 20,
            padding: "12px 16px",
            borderRadius: 12,
            backgroundColor: "var(--card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 4,
              color: "var(--text)",
            }}
          >
            Listening Test
          </div>
          <div
            style={{
              fontSize: 14,
              color: "var(--muted)",
            }}
          >
            Answer questions 1–40
          </div>
        </div>

        <div
          className="main-layout"
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "stretch",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <div
            className="questions-col"
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
            id="questions"
          >
            <div
              className="questions-card"
              ref={questionsRef}
              style={{
                backgroundColor: "var(--card)",
                color: "var(--text)",
                borderRadius: 12,
                padding: 20,
                boxShadow: "var(--shadow-card)",
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
              }}
              onMouseUp={handleQuestionsMouseUp}
              onScroll={() => setSelectionToolbar((s) => ({ ...s, open: false }))}
            >
              <div className="section-title" style={{ marginTop: 0 }}>
                Questions
              </div>

              <div className="listen-block">
                <div className="section-title" style={{ marginTop: 0 }}>
                  Questions 1–10
                </div>
                <div className="listen-p">Complete the notes below.</div>
                <p className="listen-p" style={{ marginTop: 10 }}>
                  <strong>Write NO MORE THAN TWO WORDS AND/OR A NUMBER</strong> for each answer.
                </p>

                <div className="section-title">Accommodation Request</div>
                <p className="listen-p">
                  <strong>Example</strong>
                </p>
                <ul className="listen-ul">
                  <li className="selectable-text">Name: Anna Black</li>
                  <li className="selectable-text">Type of accommodation: a house</li>
                </ul>

                <ul className="listen-ul">
                  <li className="listen-q">
                    <span className="selectable-text">Preferred location: the </span>
                    <input
                      id="q1"
                      type="text"
                      className={getTextInputClassName(1)}
                      value={answers[1] ?? ""}
                      onChange={(e) => setAnswer(1, e.target.value)}
                      placeholder="1"
                    />
                    <span className="selectable-text"> of the town</span>
                  </li>
                  <li className="listen-q">
                    <span className="selectable-text">Facilities required: furnished property with a </span>
                    <input
                      id="q2"
                      type="text"
                      className={getTextInputClassName(2)}
                      value={answers[2] ?? ""}
                      onChange={(e) => setAnswer(2, e.target.value)}
                      placeholder="2"
                    />
                  </li>
                  <li className="listen-q">
                    <span className="selectable-text">Period of time required: one year</span>
                  </li>
                  <li className="listen-q">
                    <span className="selectable-text">Start date of rental period: </span>
                    <input
                      id="q3"
                      type="text"
                      className={getTextInputClassName(3)}
                      value={answers[3] ?? ""}
                      onChange={(e) => setAnswer(3, e.target.value)}
                      placeholder="3"
                    />
                  </li>
                  <li className="listen-q">
                    <span className="selectable-text">Present address: 56, Stone Street</span>
                  </li>
                  <li className="listen-q">
                    <span className="selectable-text">Phone number: (mobile) 07942 326584</span>
                  </li>
                  <li className="listen-q">
                    <span className="selectable-text">Reference from: her </span>
                    <input
                      id="q4"
                      type="text"
                      className={getTextInputClassName(4)}
                      value={answers[4] ?? ""}
                      onChange={(e) => setAnswer(4, e.target.value)}
                      placeholder="4"
                    />
                  </li>
                  <li className="listen-q">
                    <span className="selectable-text">Maximum rent: £</span>
                    <input
                      id="q5"
                      type="text"
                      className={getTextInputClassName(5)}
                      value={answers[5] ?? ""}
                      onChange={(e) => setAnswer(5, e.target.value)}
                      placeholder="5"
                    />
                    <span className="selectable-text"> per month</span>
                  </li>
                  <li className="listen-q">
                    <span className="selectable-text">Applicant's job: </span>
                    <input
                      id="q6"
                      type="text"
                      className={getTextInputClassName(6)}
                      value={answers[6] ?? ""}
                      onChange={(e) => setAnswer(6, e.target.value)}
                      placeholder="6"
                    />
                  </li>
                </ul>

                <div className="section-title">Documents to be Supplied</div>
                <ul className="listen-ul">
                  <li className="listen-q">
                    <span className="selectable-text">ID check: applicant's passport</span>
                  </li>
                  <li className="listen-q">
                    <span className="selectable-text">Credit check: a </span>
                    <input
                      id="q7"
                      type="text"
                      className={getTextInputClassName(7)}
                      value={answers[7] ?? ""}
                      onChange={(e) => setAnswer(7, e.target.value)}
                      placeholder="7"
                    />
                  </li>
                </ul>

                <div className="section-title">Viewing Arrangements</div>
                <ul className="listen-ul">
                  <li className="listen-q">
                    <span className="selectable-text">Address of property: 33, </span>
                    <input
                      id="q8"
                      type="text"
                      className={getTextInputClassName(8)}
                      value={answers[8] ?? ""}
                      onChange={(e) => setAnswer(8, e.target.value)}
                      placeholder="8"
                    />
                    <span className="selectable-text"> Street</span>
                  </li>
                  <li className="listen-q">
                    <span className="selectable-text">Viewing day and time: Saturday 4 p.m.</span>
                  </li>
                  <li className="listen-q">
                    <span className="selectable-text">To check: Is there a </span>
                    <input
                      id="q9"
                      type="text"
                      className={getTextInputClassName(9)}
                      value={answers[9] ?? ""}
                      onChange={(e) => setAnswer(9, e.target.value)}
                      placeholder="9"
                    />
                    <span className="selectable-text"> in the house?</span>
                  </li>
                  <li className="listen-q">
                    <span className="selectable-text">Is there a </span>
                    <input
                      id="q10"
                      type="text"
                      className={getTextInputClassName(10)}
                      value={answers[10] ?? ""}
                      onChange={(e) => setAnswer(10, e.target.value)}
                      placeholder="10"
                    />
                    <span className="selectable-text"> nearby?</span>
                  </li>
                </ul>
              </div>

              <div className="listen-block">
                <div className="section-title" style={{ marginTop: 0 }}>
                  Questions 11–14 — Information for Fire Wardens
                </div>
                <p className="listen-p">Choose the correct letter, <strong>A, B, or C</strong>.</p>

                <div className="listen-q" style={{ marginTop: 14 }}>
                  <span className="selectable-text">11. The company is having this meeting about fire procedures because</span>
                </div>
                <div className="listen-mc">
                  {([
                    { v: "A", t: "A. employees did badly in the last annual fire drill." },
                    { v: "B", t: "B. there have been changes in the building layout." },
                    { v: "C", t: "C. new staff have joined the company." },
                  ] as const).map((o) => {
                    const selected = (answers[11] ?? "") === o.v;
                    const correct = (correctAnswers[11] ?? "").toUpperCase();
                    const cls =
                      !submitted
                        ? "listen-choice"
                        : o.v === correct
                          ? "listen-choice is-correct"
                          : selected
                            ? "listen-choice is-wrong"
                            : "listen-choice";
                    return (
                      <label key={o.v} className={cls}>
                        <input
                          type="radio"
                          name="q11"
                          value={o.v}
                          checked={selected}
                          onChange={(e) => setAnswer(11, e.target.value)}
                        />
                        <span className="selectable-text">{o.t}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="listen-q" style={{ marginTop: 14 }}>
                  <span className="selectable-text">12. There has been a recent upgrade to</span>
                </div>
                <div className="listen-mc">
                  {([
                    { v: "A", t: "A. the sprinkler system." },
                    { v: "B", t: "B. the fire extinguishers." },
                    { v: "C", t: "C. the alarm system." },
                  ] as const).map((o) => {
                    const selected = (answers[12] ?? "") === o.v;
                    const correct = (correctAnswers[12] ?? "").toUpperCase();
                    const cls =
                      !submitted
                        ? "listen-choice"
                        : o.v === correct
                          ? "listen-choice is-correct"
                          : selected
                            ? "listen-choice is-wrong"
                            : "listen-choice";
                    return (
                      <label key={o.v} className={cls}>
                        <input
                          type="radio"
                          name="q12"
                          value={o.v}
                          checked={selected}
                          onChange={(e) => setAnswer(12, e.target.value)}
                        />
                        <span className="selectable-text">{o.t}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="listen-q" style={{ marginTop: 14 }}>
                  <span className="selectable-text">13. During the minor fire in January, some staff working in the factory</span>
                </div>
                <div className="listen-mc">
                  {([
                    { v: "A", t: "A. were unable to read fire notices." },
                    { v: "B", t: "B. left fire doors open." },
                    { v: "C", t: "C. were unwilling to start the fire alarm." },
                  ] as const).map((o) => {
                    const selected = (answers[13] ?? "") === o.v;
                    const correct = (correctAnswers[13] ?? "").toUpperCase();
                    const cls =
                      !submitted
                        ? "listen-choice"
                        : o.v === correct
                          ? "listen-choice is-correct"
                          : selected
                            ? "listen-choice is-wrong"
                            : "listen-choice";
                    return (
                      <label key={o.v} className={cls}>
                        <input
                          type="radio"
                          name="q13"
                          value={o.v}
                          checked={selected}
                          onChange={(e) => setAnswer(13, e.target.value)}
                        />
                        <span className="selectable-text">{o.t}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="listen-q" style={{ marginTop: 14 }}>
                  <span className="selectable-text">14. In the fire in January, the problem with office staff was that they</span>
                </div>
                <div className="listen-mc">
                  {([
                    { v: "A", t: "A. refused to leave personal items behind." },
                    { v: "B", t: "B. moved too slowly during the evacuation." },
                    { v: "C", t: "C. did not move far away enough from the building." },
                  ] as const).map((o) => {
                    const selected = (answers[14] ?? "") === o.v;
                    const correct = (correctAnswers[14] ?? "").toUpperCase();
                    const cls =
                      !submitted
                        ? "listen-choice"
                        : o.v === correct
                          ? "listen-choice is-correct"
                          : selected
                            ? "listen-choice is-wrong"
                            : "listen-choice";
                    return (
                      <label key={o.v} className={cls}>
                        <input
                          type="radio"
                          name="q14"
                          value={o.v}
                          checked={selected}
                          onChange={(e) => setAnswer(14, e.target.value)}
                        />
                        <span className="selectable-text">{o.t}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="listen-block">
                <div className="section-title" style={{ marginTop: 0 }}>
                  Questions 15–20 — Comments on Aspects of Fire Safety
                </div>
                <p className="listen-p">
                  <strong>Write the correct letter, A, B, or C, next to questions 15–20.</strong>
                </p>
                <div className="listen-block" style={{ marginTop: 12 }}>
                  <p className="listen-p"><strong>Comments</strong></p>
                  <p className="listen-p" style={{ marginTop: 10 }}>
                    A. It should be a priority for fire wardens
                    <br />
                    B. It will be dealt with by an external specialist
                    <br />
                    C. It does not require attention
                  </p>
                </div>

                <div className="listen-q">
                  <span className="selectable-text">15. ensuring there are no obstacles in fire escape routes</span>
                  <input
                    id="q15"
                    type="text"
                    maxLength={1}
                    className={getTextInputClassName(15, "small")}
                    value={answers[15] ?? ""}
                    onChange={(e) => setAnswer(15, e.target.value)}
                    placeholder="Letter A-C"
                  />
                </div>

                <div className="listen-q">
                  <span className="selectable-text">16. checking that fire doors are easily opened</span>
                  <input
                    id="q16"
                    type="text"
                    maxLength={1}
                    className={getTextInputClassName(16, "small")}
                    value={answers[16] ?? ""}
                    onChange={(e) => setAnswer(16, e.target.value)}
                    placeholder="Letter A-C"
                  />
                </div>

                <div className="listen-q">
                  <span className="selectable-text">17. showing staff how to look after each other</span>
                  <input
                    id="q17"
                    type="text"
                    maxLength={1}
                    className={getTextInputClassName(17, "small")}
                    value={answers[17] ?? ""}
                    onChange={(e) => setAnswer(17, e.target.value)}
                    placeholder="Letter A-C"
                  />
                </div>

                <div className="listen-q">
                  <span className="selectable-text">18. training staff to use fire extinguishers correctly</span>
                  <input
                    id="q18"
                    type="text"
                    maxLength={1}
                    className={getTextInputClassName(18, "small")}
                    value={answers[18] ?? ""}
                    onChange={(e) => setAnswer(18, e.target.value)}
                    placeholder="Letter A-C"
                  />
                </div>

                <div className="listen-q">
                  <span className="selectable-text">19. checking that staff are aware of evacuation points</span>
                  <input
                    id="q19"
                    type="text"
                    maxLength={1}
                    className={getTextInputClassName(19, "small")}
                    value={answers[19] ?? ""}
                    onChange={(e) => setAnswer(19, e.target.value)}
                    placeholder="Letter A-C"
                  />
                </div>

                <div className="listen-q">
                  <span className="selectable-text">20. checking that flammable liquids are properly stored</span>
                  <input
                    id="q20"
                    type="text"
                    maxLength={1}
                    className={getTextInputClassName(20, "small")}
                    value={answers[20] ?? ""}
                    onChange={(e) => setAnswer(20, e.target.value)}
                    placeholder="Letter A-C"
                  />
                </div>
              </div>

              <div className="listen-block">
                <div className="section-title" style={{ marginTop: 0 }}>
                  Questions 21–25 — Types of Pigeon
                </div>
                <p className="listen-p">What comments do the speakers make about each of the following types of pigeon?</p>
                <p className="listen-p" style={{ marginTop: 10 }}>
                  <strong>Choose FIVE answers from the box and write the correct letter, A–H, next to questions 21–25.</strong>
                </p>
                <div className="listen-block" style={{ marginTop: 12 }}>
                  <p className="listen-p"><strong>Comments</strong></p>
                  <p className="listen-p" style={{ marginTop: 10 }}>
                    A. eats meat
                    <br />
                    B. communicates with its wings
                    <br />
                    C. is found in a variety of locations
                    <br />
                    D. feeds on a particular type of plant
                    <br />
                    E. sings to attract a mate
                    <br />
                    F. is endangered
                    <br />
                    G. is brightly coloured
                    <br />
                    H. avoids the ground
                  </p>
                </div>

                <div className="listen-q">
                  <span className="selectable-text">21. Australian crested pigeon</span>
                  <input
                    id="q21"
                    type="text"
                    maxLength={1}
                    className={getTextInputClassName(21, "small")}
                    value={answers[21] ?? ""}
                    onChange={(e) => setAnswer(21, e.target.value)}
                    placeholder="Letter A-H"
                  />
                </div>
                <div className="listen-q">
                  <span className="selectable-text">22. Rock pigeon</span>
                  <input
                    id="q22"
                    type="text"
                    maxLength={1}
                    className={getTextInputClassName(22, "small")}
                    value={answers[22] ?? ""}
                    onChange={(e) => setAnswer(22, e.target.value)}
                    placeholder="Letter A-H"
                  />
                </div>
                <div className="listen-q">
                  <span className="selectable-text">23. Black-banded pigeon</span>
                  <input
                    id="q23"
                    type="text"
                    maxLength={1}
                    className={getTextInputClassName(23, "small")}
                    value={answers[23] ?? ""}
                    onChange={(e) => setAnswer(23, e.target.value)}
                    placeholder="Letter A-H"
                  />
                </div>
                <div className="listen-q">
                  <span className="selectable-text">24. Galapagos pigeon</span>
                  <input
                    id="q24"
                    type="text"
                    maxLength={1}
                    className={getTextInputClassName(24, "small")}
                    value={answers[24] ?? ""}
                    onChange={(e) => setAnswer(24, e.target.value)}
                    placeholder="Letter A-H"
                  />
                </div>
                <div className="listen-q">
                  <span className="selectable-text">25. Nicobar pigeon</span>
                  <input
                    id="q25"
                    type="text"
                    maxLength={1}
                    className={getTextInputClassName(25, "small")}
                    value={answers[25] ?? ""}
                    onChange={(e) => setAnswer(25, e.target.value)}
                    placeholder="Letter A-H"
                  />
                </div>
              </div>

              <div className="listen-block">
                <div className="section-title" style={{ marginTop: 0 }}>
                  Questions 26–30 — Pigeons
                </div>
                <p className="listen-p"><strong>Choose the correct letter, A, B, or C.</strong></p>

                <div className="listen-q" style={{ marginTop: 14 }}>
                  <span className="selectable-text">26. When people feed city pigeons, it causes them to</span>
                </div>
                <div className="listen-mc">
                  {([
                    { v: "A", t: "A. breed more successfully." },
                    { v: "B", t: "B. become overweight." },
                    { v: "C", t: "C. get sick." },
                  ] as const).map((o) => {
                    const selected = (answers[26] ?? "") === o.v;
                    const correct = (correctAnswers[26] ?? "").toUpperCase();
                    const cls =
                      !submitted
                        ? "listen-choice"
                        : o.v === correct
                          ? "listen-choice is-correct"
                          : selected
                            ? "listen-choice is-wrong"
                            : "listen-choice";
                    return (
                      <label key={o.v} className={cls}>
                        <input
                          type="radio"
                          name="q26"
                          value={o.v}
                          checked={selected}
                          onChange={(e) => setAnswer(26, e.target.value)}
                        />
                        <span className="selectable-text">{o.t}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="listen-q" style={{ marginTop: 14 }}>
                  <span className="selectable-text">27. The Melbourne city council are tackling their pigeon problem by</span>
                </div>
                <div className="listen-mc">
                  {([
                    { v: "A", t: "A. removing the pigeons from the city." },
                    { v: "B", t: "B. scaring away pigeons." },
                    { v: "C", t: "C. providing homes for the pigeons." },
                  ] as const).map((o) => {
                    const selected = (answers[27] ?? "") === o.v;
                    const correct = (correctAnswers[27] ?? "").toUpperCase();
                    const cls =
                      !submitted
                        ? "listen-choice"
                        : o.v === correct
                          ? "listen-choice is-correct"
                          : selected
                            ? "listen-choice is-wrong"
                            : "listen-choice";
                    return (
                      <label key={o.v} className={cls}>
                        <input
                          type="radio"
                          name="q27"
                          value={o.v}
                          checked={selected}
                          onChange={(e) => setAnswer(27, e.target.value)}
                        />
                        <span className="selectable-text">{o.t}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="listen-q" style={{ marginTop: 14 }}>
                  <span className="selectable-text">28. Jennifer and Adam agree that the second stage of the council scheme is</span>
                </div>
                <div className="listen-mc">
                  {([
                    { v: "A", t: "A. expensive." },
                    { v: "B", t: "B. cruel." },
                    { v: "C", t: "C. ineffective." },
                  ] as const).map((o) => {
                    const selected = (answers[28] ?? "") === o.v;
                    const correct = (correctAnswers[28] ?? "").toUpperCase();
                    const cls =
                      !submitted
                        ? "listen-choice"
                        : o.v === correct
                          ? "listen-choice is-correct"
                          : selected
                            ? "listen-choice is-wrong"
                            : "listen-choice";
                    return (
                      <label key={o.v} className={cls}>
                        <input
                          type="radio"
                          name="q28"
                          value={o.v}
                          checked={selected}
                          onChange={(e) => setAnswer(28, e.target.value)}
                        />
                        <span className="selectable-text">{o.t}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="listen-q" style={{ marginTop: 14 }}>
                  <span className="selectable-text">29. What method of pigeon control was most successful in the city of Basel?</span>
                </div>
                <div className="listen-mc">
                  {([
                    { v: "A", t: "A. trapping the pigeons" },
                    { v: "B", t: "B. educating the public" },
                    { v: "C", t: "C. building nesting sites" },
                  ] as const).map((o) => {
                    const selected = (answers[29] ?? "") === o.v;
                    const correct = (correctAnswers[29] ?? "").toUpperCase();
                    const cls =
                      !submitted
                        ? "listen-choice"
                        : o.v === correct
                          ? "listen-choice is-correct"
                          : selected
                            ? "listen-choice is-wrong"
                            : "listen-choice";
                    return (
                      <label key={o.v} className={cls}>
                        <input
                          type="radio"
                          name="q29"
                          value={o.v}
                          checked={selected}
                          onChange={(e) => setAnswer(29, e.target.value)}
                        />
                        <span className="selectable-text">{o.t}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="listen-q" style={{ marginTop: 14 }}>
                  <span className="selectable-text">30. Adam and Jennifer decide to do some more research on how pigeons can</span>
                </div>
                <div className="listen-mc">
                  {([
                    { v: "A", t: "A. affect our health." },
                    { v: "B", t: "B. damage buildings." },
                    { v: "C", t: "C. cause local flooding." },
                  ] as const).map((o) => {
                    const selected = (answers[30] ?? "") === o.v;
                    const correct = (correctAnswers[30] ?? "").toUpperCase();
                    const cls =
                      !submitted
                        ? "listen-choice"
                        : o.v === correct
                          ? "listen-choice is-correct"
                          : selected
                            ? "listen-choice is-wrong"
                            : "listen-choice";
                    return (
                      <label key={o.v} className={cls}>
                        <input
                          type="radio"
                          name="q30"
                          value={o.v}
                          checked={selected}
                          onChange={(e) => setAnswer(30, e.target.value)}
                        />
                        <span className="selectable-text">{o.t}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="listen-block">
                <div className="section-title" style={{ marginTop: 0 }}>
                  SECTION 4 — Questions 31–40
                </div>
                <p className="listen-p">Complete the notes below.</p>
                <p className="listen-p" style={{ marginTop: 10 }}>
                  <strong>Write ONE WORD ONLY for each answer.</strong>
                </p>

                <div className="section-title">The Lontar Palm</div>
                <div className="listen-q"><span className="selectable-text">• Grows on Roti, an Indonesian island</span></div>
                <div className="listen-q"><span className="selectable-text">• Is known as the tree of life</span></div>
                <div className="listen-q"><span className="selectable-text">• Produces delicious juice</span></div>
                <div className="listen-q">
                  <span className="selectable-text">• Has a fruit resembling a </span>
                  <strong>31</strong>
                  <input
                    id="q31"
                    type="text"
                    className={getTextInputClassName(31)}
                    value={answers[31] ?? ""}
                    onChange={(e) => setAnswer(31, e.target.value)}
                    placeholder="31"
                  />
                  <span className="selectable-text"> (female trees only)</span>
                </div>

                <div className="section-title">People climbing the trees</div>
                <div className="listen-q">
                  <span className="selectable-text">• Fix </span>
                  <strong>32</strong>
                  <input
                    id="q32"
                    type="text"
                    className={getTextInputClassName(32)}
                    value={answers[32] ?? ""}
                    onChange={(e) => setAnswer(32, e.target.value)}
                    placeholder="32"
                  />
                  <span className="selectable-text"> to the tree trunks to help them climb</span>
                </div>
                <div className="listen-q">
                  <span className="selectable-text">• Keep their tools attached to a </span>
                  <strong>33</strong>
                  <input
                    id="q33"
                    type="text"
                    className={getTextInputClassName(33)}
                    value={answers[33] ?? ""}
                    onChange={(e) => setAnswer(33, e.target.value)}
                    placeholder="33"
                  />
                </div>
                <div className="listen-q"><span className="selectable-text">• Often own particular trees</span></div>
                <div className="listen-q"><span className="selectable-text">• Contribute to the upkeep of the communal fence</span></div>

                <div className="section-title">Using the juice</div>
                <div className="listen-q">
                  <span className="selectable-text">• It quickly becomes </span>
                  <strong>34</strong>
                  <input
                    id="q34"
                    type="text"
                    className={getTextInputClassName(34)}
                    value={answers[34] ?? ""}
                    onChange={(e) => setAnswer(34, e.target.value)}
                    placeholder="34"
                  />
                  <span className="selectable-text"> if left unprocessed</span>
                </div>
                <div className="listen-q"><span className="selectable-text">• A concentrated form of it is drunk in the rainy season</span></div>
                <div className="listen-q">
                  <span className="selectable-text">• It can be made into sugary </span>
                  <strong>35</strong>
                  <input
                    id="q35"
                    type="text"
                    className={getTextInputClassName(35)}
                    value={answers[35] ?? ""}
                    onChange={(e) => setAnswer(35, e.target.value)}
                    placeholder="35"
                  />
                </div>

                <div className="section-title">Using other parts of the tree</div>
                <div className="listen-q"><span className="selectable-text">The leaf is used:</span></div>
                <div className="listen-q"><span className="selectable-text">• To make containers, bags, and roofing</span></div>
                <div className="listen-q">
                  <span className="selectable-text">• As garden </span>
                  <strong>36</strong>
                  <input
                    id="q36"
                    type="text"
                    className={getTextInputClassName(36)}
                    value={answers[36] ?? ""}
                    onChange={(e) => setAnswer(36, e.target.value)}
                    placeholder="36"
                  />
                </div>
                <div className="listen-q">
                  <span className="selectable-text">• For brightly decorated hats worn at a </span>
                  <strong>37</strong>
                  <input
                    id="q37"
                    type="text"
                    className={getTextInputClassName(37)}
                    value={answers[37] ?? ""}
                    onChange={(e) => setAnswer(37, e.target.value)}
                    placeholder="37"
                  />
                </div>
                <div className="listen-q">
                  <span className="selectable-text">• For a musical instrument which sounds like a </span>
                  <strong>38</strong>
                  <input
                    id="q38"
                    type="text"
                    className={getTextInputClassName(38)}
                    value={answers[38] ?? ""}
                    onChange={(e) => setAnswer(38, e.target.value)}
                    placeholder="38"
                  />
                </div>
                <div className="listen-q">
                  <span className="selectable-text">The stalk is used to make </span>
                  <strong>39</strong>
                  <input
                    id="q39"
                    type="text"
                    className={getTextInputClassName(39)}
                    value={answers[39] ?? ""}
                    onChange={(e) => setAnswer(39, e.target.value)}
                    placeholder="39"
                  />
                </div>
                <div className="listen-q">
                  <span className="selectable-text">The trunk is used in the construction of </span>
                  <strong>40</strong>
                  <input
                    id="q40"
                    type="text"
                    className={getTextInputClassName(40)}
                    value={answers[40] ?? ""}
                    onChange={(e) => setAnswer(40, e.target.value)}
                    placeholder="40"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 2,
            paddingTop: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{ color: "var(--text-soft)", fontSize: 12, minHeight: 16, display: "flex", alignItems: "center" }}
          >
            {submitted && score !== null ? <span>Score: {score}/{totalQuestions}</span> : null}
          </div>
        </div>

        <div
          style={{
            height: 2,
            backgroundColor: "var(--border)",
            marginLeft: -20,
            marginRight: -20,
            marginTop: 1,
            marginBottom: 0,
          }}
        />

        <div
          style={{
            marginTop: 0,
            paddingTop: 4,
            position: "relative",
            minHeight: 40,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", gap: 4, overflowX: "auto", maxWidth: "100%" }}>
            {progressNumbers.map((num) => {
              const answered = Boolean((answers[num] ?? "").trim());
              return (
                <div
                  key={num}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: answered ? "1px solid rgba(72, 187, 120, 0.65)" : "1px solid var(--border)",
                    backgroundColor: answered ? "rgba(72, 187, 120, 0.18)" : "var(--chip-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 600,
                    color: answered ? "var(--text)" : "var(--chip-text)",
                    transform: answered ? "translateY(-1px)" : "translateY(0)",
                    boxShadow: answered ? "0 8px 14px rgba(72, 187, 120, 0.18)" : "none",
                    transition: "transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease",
                    flex: "0 0 auto",
                  }}
                >
                  {num}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              if (submitted) setIsResultsOpen(true);
              else setIsSubmitConfirmOpen(true);
            }}
            disabled={false}
            className="submit-button"
            style={{
              position: "absolute",
              right: 0,
              top: 4,
              padding: "9px 16px",
              backgroundColor: "var(--submit-bg)",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 15,
              transition: "transform 120ms ease, box-shadow 150ms ease, background-color 150ms ease",
              boxShadow: submitted ? "none" : "0 10px 18px rgba(72, 187, 120, 0.22)",
            }}
          >
            {submitted ? "View Results" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
