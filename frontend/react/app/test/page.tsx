"use client";

import { useEffect } from "react";

export default function TestPage() {
  useEffect(() => {
    let highlightTooltip: HTMLDivElement | null = null;
    let selectedRange: Range | null = null;

    function createColorPicker(
      x: number,
      y: number,
      applyColorCallback: (color: string) => void
    ) {
      const colors = ["lightgreen", "yellow", "lightskyblue"];
      const picker = document.createElement("div");
      picker.className = "highlight-tooltip";
      picker.style.top = `${y}px`;
      picker.style.left = `${x}px`;
      picker.style.position = "fixed";
      picker.style.background = "#333";
      picker.style.color = "white";
      picker.style.padding = "5px 10px";
      picker.style.borderRadius = "4px";
      picker.style.zIndex = "1000";
      picker.style.display = "flex";
      colors.forEach((color) => {
        const btn = document.createElement("button");
        btn.style.backgroundColor = color;
        btn.style.border = "none";
        btn.style.width = "20px";
        btn.style.height = "20px";
        btn.style.margin = "0 4px";
        btn.style.borderRadius = "50%";
        btn.title = `Highlight with ${color}`;
        btn.addEventListener("click", () => {
          applyColorCallback(color);
          picker.remove();
        });
        picker.appendChild(btn);
      });
      document.body.appendChild(picker);
      return picker;
    }

    function applyHighlight(color: string) {
      if (!selectedRange) return;
      const span = document.createElement("span");
      span.className = "highlight";
      span.style.backgroundColor = color;
      span.setAttribute("data-color", color);
      span.appendChild(selectedRange.extractContents());
      selectedRange.insertNode(span);
      selectedRange = null;
      const selection = window.getSelection();
      if (selection) selection.removeAllRanges();

      span.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation();
        if (highlightTooltip) highlightTooltip.remove();
        const tooltip = document.createElement("div");
        tooltip.className = "highlight-tooltip";
        tooltip.style.top = `${e.clientY}px`;
        tooltip.style.left = `${e.clientX}px`;
        tooltip.innerHTML =
          '<button style="color:white;background:red;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;">Remove Highlight</button>';
        const btn = tooltip.querySelector("button");
        if (btn) {
          btn.addEventListener("click", () => {
            const parent = span.parentNode;
            if (!parent) return;
            while (span.firstChild) {
              parent.insertBefore(span.firstChild, span);
            }
            parent.removeChild(span);
            parent.normalize();
            tooltip.remove();
          });
        }
        document.body.appendChild(tooltip);
        highlightTooltip = tooltip;
      });
    }

    function handleMouseUp(e: MouseEvent) {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim() === "") return;
      const currentTarget = e.currentTarget as Node | null;
      if (!currentTarget || !selection.anchorNode) return;
      if (!currentTarget.contains(selection.anchorNode)) return;

      selectedRange = selection.getRangeAt(0).cloneRange();
      const rect = selectedRange.getBoundingClientRect();

      if (highlightTooltip) {
        highlightTooltip.remove();
        highlightTooltip = null;
      }

      highlightTooltip = createColorPicker(
        rect.left,
        rect.top - 40,
        applyHighlight
      );
    }

    const passageEl = document.getElementById("passage-text");
    const questionsEl = document.getElementById("questions-container");
    passageEl?.addEventListener("mouseup", handleMouseUp);
    questionsEl?.addEventListener("mouseup", handleMouseUp);

    function handleDocumentMouseDown(e: MouseEvent) {
      const target = e.target as Node | null;
      if (highlightTooltip && target && !highlightTooltip.contains(target)) {
        highlightTooltip.remove();
        highlightTooltip = null;
        const selection = window.getSelection();
        if (selection) selection.removeAllRanges();
      }
    }

    document.addEventListener("mousedown", handleDocumentMouseDown);

    const nightToggle = document.getElementById("night-mode-toggle");
    function handleNightToggle() {
      document.body.classList.toggle("night-mode");
      const icon = nightToggle?.querySelector("i");
      if (!icon) return;
      if (document.body.classList.contains("night-mode")) {
        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");
      } else {
        icon.classList.remove("fa-sun");
        icon.classList.add("fa-moon");
      }
    }
    nightToggle?.addEventListener("click", handleNightToggle);

    const submitBtn = document.getElementById("submit-btn");
    const closeFeedbackBtn = document.getElementById("close-feedback");
    const resetBtn = document.getElementById("reset-btn");

    const correctAnswers: Record<string, string> = {
      q30: "B",
      q31: "C",
      q32: "D",
      q33: "A",
      q34: "B",
      q35: "I",
      q36: "E",
      q37: "C",
      q38: "H",
      q39: "G",
      q40: "F",
      q41: "NO",
      q42: "NOT GIVEN",
      q43: "NO",
      q44: "NOT GIVEN",
      q45: "YES",
      q46: "YES",
    };

    function handleSubmit() {
      let score = 0;
      let feedbackHTML = "";

      Object.entries(correctAnswers).forEach(([qid, correct]) => {
        let userAnswer = "";
        const selects = document.getElementsByName(qid);
        if (
          selects.length > 0 &&
          (selects[0] as HTMLElement).tagName === "SELECT"
        ) {
          const sel = selects[0] as HTMLSelectElement;
          userAnswer = sel.value;
        } else {
          const radios = document.getElementsByName(qid);
          radios.forEach((r) => {
            const radio = r as HTMLInputElement;
            if (radio.checked) {
              userAnswer = radio.value;
            }
          });
        }

        const isCorrect = userAnswer === correct;
        if (isCorrect) score++;

        feedbackHTML += `
        <div class="feedback-item">
            <div class="feedback-question">Q${qid.replace("q", "")}</div>
            <div class="feedback-answer ${
              isCorrect ? "correct" : "incorrect"
            }">
                Your Answer: ${userAnswer || "(no answer)"}<br/>
                ${
                  isCorrect
                    ? "✔ Correct"
                    : `✘ Incorrect (Correct: ${correct})`
                }
            </div>
        </div>`;
      });

      const feedbackBody = document.getElementById("feedback-body");
      const scoreDisplay = document.getElementById("score-display");
      const overlay = document.getElementById("feedback-overlay");
      if (feedbackBody) {
        feedbackBody.innerHTML = feedbackHTML;
      }
      if (scoreDisplay) {
        scoreDisplay.textContent = `${score}/14 `;
      }
      if (overlay) {
        (overlay as HTMLElement).style.display = "flex";
      }
    }

    function handleCloseFeedback() {
      const overlay = document.getElementById("feedback-overlay");
      if (overlay) {
        (overlay as HTMLElement).style.display = "none";
      }
    }

    function handleReset() {
      const selects = document.querySelectorAll("select");
      selects.forEach((sel) => {
        (sel as HTMLSelectElement).value = "";
      });

      const radios = document.querySelectorAll("input[type='radio']");
      radios.forEach((r) => {
        (r as HTMLInputElement).checked = false;
      });

      const progressItems = document.querySelectorAll(
        ".progress-item.completed"
      );
      progressItems.forEach((item) => {
        item.classList.remove("completed");
      });
    }

    submitBtn?.addEventListener("click", handleSubmit);
    closeFeedbackBtn?.addEventListener("click", handleCloseFeedback);
    resetBtn?.addEventListener("click", handleReset);

    const questionsConfig = [
      { id: "q30", number: 30 },
      { id: "q31", number: 31 },
      { id: "q32", number: 32 },
      { id: "q33", number: 33 },
      { id: "q34", number: 34 },
      { id: "q35", number: 35 },
      { id: "q36", number: 36 },
      { id: "q37", number: 37 },
      { id: "q38", number: 38 },
      { id: "q39", number: 39 },
      { id: "q40", number: 40 },
      { id: "q41", number: 41 },
      { id: "q42", number: 42 },
      { id: "q43", number: 43 },
      { id: "q44", number: 44 },
      { id: "q45", number: 45 },
      { id: "q46", number: 46 },
    ];

    function initializeProgressTracker() {
      const progressContainer = document.getElementById("progress-container");
      if (!progressContainer) return;
      progressContainer.innerHTML = "";
      questionsConfig.forEach(({ id, number }) => {
        const item = document.createElement("div");
        item.className = "progress-item";
        item.textContent = String(number);
        (item as any).dataset.qid = id;
        item.addEventListener("click", () => {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        });
        progressContainer.appendChild(item);
      });
    }

    function updateProgressStatus() {
      const progressItems = document.querySelectorAll(".progress-item");
      progressItems.forEach((item) => {
        const qid = (item as any).dataset.qid as string | undefined;
        if (!qid) return;
        const questionElem = document.getElementById(qid);
        if (!questionElem) return;
        let answered = false;

        const select = questionElem.querySelector("select");
        const radios = questionElem.querySelectorAll("input[type='radio']");

        if (select && (select as HTMLSelectElement).value !== "") {
          answered = true;
        } else if (radios.length > 0) {
          radios.forEach((r) => {
            if ((r as HTMLInputElement).checked) {
              answered = true;
            }
          });
        }

        if (answered) {
          item.classList.add("completed");
          questionElem.classList.add("answered");
        } else {
          item.classList.remove("completed");
          questionElem.classList.remove("answered");
        }
      });
    }

    initializeProgressTracker();
    updateProgressStatus();
    const handleChange = () => updateProgressStatus();
    document.addEventListener("change", handleChange);

    let timerInterval: number | null = null;
    let timeRemaining = 20 * 60;

    function updateTimerDisplay() {
      const minutes = Math.floor(timeRemaining / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (timeRemaining % 60).toString().padStart(2, "0");
      const timerEl = document.getElementById("timer");
      if (timerEl) {
        timerEl.textContent = `${minutes}:${seconds}`;
      }
    }

    const startTimerBtn = document.getElementById("start-timer");
    const pauseTimerBtn = document.getElementById("pause-timer");
    const resetTimerBtn = document.getElementById("reset-timer");

    function handleStartTimer() {
      if (timerInterval !== null) return;
      timerInterval = window.setInterval(() => {
        if (timeRemaining > 0) {
          timeRemaining -= 1;
          updateTimerDisplay();
        } else {
          if (timerInterval !== null) {
            window.clearInterval(timerInterval);
            timerInterval = null;
          }
          window.alert("Time is up!");
        }
      }, 1000);
    }

    function handlePauseTimer() {
      if (timerInterval !== null) {
        window.clearInterval(timerInterval);
        timerInterval = null;
      }
    }

    function handleResetTimer() {
      if (timerInterval !== null) {
        window.clearInterval(timerInterval);
        timerInterval = null;
      }
      timeRemaining = 20 * 60;
      updateTimerDisplay();
    }

    startTimerBtn?.addEventListener("click", handleStartTimer);
    pauseTimerBtn?.addEventListener("click", handlePauseTimer);
    resetTimerBtn?.addEventListener("click", handleResetTimer);

    updateTimerDisplay();

    return () => {
      passageEl?.removeEventListener("mouseup", handleMouseUp);
      questionsEl?.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      nightToggle?.removeEventListener("click", handleNightToggle);
      submitBtn?.removeEventListener("click", handleSubmit);
      closeFeedbackBtn?.removeEventListener("click", handleCloseFeedback);
      resetBtn?.removeEventListener("click", handleReset);
      document.removeEventListener("change", handleChange);
      startTimerBtn?.removeEventListener("click", handleStartTimer);
      pauseTimerBtn?.removeEventListener("click", handlePauseTimer);
      resetTimerBtn?.removeEventListener("click", handleResetTimer);
      if (timerInterval !== null) {
        window.clearInterval(timerInterval);
      }
    };
  }, []);

  return (
    <>
      <header>
        <div className="logo-area">
          <a
            className="social-link telegram"
            href="https://t.me/IELTSwithJurabek"
            target="_blank"
            title="Join on Telegram"
            rel="noopener noreferrer"
          >
            <i className="fab fa-telegram-plane" />
            <span>IELTSwithJurabek</span>
          </a>
        </div>

        <div className="header-controls">
          <div className="timer-container">
            <i className="fas fa-clock" />
            <span id="timer">20:00</span>
            <div className="timer-controls">
              <button id="start-timer" title="Start">
                <i className="fas fa-play" />
              </button>
              <button id="pause-timer" title="Pause">
                <i className="fas fa-pause" />
              </button>
              <button id="reset-timer" title="Reset">
                <i className="fas fa-redo" />
              </button>
            </div>
          </div>
          <button
            className="mode-toggle"
            id="night-mode-toggle"
            title="Toggle Night Mode"
          >
            <i className="fas fa-moon" />
          </button>
        </div>
      </header>
      <main>
        <div className="passage-container" id="passage-container">
          <div className="passage-content">
            <div className="passage-title">
              Reading Passage 3: The Rise of Multicultural London English
            </div>
            <div className="passage-text" id="passage-text">
              <p>
                <strong>1</strong> Immigrants from the Caribbean first arrived in
                Britain during the wave of immigration which took place in the
                1950s. While immigrants from the Indian subcontinent made their
                homes throughout the UK, the African-Caribbean communities mainly
                settled in parts of London and several other major cities. Their
                vibrant Caribbean culture, however, has had a significant impact
                on the whole of British life, particularly on youth culture.
                Their influence on the music young people listen to is widely
                accepted, but what is best known is the impact they have had on
                the very way young British people now speak. Slang from Jamaican
                patois (an English-based creole language spoken by Jamaicans and
                the Jamaican diaspora), as well as from other African-Caribbean
                communities, forms the backbone of what has become known as
                Multicultural London English (MLE).
              </p>

              <p>
                <strong>2</strong> Ask any parent or secondary school teacher in
                London and they might reluctantly be able to come up with a few
                MLE expressions. Particularly of interest for linguists is the
                use of "man" as a pronoun, because it is relatively rare for new
                pronouns to emerge in a language and, when they do, it takes many
                years for them to become established unlike the way "man" has.
                In the example "I don't care what my girl looks like it's her
                personality man's looking at," the speaker explains that
                personality is more important than appearance when it comes to
                choosing a girlfriend. Here the pronoun "man" takes on the same
                kind of grammatical function as the pronoun "I", but gives
                greater communicative force to the expression of a personal
                opinion.
              </p>

              <p>
                <strong>3</strong> Some linguists who have been tracking the
                growth of MLE argue that it may be better to refer to it as Urban
                British English, as even people far away from London are often
                able to understand some of its terms, such as "peng" (meaning
                attractive) and "creps" (trainers). The term MLE describes a
                "social dialect," a colloquial spoken style of UK English used
                initially among younger speakers and first identified and
                associated with London, says Antony Thorne, a linguistics
                researcher at King's College London. This way of speaking is
                characterised by a vocabulary reflecting a high proportion of
                terms coined by African-Caribbeans, especially Jamaicans,
                together with very obvious elements of Cockney, the traditional
                local London dialect. Its structure and grammar may deviate from
                traditionally taught forms of standard English. However, not all
                of the slang in MLE is based on Jamaican patois; Thorne notes
                that there are South Asian, Turkish and Polish influences, to
                varying extents, on MLE's vocabulary and intonation.
              </p>

              <p>
                <strong>4</strong> In schools in some areas of inner London,
                pupils come from many different cultural backgrounds. In some
                schools, as many as 80 languages can be heard in the playground.
                From a very young age, friendship groups are typically
                multiethnic. MLE could also be described as a "multiethnolect,"
                reflecting the fact that it is a socially inclusive variety of
                English spoken by young people from all ethnic groups living in
                the multilingual inner city area, including the indigenous
                Cockney families.
              </p>

              <p>
                <strong>5</strong> MLE cannot therefore be attributed solely to
                the effects of large-scale immigration from former British
                colonies, as many linguists initially thought. Caribbean English
                entered mainstream British culture in the 1960s and 1970s through
                styles of music such as ska and reggae; by the 1980s, speech
                patterns that were predominantly associated with ethnic
                minorities began to gain prestige in playgrounds, streets and
                clubs in all parts of London. In plain English, MLE became cool.
                By the 1990s, Thorne noted that he had recorded white
                working-class school kids using Jamaican-influenced slang, or
                what the mainstream media dubbed, "Jafaican" (fake Jamaican).
                Vocabulary and intonation patterns associated with music trends,
                such as the UK grime scene and US hip-hop, augmented these
                developments.
              </p>

              <p>
                <strong>6</strong> Some commentators have alleged that the use of
                MLE will affect its users in more formal situations, such as in a
                job or college interview, and could hamper their opportunities of
                career advancement. Yet some of the young men who Dr Rob Drummond
                and his team of researchers spoke to in Manchester in a 2014
                study didn't necessarily agree. Much like the rest of society,
                they knew the difference between a job interview and hanging out
                with their friends, and demonstrated it to those researchers. You
                just have to watch a teenager get a phone call from their grandma
                to see how quickly young people can adapt to varying contexts.
              </p>

              <p>
                <strong>7</strong> It's becoming clear that MLE has the potential
                to change English forever, even outside of youth culture. Some
                people are unhappy about this but, of course, language isn't and
                shouldn't be a static monolith. There are similar trends taking
                place in all kinds of global urban environments, such as
                "Turken-Deutsch," Turkish-influenced slang used by teenagers in
                Berlin. Linguistic change is as natural as language itself; it's
                a fundamental part of how languages are actually formed
                throughout the world. Many English words are derived from other
                European tongues and English is the richer for that. MLE is a
                valuable continuation of this process. Just as all other
                languages evolve, so too must English change and mutate to remain
                both relevant and useful.
              </p>
            </div>
          </div>
        </div>

        <div className="questions-container" id="questions-container">
          <div className="section-title">Questions 30–34</div>
          <div className="instructions">
            Choose the correct letter, A, B, C or D.
            <br />
            Write the correct letter in boxes 30–34 on your answer sheet.
          </div>
          <div className="question-group">
            <div className="question" id="q30">
              <div className="question-title">
                <div className="question-number">30</div>
                <div className="question-text">
                  What are we told in the first paragraph about African-Caribbean
                  communities in the UK?
                </div>
              </div>
              <label>
                <input type="radio" name="q30" value="A" /> A Their influence
                is limited to the largest cities in the UK.
              </label>
              <br />
              <label>
                <input type="radio" name="q30" value="B" /> B There is a lack
                of awareness about their impact on language.
              </label>
              <br />
              <label>
                <input type="radio" name="q30" value="C" /> C They arrived in
                Britain in greater numbers than other immigrant groups.
              </label>
              <br />
              <label>
                <input type="radio" name="q30" value="D" /> D They have
                developed a special culture based on British and Caribbean
                influences.
              </label>
              <br />
            </div>

            <div className="question" id="q31">
              <div className="question-title">
                <div className="question-number">31</div>
                <div className="question-text">
                  Linguists find the use of man as a pronoun interesting
                  because
                </div>
              </div>
              <label>
                <input type="radio" name="q31" value="A" /> A it is an
                unusually creative use of language.
              </label>
              <br />
              <label>
                <input type="radio" name="q31" value="B" /> B it has no
                recognisable origins.
              </label>
              <br />
              <label>
                <input type="radio" name="q31" value="C" /> C it has spread
                remarkably quickly.
              </label>
              <br />
              <label>
                <input type="radio" name="q31" value="D" /> D it is widely
                understood.
              </label>
              <br />
            </div>

            <div className="question" id="q32">
              <div className="question-title">
                <div className="question-number">32</div>
                <div className="question-text">
                  What point is the writer making about MLE in the fourth
                  paragraph?
                </div>
              </div>
              <label>
                <input type="radio" name="q32" value="A" /> A It is beginning
                to replace the many native languages of the capitals immigrant
                communities.
              </label>
              <br />
              <label>
                <input type="radio" name="q32" value="B" /> B Its vocabulary
                reflects the wide range of ethnicities in the UKs cities.
              </label>
              <br />
              <label>
                <input type="radio" name="q32" value="C" /> C It gives London
                schoolchildren a sense of their individual cultural identities.
              </label>
              <br />
              <label>
                <input type="radio" name="q32" value="D" /> D It has a
                unifying function within a diverse society.
              </label>
              <br />
            </div>

            <div className="question" id="q33">
              <div className="question-title">
                <div className="question-number">33</div>
                <div className="question-text">
                  What is the writers main point about music in the fifth
                  paragraph?
                </div>
              </div>
              <label>
                <input type="radio" name="q33" value="A" /> A Certain musical
                genres introduced Caribbean English to the wider UK population.
              </label>
              <br />
              <label>
                <input type="radio" name="q33" value="B" /> B American
                hip-hop was also influenced by Caribbean English.
              </label>
              <br />
              <label>
                <input type="radio" name="q33" value="C" /> C MLE is starting
                to inspire new generations of musicians.
              </label>
              <br />
              <label>
                <input type="radio" name="q33" value="D" /> D Reggae and ska
                have had the greatest impact on MLE.
              </label>
              <br />
            </div>

            <div className="question" id="q34">
              <div className="question-title">
                <div className="question-number">34</div>
                <div className="question-text">
                  The writer uses the example of a teenager speaking to a
                  grandparent to show that
                </div>
              </div>
              <label>
                <input type="radio" name="q34" value="A" /> A concerns about
                the inappropriate use of MLE are unnecessary.
              </label>
              <br />
              <label>
                <input type="radio" name="q34" value="B" /> B older
                generations of British people are becoming used to MLE.
              </label>
              <br />
              <label>
                <input type="radio" name="q34" value="C" /> C MLE has had a
                positive impact on the way young people communicate.
              </label>
              <br />
            </div>
          </div>

          <div className="section-title">Questions 35340</div>
          <div className="instructions">
            Write the correct letter, A3K, in boxes 35340 on your answer
            sheet.
          </div>
          <p style={{ textAlign: "center", fontWeight: "bold" }}>
            The growth of MLE
          </p>
          <div className="question-group">
            <div className="question" id="q35">
              <div className="question-title">
                <div className="question-number">35</div>
                <div className="question-text">
                  Some linguists claim that it would be ...... to refer to MLE as
                  Urban British English.
                </div>
              </div>
              <select id="q35" name="q35" className="question-input">
                <option value="">-- Select --</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="G">G</option>
                <option value="H">H</option>
                <option value="I">I</option>
                <option value="J">J</option>
                <option value="K">K</option>
              </select>
            </div>

            <div className="question" id="q36">
              <div className="question-title">
                <div className="question-number">36</div>
                <div className="question-text">
                  This is because many of its basic words are ...... to young
                  people around the rest of the UK.
                </div>
              </div>
              <select id="q36" name="q36" className="question-input">
                <option value="">-- Select --</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="G">G</option>
                <option value="H">H</option>
                <option value="I">I</option>
                <option value="J">J</option>
                <option value="K">K</option>
              </select>
            </div>

            <div className="question" id="q37">
              <div className="question-title">
                <div className="question-number">37</div>
                <div className="question-text">
                  MLE can be defined as a social dialect used by young people
                  for ...... communication with each other.
                </div>
              </div>
              <select id="q37" name="q37" className="question-input">
                <option value="">-- Select --</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="G">G</option>
                <option value="H">H</option>
                <option value="I">I</option>
                <option value="J">J</option>
                <option value="K">K</option>
              </select>
            </div>

            <div className="question" id="q38">
              <div className="question-title">
                <div className="question-number">38</div>
                <div className="question-text">
                  African-Caribbean dialects are a major influence on MLE, but
                  it is also ...... to detect the influence of Cockney.
                </div>
              </div>
              <select id="q38" name="q38" className="question-input">
                <option value="">-- Select --</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="G">G</option>
                <option value="H">H</option>
                <option value="I">I</option>
                <option value="J">J</option>
                <option value="K">K</option>
              </select>
            </div>

            <div className="question" id="q39">
              <div className="question-title">
                <div className="question-number">39</div>
                <div className="question-text">
                  There are also several other influences, but some of these are
                  less ...... .
                </div>
              </div>
              <select id="q39" name="q39" className="question-input">
                <option value="">-- Select --</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="G">G</option>
                <option value="H">H</option>
                <option value="I">I</option>
                <option value="J">J</option>
                <option value="K">K</option>
              </select>
            </div>

            <div className="question" id="q40">
              <div className="question-title">
                <div className="question-number">40</div>
                <div className="question-text">
                  Many of MLEs grammatical forms would be considered ...... by
                  users of standard English.
                </div>
              </div>
              <select id="q40" name="q40" className="question-input">
                <option value="">-- Select --</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="G">G</option>
                <option value="H">H</option>
                <option value="I">I</option>
                <option value="J">J</option>
                <option value="K">K</option>
              </select>
            </div>
          </div>

          <div className="summary-options">
            <span>A different</span>
            <span>B impossible</span>
            <span>C informal</span>
            <span>D incomprehensible</span>
            <span>E familiar</span>
            <span>F incorrect</span>
            <span>G significant</span>
            <span>H easy</span>
            <span>I appropriate</span>
            <span>J amusing</span>
            <span>K attractive</span>
          </div>

          <div className="section-title">Questions 41346</div>
          <div className="instructions">
            Do the following statements agree with the views of the writer in
            Reading Passage 3?
          </div>
          <div className="instructions">
            In boxes 41346 on your answer sheet, write:
            <br />
            YES - if the statement agrees with the views of the writer
            <br />
            NO - if the statement contradicts the views of the writer
            <br />
            NOT GIVEN - if it is impossible to say what the writer thinks about
            this
          </div>

          <div className="question-group">
            <div className="question" id="q41">
              <div className="question-title">
                <div className="question-number">41</div>
                <div className="question-text">
                  The effect of MLE on the ways people speak is likely to be
                  short-lived.
                </div>
              </div>
              <label>
                <input type="radio" name="q41" value="YES" /> YES
              </label>
              <br />
              <label>
                <input type="radio" name="q41" value="NO" /> NO
              </label>
              <br />
              <label>
                <input type="radio" name="q41" value="NOT GIVEN" /> NOT GIVEN
              </label>
              <br />
            </div>

            <div className="question" id="q42">
              <div className="question-title">
                <div className="question-number">42</div>
                <div className="question-text">
                  It is mainly the older generation who are worried about the
                  effects of MLE on youth culture.
                </div>
              </div>
              <label>
                <input type="radio" name="q42" value="YES" /> YES
              </label>
              <br />
              <label>
                <input type="radio" name="q42" value="NO" /> NO
              </label>
              <br />
              <label>
                <input type="radio" name="q42" value="NOT GIVEN" /> NOT GIVEN
              </label>
              <br />
            </div>

            <div className="question" id="q43">
              <div className="question-title">
                <div className="question-number">43</div>
                <div className="question-text">
                  MLE is unique in the way it has influenced the speech of urban
                  teenagers.
                </div>
              </div>
              <label>
                <input type="radio" name="q43" value="YES" /> YES
              </label>
              <br />
              <label>
                <input type="radio" name="q43" value="NO" /> NO
              </label>
              <br />
              <label>
                <input type="radio" name="q43" value="NOT GIVEN" /> NOT GIVEN
              </label>
              <br />
            </div>

            <div className="question" id="q44">
              <div className="question-title">
                <div className="question-number">44</div>
                <div className="question-text">
                  English has undergone greater linguistic change than other
                  world languages.
                </div>
              </div>
              <label>
                <input type="radio" name="q44" value="YES" /> YES
              </label>
              <br />
              <label>
                <input type="radio" name="q44" value="NO" /> NO
              </label>
              <br />
              <label>
                <input type="radio" name="q44" value="NOT GIVEN" /> NOT GIVEN
              </label>
              <br />
            </div>

            <div className="question" id="q45">
              <div className="question-title">
                <div className="question-number">45</div>
                <div className="question-text">
                  English vocabulary has benefitted from the influences of other
                  languages.
                </div>
              </div>
              <label>
                <input type="radio" name="q45" value="YES" /> YES
              </label>
              <br />
              <label>
                <input type="radio" name="q45" value="NO" /> NO
              </label>
              <br />
              <label>
                <input type="radio" name="q45" value="NOT GIVEN" /> NOT GIVEN
              </label>
              <br />
            </div>

            <div className="question" id="q46">
              <div className="question-title">
                <div className="question-number">46</div>
                <div className="question-text">
                  MLE is a welcome development of the English language.
                </div>
              </div>
              <label>
                <input type="radio" name="q46" value="YES" /> YES
              </label>
              <br />
              <label>
                <input type="radio" name="q46" value="NO" /> NO
              </label>
              <br />
              <label>
                <input type="radio" name="q46" value="NOT GIVEN" /> NOT GIVEN
              </label>
              <br />
            </div>
          </div>
        </div>
      </main>
      <footer>
        <div className="progress-container" id="progress-container" />
        <div className="action-buttons">
          <button className="btn-secondary" id="reset-btn">
            Reset Answers
          </button>
          <button className="btn-primary" id="submit-btn">
            Submit Answers
          </button>
        </div>
      </footer>
      <div className="feedback-overlay" id="feedback-overlay">
        <div className="feedback-container" id="feedback-container">
          <div className="feedback-header">
            <div className="feedback-title">
              <i className="fas fa-chart-bar" /> Your Results
              <span className="score-display" id="score-display">
                0/17
              </span>
            </div>
            <button id="close-feedback" title="Close">
              <i className="fas fa-times" />
            </button>
          </div>
          <div className="feedback-body" id="feedback-body" />
        </div>
      </div>

      <style jsx global>{`
        :root {
          --bg-color: #ffffff;
          --text-color: #333333;
          --passage-bg: #f8f9fa;
          --questions-bg: #ffffff;
          --border-color: #5770ff;
          --highlight-color: rgb(255, 208, 0);
          --header-bg: #f8f8f8;
          --header-text: #333333;
          --telegram-blue: #0088cc;
          --instagram-pink: #e4405f;
          --youtube-red: #ff0000;
          --button-bg: #28a745;
          --button-hover: #218838;
          --correct-color: #28a745;
          --incorrect-color: #dc3545;
          --progress-complete: #28a745;
          --progress-incomplete: #bdbdbd;
          --timer-bg: #0088cc;
          --timer-text: #ffffff;
          --footer-bg: #f5f5f5;
        }

        .night-mode {
          --bg-color: #121212;
          --text-color: #e0e0e0;
          --passage-bg: #1e1e1e;
          --questions-bg: #1e1e1e;
          --border-color: #424242;
          --highlight-color: #0084ff;
          --header-bg: #1a1a1a;
          --header-text: #ffffff;
          --telegram-blue: #005f99;
          --instagram-pink: #b2334b;
          --youtube-red: #b20000;
          --button-bg: #990000;
          --button-hover: #7a0000;
          --correct-color: #218838;
          --incorrect-color: #c82333;
          --progress-complete: #218838;
          --progress-incomplete: #616161;
          --timer-bg: #0088cc;
          --timer-text: #ffcdd2;
          --footer-bg: #121212;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          transition: background-color 0.3s, color 0.3s;
        }

        body {
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          background-color: var(--bg-color);
          color: var(--text-color);
          line-height: 1.6;
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        header {
          background-color: var(--header-bg);
          color: var(--header-text);
          padding: 12px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          z-index: 100;
        }

        .logo-area {
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .social-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: white;
          padding: 8px 15px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: background-color 0.3s ease, transform 0.2s ease;
        }

        .social-link:hover {
          transform: translateY(-1px);
        }

        .social-link i {
          font-size: 1.2em;
        }

        .social-link.telegram {
          background-color: var(--telegram-blue);
        }

        .social-link.telegram:hover {
          background-color: #007bb5;
        }

        .social-link.instagram {
          background-color: var(--instagram-pink);
        }

        .social-link.instagram:hover {
          background-color: #d62976;
        }

        .social-link.youtube {
          background-color: var(--youtube-red);
        }

        .social-link.youtube:hover {
          background-color: #cc0000;
        }

        .header-controls {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .timer-container {
          background-color: var(--timer-bg);
          color: var(--timer-text);
          padding: 8px 15px;
          border-radius: 50px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .timer-controls {
          display: flex;
          gap: 8px;
        }

        .timer-controls button {
          background: none;
          border: none;
          color: var(--timer-text);
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .timer-controls button:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }

        .night-mode .timer-controls button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .mode-toggle {
          background: none;
          border: none;
          color: var(--header-text);
          cursor: pointer;
          font-size: 20px;
          padding: 6px;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mode-toggle:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }

        .night-mode .mode-toggle:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        main {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .passage-container,
        .questions-container {
          height: 100%;
          overflow-y: auto;
          padding: 20px;
        }

        .passage-container {
          width: 50%;
          background-color: var(--passage-bg);
          border-right: 1px solid var(--border-color);
          position: relative;
        }

        .questions-container {
          width: 50%;
          background-color: var(--questions-bg);
        }

        .passage-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .passage-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 20px;
          color: var(--text-color);
          padding-bottom: 10px;
          border-bottom: 2px solid var(--border-color);
        }

        .passage-text {
          font-size: 17px;
        }

        .question-text {
          font-size: 17px;
          line-height: 1.8;
        }

        .passage-text p {
          margin-bottom: 20px;
          text-align: justify;
        }

        .highlight {
          background-color: var(--highlight-color);
          cursor: pointer;
        }

        .highlight-tooltip {
          position: absolute;
          background-color: #333;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 14px;
          z-index: 1000;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          margin: 25px 0 15px;
          color: var(--text-color);
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-color);
        }

        .question-group {
          margin-bottom: 30px;
        }

        .question {
          margin-bottom: 25px;
          padding: 15px;
          border-radius: 8px;
          background-color: var(--passage-bg);
          border-left: 4px solid var(--border-color);
        }

        .question-title {
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: baseline;
        }

        .question-number {
          display: inline-block;
          width: 28px;
          height: 28px;
          background-color: var(--progress-incomplete);
          color: white;
          border-radius: 50%;
          text-align: center;
          line-height: 28px;
          margin-right: 10px;
          font-size: 14px;
          flex-shrink: 0;
        }

        .question.answered .question-number {
          background-color: var(--progress-complete);
        }

        .options {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 8px;
        }

        .option {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .option input {
          margin-right: 8px;
        }

        .question-input {
          width: 40px;
          text-align: center;
          text-transform: uppercase;
          font-weight: bold;
        }

        footer {
          background-color: var(--footer-bg);
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border-color);
          box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
        }

        .progress-container {
          display: flex;
          gap: 8px;
        }

        .progress-item {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--progress-incomplete);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .progress-item:hover {
          transform: scale(1.1);
        }

        .progress-item.completed {
          background-color: var(--progress-complete);
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.3s, border-color 0.3s, color 0.3s;
        }

        .btn-primary {
          background-color: var(--button-bg);
          color: white;
        }

        .btn-primary:hover {
          background-color: var(--button-hover);
        }

        .btn-secondary {
          background-color: transparent;
          border: 1px solid var(--button-bg);
          color: var(--button-bg);
        }

        .btn-secondary:hover {
          background-color: rgba(204, 0, 0, 0.1);
        }

        .night-mode .btn-secondary:hover {
          background-color: rgba(153, 0, 0, 0.2);
        }

        .feedback-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          z-index: 1000;
          display: none;
          justify-content: center;
          align-items: center;
        }

        .feedback-container {
          background-color: var(--passage-bg);
          width: 90%;
          max-width: 900px;
          height: 90%;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
        }

        .feedback-header {
          padding: 20px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .feedback-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-color);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        #close-feedback {
          font-size: 24px;
          background: none;
          border: none;
          color: var(--text-color);
          cursor: pointer;
        }

        .score-display {
          font-size: 24px;
          font-weight: 700;
          margin-left: 10px;
        }

        .feedback-body {
          padding: 20px;
          overflow-y: auto;
        }

        .feedback-item {
          margin-bottom: 25px;
          padding: 15px;
          border-radius: 8px;
          background-color: var(--questions-bg);
        }

        .feedback-question {
          font-weight: 600;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
        }

        .feedback-answer {
          margin-bottom: 10px;
          padding: 8px 12px;
          border-radius: 4px;
          background-color: rgba(0, 0, 0, 0.05);
        }

        .correct {
          color: var(--correct-color);
        }

        .incorrect {
          color: var(--incorrect-color);
        }

        .feedback-explanation {
          margin-top: 10px;
          padding: 10px;
          border-left: 3px solid var(--button-bg);
          background-color: rgba(0, 0, 0, 0.03);
        }

        .feedback-passage {
          margin-top: 8px;
          font-style: italic;
          color: #757575;
        }

        @media (max-width: 900px) {
          main {
            flex-direction: column;
          }

          .passage-container,
          .questions-container {
            width: 100%;
            height: 50%;
          }

          .passage-container {
            border-right: none;
            border-bottom: 1px solid var(--border-color);
          }

          .progress-container {
            flex-wrap: wrap;
            max-width: 60%;
          }
        }

        @media (max-width: 768px) {
          .logo-area {
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px;
          }

          .social-link {
            padding: 6px 10px;
            font-size: 13px;
          }

          .social-link i {
            font-size: 1.1em;
          }

          .social-link span {
            display: inline;
          }
        }

        @media (max-width: 600px) {
          header {
            flex-direction: column;
            gap: 10px;
            padding: 10px;
          }

          .header-controls {
            width: 100%;
            justify-content: space-around;
          }

          .progress-container {
            max-width: 50%;
          }

          .progress-item {
            width: 26px;
            height: 26px;
            font-size: 12px;
          }

          footer {
            flex-direction: column;
            gap: 15px;
          }

          .action-buttons {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}

