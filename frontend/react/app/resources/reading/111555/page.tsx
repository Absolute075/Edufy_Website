 "use client";

import Head from "next/head";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { markTestCompleted } from "@/lib/completedTests";
import { api } from "@/lib/api";

const correctAnswers = {
  q1: "NO",
  q2: "YES",
  q3: "NOT GIVEN",
  q4: "YES",
  q5: "NO",
  q6: "H",
  q7: "A",
  q8: "C",
  q9: "G",
  q10: "E",
  q11: "C",
  q12: "B",
  q13: "A",
  q14: "A",
};

const progressNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

type QuestionKey = keyof typeof correctAnswers;

const initialSelections: Record<QuestionKey, string> = {
  q1: "",
  q2: "",
  q3: "",
  q4: "",
  q5: "",
  q6: "",
  q7: "",
  q8: "",
  q9: "",
  q10: "",
  q11: "",
  q12: "",
  q13: "",
  q14: "",
};

export default function Reading111555Page() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";

  const readingId = useMemo(() => {
    const idx = segments.indexOf("resources");
    if (idx !== -1 && segments[idx + 1] === "reading") {
      const maybeId = segments[idx + 2];
      if (maybeId) return maybeId;
    }
    return "111555";
  }, [segments]);

  const normalizeTextAnswer = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

  const isTextAnswerKey = (key: QuestionKey) => {
    return false;
  };

  const [timeLeft, setTimeLeft] = useState(20 * 60);
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
  const [isTimeUpOpen, setIsTimeUpOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [copiedSupportKey, setCopiedSupportKey] = useState<"visa" | "uzcard" | null>(null);
  const supportCopyTimeoutRef = useRef<{ visa: number | null; uzcard: number | null }>({ visa: null, uzcard: null });
  const timeUpTimeoutRef = useRef<number | null>(null);
  const timeUpTriggeredRef = useRef(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [passageHtml, setPassageHtml] = useState<string | null>(null);
  const passageRef = useRef<HTMLDivElement | null>(null);
  const selectionRangeRef = useRef<Range | null>(null);

  const [selectionToolbar, setSelectionToolbar] = useState<{
    open: boolean;
    top: number;
    left: number;
    text: string;
  }>({ open: false, top: 0, left: 0, text: "" });

  const [openDropdownKey, setOpenDropdownKey] = useState<QuestionKey | null>(null);

  const [selections, setSelections] = useState<Record<QuestionKey, string>>(initialSelections);

  useEffect(() => {
    return () => {
      const t = supportCopyTimeoutRef.current;
      if (t.visa !== null) window.clearTimeout(t.visa);
      if (t.uzcard !== null) window.clearTimeout(t.uzcard);

      if (timeUpTimeoutRef.current !== null) window.clearTimeout(timeUpTimeoutRef.current);
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

  const handleSubmit = () => {
    if (submitted) return;

    let s = 0;
    (Object.keys(correctAnswers) as QuestionKey[]).forEach((key) => {
      const correct = correctAnswers[key];
      const userRaw = selections[key] ?? "";
      if (!userRaw || !userRaw.trim()) return;
      if (isTextAnswerKey(key)) {
        if (normalizeTextAnswer(userRaw) === normalizeTextAnswer(String(correct))) s++;
      } else {
        if (userRaw === correct) s++;
      }
    });

    setIsRunning(false);
    setScore(s);
    setSubmitted(true);
    setIsResultsOpen(true);
    markTestCompleted("reading", readingId);
  };

  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (timeLeft !== 0) return;
    if (submitted) return;
    if (timeUpTriggeredRef.current) return;

    timeUpTriggeredRef.current = true;
    setIsSubmitConfirmOpen(false);
    setIsTimeUpOpen(true);

    if (timeUpTimeoutRef.current !== null) window.clearTimeout(timeUpTimeoutRef.current);
    timeUpTimeoutRef.current = window.setTimeout(() => {
      handleSubmitRef.current();
      setIsTimeUpOpen(false);
      timeUpTimeoutRef.current = null;
    }, 900);
  }, [timeLeft, submitted]);

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
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    onFullscreenChange();
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!passageRef.current) return;
    if (passageHtml !== null) return;
    setPassageHtml(passageRef.current.innerHTML);
  }, [passageHtml]);

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
    if (openDropdownKey === null) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest(".rounded-dropdown")) setOpenDropdownKey(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenDropdownKey(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openDropdownKey]);

  const getClosestPassageParagraph = (node: Node | null) => {
    const el = node instanceof HTMLElement ? node : node?.parentElement;
    if (!el) return null;
    const p = el.closest("#passage1 p");
    return p as HTMLParagraphElement | null;
  };

  const updatePassageHtmlFromDom = () => {
    if (!passageRef.current) return;
    setPassageHtml(passageRef.current.innerHTML);
  };

  const unwrapElement = (el: HTMLElement) => {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
    if (parent instanceof HTMLElement) parent.normalize();
  };

  const getPassageParagraphsInRange = (range: Range) => {
    const root = passageRef.current;
    if (!root) return [] as HTMLParagraphElement[];
    const paragraphs = Array.from(root.querySelectorAll("#passage1 p")) as HTMLParagraphElement[];
    return paragraphs.filter((p) => {
      try {
        return range.intersectsNode(p);
      } catch {
        return false;
      }
    });
  };

  const isEmptyFragment = (frag: DocumentFragment) => {
    return frag.childNodes.length === 0;
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
    const paragraphs = getPassageParagraphsInRange(range);
    paragraphs.forEach((p) => {
      const highlights = Array.from(p.querySelectorAll('span[data-hl="1"]')) as HTMLElement[];
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

    const paragraphs = getPassageParagraphsInRange(range);
    if (paragraphs.length === 0) return;

    removeHighlightsInRange(range);

    paragraphs.forEach((p) => {
      const sub = document.createRange();
      const startInP = p.contains(range.startContainer);
      const endInP = p.contains(range.endContainer);
      try {
        sub.setStart(startInP ? range.startContainer : p, startInP ? range.startOffset : 0);
        sub.setEnd(endInP ? range.endContainer : p, endInP ? range.endOffset : p.childNodes.length);
      } catch {
        return;
      }
      if (sub.collapsed) return;

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
    });

    updatePassageHtmlFromDom();

    const sel = window.getSelection();
    sel?.removeAllRanges();
    setSelectionToolbar((s) => ({ ...s, open: false }));
  };

  const applyNoteMarkWithId = (noteId: number) => {
    const range = selectionRangeRef.current;
    if (!range || range.collapsed) return;

    const paragraphs = getPassageParagraphsInRange(range);
    if (paragraphs.length === 0) return;

    removeHighlightsInRange(range);

    paragraphs.forEach((p) => {
      const sub = document.createRange();
      const startInP = p.contains(range.startContainer);
      const endInP = p.contains(range.endContainer);
      try {
        sub.setStart(startInP ? range.startContainer : p, startInP ? range.startOffset : 0);
        sub.setEnd(endInP ? range.endContainer : p, endInP ? range.endOffset : p.childNodes.length);
      } catch {
        return;
      }
      if (sub.collapsed) return;

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
    });

    updatePassageHtmlFromDom();

    const sel = window.getSelection();
    sel?.removeAllRanges();
    setSelectionToolbar((s) => ({ ...s, open: false }));
  };

  const clearHighlight = () => {
    const range = selectionRangeRef.current;
    if (!range) return;

    removeHighlightsInRange(range);
    updatePassageHtmlFromDom();
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
    if (!passageRef.current) return;
    const nodes = Array.from(passageRef.current.querySelectorAll(`span[data-note-id="${noteId}"]`)) as HTMLElement[];
    nodes.forEach((n) => unwrapElement(n));
    updatePassageHtmlFromDom();
  };

  const deleteNote = (id: number) => {
    removeNoteMarksById(id);
    setNotes((prev) => prev.filter((n) => n.createdAt !== id));
    setActiveNoteId((prev) => (prev === id ? null : prev));
  };

  const handlePassageMouseUp = () => {
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

    const range = sel.getRangeAt(0);
    if (!passageRef.current) return;
    const pStart = getClosestPassageParagraph(range.startContainer);
    const pEnd = getClosestPassageParagraph(range.endContainer);
    if (!pStart || !pEnd) {
      setSelectionToolbar((s) => ({ ...s, open: false }));
      return;
    }

    selectionRangeRef.current = range.cloneRange();
    const rect = range.getBoundingClientRect();
    const top = Math.max(10, rect.top - 44);
    const left = Math.min(window.innerWidth - 260, Math.max(10, rect.left));
    setSelectionToolbar({ open: true, top, left, text });
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

  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  const activeNote = activeNoteId === null ? null : (notes.find((n) => n.createdAt === activeNoteId) ?? null);
  const notesList = activeNoteId === null ? notes : notes.filter((n) => n.createdAt !== activeNoteId);
  const passageDangerousHtml = useMemo(() => ({ __html: passageHtml ?? "" }), [passageHtml]);

  const answerSheet = useMemo(() => {
    return progressNumbers.map((num) => {
      const key = `q${num}` as QuestionKey;
      const correct = (correctAnswers as Record<string, string>)[key] ?? "";
      const userRaw = (selections as Record<string, string>)[key] ?? "";
      const userDisplay = userRaw && userRaw.trim() ? userRaw.trim() : "N/A";
      const isCorrect =
        userDisplay !== "N/A" &&
        (isTextAnswerKey(key)
          ? normalizeTextAnswer(userDisplay) === normalizeTextAnswer(String(correct))
          : userDisplay === correct);
      return { num, userDisplay, correct, isCorrect };
    });
  }, [selections]);

  const totalQuestions = progressNumbers.length;
  const scoreLabel = `${score ?? 0}/${totalQuestions}`;
  const feedbackHasWord = /\S+/.test(feedbackText.trim());
  const dashboardHref = `${userPrefix}/dashboard`;
  const readingTestsHref = `${userPrefix}/resources/reading`;
  const reviewHref = pathname;

  const tfngOptions = [
    { value: "YES", label: "YES" },
    { value: "NO", label: "NO" },
    { value: "NOT GIVEN", label: "NOT GIVEN" },
  ];

  const abcdOptions = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
    { value: "D", label: "D" },
  ];

  const dropdownOptions = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;

  const summaryDropdownOptions = [
    { value: "A", label: "A. activity" },
    { value: "B", label: "B. prices" },
    { value: "C", label: "C. success" },
    { value: "D", label: "D. patients" },
    { value: "E", label: "E. tests" },
    { value: "F", label: "F. diseases" },
    { value: "G", label: "G. symptoms" },
    { value: "H", label: "H. competition" },
    { value: "I", label: "I. criticism" },
  ];

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

  const renderTextInput = (key: QuestionKey, placeholder?: string) => {
    const current = selections[key] ?? "";
    return (
      <input
        type="text"
        className="inline-text-input"
        placeholder={placeholder}
        value={current}
        disabled={submitted}
        onChange={(e) => {
          if (submitted) return;
          setSelections((s) => ({ ...s, [key]: e.target.value }));
        }}
      />
    );
  };

  const renderTfngRadio = (key: QuestionKey) => {
    const current = selections[key] ?? "";
    return (
      <div className="radio-group" role="radiogroup" aria-label={`Answer options for ${key}`}>
        {tfngOptions.map((o) => (
          <label key={o.value} className="radio-option">
            <input
              type="radio"
              className="radio-input"
              name={key}
              value={o.value}
              checked={current === o.value}
              disabled={submitted}
              onChange={() => {
                if (submitted) return;
                setSelections((s) => ({ ...s, [key]: o.value }));
              }}
            />
            <span className="radio-circle" aria-hidden="true" />
            <span className="radio-text">{o.label}</span>
          </label>
        ))}
      </div>
    );
  };

  const renderAbcdRadio = (key: QuestionKey, options?: Array<{ value: string; label: string }>) => {
    const current = selections[key] ?? "";
    const opts = options ?? abcdOptions;
    return (
      <div className="radio-group" role="radiogroup" aria-label={`Answer options for ${key}`}>
        {opts.map((o) => (
          <label key={o.value} className="radio-option">
            <input
              type="radio"
              className="radio-input"
              name={key}
              value={o.value}
              checked={current === o.value}
              disabled={submitted}
              onChange={() => {
                if (submitted) return;
                setSelections((s) => ({ ...s, [key]: o.value }));
              }}
            />
            <span className="radio-circle" aria-hidden="true" />
            <span className="radio-text">{o.label}</span>
          </label>
        ))}
      </div>
    );
  };

  const renderLetterDropdown = (key: QuestionKey, options?: Array<{ value: string; label: string }>, inline?: boolean) => {
    const current = (selections[key] ?? "").trim();
    const isOpen = openDropdownKey === key;
    const opts = options ?? dropdownOptions.map((v) => ({ value: v, label: v }));
    const currentLabel = (opts.find((o) => o.value === current)?.label ?? "").trim();
    return (
      <div className={`rounded-dropdown${inline ? " rounded-dropdown--inline" : ""}`}>
        <button
          type="button"
          className="rounded-dropdown-trigger"
          disabled={submitted}
          onClick={() => {
            if (submitted) return;
            setOpenDropdownKey((prev) => (prev === key ? null : key));
          }}
        >
          <span>{current ? currentLabel || current : "Select"}</span>
          <span aria-hidden="true" style={{ color: "var(--muted)" }}>
            ▾
          </span>
        </button>
        <div
          className={`rounded-dropdown-menu${isOpen ? " is-open" : ""}`}
          role="listbox"
          aria-label={`Select answer for ${key}`}
        >
          {opts.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="rounded-dropdown-item"
              onClick={() => {
                if (submitted) return;
                setSelections((s) => ({ ...s, [key]: opt.value }));
                setOpenDropdownKey(null);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reading Passage 1 – Examining the placebo effect</title>
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
           --shadow-card: 0 6px 16px rgba(0, 0, 0, 0.55);
           --shadow-menu: 0 16px 40px rgba(0, 0, 0, 0.65);
         }

         .rounded-dropdown {
           position: relative;
           width: 100%;
           max-width: 100%;
         }

         .rounded-dropdown.rounded-dropdown--inline {
           display: inline-block;
           width: 160px;
           margin: 0 6px;
           vertical-align: middle;
         }

         .rounded-dropdown.rounded-dropdown--inline .rounded-dropdown-trigger {
           padding: 6px 9px;
           border-radius: 10px;
           font-size: 13px;
         }

         .rounded-dropdown-trigger span:first-child {
           flex: 1;
           min-width: 0;
           overflow: hidden;
           white-space: nowrap;
           text-overflow: ellipsis;
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
           max-width: 100%;
         }

         .rounded-dropdown-menu {
           position: absolute;
           bottom: calc(100% + 6px);
           top: auto;
           left: 0;
           width: 100%;
           background: var(--card);
           border: 1px solid var(--border);
           border-radius: 14px;
           overflow: visible;
           box-shadow: var(--shadow-menu);
           z-index: 50;
           opacity: 0;
           transform: translateY(6px);
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

         .inline-text-input {
           width: 140px;
           max-width: 100%;
           padding: 7px 10px;
           border-radius: 12px;
           border: 1px solid var(--border);
           background: var(--card);
           color: var(--text-soft);
           font-size: 14px;
           line-height: 1.2;
           outline: none;
           display: inline-block;
           vertical-align: middle;
           margin: 0 6px;
         }

         .inline-text-input:focus {
           box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.25);
         }

         .inline-text-input::placeholder {
           color: var(--muted);
           opacity: 0.85;
         }

         .question {
           border: 1px solid var(--border);
           background: var(--subtle);
           border-radius: 14px;
           padding: 12px;
           margin-top: 12px;
         }

         .question--plain {
           border: none;
           background: transparent;
           padding: 0;
         }

         .question-text {
           color: var(--text);
           font-weight: 700;
           margin-bottom: 10px;
           line-height: 1.35;
         }

         .question-number {
           display: inline-block;
           min-width: 28px;
           margin-right: 8px;
           font-weight: 900;
           font-size: 18px;
           line-height: 1;
           color: var(--text);
         }

         .radio-group {
           display: flex;
           flex-direction: column;
           gap: 12px;
         }

         .radio-option {
           display: flex;
           align-items: flex-start;
           gap: 10px;
           position: relative;
           cursor: pointer;
           color: var(--text-soft);
           line-height: 1.35;
           padding: 4px 0;
         }

         .radio-input {
           position: relative;
           opacity: 0;
           pointer-events: none;
           width: 1px;
           height: 1px;
           margin: 0;
           padding: 0;
         }

         .radio-circle {
           width: 18px;
           height: 18px;
           border-radius: 999px;
           border: 2px solid var(--border);
           display: inline-flex;
           align-items: center;
           justify-content: center;
           margin-top: 2px;
           flex-shrink: 0;
           transition: border-color 160ms ease;
         }

         .radio-circle::after {
           content: "";
           width: 10px;
           height: 10px;
           border-radius: 999px;
           background: #3182ce;
           transform: scale(0);
           transition: transform 160ms ease;
         }

         .radio-option input:checked + .radio-circle {
           border-color: #3182ce;
         }

         .radio-option input:checked + .radio-circle::after {
           transform: scale(1);
         }

         .radio-text {
           color: var(--text-soft);
           font-size: 15px;
         }

         .radio-letter {
           display: inline-block;
           width: 26px;
           margin-right: 6px;
           font-weight: 900;
           color: var(--text);
         }

         .passage-card p {
           margin: 0 0 12px;
         }

         #passage1 .label {
           display: inline-block;
           margin-right: 10px;
           font-weight: 900;
           font-size: 18px;
           line-height: 1;
           color: var(--text);
         }

         .parncutt-summary {
           display: flex;
           flex-direction: column;
           gap: 10px;
           line-height: 1.6;
         }

         .summary-line {
           display: block;
           line-height: 1.6;
         }

         .list-of-words {
           display: flex;
           flex-direction: column;
           gap: 6px;
           margin-top: 12px;
         }

         .word-row {
           display: block;
         }

         .submit-button:not(.fancy-button) {
           transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
           will-change: transform;
         }

         .submit-button:not(.fancy-button):hover:not(:disabled) {
           transform: translateY(-1px);
           box-shadow: 0 8px 18px rgba(0, 0, 0, 0.16);
           filter: brightness(1.03);
         }

         .submit-button:not(.fancy-button):active:not(:disabled) {
           transform: translateY(0);
           box-shadow: 0 5px 12px rgba(0, 0, 0, 0.14);
           filter: brightness(1.01);
         }

         .fancy-button {
           padding: 1.15em 2.6em;
           font-size: 11px;
           text-transform: uppercase;
           letter-spacing: 2.2px;
           font-weight: 900;
           color: #000;
           background-color: #fff;
           border: none;
           border-radius: 45px;
           box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1);
           transition: all 0.3s ease 0s;
           cursor: pointer;
           outline: none;
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

         .submit-button.fancy-button.fancy-button-sm {
           padding: 0.95em 1.9em;
           font-size: 10px;
           letter-spacing: 2px;
         }

         @media (max-width: 520px) {
           .fancy-button.fancy-button-sm {
             width: 100%;
           }
         }

         .passage-card,
         .questions-card,
         .results-scroll {
           scrollbar-width: thin;
           scrollbar-color: var(--scrollbar-thumb) transparent;
           scrollbar-gutter: stable;
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
           font-size: 13px;
           font-weight: 700;
           cursor: pointer;
         }

         .note-item {
           padding: 10px 12px;
           border: 1px solid var(--border);
           background: var(--subtle);
           border-radius: 10px;
           margin-bottom: 10px;
           font-size: 13px;
           line-height: 1.4;
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
           border: 1px solid var(--border);
           border-radius: 14px;
           padding: 10px 12px;
           background: var(--card);
           cursor: pointer;
           font-weight: 900;
           color: var(--text);
         }

         .support-btn:hover {
           background: var(--hover);
         }

         .feedback-box {
           border: 1px solid var(--border);
           background: var(--subtle);
           border-radius: 14px;
           padding: 12px;
           margin-top: 14px;
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
           .nav-row {
             grid-template-columns: 1fr;
           }
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
                   <button
                     type="button"
                     className="note-editor-delete"
                     onClick={() => deleteNote(activeNote.createdAt)}
                   >
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

         {isTimeUpOpen ? (
           <>
             <div className="timeup-overlay" />
             <div className="timeup-modal" role="dialog" aria-modal="true">
               <div className="timeup-title">Time is up</div>
               <div className="timeup-subtitle">Submitting your answers</div>
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
                       <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>Thanks for your feedback!</div>
                     ) : null}
                     <button
                       type="button"
                       className="feedback-submit"
                       disabled={!feedbackHasWord}
                       onClick={async () => {
                         if (!feedbackHasWord) return;
                         try {
                           const trimmed = feedbackText.trim();
                           const res = await api("/support/report", {
                             method: "POST",
                             headers: { "Content-Type": "application/json" },
                             body: JSON.stringify({
                               title: `Reading feedback: ${readingId}`,
                               category: "reading_feedback",
                               description: `Reading ID: ${readingId}\nURL: ${typeof window !== "undefined" ? window.location.href : ""}\n\n${trimmed}`,
                             }),
                           });

                           if (!res.ok) return;

                           setFeedbackText("");
                           setFeedbackSubmitted(true);
                         } catch {
                           return;
                         }
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
                   <button type="button" className="nav-btn" onClick={() => router.push(readingTestsHref)}>
                     <i className="fa-solid fa-book-open" aria-hidden="true" />
                     <span>Reading Tests</span>
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

         <div style={{ height: 2, backgroundColor: "var(--border)", marginLeft: -20, marginRight: -20, marginBottom: 16 }} />

         <div
           style={{
             marginBottom: 20,
             padding: "12px 16px",
             borderRadius: 12,
             backgroundColor: "var(--card)",
             boxShadow: "var(--shadow-card)",
           }}
         >
           <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "var(--text)" }}>Passage 1</div>
           <div style={{ fontSize: 14, color: "var(--muted)" }}>Read the text and answer questions 1–14</div>
         </div>

         <div
           className="main-layout"
           style={{
             display: "flex",
             gap: "20px",
             alignItems: "stretch",
             flex: 1,
             minHeight: 0,
             paddingBottom: 10,
             overflow: "hidden",
           }}
         >
           <div className="passage-col" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
             <div
               className="passage-card"
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
               onMouseUp={handlePassageMouseUp}
               onScroll={() => {
                if (!selectionToolbar.open) return;
                setSelectionToolbar((s) => ({ ...s, open: false }));
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 20, fontWeight: 700 }}>Examining the placebo effect</h3>

             {passageHtml === null ? (
                <div id="passage1" ref={passageRef}>
                  <p>
                    The fact that taking a fake drug can powerfully improve some people's health - the so-called placebo effect - was long considered an embarrassment to the serious practice of pharmacology, but now things have changed.
                  </p>
                  <p>
                    Several years ago, Merck, a global pharmaceutical company, was falling behind its rivals in sales. To make matters worse, patents on five blockbuster drugs were about to expire, which would allow cheaper generic products to flood the market. In interviews with the press, Edward Scolnick, Merck's Research Director, presented his plan to restore the firm to pre-eminence. Key to his strategy was expanding the company’s reach into the antidepressant market, where Merck had trailed behind, while competitors like Pfizer and GlaxoSmithKline had created some of the best-selling drugs in the world. "To remain dominant in the future,” he told one media company, "we need to dominate the central nervous system."
                  </p>
                  <p>
                    His plan hinged on the success of an experimental antidepressant codenamed MK-869. Still in clinical trials, it was a new kind of medication that exploited brain chemistry in innovative ways to promote feelings of well-being. The drug tested extremely well early on, with minimal side effects. Behind the scenes, however, MK-869 was starting to unravel. True, many test subjects treated with the medication felt their hopelessness and anxiety lift. But so did nearly the same number who took a placebo, a look-alike pill made of milk sugar or another inert substance given to groups of volunteers in subsequent clinical trials to gauge the effectiveness of the real drug by comparison. Ultimately, Merck's venture into the antidepressant market failed. In the jargon of the industry, the trials crossed the "futility boundary".
                  </p>
                  <p>
                    MK-869 has not been the only much-awaited medical breakthrough to be undone in recent years by the placebo effect. And it's not only trials of new drugs that are crossing the futility boundary. Some products that have been on the market for decades are faltering in more recent follow-up tests. It's not that the old medications are getting weaker, drug developers say. It's as if the placebo effect is somehow getting stronger. The fact that an increasing number of medications are unable to beat sugar pills has thrown the industry into crisis. The stakes could hardly be higher. To win FDA approval, a new medication must beat placebo in at least two authenticated trials. In today’s economy, the fate of a well-established company can hang on the outcome of a handful of tests.
                  </p>
                  <p>
                    Why are fake pills suddenly overwhelming promising new drugs and established medicines alike? The reasons are only just beginning to be understood. A network of independent researchers is doggedly uncovering the inner workings and potential applications of the placebo effect. A psychiatrist, William Potter, who knew that some patients really do seem to get healthier for reasons that have more to do with a doctor's empathy than with the contents of a pill, was baffled by the fact that drugs he had been prescribing for years seemed to be struggling to prove their effectiveness. Thinking that a crucial factor may have been overlooked, Potter combed through his company’s database of published and unpublished trials—including those that had been kept secret because of high placebo response. His team aggregated the findings from decades of antidepressant trials, looking for patterns and trying to see what was changing over time. What they found challenged some of the industry’s basic assumptions about its drug-vetting process.
                  </p>
                  <p>
                    Assumption number one was that if a trial were managed correctly, a medication would perform as well or badly in a Phoenix hospital as in a Bangalore clinic. Potter discovered, however, that geographic location alone could determine the outcome. By the late 1990s, for example, the anti-anxiety drug Diazepam was still beating placebo in France and Belgium. But when the drug was tested in the U.S., it was likely to fail. Conversely, a similar drug, Prozac, performed better in America than it did in western Europe and South Africa. It was an unsettling prospect: FDA approval could hinge on where the company chose to conduct a trial.
                  </p>
                  <p>
                    Mistaken assumption number two was that the standard tests used to gauge volunteers' improvement in trials yielded consistent results. Potter and his colleagues discovered that ratings by trial observers varied significantly from one testing site to another. It was like finding out that the judges in a tight race each had a different idea about the placement of the finish line.
                  </p>
                  <p>
                    After some coercion by Potter and others, the National Institute of Health (NIH) focused on the issue in 2000, hosting a three-day conference in Washington, and this conference launched a new wave of placebo research in academic laboratories in the U.S. and Italy that would make significant progress toward solving the mystery of what was happening in clinical trials.
                  </p>
                  <p>
                    In one study last year, Harvard Medical School researcher Ted Kaptchuk devised a clever strategy for testing his volunteers’ response to varying levels of therapeutic ritual. The study focused on a common but painful medical condition that costs more than $40 billion a year worldwide to treat. First, the volunteers were placed randomly in one of three groups. One group was simply put on a waiting list; researchers know that some patients get better just because they sign up for a trial. Another group received placebo treatment from a clinician who declined to engage in small talk. Volunteers in the third group got the same fake treatment from a clinician who asked them questions about symptoms, outlined the causes of the illness, and displayed optimism about their condition.
                  </p>
                  <p>
                    Not surprisingly, the health of those in the third group improved most. In fact, just by participating in the trial, volunteers in this high-interaction group got as much relief as did people taking the two leading prescription drugs for the condition. And the benefits of their “bogus” treatment persisted for weeks afterward, contrary to the belief—widespread in the pharmaceutical industry—that the placebo response is short-lived.
                  </p>
                  <p>
                    Studies like this open the door to hybrid treatment strategies that exploit the placebo effect to make real drugs safer and more effective. As Potter says, “To really do the best for your patients, you want the best placebo response plus the best drug response.”
                  </p>
                  <p>
                    <em>* The Food and Drug Administration (an agency in the United States responsible for protecting public health by assuring the safety of human drugs)</em>
                  </p>
                </div>
              ) : (
                <div id="passage1" ref={passageRef} dangerouslySetInnerHTML={passageDangerousHtml} />
              )}
            </div>
          </div>

           <div className="questions-col" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} id="questions">
             <div
               className="questions-card"
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
             >

              <div className="question-group">
                <div className="question-group-title"><strong>Questions 1-5</strong></div>
                <p>
                  Do the following statements agree with the claims of the writer?
                  <br />
                  Write
                  <br />
                  <strong>YES</strong> if the statement agrees with the claims of the writer
                  <br />
                  <strong>NO</strong> if the statement contradicts the claims of the writer
                  <br />
                  <strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this
                </p>

                <div className="question question--plain">
                  <div className="question-text">1. Merck’s experience with MK-869 was unique.</div>
                  {renderTfngRadio("q1")}
                </div>

                <div className="question question--plain">
                  <div className="question-text">2. These days, a small number of unsuccessful test results can ruin a well-established drugs company.</div>
                  {renderTfngRadio("q2")}
                </div>

                <div className="question question--plain">
                  <div className="question-text">3. Some medical conditions are more easily treated by a placebo than others.</div>
                  {renderTfngRadio("q3")}
                </div>

                <div className="question question--plain">
                  <div className="question-text">4. It was to be expected that the third group in Kaptchuk’s trial would do better than the other two groups.</div>
                  {renderTfngRadio("q4")}
                </div>

                <div className="question question--plain">
                  <div className="question-text">5. Kaptchuk’s research highlights the fact that combined drug and placebo treatments should be avoided.</div>
                  {renderTfngRadio("q5")}
                </div>
              </div>

              <div className="question-group" style={{ marginTop: 16 }}>
                <div className="question-group-title"><strong>Questions 6-10</strong></div>
                <p>
                  Complete the summary using the list of words A-I below.
                  <br />
                  <strong>Merck and MK-869</strong>
                </p>
                <p>
                  As a result of concerns about increasing{" "}
                  {renderLetterDropdown("q6", summaryDropdownOptions, true)}{" "}
                  in the drugs industry, the pharmaceutical company Merck decided to increase its{" "}
                  {renderLetterDropdown("q7", summaryDropdownOptions, true)}{" "}
                  in the antidepressant market. The development of the drug MK-869 was seen as the way forward. Initially, MK-869 had some{" "}
                  {renderLetterDropdown("q8", summaryDropdownOptions, true)}{" "}
                  , but later trials revealed a different picture. Although key{" "}
                  {renderLetterDropdown("q9", summaryDropdownOptions, true)}{" "}
                  could be treated with the drug, a sugar pill was proving equally effective. In the end, the{" "}
                  {renderLetterDropdown("q10", summaryDropdownOptions, true)}{" "}
                  indicated that it was pointless continuing with the development of the drug.
                </p>
              </div>

              <div className="question-group" style={{ marginTop: 16 }}>
                <div className="question-group-title"><strong>Questions 11-14</strong></div>
                <p>Choose the correct letter A, B, C or D.</p>

                <div className="question question--plain">
                  <div className="question-text">11. Which of the following is true of William Potter’s research?</div>
                  {renderAbcdRadio("q11", [
                    { value: "A", label: "A. It was based on recently developed drugs that he had recommended." },
                    { value: "B", label: "B. It included trial results from a range of drugs companies." },
                    { value: "C", label: "C. Some of the trial results he investigated had not been made public." },
                    { value: "D", label: "D. Some of his findings were not accepted by the drugs industry." },
                  ])}
                </div>

                <div className="question question--plain">
                  <div className="question-text">12. What did William Potter's research reveal about the location of drugs trials?</div>
                  {renderAbcdRadio("q12", [
                    { value: "A", label: "A. The placebo effect was weakest in the US." },
                    { value: "B", label: "B. Results were not consistent around the world." },
                    { value: "C", label: "C. Results varied depending on the type of hospital." },
                    { value: "D", label: "D. The FDA preferred drugs to be tested in different countries." },
                  ])}
                </div>

                <div className="question question--plain">
                  <div className="question-text">13. What does the tight race refer to in line 80?</div>
                  {renderAbcdRadio("q13", [
                    { value: "A", label: "A. the standard tests" },
                    { value: "B", label: "B. consistent results" },
                    { value: "C", label: "C. ratings by trial observers" },
                    { value: "D", label: "D. testing sites" },
                  ])}
                </div>

                <div className="question question--plain">
                  <div className="question-text">14. What significant discovery was made by Ted Kaptchuk?</div>
                  {renderAbcdRadio("q14", [
                    { value: "A", label: "A. The effects of a placebo can last longer than previously thought." },
                    { value: "B", label: "B. Patients’ health can improve while waiting to undergo a trial." },
                    { value: "C", label: "C. Patients respond better to a placebo if they are treated by the same clinician throughout the trial." },
                    { value: "D", label: "D. Those conducting a placebo trial need to know the subjects’ disorder well." },
                  ])}
                </div>
              </div>
            </div>
          </div>
        </div>

         <div style={{ height: 2, backgroundColor: "var(--border)", marginLeft: -20, marginRight: -20, marginTop: 1, marginBottom: 0 }} />

         <div style={{ marginTop: 0, paddingTop: 4, minHeight: 40, display: "flex", alignItems: "center" }}>
           <div style={{ width: "100%", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
             <div
               style={{
                 flex: 1,
                 minWidth: 0,
                 display: "flex",
                 justifyContent: "center",
                 gap: 4,
                 overflowX: "auto",
                 overflowY: "hidden",
                 paddingTop: 2,
                 paddingBottom: 1,
               }}
             >
               {progressNumbers.map((num) =>
                 (() => {
                   const key = `q${num}` as QuestionKey;
                   const answered = Boolean((selections[key] ?? "").trim());
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
                         transition:
                           "transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease",
                       }}
                     >
                       {num}
                     </div>
                   );
                 })()
               )}
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
       </div>
     </div>
   );
 }
