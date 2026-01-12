 "use client";

import Head from "next/head";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { markTestCompleted } from "@/lib/completedTests";
import { api } from "@/lib/api";
const correctAnswers = {
  q1: "TRUE",
  q2: "FALSE",
  q3: "NOT GIVEN",
  q4: "TRUE",
  q5: "FALSE",
  q6: "NOT GIVEN",
  q7: "Discoveries",
  q8: "Publisher",
  q9: "Counties",
  q10: "Recognition",
  q11: "Stone",
  q12: "Economy",
  q13: "Importance",
};

const progressNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

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
};

export default function Reading781693Page() {
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
     return "781693";
   }, [segments]);

   const isTextAnswerKey = (key: QuestionKey) =>
    key === "q7" ||
    key === "q8" ||
    key === "q9" ||
    key === "q10" ||
    key === "q11" ||
    key === "q12" ||
    key === "q13";

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

   const [openHeadingDropdown, setOpenHeadingDropdown] = useState<string | null>(null);
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
     if (!openHeadingDropdown) return;

     const onPointerDown = (e: PointerEvent) => {
       const target = e.target as HTMLElement | null;
       if (!target) return;
       if (!target.closest(".rounded-dropdown")) {
         setOpenHeadingDropdown(null);
       }
     };

     const onKeyDown = (e: KeyboardEvent) => {
       if (e.key === "Escape") setOpenHeadingDropdown(null);
     };

     document.addEventListener("pointerdown", onPointerDown);
     document.addEventListener("keydown", onKeyDown);
     return () => {
       document.removeEventListener("pointerdown", onPointerDown);
       document.removeEventListener("keydown", onKeyDown);
     };
   }, [openHeadingDropdown]);

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
           ? userDisplay.trim().toLowerCase() === String(correct).trim().toLowerCase()
           : userDisplay === correct);
       return { num, userDisplay, correct, isCorrect };
     });
   }, [selections, isTextAnswerKey]);

   const totalQuestions = progressNumbers.length;
   const scoreLabel = `${score ?? 0}/${totalQuestions}`;
   const feedbackHasWord = /\S+/.test(feedbackText.trim());
   const dashboardHref = `${userPrefix}/dashboard`;
   const readingTestsHref = `${userPrefix}/resources/reading`;
   const reviewHref = pathname;

   const tfngOptions = [
     { value: "TRUE", text: "TRUE" },
     { value: "FALSE", text: "FALSE" },
     { value: "NOT GIVEN", text: "NOT GIVEN" },
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

   const dropdownLabel = (key: QuestionKey, value: string) => {
     if (!value) return "Select an option";
     return value;
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

   const renderRadioGroup = (
     key: QuestionKey,
     options: Array<{ value: string; text: string }>,
     showLeadingLetter: boolean
   ) => {
     const current = selections[key] ?? "";
     return (
       <div className="radio-group" role="radiogroup" aria-label={String(key)}>
         {options.map((o) => {
           const safeValue = String(o.value).replace(/[^a-zA-Z0-9_-]/g, "-");
           const id = `${String(key)}-${safeValue}`;
           return (
             <label
               key={o.value}
               className="radio-option"
               htmlFor={id}
               onMouseDown={(e) => {
                 e.preventDefault();
               }}
               onClick={(e) => {
                 e.preventDefault();
                 if (submitted) return;
                 setSelections((s) => ({ ...s, [key]: o.value }));
               }}
             >
               <input
                 id={id}
                 className="radio-input"
                 type="radio"
                 name={String(key)}
                 value={o.value}
                 disabled={submitted}
                 checked={current === o.value}
                 onChange={() => {
                   if (submitted) return;
                   setSelections((s) => ({ ...s, [key]: o.value }));
                 }}
               />
               <span className="radio-circle" aria-hidden="true" />
               <span className="radio-text">
                 {showLeadingLetter ? <span className="radio-letter">{o.value}</span> : null}
                 {o.text}
               </span>
             </label>
           );
         })}
       </div>
     );
   };

   const renderDropdown = (
     key: QuestionKey,
     options: Array<{ value: string; label: string }>,
     className?: string
   ) => {
     const isOpen = openHeadingDropdown === key;
     const current = selections[key] ?? "";
     return (
       <div className={`rounded-dropdown${className ? ` ${className}` : ""}`}>
         <button
           type="button"
           className="rounded-dropdown-trigger"
           aria-haspopup="listbox"
           aria-expanded={isOpen}
           disabled={submitted}
           onClick={() => {
             if (submitted) return;
             setOpenHeadingDropdown((v) => (v === key ? null : key));
           }}
         >
           <span>{dropdownLabel(key, current)}</span>
           <span style={{ color: "#718096", fontSize: 12 }}>▼</span>
         </button>
         <div
           className={`rounded-dropdown-menu${isOpen ? " is-open" : ""}`}
           role="listbox"
           aria-hidden={!isOpen}
         >
           {options.map((o) => (
             <button
               key={o.value}
               type="button"
               className="rounded-dropdown-item"
               disabled={submitted}
               onClick={() => {
                 if (submitted) return;
                 setSelections((s) => ({ ...s, [key]: o.value }));
                 setOpenHeadingDropdown(null);
               }}
             >
               {o.label}
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
         <title>Reading Passage 1 – The Father of English Geology</title>
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

         .rounded-dropdown.summary-dropdown {
           width: 180px;
           display: inline-block;
           vertical-align: middle;
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

         .rounded-dropdown-menu {
           position: absolute;
           top: calc(100% + 6px);
           left: 0;
           width: 100%;
           background: var(--card);
           border: 1px solid var(--border);
           border-radius: 14px;
           overflow: visible;
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

         .inline-text-input {
           display: inline-block;
           min-width: 120px;
           padding: 8px 10px;
           border-radius: 12px;
           border: 1px solid var(--border);
           background: var(--card);
           color: var(--text);
           outline: none;
         }

         .inline-text-input:focus {
           border-color: #63b3ed;
           box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.25);
         }

         .summary-inline {
           margin: 0;
           line-height: 1.8;
         }

         .summary-inline p {
           margin-top: 0;
           margin-bottom: 14px;
         }

         .summary-inline p:last-child {
           margin-bottom: 0;
         }

         .summary-inline .inline-text-input {
           min-width: 90px;
           height: 28px;
           padding: 4px 8px;
           font-size: 13px;
           border-radius: 10px;
           margin: 0 8px;
           vertical-align: baseline;
         }

         .questions-card {
           padding: 24px;
         }

         .question-group {
           padding-top: 4px;
         }

         .question-group + .question-group {
           margin-top: 20px;
         }

         .question-group .question:first-of-type {
           margin-top: 0;
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

         .radio-group {
           display: flex;
           flex-direction: column;
           gap: 12px;
         }

         .radio-option {
           display: flex;
           align-items: flex-start;
           gap: 10px;
           cursor: pointer;
           color: var(--text-soft);
           line-height: 1.35;
           padding: 4px 0;
         }

         .radio-input {
           position: absolute;
           opacity: 0;
           pointer-events: none;
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

         .rounded-dropdown.summary-dropdown {
           margin: 0 8px;
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
           <div style={{ fontSize: 14, color: "var(--muted)" }}>Read the text and answer questions 1–13</div>
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
            marginBottom: 12,
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
              onScroll={() => setSelectionToolbar((s) => (s.open ? { ...s, open: false } : s))}
            >
              <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 20, fontWeight: 700 }}>The Father of English Geology</h3>

              {passageHtml === null ? (
                <div id="passage1" ref={passageRef}>
                  <p>
                    William Smith, 1769–1839, has been called the ‘Father of English Geology’. His pioneering map of 1815, depicting the geology of England, Wales and part of Scotland, helped to shape the economic and scientific development of Britain, just as the country was experiencing the Industrial Revolution.
                  </p>
                  <p>
                    William Smith was born in rural Oxfordshire in 1769. The son of the village blacksmith, Smith was the eldest of five children. After elementary education at the village school, where he developed a liking for geometry and drawing, he decided to teach himself the skills of surveying, possibly because there were an increasing number of openings for that profession. At the age of 18 he was employed by Edward Webb, a surveyor in a nearby town, and subsequently, in 1791, he set up in business on his own.
                  </p>
                  <p>
                    As a boy, Smith had developed an interest in the exposures of rock and the fossils which were to be found locally. As an adult, his surveys of land that would be suitable for building canals, and for sources of building stone and coal in other parts of England, led to a great increase in his knowledge and awareness of various geological features.
                  </p>
                  <p>
                    As he travelled, he found the strata that he was familiar with in the south of England were repeated in other areas, with some outcrops – the rocks emerging above ground – stretching right across the country. Coal miners were already aware of the occurrences of regular successions of workable coal seams. But on a larger scale, Smith began to recognise that sedimentary rocks could be identified by the fossils they contained, and that these rocks were always arranged in the same order. Smith’s discovery that beds of rocks can be distinguished by the fossils found in them was a concept virtually unrecognised by geologists of that period.
                  </p>
                  <p>
                    Working on this principle, Smith was able to draw up a table of successive strata which could be applied in any other locality – an early version of the geological column.
                  </p>
                  <p>
                    By 1799, Smith was using both his skills as a surveyor and the knowledge gained from his observations in the field to draw up a geological map. This first map was circular in form, covered the area around the city of Bath, and was exhibited at the Bath Agricultural Society. At the same time, Smith continued to plan the publication of a treatise describing his discoveries, but financial support proved difficult to find. In 1801, Smith produced a small geological map of England and Wales which illustrated the outcrops of seven geological formations.
                  </p>
                  <p>
                    Other maps were produced for exhibition at various meetings, but it was not until 1815 that, with input from the enterprising map publisher John Cary, Smith’s first major map actually appeared. It was called ‘A delineation of the Strata of England and Wales with part of Scotland; exhibiting the Collieries and Mines, the Marshes and Fen Lands originally overflowed by the Sea, and the varieties of soil according to the variations in the substrata, illustrated by the most descriptive names’.
                  </p>
                  <p>
                    Based on Cary’s new topographical map at the scale of five miles to the inch, Smith’s map showed the outcrops of some twenty formations. Other publications on stratigraphy followed, including his major mapping publication ‘Geological Atlas’, comprising maps of 21 counties. Published between 1819 and 1824, these maps represent a first attempt at systematic sheet mapping of England and Wales.
                  </p>
                  <p>
                    Despite the importance of his ideas and publications, Smith continued to find recognition elusive and it was not until 1831, when the Geological Society awarded him the first Wollaston Medal, that the importance of his achievements was finally acknowledged. In his citation, the geologist Adam Sedgwick called Smith the ‘Founder of English Geology’.
                  </p>
                  <p>
                    From time to time Smith’s expertise continued to be drawn upon for major projects. In 1838 he was commissioned to accompany Henry De la Beche and Sir Charles Barry on a tour of the principal stone quarries to recommend the stone to be used in the rebuilding of the Houses of Parliament, which had been destroyed by fire in 1835. The practical nature of the commission provides a link between Smith’s work and that of De la Beche and his newly founded Geological Survey.
                  </p>
                  <p>
                    The main focus of Smith’s work was to apply his observations and ideas to the everyday needs of the canal builders, quarry- and mine-owners, landowners and agriculturists who were underpinning the Industrial Revolution. His understanding of geology enabled him to predict where coal or different types of stone could be found, which was very useful for mining companies. He talked at meetings about geology and its valuable contribution to the national economy.
                  </p>
                  <p>
                    The methods involved in map production have developed and the ways in which people access maps have altered radically since Smith’s time. However, his conviction that geological mapping is of vital importance at many levels and in many areas of the nation’s society, science, and industry is as true today as it was two centuries ago, when he conceived his original geological map. It is as vital for today’s industries to be provided with accurate geological map data as it was in Smith’s time.
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
                padding: 24,
                boxShadow: "var(--shadow-card)",
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
              }}
            >
              <div className="question-group">
                <div className="question-group-title"><strong>Questions 1-6</strong></div>
                <p>
                  Do the following statements agree with the information given in the text?
                  <br />
                  In boxes <strong>1–6</strong> on your answer sheet, write:
                  <br />
                  <strong>TRUE</strong> if the statement agrees with the information
                  <br />
                  <strong>FALSE</strong> if the statement contradicts the information
                  <br />
                  <strong>NOT GIVEN</strong> if there is no information on this
                </p>

                <div className="question question--plain">
                  <div className="question-text">1. At the time when Smith left school, there was a growing demand for surveyors.</div>
                  {renderRadioGroup("q1", tfngOptions, false)}
                </div>

                <div className="question question--plain">
                  <div className="question-text">2. When Smith was 18, he formed a partnership with another surveyor.</div>
                  {renderRadioGroup("q2", tfngOptions, false)}
                </div>

                <div className="question question--plain">
                  <div className="question-text">3. Smith’s interest in rocks and fossils was encouraged by his school.</div>
                  {renderRadioGroup("q3", tfngOptions, false)}
                </div>

                <div className="question question--plain">
                  <div className="question-text">4. Smith noticed that the same types of rocks were visible in a number of places.</div>
                  {renderRadioGroup("q4", tfngOptions, false)}
                </div>

                <div className="question question--plain">
                  <div className="question-text">5. Smith believed that the order of strata in the ground varied from locality to locality.</div>
                  {renderRadioGroup("q5", tfngOptions, false)}
                </div>

                <div className="question question--plain">
                  <div className="question-text">6. Smith’s map of Bath was commissioned by the Bath Agricultural Society.</div>
                  {renderRadioGroup("q6", tfngOptions, false)}
                </div>
              </div>

              <div className="question-group" style={{ marginTop: 16 }}>
                <div className="question-group-title"><strong>Questions 7-13</strong></div>
                <p>
                  Complete the sentences below.
                  <br />
                  Choose <strong>ONE WORD ONLY</strong> from the text for each answer.
                  <br />
                  Write your answers in boxes <strong>7–13</strong> on your answer sheet.
                </p>

                <div className="summary-inline" style={{ lineHeight: 1.9 }}>
                  <p>
                    7. Around 1799, Smith struggled to raise money for a publication about his {renderTextInput("q7", "7")}.
                  </p>
                  <p>
                    8. Unlike other maps, Smith’s 1815 map was produced with help from a {renderTextInput("q8", "8")}.
                  </p>
                  <p>
                    9. Smith's ‘Geological Atlas’ contained maps of a number of the {renderTextInput("q9", "9")} of England and Wales.
                  </p>
                  <p>
                    10. Smith did not receive {renderTextInput("q10", "10")} for his work until 1831.
                  </p>
                  <p>
                    11. In 1838 Smith advised on the most suitable {renderTextInput("q11", "11")} for rebuilding the Houses of Parliament.
                  </p>
                  <p>
                    12. Smith made speeches about how the country’s {renderTextInput("q12", "12")} benefited from geology.
                  </p>
                  <p>
                    13. Nowadays, geological maps still have the {renderTextInput("q13", "13")} that Smith believed they had.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div><div style={{ height: 2, backgroundColor: "var(--border)", marginLeft: -20, marginRight: -20, marginTop: 1, marginBottom: 0 }} />


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
                         boxShadow: answered ? "0 8px 14px rgba(72, 187, 120, 0.18)" : "none",
                         transition:
                           "box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease",
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

