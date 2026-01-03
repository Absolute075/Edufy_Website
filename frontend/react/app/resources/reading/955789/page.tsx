 "use client";

import Head from "next/head";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { markTestCompleted } from "@/lib/completedTests";
import { api } from "@/lib/api";
const correctAnswers = {
  q27: "NO",
  q28: "YES",
  q29: "NOT GIVEN",
  q30: "YES",
  q31: "NOT GIVEN",
  q32: "NO",
  q33: "B",
  q34: "A",
  q35: "C",
  q36: "C",
  q37: "D",
  q38: "A",
  q39: "F",
  q40: "G",
};

const progressNumbers = [27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40];

type QuestionKey = keyof typeof correctAnswers;

const initialSelections: Record<QuestionKey, string> = {
  q27: "",
  q28: "",
  q29: "",
  q30: "",
  q31: "",
  q32: "",
  q33: "",
  q34: "",
  q35: "",
  q36: "",
  q37: "",
  q38: "",
  q39: "",
  q40: "",
};

export default function Reading955789Page() {
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
    return "955789";
  }, [segments]);

  const isTextAnswerKey = (_key: QuestionKey) => false;

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
        if (userRaw.trim().toLowerCase() === String(correct).trim().toLowerCase()) s++;
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
     const p = el.closest("#passage3 p");
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
     const paragraphs = Array.from(root.querySelectorAll("#passage3 p")) as HTMLParagraphElement[];
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
           ? userDisplay.trim().toLowerCase() === String(correct).trim().toLowerCase()
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

   const afOptions = [
     { value: "A", label: "A" },
     { value: "B", label: "B" },
     { value: "C", label: "C" },
     { value: "D", label: "D" },
     { value: "E", label: "E" },
     { value: "F", label: "F" },
   ];

   const dropdownOptions = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

   const summaryDropdownOptions = [
     { value: "A", label: "A" },
     { value: "B", label: "B" },
     { value: "C", label: "C" },
     { value: "D", label: "D" },
     { value: "E", label: "E" },
     { value: "F", label: "F" },
     { value: "G", label: "G" },
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

   const renderTextInput = (key: QuestionKey) => {
     const current = selections[key] ?? "";
     return (
       <input
         type="text"
         className="inline-text-input"
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

   const renderAbcdRadio = (key: QuestionKey) => {
     const current = selections[key] ?? "";
     return (
       <div className="radio-group" role="radiogroup" aria-label={`Answer options for ${key}`}>
         {abcdOptions.map((o) => (
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
         <title>Reading Passage 3 – New Zealand Short Stories</title>
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

         #passage3 .label {
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
           <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "var(--text)" }}>Passage 3</div>
           <div style={{ fontSize: 14, color: "var(--muted)" }}>Read the text and answer questions 27–40</div>
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
               <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 20, fontWeight: 700 }}>New Zealand Short Stories</h3>
 
               {passageHtml === null ? (
                 <div id="passage3" ref={passageRef}>
                   <p>Paula Morris, the editor of a new book of short stories, introduces her collection.</p>
                   <p>
                     When I was appointed editor of this new collection, my instructions were to choose stories written by New Zealanders in the last decade.
                     In order to make that selection, I wanted to read as widely as possible. I would not select authors simply because they were important
                     names in New Zealand literature. Novelists who occasionally write short stories were not excluded; however, those who write full-length
                     novels may not always possess the specific abilities necessary to write short stories, and vice versa. A variety of people – publishers,
                     editors, academics – alerted me to new names, or reminded me about familiar names that associated with other forms of writing. The author
                     may be living overseas, or publishing elsewhere, or setting his or her work in another country, but none of these were issues I considered
                     relevant. Neither did it matter whether they were famous or obscure. The only New Zealand short-story writer I ruled out of my considerations
                     was myself, as it would have been incompatible with my role as editor.
                   </p>
                   <p>
                     I certainly had no wish to separate contemporary stories into those most influenced by iconic writers of the past, such as Katherine Mansfield,
                     and those following more recent traditions; such categorizations are simplistic. There was no particular version of New Zealand I wanted to
                     construct or dismantle. For although we may get glimpses of a society through its short stories, these cannot set out to give us a panoramic
                     social summary, because such a goal is beyond their scope.
                   </p>
                   <p>
                     The stories chosen would reflect the diversity of contemporary New Zealand, I hoped. However, it quickly became apparent that the quality of the
                     story – that small matter of the fluency of the writing – was more important to me than the ethnicity, gender, social background, or regional
                     affiliation of its author. My purpose was not to ensure every group in this diverse nation was represented in some fair and proportional way,
                     and there are some absences. Of writers from the Pacific Islands, Samoa is the dominant presence among the stories selected. This is perhaps
                     unsurprising given the number of Samoans who have settled in New Zealand over recent decades. However, Samoa’s dominance may not endure. The number
                     of stories I read by authors from all the many different Pacific Islands, both published and unpublished, indicates that a new wave of talent is
                     about to become prominent in our national literature.
                   </p>
                   <p>
                     All the writers here speak of New Zealand, I think, in direct and indirect ways, even the ones who set their work elsewhere. When writing fiction,
                     says the master short-story writer William Trevor, you cannot escape the person you are … All fiction has its autobiographical roots. Trevor was
                     born in Ireland and, therefore, he says: I chose the world through Irish sensibilities, to be sure an Irish way of doing things, … and am reminded
                     of familiarities of early environment when I’m separated from them. The stories featured in this collection are evidence of this truth.
                   </p>
                   <p>
                     An outsider, after reading these stories, would draw certain conclusions about New Zealand. They might conclude that Māori, the country’s original
                     inhabitants, may live in simple conditions or in one of the most expensive suburbs; that rather than the clean, green paradise sometimes presented
                     to tourists from overseas, New Zealand has its fair share of social issues; that our businesses happily employ arrogant managers and rude receptionists;
                     that dwelling among us are the happily married and the smugly suburban, and that we like sport. Each of these narratives and many others are presented here.
                   </p>
                   <p>
                     Of course, a collection like this is partly a product of the taste and enthusiasms of its editor. At some point, early in my reading, I became
                     conscious of this. A story had to grab me – more, provoke, excite, entertain or challenge me, stay with me in some way – if it was to be included.
                     The stories I kept returning to were those that would not go away, would not be forgotten by me, and in this sense it is a subjective selection.
                   </p>
                   <p>
                     So, was the past decade a golden age for short fiction in New Zealand? Certainly, it could be seen as a period of investment and opportunity. For nine
                     years the Prime Minister herself took on the arts, culture and heritage ministerial portfolio, quickly implementing a cultural recovery package of tens
                     of millions of dollars. Furthermore, valuable prizes for writers were created. These included a residency in Berlin, Germany, and also residencies in
                     locations around New Zealand, such as Randall Cottage in Wellington, allowing writers to leave home and work in fresh environments. The decade also saw
                     the establishment of various postgraduate degree courses in creative writing. Victoria University led the way when Bill Manhire added an MA course to his
                     already popular undergraduate course in creative writing and this was followed by other institutions.
                   </p>
                   <p>
                     A number of journals promoting new writing survived, including Landfall, established at the University of Otago in 1947. These titles were joined in
                     this period by ventures like JAM and The Thrill, where many emerging writers get their start. And Radio New Zealand National, our single largest purchaser
                     of short fiction, continued to broadcast highly storied airwaves each year because they remained very popular with the listening audience. Two of the writers
                     included in this collection got their start writing for radio. All in all then, there were many positive developments for writers over the decade.
                   </p>
                 </div>
               ) : (
                 <div id="passage3" ref={passageRef} dangerouslySetInnerHTML={passageDangerousHtml} />
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
                 <div className="question-group-title"><strong>Questions 27-32</strong></div>
                 <p style={{ marginBottom: 10 }}>
                   Do the following statements agree with the claims of the writer in Reading Passage 3?
                   <br />
                   In boxes <strong>27–32</strong> on your answer sheet, write:
                   <br />
                   <strong>YES</strong> if the statement agrees with the claims of the writer
                   <br />
                   <strong>NO</strong> if the statement contradicts the claims of the writer
                   <br />
                   <strong>NOT GIVEN</strong> if it is impossible to say what the writer thinks about this
                 </p>

                 <div className="question question--plain">
                   <div className="question-text">27. Writing novels and short stories requires the same range of skills.</div>
                   {renderTfngRadio("q27")}
                 </div>

                 <div className="question question--plain">
                   <div className="question-text">28. Publishers, editors and academics provided valuable help in identifying sources of material.</div>
                   {renderTfngRadio("q28")}
                 </div>

                 <div className="question question--plain">
                   <div className="question-text">29. Authors living overseas tend to lose interest in writing about New Zealand.</div>
                   {renderTfngRadio("q29")}
                 </div>

                 <div className="question question--plain">
                   <div className="question-text">30. It was important that one particular author’s work was excluded from the collection.</div>
                   {renderTfngRadio("q30")}
                 </div>

                 <div className="question question--plain">
                   <div className="question-text">31. Katherine Mansfield’s influence on today’s authors has been overstated.</div>
                   {renderTfngRadio("q31")}
                 </div>

                 <div className="question question--plain">
                   <div className="question-text">32. It is possible to give an overview of an entire society in a short story.</div>
                   {renderTfngRadio("q32")}
                 </div>
               </div>

               <div className="question-group" style={{ marginTop: 16 }}>
                 <div className="question-group-title"><strong>Questions 33-36</strong></div>
                 <p>
                   Choose the correct letter, A, B, C, or D.
                   <br />
                   Write the correct letter in boxes <strong>33–36</strong> on your answer sheet.
                 </p>

                 <div className="question question--plain">
                   <div className="question-text">
                     33. Paula Morris refers to that small matter of the fluency of the writing to
                     <br />
                     <strong>A</strong>
                     <span style={{ fontWeight: 400 }}> demonstrate how language changes over time.</span>
                     <br />
                     <strong>B</strong>
                     <span style={{ fontWeight: 400 }}> emphasise her priorities when selecting stories.</span>
                     <br />
                     <strong>C</strong>
                     <span style={{ fontWeight: 400 }}> suggest that story-writing is losing popularity.</span>
                     <br />
                     <strong>D</strong>
                     <span style={{ fontWeight: 400 }}> illustrate the variety of cultures in New Zealand.</span>
                   </div>
                   {renderAbcdRadio("q33")}
                 </div>

                 <div className="question question--plain">
                   <div className="question-text">
                     34. What are we told about writers from the Pacific Islands?
                     <br />
                     <strong>A</strong>
                     <span style={{ fontWeight: 400 }}> They will be increasingly important in the future.</span>
                     <br />
                     <strong>B</strong>
                     <span style={{ fontWeight: 400 }}> Few of their stories were included in this collection.</span>
                     <br />
                     <strong>C</strong>
                     <span style={{ fontWeight: 400 }}> Their stories are distinct from those of other writers.</span>
                     <br />
                     <strong>D</strong>
                     <span style={{ fontWeight: 400 }}> They have been overlooked too often in the past.</span>
                   </div>
                   {renderAbcdRadio("q34")}
                 </div>

                 <div className="question question--plain">
                   <div className="question-text">
                     35. Paula Morris refers to William Trevor to illustrate
                     <br />
                     <strong>A</strong>
                     <span style={{ fontWeight: 400 }}> why some authors prefer to write in second languages.</span>
                     <br />
                     <strong>B</strong>
                     <span style={{ fontWeight: 400 }}> who has had most influence on her own writing style.</span>
                     <br />
                     <strong>C</strong>
                     <span style={{ fontWeight: 400 }}> how an author’s life experiences affect their writing.</span>
                     <br />
                     <strong>D</strong>
                     <span style={{ fontWeight: 400 }}> what is problematic about certain written stories.</span>
                   </div>
                   {renderAbcdRadio("q35")}
                 </div>

                 <div className="question question--plain">
                   <div className="question-text">
                     36. What is Paula Morris doing in the fifth paragraph?
                     <br />
                     <strong>A</strong>
                     <span style={{ fontWeight: 400 }}> explaining which were her favourite stories.</span>
                     <br />
                     <strong>B</strong>
                     <span style={{ fontWeight: 400 }}> rejecting a common criticism of modern stories.</span>
                     <br />
                     <strong>C</strong>
                     <span style={{ fontWeight: 400 }}> contrasting the content of various different stories.</span>
                     <br />
                     <strong>D</strong>
                     <span style={{ fontWeight: 400 }}> comparing her collection with other books of stories.</span>
                   </div>
                   {renderAbcdRadio("q36")}
                 </div>
               </div>

               <div className="question-group" style={{ marginTop: 16 }}>
                 <div className="question-group-title"><strong>Questions 37-40</strong></div>
                 <p>
                   Complete the summary using the list of phrases, <strong>A–G</strong>, below.
                   <br />
                   Write the correct letter, <strong>A–G</strong>, in boxes <strong>37–40</strong> on your answer sheet.
                 </p>
                 <p>Was this a golden decade for writers?</p>

                 <div style={{ fontWeight: 800, marginTop: 12, marginBottom: 8, marginLeft: 12 }}>List of Words</div>
                 <div className="list-of-words" style={{ marginLeft: 12, marginBottom: 12 }}>
                   <div className="word-row">
                     <strong>A</strong> travel opportunities
                   </div>
                   <div className="word-row">
                     <strong>B</strong> technological advances
                   </div>
                   <div className="word-row">
                     <strong>C</strong> broadcast media
                   </div>
                   <div className="word-row">
                     <strong>D</strong> government support
                   </div>
                   <div className="word-row">
                     <strong>E</strong> commercial sponsorship
                   </div>
                   <div className="word-row">
                     <strong>F</strong> tertiary programmes
                   </div>
                   <div className="word-row">
                     <strong>G</strong> literary publications
                   </div>
                 </div>

                 <div className="parncutt-summary" style={{ marginLeft: 12 }}>
                   <span className="summary-line">
                     The arts in general benefited from{" "}{renderLetterDropdown("q37", summaryDropdownOptions, true)}{" "}
                     that resulted in millions of dollars worth of investment.
                   </span>
                   <span className="summary-line">
                     Another innovation was new{" "}{renderLetterDropdown("q38", summaryDropdownOptions, true)}{" "}
                     such as the Randall Cottage initiative.
                   </span>
                   <span className="summary-line">
                     What’s more, there was a development in{" "}{renderLetterDropdown("q39", summaryDropdownOptions, true)}{" "}
                     available for writers, with Bill Manhire playing an important role.
                   </span>
                   <span className="summary-line">
                     Writers were also served by{" "}{renderLetterDropdown("q40", summaryDropdownOptions, true)}{" "}
                     dating variously from 1947 to more recent times.
                   </span>
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
