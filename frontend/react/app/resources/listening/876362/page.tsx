"use client";

import Head from "next/head";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { markTestCompleted } from "@/lib/completedTests";

const correctAnswers: Record<number, string> = {
  1: "94635550",
  2: "Clark House",
  3: "University Drive",
  4: "Monday",
  5: "Thursday",
  6: "a month",
  7: "A",
  8: "C",
  9: "B",
  10: "C",
  11: "Computer as Teacher",
  12: "University of Melbourne",
  13: "top floor",
  14: "ground floor",
  15: "3:10",
  16: "Palm Lounge",
  17: "C",
  18: "B",
  19: "B",
  20: "A",
  21: "C",
  22: "A",
  23: "A",
  24: "C",
  25: "A",
  26: "C",
  30: "textbook allowance",
  31: "plastic",
  32: "processing",
  33: "seasoned",
  34: "polished",
  35: "the cost",
  36: "grain patterns",
  37: "words",
  38: "0.8",
  39: "0.1",
  40: "black velvet",
};

const multiCorrect27to29 = ["C", "E", "F"] as const;

const letterQuestions = new Set<number>([
  7, 8, 9, 10, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
]);

function range(from: number, to: number) {
  const out: number[] = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
}

const progressNumbers = range(1, 40);

export default function ListeningTest876362Page() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";

  const listeningId = useMemo(() => {
    const idx = segments.indexOf("resources");
    if (idx !== -1 && segments[idx + 1] === "listening") {
      const maybeId = segments[idx + 2];
      if (maybeId) return maybeId;
    }
    return "876362";
  }, [segments]);

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isTimeUpOpen, setIsTimeUpOpen] = useState(false);
  const [copiedSupportKey, setCopiedSupportKey] = useState<"visa" | "uzcard" | null>(null);
  const supportCopyTimeoutRef = useRef<{ visa: number | null; uzcard: number | null }>({ visa: null, uzcard: null });
  const timeUpTimeoutRef = useRef<number | null>(null);
  const timeUpTriggeredRef = useRef(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notes, setNotes] = useState<Array<{ quote: string; text: string; createdAt: number }>>([]);
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);

  const [openLetterDropdown, setOpenLetterDropdown] = useState<number | null>(null);

  const [timeLeft, setTimeLeft] = useState(32 * 60);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [availableAudioSources, setAvailableAudioSources] = useState<string[]>([]);

  const signRel = async (rel: string): Promise<{ url: string | null; forbidden: boolean }> => {
    const endpoints = ["/__materials_sign", "/api/materials/sign"];
    for (const ep of endpoints) {
      try {
        const res = await fetch(`${ep}?rel=${encodeURIComponent(rel)}`, {
          cache: "no-store",
        });
        if (res.status === 403) return { url: null, forbidden: true };
        if (!res.ok) continue;
        const data = (await res.json().catch(() => null)) as any;
        const url = typeof data?.url === "string" ? data.url : null;
        return { url, forbidden: false };
      } catch {
        // try next endpoint
      }
    }
    return { url: null, forbidden: false };
  };

  const [playerSection, setPlayerSection] = useState(1);
  const [playerIsPlaying, setPlayerIsPlaying] = useState(false);
  const [playerTime, setPlayerTime] = useState(0);
  const [playerDuration, setPlayerDuration] = useState(0);
  const [playerIsSeeking, setPlayerIsSeeking] = useState(false);
  const [playerSeekValue, setPlayerSeekValue] = useState(0);
  const [playerIsBuffering, setPlayerIsBuffering] = useState(false);

  const questionsRef = useRef<HTMLDivElement | null>(null);
  const selectionRangeRef = useRef<Range | null>(null);
  const scrollCloseRafRef = useRef<number | null>(null);
  const [selectionToolbar, setSelectionToolbar] = useState<{
    open: boolean;
    top: number;
    left: number;
    text: string;
  }>({ open: false, top: 0, left: 0, text: "" });

  useEffect(() => {
    return () => {
      const t = supportCopyTimeoutRef.current;
      if (t.visa !== null) window.clearTimeout(t.visa);
      if (t.uzcard !== null) window.clearTimeout(t.uzcard);

      if (timeUpTimeoutRef.current !== null) window.clearTimeout(timeUpTimeoutRef.current);

      if (scrollCloseRafRef.current !== null) {
        window.cancelAnimationFrame(scrollCloseRafRef.current);
        scrollCloseRafRef.current = null;
      }
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
    if (timeLeft !== 0) return;
    const audioEl = audioRef.current;
    if (!audioEl) return;
    try {
      audioEl.pause();
    } catch {
      // ignore
    }
  }, [timeLeft]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest(".rounded-dropdown")) {
        setOpenLetterDropdown(null);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    onFullscreenChange();
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
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

  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  const getSectionRange = (sec: number) => {
    if (sec === 1) return { start: 1, end: 10 };
    if (sec === 2) return { start: 11, end: 20 };
    if (sec === 3) return { start: 21, end: 30 };
    if (sec === 4) return { start: 31, end: 40 };
    return { start: 1, end: 10 };
  };

  const countAnsweredInRange = (start: number, end: number) => {
    let c = 0;
    for (let i = start; i <= end; i++) {
      if ((answers[i] ?? "").trim()) c++;
    }
    return c;
  };

  const currentSectionRange = getSectionRange(currentSection);

  const scrollQuestionsCardToTop = () => {
    const card = document.getElementById("questions-card");
    if (!card) return;
    card.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalQuestions = progressNumbers.length;
  const scoreLabel = `${score ?? 0}/${totalQuestions}`;
  const feedbackHasWord = /\S+/.test(feedbackText.trim());
  const dashboardHref = `${userPrefix}/dashboard`;
  const listeningTestsHref = `${userPrefix}/resources/listening`;
  const reviewHref = pathname;

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

  const normalizeText = (v: string) => v.replace(/\s+/g, " ").trim();
  const normalizeWord = (v: string) => normalizeText(v).toLowerCase();

   const getSelectedMulti27to29 = () => {
     return [answers[27] ?? "", answers[28] ?? "", answers[29] ?? ""]
       .map((v) => normalizeText(v).toUpperCase())
       .filter(Boolean);
   };

   const toggleMulti27to29 = (letter: string) => {
     if (submitted) return;
     const L = normalizeText(letter).toUpperCase();
     if (!L) return;

     const selected = getSelectedMulti27to29();
     const exists = selected.includes(L);
     const next = exists ? selected.filter((x) => x !== L) : [...selected, L].slice(0, 3);

     setAnswers((prev) => ({
       ...prev,
       27: next[0] ?? "",
       28: next[1] ?? "",
       29: next[2] ?? "",
     }));
   };

   const computeMultiScore27to29 = () => {
     const selected = getSelectedMulti27to29();
     const uniqSelected = Array.from(new Set(selected));
     const correctSet = new Set<string>(multiCorrect27to29);
     return uniqSelected.filter((x) => correctSet.has(x)).length;
   };

   const isMultiFullyCorrect27to29 = () => {
     const selected = getSelectedMulti27to29();
     const uniqSelected = Array.from(new Set(selected));
     return uniqSelected.length === 3 && computeMultiScore27to29() === 3;
   };

  const isCorrect = (q: number, value: string) => {
    const correct = correctAnswers[q] ?? "";
    if (!value || !value.trim()) return false;

    if (letterQuestions.has(q)) {
      return (
        normalizeText(value).toUpperCase() === normalizeText(correct).toUpperCase()
      );
    }

    return normalizeWord(value) === normalizeWord(correct);
  };

  const focusQuestion = (qNum: number) => {
    if (qNum >= 27 && qNum <= 29) {
      const group = document.querySelector(`[name="q27_29"]`) as HTMLElement | null;
      if (!group) return;
      group.scrollIntoView({ behavior: "smooth", block: "center" });
      if ("focus" in group) group.focus();
      return;
    }

    const byId = document.getElementById(`q${qNum}`);
    const byName = document.querySelector(`[name="q${qNum}"]`);
    const el = (byId ?? byName) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if ("focus" in el) el.focus();
  };

  const unwrapElement = (el: HTMLElement) => {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
    if (parent instanceof HTMLElement) parent.normalize();
  };

  const isEmptyFragment = (frag: DocumentFragment) => {
    return frag.childNodes.length === 0;
  };

  const getHighlightBlocksInRange = (range: Range) => {
    const root = questionsRef.current;
    if (!root) return [];

    const blocks = Array.from(root.querySelectorAll(".question-line")) as HTMLElement[];
    return blocks.filter((b) => {
      try {
        return range.intersectsNode(b);
      } catch {
        return false;
      }
    });
  };

  const getTextNodesInRange = (range: Range, root: HTMLElement) => {
    const out: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n: Node | null = walker.nextNode();
    while (n) {
      const t = n as Text;
      if (t.nodeValue && t.nodeValue.trim()) {
        try {
          if (range.intersectsNode(t)) out.push(t);
        } catch {
          // ignore
        }
      }
      n = walker.nextNode();
    }
    return out;
  };

  const removeHighlightInSpanForRange = (spanEl: HTMLElement, range: Range) => {
    const spanRange = document.createRange();
    spanRange.selectNodeContents(spanEl);

    const useSpanStart = range.compareBoundaryPoints(Range.START_TO_START, spanRange) <= 0;
    const useSpanEnd = range.compareBoundaryPoints(Range.END_TO_END, spanRange) >= 0;

    const startContainer = useSpanStart ? spanRange.startContainer : range.startContainer;
    const startOffset = useSpanStart ? spanRange.startOffset : range.startOffset;
    const endContainer = useSpanEnd ? spanRange.endContainer : range.endContainer;
    const endOffset = useSpanEnd ? spanRange.endOffset : range.endOffset;

    const intersection = document.createRange();
    try {
      intersection.setStart(startContainer, startOffset);
      intersection.setEnd(endContainer, endOffset);
    } catch {
      return;
    }

    const beforeR = document.createRange();
    beforeR.selectNodeContents(spanEl);
    try {
      beforeR.setEnd(startContainer, startOffset);
    } catch {
      // ignore
    }
    const beforeFrag = beforeR.cloneContents();

    const selectedFrag = intersection.cloneContents();

    const afterR = document.createRange();
    afterR.selectNodeContents(spanEl);
    try {
      afterR.setStart(endContainer, endOffset);
    } catch {
      // ignore
    }
    const afterFrag = afterR.cloneContents();

    const parent = spanEl.parentNode;
    if (!parent) return;
    const next = spanEl.nextSibling;

    const mkSpan = (frag: DocumentFragment) => {
      const s = document.createElement("span");
      s.setAttribute("data-hl", "1");
      const noteId = spanEl.getAttribute("data-note-id");
      if (noteId) s.setAttribute("data-note-id", noteId);
      s.className = spanEl.className;
      s.appendChild(frag);
      return s;
    };

    parent.removeChild(spanEl);

    if (!isEmptyFragment(beforeFrag)) parent.insertBefore(mkSpan(beforeFrag), next);
    if (!isEmptyFragment(selectedFrag)) parent.insertBefore(selectedFrag, next);
    if (!isEmptyFragment(afterFrag)) parent.insertBefore(mkSpan(afterFrag), next);

    if (parent instanceof HTMLElement) parent.normalize();
  };

  const removeHighlightsInRange = (range: Range) => {
    const blocks = getHighlightBlocksInRange(range);
    blocks.forEach((b) => {
      const highlights = Array.from(b.querySelectorAll('span[data-hl="1"]')) as HTMLElement[];
      highlights.forEach((hl) => {
        try {
          if (!range.intersectsNode(hl)) return;
          removeHighlightInSpanForRange(hl, range);
        } catch {
          // ignore
        }
      });
    });
  };

  const applyHighlight = (color: "yellow" | "green") => {
    const range = selectionRangeRef.current;
    if (!range || range.collapsed) return;

    const blocks = getHighlightBlocksInRange(range);
    if (blocks.length === 0) return;

    removeHighlightsInRange(range);

    blocks.forEach((b) => {
      const textNodes = getTextNodesInRange(range, b);
      for (let i = textNodes.length - 1; i >= 0; i--) {
        const node = textNodes[i];
        const nodeLen = node.nodeValue?.length ?? 0;
        if (nodeLen === 0) continue;

        const startOffset = range.startContainer === node ? range.startOffset : 0;
        const endOffset = range.endContainer === node ? range.endOffset : nodeLen;
        if (startOffset === endOffset) continue;

        const sub = document.createRange();
        try {
          sub.setStart(node, Math.max(0, Math.min(nodeLen, startOffset)));
          sub.setEnd(node, Math.max(0, Math.min(nodeLen, endOffset)));
        } catch {
          continue;
        }
        if (sub.collapsed) continue;

        const wrapper = document.createElement("span");
        wrapper.setAttribute("data-hl", "1");
        wrapper.className = `hl hl-${color}`;

        try {
          const contents = sub.extractContents();
          wrapper.appendChild(contents);
          sub.insertNode(wrapper);
        } catch {
          // ignore
        }
      }
    });

    const sel = window.getSelection();
    sel?.removeAllRanges();
    setSelectionToolbar((s) => ({ ...s, open: false }));
  };

  const clearHighlight = () => {
    const range = selectionRangeRef.current;
    if (!range) return;

    removeHighlightsInRange(range);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    setSelectionToolbar((s) => ({ ...s, open: false }));
  };

  const applyNoteMarkWithId = (noteId: number) => {
    const range = selectionRangeRef.current;
    if (!range || range.collapsed) return;

    const blocks = getHighlightBlocksInRange(range);
    if (blocks.length === 0) return;

    removeHighlightsInRange(range);

    blocks.forEach((b) => {
      const textNodes = getTextNodesInRange(range, b);
      for (let i = textNodes.length - 1; i >= 0; i--) {
        const node = textNodes[i];
        const nodeLen = node.nodeValue?.length ?? 0;
        if (nodeLen === 0) continue;

        const startOffset = range.startContainer === node ? range.startOffset : 0;
        const endOffset = range.endContainer === node ? range.endOffset : nodeLen;
        if (startOffset === endOffset) continue;

        const sub = document.createRange();
        try {
          sub.setStart(node, Math.max(0, Math.min(nodeLen, startOffset)));
          sub.setEnd(node, Math.max(0, Math.min(nodeLen, endOffset)));
        } catch {
          continue;
        }
        if (sub.collapsed) continue;

        const wrapper = document.createElement("span");
        wrapper.setAttribute("data-hl", "1");
        wrapper.setAttribute("data-note-id", String(noteId));
        wrapper.className = "hl hl-note";

        try {
          const contents = sub.extractContents();
          wrapper.appendChild(contents);
          sub.insertNode(wrapper);
        } catch {
          // ignore
        }
      }
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
    if (!questionsRef.current) return;
    const nodes = Array.from(
      questionsRef.current.querySelectorAll(`span[data-note-id="${noteId}"]`)
    ) as HTMLElement[];
    nodes.forEach((n) => unwrapElement(n));
  };

  const deleteNote = (id: number) => {
    removeNoteMarksById(id);
    setNotes((prev) => prev.filter((n) => n.createdAt !== id));
    setActiveNoteId((prev) => (prev === id ? null : prev));
  };

  const handleQuestionsMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      setSelectionToolbar((s) => ({ ...s, open: false }));
      return;
    }

    const text = sel.toString();
    if (!text || !text.trim()) {
      setSelectionToolbar((s) => ({ ...s, open: false }));
      return;
    }

    const r = sel.getRangeAt(0);
    if (!questionsRef.current) return;
    if (!questionsRef.current.contains(r.commonAncestorContainer)) {
      setSelectionToolbar((s) => ({ ...s, open: false }));
      return;
    }

    selectionRangeRef.current = r.cloneRange();
    const rect = r.getBoundingClientRect();
    const top = Math.max(10, rect.top - 44);
    const left = Math.min(window.innerWidth - 260, Math.max(10, rect.left));
    setSelectionToolbar({ open: true, top, left, text });
  };

  const handleQuestionsScroll = () => {
    if (!selectionToolbar.open) return;
    if (scrollCloseRafRef.current !== null) return;

    scrollCloseRafRef.current = window.requestAnimationFrame(() => {
      scrollCloseRafRef.current = null;
      setSelectionToolbar((s) => {
        if (!s.open) return s;
        return { ...s, open: false };
      });
    });
  };

  const setAnswer = (q: number, value: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [q]: value }));
  };

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

  const submitTest = () => {
    if (submitted) return;
    let total = 0;

    for (let q = 1; q <= 40; q++) {
      if (q === 27) {
        total += computeMultiScore27to29();
        continue;
      }
      if (q === 28 || q === 29) continue;

      const user = answers[q] ?? "";
      const ok = isCorrect(q, user);
      if (!ok) continue;

      total++;
    }
    setScore(total);
    setSubmitted(true);
    setIsRunning(false);
    setIsResultsOpen(true);
    markTestCompleted("listening", listeningId);

    const audioEl = audioRef.current;
    try {
      audioEl?.pause();
      if (audioEl) audioEl.currentTime = 0;
    } catch {
      // ignore
    }

    setPlayerSection(currentSection);
  };

  useEffect(() => {
    if (timeLeft !== 0) return;
    if (submitted) return;
    if (timeUpTriggeredRef.current) return;

    timeUpTriggeredRef.current = true;
    setIsSubmitConfirmOpen(false);
    setIsTimeUpOpen(true);

    if (timeUpTimeoutRef.current !== null) window.clearTimeout(timeUpTimeoutRef.current);
    timeUpTimeoutRef.current = window.setTimeout(() => {
      submitTest();
      setIsTimeUpOpen(false);
      timeUpTimeoutRef.current = null;
    }, 900);
  }, [timeLeft, submitted, submitTest]);

  const resetTest = () => {
    const audioEl = audioRef.current;
    try {
      audioEl?.pause();
      if (audioEl) {
        audioEl.currentTime = 0;
        audioEl.src = "";
      }
    } catch {
      // ignore
    }

    if (timeUpTimeoutRef.current !== null) {
      window.clearTimeout(timeUpTimeoutRef.current);
      timeUpTimeoutRef.current = null;
    }
    timeUpTriggeredRef.current = false;
    setIsTimeUpOpen(false);

    if (questionsRef.current) {
      const spans = Array.from(questionsRef.current.querySelectorAll('span[data-hl="1"]')) as HTMLElement[];
      spans.forEach((s) => unwrapElement(s));
    }

    const sel = window.getSelection();
    sel?.removeAllRanges();
    selectionRangeRef.current = null;
    setSelectionToolbar((s) => ({ ...s, open: false }));

    setAnswers({});
    setSubmitted(false);
    setScore(null);
    setIsSubmitConfirmOpen(false);
    setIsResultsOpen(false);
    setIsRunning(false);
    setTimeLeft(32 * 60);
    setCurrentSection(1);
    setOpenLetterDropdown(null);
    setIsNotesOpen(false);
    setNotes([]);
    setActiveNoteId(null);
    setHasStarted(false);
    window.requestAnimationFrame(() => scrollQuestionsCardToTop());
  };

  const answerSheet = useMemo(() => {
    const out: Array<{
      num: number;
      label: string;
      userDisplay: string;
      correct: string;
      isCorrect: boolean;
    }> = [];

    for (let num = 1; num <= 40; num++) {
      if (num === 27) {
        const selected = getSelectedMulti27to29();
        const userDisplay = selected.length ? selected.join(", ") : "N/A";
        out.push({
          num,
          label: "27–29",
          userDisplay,
          correct: multiCorrect27to29.join(", "),
          isCorrect: userDisplay !== "N/A" && isMultiFullyCorrect27to29(),
        });
        continue;
      }
      if (num === 28 || num === 29) continue;

      const user = answers[num] ?? "";
      const userDisplay = user && user.trim() ? user.trim() : "N/A";
      const correct = correctAnswers[num] ?? "";
      const isCorrectAnswer = userDisplay !== "N/A" && isCorrect(num, userDisplay);
      out.push({ num, label: String(num), userDisplay, correct, isCorrect: isCorrectAnswer });
    }

    return out;
  }, [answers]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const relPrefix = `listening/${listeningId}/`;
      const found: string[] = [];

      const sectionResults = await Promise.all(
        [1, 2, 3, 4].map((i) => signRel(`${relPrefix}section${i}.mp3`))
      );

      if (sectionResults.some((r) => r.forbidden)) {
        const redirectPath = `${userPrefix}/resources/listening/${listeningId}`;
        router.push(`${userPrefix}/billing?redirect=${encodeURIComponent(redirectPath)}`);
        return;
      }

      for (const r of sectionResults) {
        if (!r.url) break;
        found.push(r.url);
      }

      if (found.length === 0) {
        const fullNames = [
          "full.mp3",
          "full-test.mp3",
          "full-listening-test.mp3",
          "full-listening-test-1.mp3",
          "full-listening-test-2.mp3",
          "full-listening-test-3.mp3",
          "full-listening-test-4.mp3",
          "full-listening-test-5.mp3",
        ];
        for (const name of fullNames) {
          // eslint-disable-next-line no-await-in-loop
          const { url, forbidden } = await signRel(`${relPrefix}${name}`);
          if (forbidden) {
            const redirectPath = `${userPrefix}/resources/listening/${listeningId}`;
            router.push(`${userPrefix}/billing?redirect=${encodeURIComponent(redirectPath)}`);
            return;
          }
          if (url) {
            found.push(url);
            break;
          }
        }
      }

      if (!cancelled) setAvailableAudioSources(found);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [listeningId, userPrefix, router]);

  const formatAudioTime = (sec: number) => {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const s = Math.floor(sec);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  const setPlayerAudioSourceForSection = (_sec: number) => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    const src = availableAudioSources[0] ?? "";
    if (!src) return;
    if (audioEl.src === src) return;
    audioEl.src = src;
    try {
      audioEl.load();
    } catch {
      // ignore
    }
  };

  const togglePlayerPlay = async () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    setPlayerAudioSourceForSection(playerSection);

    try {
      if (audioEl.paused) {
        await audioEl.play();
      } else {
        audioEl.pause();
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const onLoaded = () => {
      const d = Number.isFinite(audioEl.duration) ? audioEl.duration : 0;
      setPlayerDuration(d);
    };
    const onTime = () => {
      if (playerIsSeeking) return;
      setPlayerTime(audioEl.currentTime || 0);
    };
    const onPlay = () => setPlayerIsPlaying(true);
    const onPause = () => setPlayerIsPlaying(false);
    const onEnded = () => setPlayerIsPlaying(false);
    const onWaiting = () => setPlayerIsBuffering(true);
    const onCanPlay = () => setPlayerIsBuffering(false);
    const onPlaying = () => setPlayerIsBuffering(false);

    audioEl.addEventListener("loadedmetadata", onLoaded);
    audioEl.addEventListener("durationchange", onLoaded);
    audioEl.addEventListener("timeupdate", onTime);
    audioEl.addEventListener("play", onPlay);
    audioEl.addEventListener("pause", onPause);
    audioEl.addEventListener("ended", onEnded);
    audioEl.addEventListener("waiting", onWaiting);
    audioEl.addEventListener("canplay", onCanPlay);
    audioEl.addEventListener("playing", onPlaying);

    onLoaded();
    onTime();
    onPause();

    return () => {
      audioEl.removeEventListener("loadedmetadata", onLoaded);
      audioEl.removeEventListener("durationchange", onLoaded);
      audioEl.removeEventListener("timeupdate", onTime);
      audioEl.removeEventListener("play", onPlay);
      audioEl.removeEventListener("pause", onPause);
      audioEl.removeEventListener("ended", onEnded);
      audioEl.removeEventListener("waiting", onWaiting);
      audioEl.removeEventListener("canplay", onCanPlay);
      audioEl.removeEventListener("playing", onPlaying);
    };
  }, [audioRef, playerIsSeeking]);

  useEffect(() => {
    if (!submitted) return;
    setPlayerTime(0);
    setPlayerDuration(0);
    setPlayerIsPlaying(false);
    setPlayerAudioSourceForSection(playerSection);
  }, [submitted, playerSection, availableAudioSources]);

  const inputClass = (q: number) => {
    return "question-input";
  };

  const renderRadio = (
    q: number,
    options: ReadonlyArray<{ value: string; label: string }>
  ) => {
    const selected = (answers[q] ?? "").trim();
    const usePlainRadio = (q >= 17 && q <= 26);

    return (
      <div className={`mcq${usePlainRadio ? " mcq-plain mcq-large-radio" : ""}`}>
        {options.map((opt) => {
          const isSelected = selected === opt.value;

          return (
            <label key={opt.value} className="choice-item">
              <input
                type="radio"
                name={`q${q}`}
                value={opt.value}
                checked={isSelected}
                disabled={submitted}
                onChange={(e) => setAnswer(q, e.target.value)}
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>
    );
  };

  const renderLetterDropdown = (q: number, options: string[]) => {
    const selected = (answers[q] ?? "").toUpperCase();
    const isOpen = openLetterDropdown === q;

    return (
      <div className="rounded-dropdown letter-dropdown">
        <button
          type="button"
          className="rounded-dropdown-trigger"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          disabled={submitted}
          onClick={() => {
            if (submitted) return;
            setOpenLetterDropdown((prev) => (prev === q ? null : q));
          }}
        >
          <span>{selected || "Select"}</span>
          <span>▾</span>
        </button>

        <div
          className={`rounded-dropdown-menu${isOpen ? " is-open" : ""}`}
          role="listbox"
          aria-hidden={!isOpen}
        >
          <button
            type="button"
            className="rounded-dropdown-item"
            onClick={() => {
              setAnswer(q, "");
              setOpenLetterDropdown(null);
            }}
          >
            Select
          </button>
          {options.map((v) => (
            <button
              key={v}
              type="button"
              className="rounded-dropdown-item"
              onClick={() => {
                setAnswer(q, v);
                setOpenLetterDropdown(null);
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
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
      <style jsx global>{`
        html,
        body {
          background: var(--bg);
          color: var(--text);
        }

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

        .fancy-button {
          padding: 1.3em 3em;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 2.5px;
          font-weight: 500;
          color: #000;
          background-color: #fff;
          border: none;
          border-radius: 45px;
          box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease 0s;
          cursor: pointer;
          outline: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          white-space: nowrap;
        }

        .fancy-button:hover {
          background-color: #23c483;
          box-shadow: 0px 15px 20px rgba(46, 229, 157, 0.4);
          color: #fff;
          transform: translateY(-7px);
        }

        .fancy-button:active {
          transform: translateY(-1px);
        }

        .fancy-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .fancy-button:disabled:hover {
          background-color: #fff;
          box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1);
          color: #000;
          transform: none;
        }

        .fancy-button.fancy-button-sm {
          padding: 1.05em 2.1em;
        }

        @media (max-width: 520px) {
          .fancy-button.fancy-button-sm {
            width: 100%;
          }
        }

        .intro-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(2, 6, 23, 0.45);
        }

        .intro-card {
          max-width: 560px;
          width: 100%;
          background: #fff;
          border-radius: 18px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          padding: 26px 22px 22px;
          text-align: center;
          color: #0b1120;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
        }

        .intro-icon {
          width: 84px;
          height: 84px;
          margin: 0 auto 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .intro-text {
          font-size: 14px;
          line-height: 1.55;
          margin: 0 0 18px;
          color: #0b1120;
        }

        .audio-player-card {
          margin-bottom: 12px;
          padding: 14px 16px;
          border-radius: 14px;
          background: var(--card);
          box-shadow: var(--shadow-card);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .audio-player-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .audio-player-title {
          font-weight: 900;
          font-size: 13px;
          color: var(--text);
          letter-spacing: 0.2px;
        }

        .audio-player-sections {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .audio-section-chip {
          border: 1px solid var(--border);
          background: var(--subtle);
          color: var(--text);
          border-radius: 999px;
          padding: 7px 10px;
          font-weight: 800;
          font-size: 12px;
          cursor: pointer;
          user-select: none;
          transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
        }

        .audio-section-chip:hover {
          background: var(--hover);
          transform: translateY(-1px);
        }

        .audio-section-chip.is-active {
          background: rgba(35, 196, 131, 0.16);
          border-color: rgba(35, 196, 131, 0.5);
        }

        .audio-section-chip:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        .audio-player-controls {
          display: grid;
          grid-template-columns: 52px 1fr;
          gap: 12px;
          align-items: center;
        }

        .audio-play-btn {
          height: 46px;
          width: 46px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: var(--subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 160ms ease, background-color 160ms ease;
          color: var(--text);
        }

        .audio-play-btn:hover {
          background: var(--hover);
          transform: translateY(-1px);
        }

        .audio-timeline {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .audio-time-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 800;
          color: var(--muted);
        }

        .audio-range {
          width: 100%;
          accent-color: #23c483;
        }

        .main-layout {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .questions-layout {
          background: transparent;
          border: none;
          border-radius: 0;
          padding: 20px;
          box-shadow: none;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: var(--scrollbar-thumb) transparent;
        }

        #questions-card::-webkit-scrollbar {
          width: 8px;
        }

        #questions-card::-webkit-scrollbar-track {
          background: transparent;
        }

        #questions-card::-webkit-scrollbar-thumb {
          background-color: var(--scrollbar-thumb);
          border-radius: 4px;
        }

        .results-scroll {
          scrollbar-width: thin;
          scrollbar-color: var(--scrollbar-thumb) transparent;
        }

        .results-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .results-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .results-scroll::-webkit-scrollbar-thumb {
          background-color: var(--scrollbar-thumb);
          border-radius: 4px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }

        .section-title {
          font-weight: 900;
          font-size: 16px;
          color: var(--text);
        }

        .section-instructions {
          margin-top: 4px;
          color: var(--muted);
          font-weight: 700;
          font-size: 13px;
        }

        .question-block {
          color: var(--text);
        }

        .question-line {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          flex-wrap: wrap;
        }

        #questions-body {
          padding-bottom: 16px;
        }

        .question-input {
          height: 34px;
          padding: 6px 10px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text);
          font-weight: 400;
          outline: none;
          min-width: 70px;
        }

        .question-select {
          width: 200px;
          max-width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text-soft);
          font-size: 13px;
          outline: none;
        }

        .mcq {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 12px 0 10px;
        }

        .mcq-plain .choice-item {
          padding: 6px 0;
          border: none;
          background: transparent;
          border-radius: 0;
        }

        .mcq-plain .choice-item:hover {
          background: transparent;
        }

        .mcq-large-radio input[type="radio"] {
          width: 22px;
          height: 22px;
          margin-top: 1px;
          appearance: none;
          -webkit-appearance: none;
          border: 2px solid #94a3b8;
          border-radius: 999px;
          background: transparent;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          cursor: pointer;
        }

        .mcq-large-radio input[type="radio"]:checked {
          border-color: #94a3b8;
        }

        .mcq-large-radio input[type="radio"]:checked::after {
          content: "";
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #2563eb;
        }

        .mcq-large-radio input[type="radio"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.25);
        }

        input[type="checkbox"][name="q27_29"] {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 4px;
          border: 2px solid rgba(148, 163, 184, 0.8);
          background: transparent;
          display: inline-block;
          position: relative;
          flex: 0 0 auto;
          margin-top: 1px;
          cursor: pointer;
        }

        input[type="checkbox"][name="q27_29"]::before,
        input[type="checkbox"][name="q27_29"]::after {
          content: none !important;
          display: none !important;
        }

        input[type="checkbox"][name="q27_29"]:checked {
          background: #2563eb;
          border-color: #2563eb;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
        }

        input[type="checkbox"][name="q27_29"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.28);
        }

        input[type="checkbox"][name="q27_29"]:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .rounded-dropdown {
          position: relative;
          width: 200px;
          max-width: 100%;
        }

        .rounded-dropdown.letter-dropdown {
          width: 145px;
        }

        .rounded-dropdown-trigger {
          width: 100%;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text-soft);
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .rounded-dropdown-trigger > span:last-child {
          color: var(--muted) !important;
        }

        .rounded-dropdown-trigger:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.25);
        }

        .rounded-dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 100%;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: var(--shadow-menu);
          z-index: 50;
          opacity: 0;
          transform: translateY(-6px);
          pointer-events: none;
          transition: opacity 180ms ease, transform 180ms ease;
        }

        .rounded-dropdown-menu.is-open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .rounded-dropdown-item {
          width: 100%;
          border: none;
          background: transparent;
          padding: 10px 12px;
          text-align: left;
          cursor: pointer;
          font-size: 14px;
          color: var(--text-soft);
        }

        .rounded-dropdown-item:hover {
          background: var(--hover);
        }

        .choice-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--card);
          color: var(--text);
          cursor: pointer;
          user-select: none;
        }

        .choice-item input {
          margin-top: 2px;
        }

        .confirm-overlay,
        .results-overlay {
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
          background: rgba(0, 0, 0, 0.55);
          z-index: 400;
        }

        .timeup-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          z-index: 650;
        }

        .timeup-modal {
          position: fixed;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 420px;
          max-width: calc(100vw - 32px);
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: var(--shadow-menu);
          z-index: 651;
          padding: 18px 16px;
          text-align: center;
        }

        .timeup-title {
          font-weight: 900;
          font-size: 16px;
          color: var(--text);
          letter-spacing: 0.2px;
          margin-bottom: 8px;
        }

        .timeup-subtitle {
          font-weight: 800;
          font-size: 13px;
          color: var(--muted);
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
          color: var(--text);
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
        }

        .section-title {
          font-size: 14px;
          font-weight: 900;
          margin-top: 14px;
          margin-bottom: 10px;
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
          margin-top: 16px;
        }

        @media (max-width: 520px) {
          .nav-row {
            grid-template-columns: 1fr;
          }
        }

        .nav-btn {
          width: 100%;
          padding: 9px 12px;
          border-radius: 999px;
          font-weight: 900;
          border: 1px solid var(--border);
          background: var(--subtle);
          color: var(--text);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background-color 160ms ease, transform 160ms ease;
        }

        .nav-btn:hover {
          background: var(--hover);
        }

        .nav-btn:active {
          transform: translateY(1px);
        }

        .nav-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.25);
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
          width: 320px;
          background: var(--card);
          border-left: 1px solid var(--border);
          box-shadow: var(--shadow-menu);
          z-index: 181;
          transform: translateX(100%);
          transition: transform 220ms ease;
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
          padding: 14px 14px 10px;
          border-bottom: 1px solid var(--border);
          color: var(--text);
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
          color: var(--text-soft);
          border-radius: 10px;
          padding: 10px 10px;
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
          border-radius: 10px;
          padding: 8px 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
        }

        .note-item {
          padding: 10px 12px;
          border: 1px solid var(--border);
          background: var(--subtle);
          border-radius: 10px;
          margin-bottom: 10px;
          font-size: 13px;
          line-height: 1.4;
          cursor: pointer;
        }

        .selection-toolbar {
          position: fixed;
          z-index: 220;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: var(--shadow-menu);
          padding: 8px 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          user-select: none;
        }

        .selection-toolbar .toolbar-title {
          display: flex;
          align-items: center;
          flex-direction: column;
          gap: 2px;
          color: var(--text);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          background: transparent;
          padding: 0;
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
          width: 28px;
          height: 28px;
          border-radius: 999px;
          border: 1px solid var(--border);
          cursor: pointer;
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.18);
        }

        .dot-yellow { background: #ffeb3b; }
        .dot-green { background: #00ff5a; }
        .dot-white { background: var(--card); }

        .hl { padding: 0; border-radius: 3px; }
        .hl-yellow { background: #ffeb3b; }
        .hl-green { background: rgba(0, 255, 90, 0.30); }
        .hl-note { background: rgba(41, 98, 255, 0.26); }
      `}</style>

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
            src="https://resources.edufyuzbekistan.com/storage/images/IELTSlogo.png"
            alt="IELTS"
            style={{
              height: 28,
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
          >
            ×
          </button>
        </div>
        <div className="notes-body">
          {activeNoteId !== null ? (
            <div className="note-editor">
              <div className="note-editor-quote">
                <em>
                  <strong>{notes.find((n) => n.createdAt === activeNoteId)?.quote ?? ""}</strong>
                </em>
              </div>
              <textarea
                className="note-editor-input"
                value={notes.find((n) => n.createdAt === activeNoteId)?.text ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setNotes((prev) => prev.map((n) => (n.createdAt === activeNoteId ? { ...n, text: v } : n)));
                }}
                placeholder="Write a note..."
              />
              <div className="note-editor-actions">
                <button type="button" className="note-editor-delete" onClick={() => deleteNote(activeNoteId)}>
                  Delete
                </button>
              </div>
            </div>
          ) : null}

          {notes.length === 0 ? (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>No notes yet.</div>
          ) : (
            notes
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((n) => (
                <div key={n.createdAt} className="note-item" onClick={() => setActiveNoteId(n.createdAt)}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div style={{ marginBottom: 6, flex: 1 }}>
                      <em>
                        <strong>{n.quote}</strong>
                      </em>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(n.createdAt);
                      }}
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

      <div
        style={{
          height: 2,
          backgroundColor: "var(--border)",
          marginLeft: -20,
          marginRight: -20,
          marginBottom: 16,
        }}
      />

      {submitted ? (
        <div className="audio-player-card">
          <div className="audio-player-top">
            <div className="audio-player-title">Audio Playback</div>
            <div className="audio-player-sections">
              <button
                type="button"
                className={`audio-section-chip${playerSection === 1 ? " is-active" : ""}`}
                disabled={availableAudioSources.length === 0}
                onClick={() => {
                  setPlayerSection(1);
                }}
              >
                Full Audio
              </button>
            </div>
          </div>

          <div className="audio-player-controls">
            <button type="button" className="audio-play-btn" onClick={togglePlayerPlay} aria-label="Play/Pause">
              {playerIsPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M7 5v14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M17 5v14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 18V6l12 6-12 6Z"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            <div className="audio-timeline">
              <input
                className="audio-range"
                type="range"
                min={0}
                max={playerDuration || 0}
                value={
                  playerIsSeeking
                    ? playerSeekValue
                    : Math.min(playerTime, playerDuration || 0)
                }
                step={0.1}
                onPointerDown={() => {
                  const v = Math.min(playerTime, playerDuration || 0);
                  setPlayerIsSeeking(true);
                  setPlayerSeekValue(v);
                }}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v)) return;
                  setPlayerSeekValue(v);
                  setPlayerTime(v);
                }}
                onPointerUp={() => {
                  const audioEl = audioRef.current;
                  if (!audioEl) {
                    setPlayerIsSeeking(false);
                    return;
                  }
                  try {
                    audioEl.currentTime = playerSeekValue;
                  } catch {
                    // ignore
                  }
                  setPlayerIsSeeking(false);
                }}
              />
              <div className="audio-time-row">
                <span>{formatAudioTime(playerIsSeeking ? playerSeekValue : playerTime)}</span>
                <span>{formatAudioTime(playerDuration)}</span>
              </div>
              {playerIsBuffering ? (
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>
                  Loading audio…
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <main className="main-layout">
        <div
          id="questions-card"
          className="questions-layout"
          onMouseUp={handleQuestionsMouseUp}
          onScroll={handleQuestionsScroll}
        >
          <div className="question-block" id="questions-body" ref={questionsRef}>
            <div style={{ display: currentSection === 1 ? "block" : "none" }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>SECTION 1</div>
              <div style={{ marginBottom: 10, fontWeight: 900 }}>
                Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.
              </div>
              <div style={{ fontWeight: 900, margin: "10px 0" }}>
                Moving Company Service Report
              </div>

              <div className="question-line">
                <span style={{ fontWeight: 800 }}>1.</span>
                <span>Phone Number:</span>
                <input
                  id="q1"
                  className={inputClass(1)}
                  value={answers[1] ?? ""}
                  onChange={(e) => setAnswer(1, e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="question-line">
                <span style={{ fontWeight: 800 }}>2.</span>
                <span>USA Address: 509</span>
                <input
                  id="q2"
                  className={inputClass(2)}
                  value={answers[2] ?? ""}
                  onChange={(e) => setAnswer(2, e.target.value)}
                  placeholder="2"
                />
              </div>
              <div className="question-line">
                <span style={{ fontWeight: 800 }}>3.</span>
                <span>1137</span>
                <input
                  id="q3"
                  className={inputClass(3)}
                  value={answers[3] ?? ""}
                  onChange={(e) => setAnswer(3, e.target.value)}
                  placeholder="3"
                />
                <span>in Seattle</span>
              </div>
              <div className="question-line">
                <span style={{ fontWeight: 800 }}>4.</span>
                <span>Packing Day:</span>
                <input
                  id="q4"
                  className={inputClass(4)}
                  value={answers[4] ?? ""}
                  onChange={(e) => setAnswer(4, e.target.value)}
                  placeholder="4"
                />
              </div>
              <div className="question-line">
                <span style={{ fontWeight: 800 }}>5.</span>
                <span>Clean-up Day:</span>
                <input
                  id="q5"
                  className={inputClass(5)}
                  value={answers[5] ?? ""}
                  onChange={(e) => setAnswer(5, e.target.value)}
                  placeholder="5"
                />
              </div>
              <div className="question-line">
                <span style={{ fontWeight: 800 }}>6.</span>
                <span>Storage Time:</span>
                <input
                  id="q6"
                  className={inputClass(6)}
                  value={answers[6] ?? ""}
                  onChange={(e) => setAnswer(6, e.target.value)}
                  placeholder="6"
                />
              </div>

              <div style={{ fontWeight: 900, margin: "18px 0 10px" }}>
                Questions 7–10
              </div>
              <div style={{ color: "var(--muted)", marginBottom: 10, fontWeight: 900 }}>
                Choose the correct letter, A, B, or C.
              </div>

              <div className="card" style={{ marginTop: 12, background: "var(--subtle)", padding: 14 }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Options</div>
                <div style={{ color: "var(--text-soft)", fontSize: 15, lineHeight: 1.7 }}>
                  <strong>A.</strong> in emergency pack
                  <br />
                  <strong>B.</strong> in personal package
                  <br />
                  <strong>C.</strong> in storage with the furniture
                </div>
              </div>

              {[7, 8, 9, 10].map((q) => (
                <div key={q} className="question-line">
                  <span style={{ fontWeight: 800 }}>{q}.</span>
                  <span>
                    {q === 7
                      ? "cutlery and dishes"
                      : q === 8
                        ? "kettle"
                        : q === 9
                          ? "alarm clock"
                          : "CD player"}
                  </span>
                  <input
                    id={`q${q}`}
                    className={inputClass(q)}
                    value={answers[q] ?? ""}
                    onChange={(e) =>
                      setAnswer(q, e.target.value.replace(/[^a-cA-C]/g, "").slice(0, 1).toUpperCase())
                    }
                    placeholder={String(q)}
                    style={{ width: 90, textTransform: "uppercase" }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: currentSection === 2 ? "block" : "none" }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>SECTION 2</div>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>
                Annual Willaballoo Conference Schedule
              </div>
              <div style={{ color: "var(--muted)", marginBottom: 10, fontWeight: 900 }}>
                Complete the table below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.
              </div>

              <div className="card" style={{ background: "var(--subtle)", padding: 14, marginTop: 6 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ border: "1px solid var(--border)", padding: 8, textAlign: "left" }}>TIME</th>
                      <th style={{ border: "1px solid var(--border)", padding: 8, textAlign: "left" }}>CONTENT</th>
                      <th style={{ border: "1px solid var(--border)", padding: 8, textAlign: "left" }}>LOCATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>9:00 a.m.</td>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                          <span style={{ fontWeight: 800 }}>Title:</span>
                          <input
                            id="q11"
                            className={inputClass(11)}
                            value={answers[11] ?? ""}
                            onChange={(e) => setAnswer(11, e.target.value)}
                            placeholder="11"
                            style={{ minWidth: 140 }}
                          />
                        </div>
                        <div style={{ height: 8 }} />
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                          <span style={{ fontWeight: 800 }}>Lecturer:</span>
                          <span>John Smith from the</span>
                          <input
                            id="q12"
                            className={inputClass(12)}
                            value={answers[12] ?? ""}
                            onChange={(e) => setAnswer(12, e.target.value)}
                            placeholder="12"
                            style={{ minWidth: 160 }}
                          />
                        </div>
                      </td>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>Main Hall</td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>10:30 a.m.</td>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>Presentation of papers</td>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>Garden Room (ground floor)</td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>11:15 a.m.</td>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>Coffee break</td>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>Main Hall</td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>1:00 p.m.</td>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>Lunch</td>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                          <span>Sea View Restaurant on the</span>
                          <input
                            id="q13"
                            className={inputClass(13)}
                            value={answers[13] ?? ""}
                            onChange={(e) => setAnswer(13, e.target.value)}
                            placeholder="13"
                            style={{ minWidth: 120 }}
                          />
                        </div>
                        <div style={{ height: 8 }} />
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                          <span>Lift on the</span>
                          <input
                            id="q14"
                            className={inputClass(14)}
                            value={answers[14] ?? ""}
                            onChange={(e) => setAnswer(14, e.target.value)}
                            placeholder="14"
                            style={{ minWidth: 120 }}
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>2:00 p.m.</td>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>Presentation of further papers</td>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>Ballroom</td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input
                            id="q15"
                            className={inputClass(15)}
                            value={answers[15] ?? ""}
                            onChange={(e) => setAnswer(15, e.target.value)}
                            placeholder="15"
                            style={{ width: 110 }}
                          />
                          <span>p.m.</span>
                        </div>
                      </td>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>Afternoon tea</td>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>Ballroom</td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>5:00 p.m.</td>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>Conference ends</td>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>Main Hall</td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>5:10-6:10 p.m.</td>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>Informal reception</td>
                      <td style={{ border: "1px solid var(--border)", padding: 8 }}>
                        <input
                          id="q16"
                          className={inputClass(16)}
                          value={answers[16] ?? ""}
                          onChange={(e) => setAnswer(16, e.target.value)}
                          placeholder="16"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ fontWeight: 900, marginTop: 18 }}>Questions 17–20</div>
              <div style={{ color: "var(--muted)", marginTop: 6, fontWeight: 900 }}>
                Choose the correct letter, A, B, or C.
              </div>

                <div className="question-line" style={{ alignItems: "flex-start", marginTop: 14 }}>
                  <div style={{ fontWeight: 800 }}>17. Tickets are available:</div>
                </div>
                {renderRadio(17, [
                  { value: "A", label: "A. only at the reception desk" },
                  { value: "B", label: "B. tomorrow evening" },
                  { value: "C", label: "C. at any time before the reception" },
                ])}

                <div className="question-line" style={{ alignItems: "flex-start", marginTop: 14 }}>
                  <div style={{ fontWeight: 800 }}>18. The delegates will be charged ...... for lunch.</div>
                </div>
                {renderRadio(18, [
                  { value: "A", label: "A. $6.50" },
                  { value: "B", label: "B. $15.00" },
                  { value: "C", label: "C. $25.00" },
                ])}

                <div className="question-line" style={{ alignItems: "flex-start", marginTop: 14 }}>
                  <div style={{ fontWeight: 800 }}>19. The restaurant is famous for:</div>
                </div>
                {renderRadio(19, [
                  { value: "A", label: "A. steak" },
                  { value: "B", label: "B. fish" },
                  { value: "C", label: "C. barbecue" },
                ])}

                <div className="question-line" style={{ alignItems: "flex-start", marginTop: 14 }}>
                  <div style={{ fontWeight: 800 }}>20. The trip on Sunday costs:</div>
                </div>
                {renderRadio(20, [
                  { value: "A", label: "A. $35 in total" },
                  { value: "B", label: "B. $35 plus entrance fees" },
                  { value: "C", label: "C. $35 plus lunch" },
                ])}
              </div>

              <div style={{ display: currentSection === 3 ? "block" : "none" }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>SECTION 3</div>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Course Details</div>

                <div style={{ fontWeight: 900, marginTop: 18 }}>Questions 21–26</div>
                <div style={{ color: "var(--muted)", marginTop: 6, fontWeight: 900 }}>
                  Choose the correct letter, A, B, or C.
                </div>

                <div className="question-line" style={{ alignItems: "flex-start", marginTop: 14 }}>
                  <div style={{ fontWeight: 800 }}>
                    21. What is the defining characteristic of a specialised course?
                  </div>
                </div>
                {renderRadio(21, [
                  { value: "A", label: "A. Taking a proficiency exam" },
                  { value: "B", label: "B. Attending class frequently" },
                  { value: "C", label: "C. Compulsory and regular" },
                ])}

                <div className="question-line" style={{ alignItems: "flex-start", marginTop: 14 }}>
                  <div style={{ fontWeight: 800 }}>22. The Microbiology courses are available for:</div>
                </div>
                {renderRadio(22, [
                  { value: "A", label: "A. full-time and flexible-time students" },
                  { value: "B", label: "B. Microbiology students only" },
                  { value: "C", label: "C. students on a flexible schedule" },
                ])}

                <div className="question-line" style={{ alignItems: "flex-start", marginTop: 14 }}>
                  <div style={{ fontWeight: 800 }}>23. The Biology courses are available for:</div>
                </div>
                {renderRadio(23, [
                  { value: "A", label: "A. all students" },
                  { value: "B", label: "B. full-time students only" },
                  { value: "C", label: "C. freshmen only" },
                ])}

                <div className="question-line" style={{ alignItems: "flex-start", marginTop: 14 }}>
                  <div style={{ fontWeight: 800 }}>24. Who are interested in Microbiology courses?</div>
                </div>
                {renderRadio(24, [
                  { value: "A", label: "A. People who need work experience" },
                  { value: "B", label: "B. People from off-campus" },
                  { value: "C", label: "C. People who work at hospitals" },
                ])}

                <div className="question-line" style={{ alignItems: "flex-start", marginTop: 14 }}>
                  <div style={{ fontWeight: 800 }}>
                    25. A Medical Science course will be opened next year because:
                  </div>
                </div>
                {renderRadio(25, [
                  { value: "A", label: "A. there are no experimental facilities" },
                  { value: "B", label: "B. the lab equipment is too expensive" },
                  { value: "C", label: "C. the building is damaged" },
                ])}

                <div className="question-line" style={{ alignItems: "flex-start", marginTop: 14 }}>
                  <div style={{ fontWeight: 800 }}>26. Which is the quickest increasing subject in enrolment?</div>
                </div>
                {renderRadio(26, [
                  { value: "A", label: "A. Medical Science" },
                  { value: "B", label: "B. Statistics" },
                  { value: "C", label: "C. Environmental Science" },
                ])}

                <div style={{ fontWeight: 900, marginTop: 18 }}>Questions 27–29</div>
                <div style={{ color: "var(--muted)", marginTop: 6, fontWeight: 900 }}>
                  Choose THREE letters, A–G. Which THREE compulsory courses must be taken?
                </div>

                <div className="mcq" style={{ marginTop: 10 }}>
                  {(
                    [
                      { value: "A", label: "A. Medical Science" },
                      { value: "B", label: "B. Computing" },
                      { value: "C", label: "C. Mathematics" },
                      { value: "D", label: "D. Laboratory Techniques" },
                      { value: "E", label: "E. Statistics" },
                      { value: "F", label: "F. Medicine" },
                      { value: "G", label: "G. Environmental Science" },
                    ] as const
                  ).map((opt) => {
                    const selected = getSelectedMulti27to29().includes(opt.value);
                    return (
                      <label key={opt.value} className="choice-item">
                        <input
                          type="checkbox"
                          name="q27_29"
                          value={opt.value}
                          checked={selected}
                          disabled={submitted}
                          onChange={() => toggleMulti27to29(opt.value)}
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
                <div style={{ color: "#3b82f6", marginTop: 6, fontSize: 12, fontWeight: 900 }}>
                  Selected: {getSelectedMulti27to29().join(", ") || "—"}
                </div>

                <div style={{ fontWeight: 900, marginTop: 18 }}>Question 30</div>
                <div className="question-line" style={{ alignItems: "center", marginTop: 10 }}>
                  <span style={{ fontWeight: 800 }}>30.</span>
                  <span>
                    There are three full scholarships that cover tuition and provide $1,500 cash as:
                  </span>
                  <input
                    id="q30"
                    className={inputClass(30)}
                    value={answers[30] ?? ""}
                    onChange={(e) => setAnswer(30, e.target.value)}
                    placeholder="30"
                  />
                </div>
              </div>

              <div style={{ display: currentSection === 4 ? "block" : "none" }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>SECTION 4</div>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>
                  How to Choose Flooring Materials
                </div>
                <div style={{ color: "var(--muted)", marginBottom: 12, fontWeight: 900 }}>
                  Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.
                </div>

                {[31, 32, 33, 34, 35, 36, 37].map((q) => (
                  <div key={q} className="question-line">
                    <span style={{ fontWeight: 800 }}>{q}.</span>
                    <span>
                      {q === 31
                        ? "There are some man-made materials like"
                        : q === 32
                          ? "Before being used, material undergoes"
                          : q === 33
                            ? "Wood should be cut and"
                            : q === 34
                              ? "Stone should be cut and"
                              : q === 35
                                ? "Aside from environmental factors, consider"
                                : q === 36
                                  ? "Material properties affecting mood:"
                                  : "Use mathematical formulas because"}
                    </span>
                    <input
                      id={`q${q}`}
                      className={inputClass(q)}
                      value={answers[q] ?? ""}
                      onChange={(e) => setAnswer(q, e.target.value)}
                      placeholder={String(q)}
                    />
                    {q === 35 ? <span>during construction</span> : null}
                    {q === 36 ? <span>texture, and colour</span> : null}
                    {q === 37 ? <span>are subjective</span> : null}
                  </div>
                ))}

                <div style={{ fontWeight: 900, marginTop: 18 }}>Questions 38–40</div>
                <div style={{ color: "var(--muted)", marginTop: 6, fontWeight: 900 }}>
                  Complete the table. Write NO MORE THAN TWO WORDS AND/OR A NUMBER.
                </div>

                <div className="card" style={{ background: "var(--subtle)", marginTop: 12, padding: 14 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ border: "1px solid var(--border)", padding: 8, textAlign: "left" }}>MATERIAL</th>
                        <th style={{ border: "1px solid var(--border)", padding: 8, textAlign: "left" }}>
                          REFLECTANCE RATE
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: "1px solid var(--border)", padding: 8 }}>Polished silver</td>
                        <td style={{ border: "1px solid var(--border)", padding: 8 }}>Almost 1.0</td>
                      </tr>
                      <tr>
                        <td style={{ border: "1px solid var(--border)", padding: 8 }}>White-painted plastic</td>
                        <td style={{ border: "1px solid var(--border)", padding: 8 }}>
                          <input
                            id="q38"
                            className={inputClass(38)}
                            value={answers[38] ?? ""}
                            onChange={(e) => setAnswer(38, e.target.value)}
                            placeholder="38"
                            style={{ width: "100%" }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: "1px solid var(--border)", padding: 8 }}>Quarry tile</td>
                        <td style={{ border: "1px solid var(--border)", padding: 8 }}>
                          <input
                            id="q39"
                            className={inputClass(39)}
                            value={answers[39] ?? ""}
                            onChange={(e) => setAnswer(39, e.target.value)}
                            placeholder="39"
                            style={{ width: "100%" }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: "1px solid var(--border)", padding: 8 }}>
                          <input
                            id="q40"
                            className={inputClass(40)}
                            value={answers[40] ?? ""}
                            onChange={(e) => setAnswer(40, e.target.value)}
                            placeholder="40"
                            style={{ width: "100%" }}
                          />
                        </td>
                        <td style={{ border: "1px solid var(--border)", padding: 8 }}>Almost 0.0</td>
                      </tr>
                    </tbody>
                  </table>
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
          style={{
            color: "var(--text-soft)",
            fontSize: 12,
            minHeight: 16,
            display: "flex",
            alignItems: "center",
          }}
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
          minHeight: 40,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ width: "100%", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, width: "100%", alignItems: "stretch" }}>
            {[1, 2, 3, 4].map((sec) => {
              const secRange = getSectionRange(sec);
              const isActive = currentSection === sec;
              const totalInSection = secRange.end - secRange.start + 1;
              const answeredInSection = countAnsweredInRange(secRange.start, secRange.end);
              return (
                <div
                  key={sec}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 10,
                    padding: "6px 10px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    cursor: "pointer",
                    userSelect: "none",
                    boxShadow: "none",
                    transition:
                      "transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease",
                  }}
                  onClick={() => {
                    if (currentSection === sec) return;
                    setCurrentSection(sec);
                    window.requestAnimationFrame(() => scrollQuestionsCardToTop());
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {isActive ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", whiteSpace: "nowrap" }}>
                        Section {sec}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          overflowX: "auto",
                          overflowY: "hidden",
                          minWidth: 0,
                          paddingBottom: 1,
                          flex: 1,
                        }}
                      >
                        {range(secRange.start, secRange.end).map((num) => {
                          const answered = Boolean((answers[num] ?? "").trim());
                          return (
                            <div
                              key={num}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 7,
                                border: answered
                                  ? "1px solid rgba(72, 187, 120, 0.65)"
                                  : "1px solid var(--border)",
                                backgroundColor: answered ? "rgba(72, 187, 120, 0.18)" : "var(--card)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 900,
                                color: answered ? "var(--text)" : "var(--muted)",
                                cursor: "pointer",
                                userSelect: "none",
                                flex: "0 0 auto",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                focusQuestion(num);
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              {num}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>Section {sec}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>
                        {answeredInSection}/{totalInSection}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (submitted) setIsResultsOpen(true);
              else setIsSubmitConfirmOpen(true);
            }}
            disabled={false}
            className="submit-button fancy-button fancy-button-sm"
            style={{ flex: "0 0 auto" }}
          >
            {submitted ? "View Results" : "Submit"}
          </button>
        </div>
      </div>

      {isSubmitConfirmOpen ? (
        <>
          <div
            className="confirm-overlay"
            onClick={() => setIsSubmitConfirmOpen(false)}
          />
          <div className="confirm-modal" role="dialog" aria-modal="true">
            <div className="confirm-title">
              Are you sure you want to submit the test?
            </div>
            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-btn"
                onClick={() => setIsSubmitConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-btn confirm-btn-primary"
                onClick={() => {
                  setIsSubmitConfirmOpen(false);
                  submitTest();
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </>
      ) : null}

      {isTimeUpOpen ? (
        <>
          <div className="timeup-overlay" />
          <div className="timeup-modal" role="dialog" aria-modal="true">
            <div className="timeup-title">Time is up</div>
            <div className="timeup-subtitle">Submitting your answers</div>
          </div>
        </>
      ) : null}

      {isSupportOpen ? (
        <>
          <div
            className="results-overlay"
            style={{ zIndex: 500 }}
            onClick={() => setIsSupportOpen(false)}
          />
          <div className="support-modal" role="dialog" aria-modal="true">
            <div className="results-top" style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 14 }}>Support Our Project</div>
              <button
                type="button"
                className="results-close"
                onClick={() => setIsSupportOpen(false)}
                aria-label="Close support"
              >
                ×
              </button>
            </div>

            <div className="support-card">
              <div className="support-card-num">4023 0601 0538 4175</div>
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
              <div className="support-card-num">8600 1402 8071 0535</div>
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

      {isResultsOpen ? (
        <>
          <div className="results-overlay" onClick={() => setIsResultsOpen(false)} />
          <div className="results-modal" role="dialog" aria-modal="true">
            <div className="results-scroll">
              <div className="results-top">
                <div style={{ fontWeight: 900, fontSize: 14 }}>Results</div>
                <button
                  type="button"
                  className="results-close"
                  onClick={() => setIsResultsOpen(false)}
                  aria-label="Close results"
                >
                  ×
                </button>
              </div>

              <div className="results-hero">
                <div className="complete-badge" aria-hidden="true">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 7 10.5 16.5 4 10"
                      stroke="#48bb78"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
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
                      <div className="answer-q">{a.label}</div>
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
                          <path
                            d="M20 7 10.5 16.5 4 10"
                            stroke="#48bb78"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M18 6 6 18"
                            stroke="#ef4444"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M6 6l12 12"
                            stroke="#ef4444"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="support-btn"
                onClick={() => {
                  setIsSupportOpen(true);
                  setFeedbackSubmitted(false);
                }}
              >
                Support Our Project
              </button>

              <div className="feedback-box">
                <div className="section-title" style={{ marginTop: 0 }}>
                  Leave Your Feedback
                </div>
                <textarea
                  className="feedback-input"
                  value={feedbackText}
                  onChange={(e) => {
                    setFeedbackText(e.target.value);
                    setFeedbackSubmitted(false);
                  }}
                  placeholder="Write your feedback..."
                />
                <div className="feedback-actions">
                  {feedbackSubmitted ? (
                    <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>
                      Thanks for your feedback!
                    </div>
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
                <button type="button" className="nav-btn" onClick={resetTest}>
                  <i className="fa-solid fa-rotate-right" aria-hidden="true" />
                  <span>Try Again</span>
                </button>
                <button type="button" className="nav-btn" onClick={() => router.push(dashboardHref)}>
                  <i className="fa-solid fa-house" aria-hidden="true" />
                  <span>Back to Dashboard</span>
                </button>
                <button type="button" className="nav-btn" onClick={() => router.push(listeningTestsHref)}>
                  <i className="fa-solid fa-headphones" aria-hidden="true" />
                  <span>Listening Tests</span>
                </button>
                <button
                  type="button"
                  className="nav-btn"
                  onClick={() => {
                    setIsResultsOpen(false);
                    router.push(reviewHref);
                  }}
                >
                  <i className="fa-solid fa-clipboard-check" aria-hidden="true" />
                  <span>Review Test</span>
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      </main>

      <audio ref={audioRef} preload="auto" style={{ display: "none" }} />

      {!hasStarted ? (
        <div className="intro-overlay">
          <div className="intro-card">
            <div className="intro-icon" aria-hidden="true">
              <svg
                fill="#000000"
                width="84"
                height="84"
                viewBox="-2.3 0 122.88 122.88"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                xmlSpace="preserve"
              >
                <g>
                  <path d="M111.85,108.77c-3.47,4.82-8.39,8.52-14.13,10.48c-0.26,0.12-0.55,0.18-0.84,0.18c-0.28,0-0.56-0.06-0.82-0.17v0.06 c0,1.96-1.6,3.56-3.57,3.56l-7.68,0c-1.96,0-3.57-1.6-3.57-3.56l0-55.13c0-1.96,1.6-3.57,3.57-3.57h7.68c1.96,0,3.57,1.6,3.57,3.57 v0.34c0.26-0.12,0.54-0.18,0.82-0.18c0.22,0,0.44,0.04,0.64,0.1l0,0.01c4.36,1.45,8.26,3.92,11.42,7.11V59.15 c0-14.89-4.99-27.63-13.81-36.6l-3.91,5.83c-7.95-8.75-19.4-14.27-32.08-14.27c-12.76,0-24.29,5.59-32.24,14.45l-4.73-5.78 C13.47,31.65,8.54,44.21,8.54,59.15V73.4c3.4-4.08,7.92-7.22,13.07-8.93l0-0.01c0.21-0.07,0.43-0.11,0.64-0.11 c0.28,0,0.57,0.06,0.82,0.17v-0.34c0-1.96,1.61-3.57,3.57-3.57l7.68,0c1.96,0,3.57,1.6,3.57,3.57v55.13c0,1.96-1.61,3.56-3.57,3.56 h-7.68c-1.96,0-3.57-1.6-3.57-3.56v-0.06c-0.25,0.11-0.53,0.17-0.82,0.17c-0.3,0-0.58-0.07-0.83-0.18 c-5.74-1.96-10.66-5.66-14.13-10.48c-1.82-2.52-3.24-5.34-4.17-8.37l-3.12,0V59.15c0-16.27,6.65-31.05,17.37-41.77 C28.09,6.66,42.88,0,59.14,0c16.27,0,31.06,6.66,41.77,17.37c10.72,10.72,17.37,25.5,17.37,41.77v41.25h-2.27 C115.1,103.39,113.68,106.23,111.85,108.77L111.85,108.77L111.85,108.77z" />
                </g>
              </svg>
            </div>
            <p className="intro-text">
              You will be listening to an audio clip during this test. You will not be
              permitted to pause or rewind the audio while answering the questions.
              <br />
              <br />
              To continue, click Play.
            </p>
            <button
              type="button"
              className="fancy-button"
              onClick={() => {
                setHasStarted(true);
                setIsRunning(true);
                setTimeLeft(32 * 60);

                const audioEl = audioRef.current;
                if (!audioEl) return;

                const firstUrl = availableAudioSources[0] ?? "";
                if (!firstUrl) return;

                setCurrentSection(1);

                audioEl.src = firstUrl;
                try {
                  audioEl.load();
                  audioEl.play().catch(() => {
                    // ignore autoplay errors
                  });
                } catch {
                  // ignore
                }
              }}
            >
              Play
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
