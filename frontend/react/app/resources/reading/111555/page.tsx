"use client";

import Head from "next/head";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { markTestCompleted } from "@/lib/completedTests";

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
} as const;

type QuestionKey = keyof typeof correctAnswers;

const progressNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;

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

const tfngOptions = [
  { value: "YES", label: "YES" },
  { value: "NO", label: "NO" },
  { value: "NOT GIVEN", label: "NOT GIVEN" },
];

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

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

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

  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);

  const [openDropdownKey, setOpenDropdownKey] = useState<QuestionKey | null>(null);
  const [selections, setSelections] = useState<Record<QuestionKey, string>>(initialSelections);

  const handleSubmit = () => {
    if (submitted) return;
    let s = 0;
    (Object.keys(correctAnswers) as QuestionKey[]).forEach((key) => {
      const correct = correctAnswers[key];
      const user = (selections[key] ?? "").trim();
      if (!user) return;
      if (user === correct) s++;
    });
    setIsRunning(false);
    setSubmitted(true);
    setScore(s);
    setIsResultsOpen(true);
    markTestCompleted("reading", readingId);
  };

  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    if (timeLeft !== 0) return;
    if (submitted) return;
    setIsSubmitConfirmOpen(false);
    handleSubmitRef.current();
  }, [timeLeft, isRunning, submitted]);

  useEffect(() => {
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
  }, []);

  const answeredCount = useMemo(() => {
    return progressNumbers.reduce((acc, n) => {
      const key = `q${n}` as QuestionKey;
      return acc + (selections[key]?.trim() ? 1 : 0);
    }, 0);
  }, [selections]);

  const totalQuestions = progressNumbers.length;
  const scoreLabel = `${score ?? 0}/${totalQuestions}`;

  const dashboardHref = `${userPrefix}/dashboard`;
  const readingTestsHref = `${userPrefix}/resources/reading`;
  const reviewHref = pathname;

  const setAnswer = (key: QuestionKey, value: string) => {
    if (submitted) return;
    setSelections((s) => ({ ...s, [key]: value }));
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
              onChange={() => setAnswer(key, o.value)}
            />
            <span className="radio-circle" aria-hidden="true" />
            <span className="radio-text">{o.label}</span>
          </label>
        ))}
      </div>
    );
  };

  const renderAbcdRadio = (key: QuestionKey, options: Array<{ value: string; label: string }>) => {
    const current = selections[key] ?? "";
    return (
      <div className="radio-group" role="radiogroup" aria-label={`Answer options for ${key}`}>
        {options.map((o) => (
          <label key={o.value} className="radio-option">
            <input
              type="radio"
              className="radio-input"
              name={key}
              value={o.value}
              checked={current === o.value}
              disabled={submitted}
              onChange={() => setAnswer(key, o.value)}
            />
            <span className="radio-circle" aria-hidden="true" />
            <span className="radio-text">{o.label}</span>
          </label>
        ))}
      </div>
    );
  };

  const renderLetterDropdown = (key: QuestionKey, options: Array<{ value: string; label: string }>, inline?: boolean) => {
    const current = (selections[key] ?? "").trim();
    const isOpen = openDropdownKey === key;
    const currentLabel = (options.find((o) => o.value === current)?.label ?? "").trim();

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

        <div className={`rounded-dropdown-menu${isOpen ? " is-open" : ""}`} role="listbox" aria-label={`Select answer for ${key}`}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="rounded-dropdown-item"
              onClick={() => {
                if (submitted) return;
                setAnswer(key, opt.value);
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
        <title>Reading – Examining the placebo effect</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <style jsx global>{`
        .page-root {
          --bg: #f5f5f5;
          --card: #ffffff;
          --text: #0f172a;
          --text-soft: #1f2937;
          --muted: #64748b;
          --border: #cbd5e1;
          --subtle: #f8fafc;
          --hover: #eef2ff;
          --chip-bg: #e2e8f0;
          --chip-text: #1f2937;
          --shadow-card: 0 10px 25px rgba(15, 23, 42, 0.08);
          --shadow-menu: 0 18px 44px rgba(15, 23, 42, 0.16);
          --accent: #2563eb;
          --good: #16a34a;
          --warn: #b91c1c;
        }

        .page-root {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          padding: 16px;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px 14px;
          box-shadow: var(--shadow-card);
        }

        .brand {
          font-weight: 800;
          letter-spacing: 0.2px;
        }

        .timer {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--subtle);
          color: var(--text-soft);
          font-weight: 700;
          min-width: 98px;
          justify-content: center;
        }

        .timer.is-warning {
          border-color: rgba(185, 28, 28, 0.35);
          background: rgba(254, 226, 226, 0.75);
          color: var(--warn);
        }

        .start-btn {
          border: 1px solid var(--border);
          background: var(--accent);
          color: #fff;
          border-radius: 12px;
          padding: 10px 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .start-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 16px;
          min-height: calc(100vh - 140px);
        }

        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 16px;
          box-shadow: var(--shadow-card);
          min-height: 0;
          overflow: auto;
        }

        h3 {
          margin: 0 0 12px;
          font-size: 20px;
          line-height: 1.2;
        }

        .passage p {
          margin: 0 0 12px;
          color: var(--text-soft);
          line-height: 1.7;
        }

        .question-group-title {
          font-weight: 900;
          margin: 12px 0 10px;
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
          font-weight: 800;
          margin-bottom: 10px;
          color: var(--text);
          line-height: 1.35;
        }

        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .radio-option {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          color: var(--text-soft);
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
        }

        .radio-circle::after {
          content: "";
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: var(--accent);
          transform: scale(0);
          transition: transform 160ms ease;
        }

        .radio-option input:checked + .radio-circle {
          border-color: var(--accent);
        }

        .radio-option input:checked + .radio-circle::after {
          transform: scale(1);
        }

        .radio-text {
          font-size: 15px;
          line-height: 1.4;
          color: var(--text-soft);
        }

        .rounded-dropdown {
          position: relative;
          width: 100%;
          max-width: 100%;
          margin: 0 6px;
          display: inline-block;
          vertical-align: middle;
        }

        .rounded-dropdown--inline {
          width: 170px;
        }

        .rounded-dropdown-trigger {
          width: 100%;
          padding: 8px 10px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text-soft);
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          cursor: pointer;
        }

        .rounded-dropdown-menu {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 0;
          width: 100%;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: var(--shadow-menu);
          z-index: 50;
          opacity: 0;
          transform: translateY(6px);
          pointer-events: none;
          transition: opacity 180ms ease, transform 180ms ease;
          max-height: 260px;
          overflow: auto;
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
          font-weight: 700;
          color: var(--text-soft);
        }

        .rounded-dropdown-item:hover {
          background: var(--hover);
        }

        .footer {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .progress {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .chip {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--chip-bg);
          color: var(--chip-text);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
        }

        .chip.is-answered {
          border-color: rgba(22, 163, 74, 0.45);
          background: rgba(22, 163, 74, 0.12);
          color: var(--text);
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn {
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text-soft);
          border-radius: 12px;
          padding: 10px 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .btn-primary {
          background: var(--good);
          color: #fff;
          border-color: rgba(22, 163, 74, 0.35);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          z-index: 999;
        }

        .modal {
          position: fixed;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: min(680px, calc(100vw - 24px));
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: var(--shadow-menu);
          z-index: 1000;
          padding: 16px;
        }

        .modal-title {
          font-weight: 900;
          font-size: 16px;
          margin-bottom: 10px;
        }

        .modal-score {
          font-size: 34px;
          font-weight: 900;
          margin: 14px 0;
        }

        .muted {
          color: var(--muted);
        }

        @media (max-width: 980px) {
          .layout {
            grid-template-columns: 1fr;
            min-height: unset;
          }
        }
      `}</style>

      <div className="page-root">
        <div className="topbar">
          <div>
            <div className="brand">IELTSwithJurabek</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
              Reading Test – Questions 1–14
            </div>
          </div>

          <div className={`timer${timeLeft <= 2 * 60 ? " is-warning" : ""}`}>
            <i className="fa-solid fa-clock" aria-hidden="true" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button type="button" className="start-btn" disabled={isRunning || submitted} onClick={() => setIsRunning(true)}>
            {isRunning ? "Running" : submitted ? "Finished" : "Start"}
          </button>
        </div>

        <div className="layout">
          <div className="card passage" role="region" aria-label="Reading Passage">
            <div className="muted" style={{ fontWeight: 900, marginBottom: 10 }}>
              Reading Passage
            </div>
            <h3>Examining the placebo effect</h3>
            <div id="passage1">
              <p>
                The fact that taking a fake drug can powerfully improve some people's health - the so-called placebo effect - was long considered an
                embarrassment to the serious practice of pharmacology, but now things have changed.
              </p>
              <p>
                Several years ago, Merck, a global pharmaceutical company, was falling behind its rivals in sales. To make matters worse, patents on five
                blockbuster drugs were about to expire, which would allow cheaper generic products to flood the market. In interviews with the press,
                Edward Scolnick, Merck's Research Director, presented his plan to restore the firm to pre-eminence. Key to his strategy was expanding the
                company’s reach into the antidepressant market, where Merck had trailed behind, while competitors like Pfizer and GlaxoSmithKline had
                created some of the best-selling drugs in the world. "To remain dominant in the future,” he told one media company, "we need to dominate
                the central nervous system."
              </p>
              <p>
                His plan hinged on the success of an experimental antidepressant codenamed MK-869. Still in clinical trials, it was a new kind of
                medication that exploited brain chemistry in innovative ways to promote feelings of well-being. The drug tested extremely well early on,
                with minimal side effects. Behind the scenes, however, MK-869 was starting to unravel. True, many test subjects treated with the
                medication felt their hopelessness and anxiety lift. But so did nearly the same number who took a placebo, a look-alike pill made of milk
                sugar or another inert substance given to groups of volunteers in subsequent clinical trials to gauge the effectiveness of the real drug by
                comparison. Ultimately, Merck's venture into the antidepressant market failed. In the jargon of the industry, the trials crossed the
                "futility boundary".
              </p>
              <p>
                MK-869 has not been the only much-awaited medical breakthrough to be undone in recent years by the placebo effect. And it's not only
                trials of new drugs that are crossing the futility boundary. Some products that have been on the market for decades are faltering in more
                recent follow-up tests. It's not that the old medications are getting weaker, drug developers say. It's as if the placebo effect is
                somehow getting stronger. The fact that an increasing number of medications are unable to beat sugar pills has thrown the industry into
                crisis. The stakes could hardly be higher. To win FDA approval, a new medication must beat placebo in at least two authenticated trials.
                In today’s economy, the fate of a well-established company can hang on the outcome of a handful of tests.
              </p>
              <p>
                Why are fake pills suddenly overwhelming promising new drugs and established medicines alike? The reasons are only just beginning to be
                understood. A network of independent researchers is doggedly uncovering the inner workings and potential applications of the placebo
                effect. A psychiatrist, William Potter, who knew that some patients really do seem to get healthier for reasons that have more to do with
                a doctor's empathy than with the contents of a pill, was baffled by the fact that drugs he had been prescribing for years seemed to be
                struggling to prove their effectiveness. Thinking that a crucial factor may have been overlooked, Potter combed through his company’s
                database of published and unpublished trials—including those that had been kept secret because of high placebo response. His team
                aggregated the findings from decades of antidepressant trials, looking for patterns and trying to see what was changing over time. What
                they found challenged some of the industry’s basic assumptions about its drug-vetting process.
              </p>
              <p>
                Assumption number one was that if a trial were managed correctly, a medication would perform as well or badly in a Phoenix hospital as in a
                Bangalore clinic. Potter discovered, however, that geographic location alone could determine the outcome. By the late 1990s, for example,
                the anti-anxiety drug Diazepam was still beating placebo in France and Belgium. But when the drug was tested in the U.S., it was likely to
                fail. Conversely, a similar drug, Prozac, performed better in America than it did in western Europe and South Africa. It was an unsettling
                prospect: FDA approval could hinge on where the company chose to conduct a trial.
              </p>
              <p>
                Mistaken assumption number two was that the standard tests used to gauge volunteers' improvement in trials yielded consistent results.
                Potter and his colleagues discovered that ratings by trial observers varied significantly from one testing site to another. It was like
                finding out that the judges in a tight race each had a different idea about the placement of the finish line.
              </p>
              <p>
                After some coercion by Potter and others, the National Institute of Health (NIH) focused on the issue in 2000, hosting a three-day
                conference in Washington, and this conference launched a new wave of placebo research in academic laboratories in the U.S. and Italy that
                would make significant progress toward solving the mystery of what was happening in clinical trials.
              </p>
              <p>
                In one study last year, Harvard Medical School researcher Ted Kaptchuk devised a clever strategy for testing his volunteers’ response to
                varying levels of therapeutic ritual. The study focused on a common but painful medical condition that costs more than $40 billion a year
                worldwide to treat. First, the volunteers were placed randomly in one of three groups. One group was simply put on a waiting list;
                researchers know that some patients get better just because they sign up for a trial. Another group received placebo treatment from a
                clinician who declined to engage in small talk. Volunteers in the third group got the same fake treatment from a clinician who asked them
                questions about symptoms, outlined the causes of the illness, and displayed optimism about their condition.
              </p>
              <p>
                Not surprisingly, the health of those in the third group improved most. In fact, just by participating in the trial, volunteers in this
                high-interaction group got as much relief as did people taking the two leading prescription drugs for the condition. And the benefits of
                their “bogus” treatment persisted for weeks afterward, contrary to the belief—widespread in the pharmaceutical industry—that the placebo
                response is short-lived.
              </p>
              <p>
                Studies like this open the door to hybrid treatment strategies that exploit the placebo effect to make real drugs safer and more effective.
                As Potter says, “To really do the best for your patients, you want the best placebo response plus the best drug response.”
              </p>
              <p>
                <em>
                  * The Food and Drug Administration (an agency in the United States responsible for protecting public health by assuring the safety of human
                  drugs)
                </em>
              </p>
            </div>
          </div>

          <div className="card" id="questions" role="region" aria-label="Questions">
            <div className="muted" style={{ fontWeight: 900, marginBottom: 10 }}>
              Questions
            </div>
            <div className="muted" style={{ marginBottom: 12 }}>
              You should spend about 20 minutes on Questions 1–14, which are based on the Reading Passage.
            </div>

            <div className="question-group">
              <div className="question-group-title">Questions 1–5</div>
              <p className="muted" style={{ marginTop: 0 }}>
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
              <div className="question-group-title">Questions 6–10</div>
              <p className="muted" style={{ marginTop: 0 }}>
                Complete the summary using the list of words A–I below.
                <br />
                <strong>Merck and MK-869</strong>
              </p>

              <p style={{ lineHeight: 1.8, color: "var(--text-soft)" }}>
                As a result of concerns about increasing
                {renderLetterDropdown("q6", summaryDropdownOptions, true)}
                in the drugs industry, the pharmaceutical company Merck decided to increase its
                {renderLetterDropdown("q7", summaryDropdownOptions, true)}
                in the antidepressant market. The development of the drug MK-869 was seen as the way forward. Initially, MK-869 had some
                {renderLetterDropdown("q8", summaryDropdownOptions, true)}
                , but later trials revealed a different picture. Although key
                {renderLetterDropdown("q9", summaryDropdownOptions, true)}
                could be treated with the drug, a sugar pill was proving equally effective. In the end, the
                {renderLetterDropdown("q10", summaryDropdownOptions, true)}
                indicated that it was pointless continuing with the development of the drug.
              </p>
            </div>

            <div className="question-group" style={{ marginTop: 16 }}>
              <div className="question-group-title">Questions 11–14</div>
              <p className="muted" style={{ marginTop: 0 }}>Choose the correct letter A, B, C or D.</p>

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

        <div className="footer">
          <div className="progress" aria-label="Progress">
            {progressNumbers.map((n) => {
              const key = `q${n}` as QuestionKey;
              const answered = Boolean((selections[key] ?? "").trim());
              return (
                <div key={n} className={`chip${answered ? " is-answered" : ""}`} title={answered ? "Answered" : "Not answered"}>
                  {n}
                </div>
              );
            })}
          </div>

          <div className="actions">
            <div className="muted" style={{ fontWeight: 800 }}>
              Answered: {answeredCount}/{totalQuestions}
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (submitted) setIsResultsOpen(true);
                else setIsSubmitConfirmOpen(true);
              }}
              disabled={!isRunning && !submitted}
            >
              {submitted ? "View Results" : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {isSubmitConfirmOpen ? (
        <>
          <div className="overlay" onClick={() => setIsSubmitConfirmOpen(false)} />
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-title">Submit test?</div>
            <div className="muted">You can still review answers after submission.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16, flexWrap: "wrap" }}>
              <button type="button" className="btn" onClick={() => setIsSubmitConfirmOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setIsSubmitConfirmOpen(false);
                  handleSubmit();
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </>
      ) : null}

      {isResultsOpen ? (
        <>
          <div className="overlay" onClick={() => setIsResultsOpen(false)} />
          <div className="modal" role="dialog" aria-modal="true">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div className="modal-title">Test Results</div>
              <button type="button" className="btn" onClick={() => setIsResultsOpen(false)}>
                Close
              </button>
            </div>

            <div className="modal-score">{scoreLabel}</div>

            <div className="muted" style={{ lineHeight: 1.7 }}>Score is calculated from provided answer key.</div>

            <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 16, flexWrap: "wrap" }}>
              <button type="button" className="btn" onClick={() => router.push(readingTestsHref)}>
                Back to Reading
              </button>
              <button type="button" className="btn" onClick={() => router.push(dashboardHref)}>
                Dashboard
              </button>
              <button type="button" className="btn" onClick={() => router.push(reviewHref)}>
                Review
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
