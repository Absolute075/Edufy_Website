 'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import Image from 'next/image';
import heroPhoto from '../public/photos/photo_2025-11-26_22-49-48.jpg';
import aboutPhoto from '../public/photos/de879823cdded25720a788ccc70ab3bc.jpg';
import founderPhoto1 from '../public/photos/photo_2025-10-30_18-03-35.jpg';
import founderPhoto2 from '../public/photos/photo_2025-10-20_20-22-58.jpg';

export default function HomePage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | '6months' | 'yearly'>('monthly');
  const [openBlogPost, setOpenBlogPost] = useState<string | null>(null);
  const [blogExpandRect, setBlogExpandRect] = useState<
    | {
        top: number;
        left: number;
        width: number;
        height: number;
      }
    | null
  >(null);
  const [blogExpanded, setBlogExpanded] = useState(false);
  const blogModalRef = useRef<HTMLDivElement | null>(null);

  const plusPrice =
    billingPeriod === '6months'
      ? '$19.99'
      : billingPeriod === 'yearly'
      ? '$29.99'
      : '$3.99';

  const premiumPrice =
    billingPeriod === '6months'
      ? '$39.99'
      : billingPeriod === 'yearly'
      ? '$59.99'
      : '$7.99';

  const exams = ['ACT', 'SAT', 'IELTS', 'TOEFL', 'AP'];
  const [activeExamIndex, setActiveExamIndex] = useState(2);
  const activeExam = exams[activeExamIndex];

  const handleExamWheel = (event: any) => {
    event.preventDefault();
    setActiveExamIndex((prev: number) => {
      if (event.deltaY > 0) {
        return Math.min(prev + 1, exams.length - 1);
      }
      if (event.deltaY < 0) {
        return Math.max(prev - 1, 0);
      }
      return prev;
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as any;

    // Init AOS animations
    try {
      if (w.AOS && !w.__aosInitialized) {
        w.AOS.init({
          duration: 800,
          easing: 'ease-in-out',
          once: true,
        });
        w.__aosInitialized = true;
      }
    } catch {}

    // Fun facts rotation
    const funFacts = [
      'Students who study with personalized learning plans improve their test scores by 30% on average.',
      'Regular 20-minute practice sessions are more effective than marathon study sessions.',
      'Edufy students report 2.5x higher confidence levels before exams.',
      'The average IELTS score improvement for Edufy students is 1.5 bands in 3 months.',
      '85% of Edufy students achieve their target scores on standardized tests.',
    ];
    let currentFact = 0;
    const funFactEl = document.getElementById('fun-fact');
    const factInterval = funFactEl
      ? window.setInterval(() => {
          currentFact = (currentFact + 1) % funFacts.length;
          if (!funFactEl) return;
          funFactEl.style.opacity = '0';
          setTimeout(() => {
            if (!funFactEl) return;
            funFactEl.textContent = funFacts[currentFact];
            funFactEl.style.opacity = '1';
          }, 500);
        }, 5000)
      : null;

    // Typewriter effect for dynamicText
    const phrases = [
      'Learn smarter.',
      'Learn better.',
      'Achieve more.',
      'Master new skills.',
      'Boost your knowledge.',
      'Study efficiently.',
      'Reach your potential.',
      'Excel faster.',
      'Grow every day.',
      'Succeed confidently.',
      'Unlock your mind.',
      'Improve consistently.',
      'Score higher.',
      'Transform your learning.',
    ];
    let i = 0;
    let j = 0;
    let isDeleting = false;
    const speed = 150;
    let cancelled = false;
    const dynamicEl = document.getElementById('dynamicText');

    function type() {
      if (!dynamicEl || cancelled) return;
      const fullText = phrases[i];

      let currentPhrase = '';
      if (isDeleting) {
        currentPhrase = fullText.substring(0, j--);
      } else {
        currentPhrase = fullText.substring(0, j++);
      }

      dynamicEl.textContent = currentPhrase;

      if (!isDeleting && j === fullText.length + 1) {
        setTimeout(() => {
          isDeleting = true;
          type();
        }, 1000);
        return;
      }
      if (isDeleting && j === 0) {
        isDeleting = false;
        i = (i + 1) % phrases.length;
      }

      setTimeout(type, isDeleting ? speed / 2 : speed);
    }

    if (dynamicEl) {
      type();
    }

    // Feather icons
    try {
      w.feather?.replace?.();
    } catch {}

    return () => {
      cancelled = true;
      if (factInterval) window.clearInterval(factInterval);
    };
  }, []);

  useEffect(() => {
    if (!openBlogPost || !blogExpandRect) return;
    if (typeof window === 'undefined') return;
    const id = window.requestAnimationFrame(() => {
      setBlogExpanded(true);
    });
    return () => {
      window.cancelAnimationFrame(id);
    };
  }, [openBlogPost, blogExpandRect]);

  useEffect(() => {
    if (!openBlogPost) return;
    if (!blogModalRef.current) return;
    blogModalRef.current.scrollTop = 0;
  }, [openBlogPost]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    if (openBlogPost) {
      body.style.overflow = 'hidden';
    }
    return () => {
      body.style.overflow = prevOverflow;
    };
  }, [openBlogPost]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as any;
    const items = Array.from(document.querySelectorAll<HTMLElement>('.timeline-item'));

    if (!('IntersectionObserver' in w) || items.length === 0) {
      // Fallback: если нет IntersectionObserver, просто сразу показываем элементы
      items.forEach((el) => el.classList.add('timeline-item-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.classList.add('timeline-item-visible');
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.4 }
    );

    items.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as any;
    const title = document.querySelector<HTMLElement>('.founders-title');

    if (!title) return;

    if (!('IntersectionObserver' in w)) {
      title.classList.add('founders-title-visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            title.classList.add('founders-title-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(title);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as any;
    const stats = Array.from(document.querySelectorAll<HTMLElement>('.stat-number'));

    if (stats.length === 0) return;

    const animateValue = (el: HTMLElement) => {
      const targetStr = el.dataset.target;
      const target = targetStr ? parseInt(targetStr, 10) : 0;
      if (!target || Number.isNaN(target)) return;

      const duration = 1500;
      const startTime = performance.now();

      const step = (currentTime: number) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const value = Math.floor(progress * target);
        el.textContent = value.toLocaleString('en-US');
        if (progress < 1) {
          w.requestAnimationFrame(step);
        }
      };

      w.requestAnimationFrame(step);
    };

    if (!('IntersectionObserver' in w)) {
      stats.forEach((el) => {
        if (el.dataset.animated === 'true') return;
        el.dataset.animated = 'true';
        animateValue(el);
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            if (target.dataset.animated === 'true') {
              observer.unobserve(target);
              return;
            }
            target.dataset.animated = 'true';
            animateValue(target);
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.4 }
    );

    stats.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as any;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('.materials-header, .materials-list')
    );

    if (elements.length === 0) return;

    if (!('IntersectionObserver' in w)) {
      elements.forEach((el) => {
        if (el.classList.contains('materials-header')) {
          el.classList.add('materials-header-visible');
        }
        if (el.classList.contains('materials-list')) {
          el.classList.add('materials-list-visible');
        }
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            if (target.classList.contains('materials-header')) {
              target.classList.add('materials-header-visible');
            }
            if (target.classList.contains('materials-list')) {
              target.classList.add('materials-list-visible');
            }
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.3 }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as any;
    const blocks = Array.from(document.querySelectorAll<HTMLElement>('.exam-overview'));

    if (blocks.length === 0) return;

    if (!('IntersectionObserver' in w)) {
      blocks.forEach((el) => el.classList.add('exam-overview-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.classList.add('exam-overview-visible');
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.3 }
    );

    blocks.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as any;
    const words = Array.from(document.querySelectorAll<HTMLElement>('.materials-word'));

    if (words.length === 0) return;

    if (!('IntersectionObserver' in w)) {
      // Fallback: если нет IntersectionObserver, просто сразу показываем слова
      words.forEach((el) => el.classList.add('materials-word-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.classList.add('materials-word-visible');
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.4 }
    );

    words.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleOpenBlogPost = (postId: string, elementId: string) => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById(elementId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setBlogExpandRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setBlogExpandRect(null);
    }
    setBlogExpanded(false);
    setOpenBlogPost(postId);
  };

  const handleOpenSatUnderstand = () => {
    handleOpenBlogPost('sat-understand', 'blog-card-sat');
  };

  const handleOpenShadowYourself = () => {
    handleOpenBlogPost('shadow-yourself', 'blog-card-shadow-yourself');
  };

  const handleOpenShortFrequent = () => {
    handleOpenBlogPost('short-frequent', 'blog-card-short-frequent');
  };

  const handleShareBlogPost = (elementId: string) => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}${window.location.pathname}#${elementId}`;

    if (navigator.share) {
      navigator
        .share({ url })
        .catch(() => {
          // ignore user cancelling share
        });
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).catch(() => {
        // ignore clipboard errors silently
      });
    }
  };

  return (
    <>
      <Script src="https://unpkg.com/aos@2.3.1/dist/aos.js" strategy="afterInteractive" />
      <Script
        src="https://unpkg.com/feather-icons"
        strategy="afterInteractive"
        onLoad={() => {
          try {
            (window as any).feather?.replace?.();
          } catch {}
        }}
      />

      <div className="relative">

        {/* Hero Section */}
        <section
          id="home"
          className="relative min-h-screen pt-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center"
        >
          <div className="fixed inset-x-0 top-0 z-30">
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-6 bg-black/40 backdrop-blur-sm">
              <div className="flex items-center gap-8">
                <div className="font-ptserif tracking-[0.35em] text-lg sm:text-xl md:text-2xl text-white/90">
                  EDUFY
                </div>
                <nav className="hidden sm:flex items-center gap-6 md:gap-8 font-bebas tracking-[0.3em] text-xs sm:text-sm md:text-base uppercase text-white/80">
                  <a href="#about" className="hover:text-white transition-colors">
                    About
                  </a>
                  <a href="#courses" className="hover:text-white transition-colors">
                    Courses
                  </a>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                  <a href="/blog" className="hover:text-white transition-colors">
                    Blog
                  </a>
                  <a href="/contact" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </nav>
              </div>
              <div className="hidden sm:flex items-center gap-3 font-bebas tracking-[0.25em] text-xs sm:text-sm uppercase">
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = 'https://access.edufyuzbekistan.com/login';
                  }}
                  className="text-white/80 hover:text-white px-3 py-1.5 rounded-full border border-white/30 bg-black/30 backdrop-blur-sm transition-colors"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = 'https://access.edufyuzbekistan.com/login';
                  }}
                  className="text-black px-4 py-1.5 rounded-full bg-white hover:bg-gray-100 transition-colors shadow-sm shadow-white/30"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
          <div className="absolute inset-0">
            <Image
              src={heroPhoto}
              alt="Edufy students"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute inset-x-0 bottom-0 h-32 sm:h-40 md:h-48 bg-gradient-to-b from-transparent to-[#0a0a0a]" />
          </div>

          {/* Center hero title */}
          <div className="relative z-10 text-center translate-y-40">
            <div className="text-6xl md:text-8xl font-cormorant leading-tight text-white hero-fade-up">
              <div>Welcome</div>
              <div className="mt-2">
                to Edufy
              </div>
            </div>
          </div>

          {/* Right-side hero description */}
          <div className="absolute right-8 sm:right-16 md:right-24 bottom-16 sm:bottom-24 max-w-md text-right z-10 hero-fade-up-delayed">
            <h2 className="font-cormorant-main text-lg sm:text-xl md:text-2xl lg:text-3xl text-white leading-snug">
              Prepare for International Exams with Real Practice Tests
            </h2>
            <p className="mt-3 text-xs sm:text-sm md:text-sm text-gray-200">
              Edufy offers practice tests and materials for IELTS, SAT, TOEFL, and other international certificates. Learn at your own pace, practice in real exam format, and track your progress.
            </p>
          </div>
        </section>

        {/* AI Timeline Section */}
        <section id="ai-timeline" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs sm:text-sm tracking-[0.35em] uppercase text-gray-400 font-bebas mb-3">
              Timeline
            </p>
            <h2 className="text-3xl md:text-4xl font-space font-bold text-white">
              How AI guides your entire exam journey
            </h2>
            <p className="mt-3 text-gray-300 text-sm md:text-base max-w-2xl mx-auto">
              Instead of scattered tools, you get one connected system: training, materials, progress, and certificate —
              all linked together by AI.
            </p>
          </div>

          {/* Central vertical line with side branches */}
          <div className="relative max-w-4xl mx-auto pt-2">
            {/* Main vertical axis (stops well above arrow) */}
            <div className="pointer-events-none absolute left-1/2 top-0 bottom-32 -translate-x-1/2">
              <div className="w-px h-full bg-gray-600 shadow-[0_0_18px_rgba(255,255,255,0.20)]" />
            </div>

            <div className="space-y-10 md:space-y-14">
              {/* Step 1 – branch to the left from center line */}
              <div className="timeline-item timeline-item-1 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
                {/* Left side: line -> dot -> text */}
                <div className="flex justify-end pr-4 md:pr-8">
                  <div className="flex flex-row-reverse items-center gap-3">
                    {/* Line starting at vertical axis */}
                    <div className="h-px w-16 md:w-24 bg-gray-500 shadow-[0_0_14px_rgba(255,255,255,0.20)]" />
                    {/* Dot at end of line */}
                    <div className="h-3 w-3 rounded-full bg-gray-300 shadow-[0_0_10px_rgba(255,255,255,0.45)]" />
                    {/* Text after dot */}
                    <div className="text-right">
                      <div className="text-[11px] tracking-[0.25em] uppercase text-gray-300 font-bebas">
                        Step 1 · AI
                      </div>
                      <div className="text-sm md:text-base font-semibold text-white mt-1">AI training</div>
                      <p className="mt-1 text-xs md:text-sm text-gray-300 max-w-xs md:max-w-sm ml-auto">
                        The algorithm analyzes your answers and selects exercises for your level and target score.
                      </p>
                    </div>
                  </div>
                </div>
                {/* Center placeholder (axis is absolute) */}
                <div />
                {/* Right side empty */}
                <div />
              </div>

              {/* Step 2 – branch to the right from center line */}
              <div className="timeline-item timeline-item-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
                {/* Left side empty */}
                <div />
                <div />
                {/* Right side: line -> dot -> text */}
                <div className="flex justify-start pl-4 md:pl-8">
                  <div className="flex items-center gap-3">
                    {/* Line starting at vertical axis */}
                    <div className="h-px w-16 md:w-24 bg-gray-500 shadow-[0_0_14px_rgba(255,255,255,0.20)]" />
                    {/* Dot at end of line */}
                    <div className="h-3 w-3 rounded-full bg-gray-300 shadow-[0_0_10px_rgba(255,255,255,0.45)]" />
                    {/* Text after dot */}
                    <div>
                      <div className="text-[11px] tracking-[0.25em] uppercase text-gray-300 font-bebas">
                        Step 2 · Materials
                      </div>
                      <div className="text-sm md:text-base font-semibold text-white mt-1">Exam-style materials</div>
                      <p className="mt-1 text-xs md:text-sm text-gray-300 max-w-xs md:max-w-sm">
                        Access to real exam-style tasks for IELTS, SAT, TOEFL and other international tests.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 – branch to the left from center line */}
              <div className="timeline-item timeline-item-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
                {/* Left side: line -> dot -> text */}
                <div className="flex justify-end pr-4 md:pr-8">
                  <div className="flex flex-row-reverse items-center gap-3">
                    {/* Line starting at vertical axis */}
                    <div className="h-px w-16 md:w-24 bg-gray-500 shadow-[0_0_10px_rgba(255,255,255,0.10)]" />
                    {/* Dot at end of line */}
                    <div className="h-3 w-3 rounded-full bg-gray-300 shadow-[0_0_10px_rgba(255,255,255,0.45)]" />
                    {/* Text after dot */}
                    <div className="text-right">
                      <div className="text-[11px] tracking-[0.25em] uppercase text-gray-300 font-bebas">
                        Step 3 · Progress
                      </div>
                      <div className="text-sm md:text-base font-semibold text-white mt-1">Progress & analytics</div>
                      <p className="mt-1 text-xs md:text-sm text-gray-300 max-w-xs md:max-w-sm ml-auto">
                        Clear charts, completion percentages and recommendations for your next step.
                      </p>
                    </div>
                  </div>
                </div>
                {/* Center placeholder */}
                <div />
                {/* Right side empty */}
                <div />
              </div>
            </div>

            {/* Bottom arrow and Step 4 */}
            <div className="timeline-item timeline-item-4 mt-10 flex flex-col items-center">
              <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[12px] border-t-gray-400" />
              <div className="mt-4 text-center">
                <div className="text-[11px] tracking-[0.25em] uppercase text-gray-400 font-bebas">
                  Step 4 · Outcome
                </div>
                <div className="text-sm md:text-base font-semibold text-white mt-1">Certificate & target score</div>
                <p className="mt-1 text-xs md:text-sm text-gray-300 max-w-xs md:max-w-sm mx-auto">
                  You reach your target score and receive the certificate your whole journey was built for.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Materials & Courses Overview */}
        <section id="courses" className="py-20 px-4 sm:px-6 lg:px-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="materials-header text-center mb-16">
              <p className="text-xs sm:text-sm tracking-[0.35em] uppercase text-gray-400 font-bebas mb-3">
                Materials & Courses
              </p>
              <h2 className="text-3xl md:text-4xl font-space font-bold text-white">
                Materials & Courses overview
              </h2>
              <p className="mt-3 text-gray-300 text-sm md:text-base max-w-2xl mx-auto">
                The key exam directions you can prepare for with Edufy. Each line connects to a full path of
                materials, practice and AI feedback.
              </p>
            </div>

            <div className="mt-10 grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-16 items-center">
              <div key={activeExam} className="exam-overview text-left space-y-4">
                <p className="text-xs sm:text-sm tracking-[0.35em] uppercase text-gray-400 font-bebas">
                  Exam Overview
                </p>

                {activeExam === 'IELTS' ? (
                  <>
                    <h3 className="text-2xl md:text-3xl font-space font-bold text-white">IELTS</h3>
                    <p className="text-gray-300 text-sm md:text-base">
                      IELTS (International English Language Testing System) is a globally recognized exam that assesses
                      English language proficiency for non-native speakers. The test is widely used for academic study,
                      professional purposes, and immigration to English-speaking countries.
                    </p>
                    <div className="text-gray-300 text-sm md:text-base space-y-2">
                      <div className="font-semibold text-white">Benefits of preparing with Edufy:</div>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Access to real IELTS practice tests aligned with international standards.</li>
                        <li>Detailed progress analytics to track learning growth.</li>
                        <li>
                          Balanced development of all skills to successfully pass the exam and achieve a high score.
                        </li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl md:text-3xl font-space font-bold text-white">{activeExam}</h3>
                    <p className="text-gray-300 text-sm md:text-base">Coming Soon</p>
                  </>
                )}
              </div>

              <div className="w-full">
                <div
                  className="materials-list relative h-[70vh] overflow-hidden flex items-center justify-center"
                  onWheel={handleExamWheel}
                >
                  {exams.map((exam, index) => {
                    const offset = index - activeExamIndex;
                    const isActive = offset === 0;

                    return (
                      <button
                        key={exam}
                        type="button"
                        onClick={() => setActiveExamIndex(index)}
                        className={`materials-word absolute left-1/2 select-none text-6xl sm:text-7xl md:text-8xl font-space tracking-[0.4em] uppercase ${
                          isActive ? 'text-white font-extrabold' : 'text-white/30 font-bold'
                        }`}
                        style={{
                          transform: `translate(-50%, ${offset * 112}px) scale(${isActive ? 1.35 : 0.65})`,
                          opacity: isActive ? 1 : 0.4,
                          filter: isActive ? 'drop-shadow(0 0 22px rgba(255,255,255,0.55))' : 'none',
                        }}
                      >
                        {exam}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="relative py-28 bg-black overflow-hidden">
          {/* Smooth gradient into previous / next sections */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0a0a0a] to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />

          <div className="relative z-10 grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-stretch">
            <div className="relative h-[26rem] md:h-[36rem] lg:h-[44rem]" data-aos="fade-right">
              <div className="absolute inset-0 overflow-hidden">
                <Image
                  src={aboutPhoto}
                  alt="Edufy team"
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 50vw, 100vw"
                  priority={false}
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
              </div>
            </div>
            <div className="flex items-start pl-3 sm:pl-5 lg:pl-6 pr-4 sm:pr-6 lg:pr-10">
              <div data-aos="fade-left" className="max-w-xl">
                <p className="text-xs sm:text-sm tracking-[0.35em] uppercase text-gray-400 font-bebas mb-3">
                  About Us
                </p>
                <h2 className="text-3xl md:text-4xl font-space font-bold text-white mb-4">
                  Behind Edufy
                </h2>
                <p className="text-gray-300 text-sm md:text-base mb-3">
                  At Edufy, we are dedicated to helping students worldwide achieve their academic and professional goals
                  through high-quality exam preparation. Our mission is to provide access to real practice materials,
                  personalized learning paths, and insightful progress analytics, ensuring that every learner can study
                  efficiently and confidently.
                </p>
                <p className="text-gray-300 text-sm md:text-base mb-3">
                  We specialize in international exams such as IELTS, SAT, TOEFL, and many others. Our platform offers
                  a complete learning environment tailored to each student.
                </p>
                <p className="text-gray-300 text-sm md:text-base mb-3">
                  Authentic practice tests that replicate real exam conditions, personalized feedback and guidance to
                  strengthen weak areas, progress tracking and analytics to monitor growth over time, and practical
                  assignments and resources to develop real-world skills alongside exam readiness.
                </p>
                <p className="text-gray-300 text-sm md:text-base">
                  At Edufy, we believe that preparation is not just about passing exams—it’s about building knowledge,
                  confidence, and the skills for lifelong learning. Our team of educators and AI-driven tools work
                  together to create a seamless, engaging, and effective learning experience for every student.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-16 px-4 sm:px-6 lg:px-10">
            <p className="text-3xl sm:text-4xl md:text-5xl font-space font-extrabold uppercase tracking-[0.25em] text-white mb-6">
              Highlights
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs sm:text-sm tracking-[0.25em] uppercase text-gray-400 font-bebas mb-1">
                  Number of Learners
                </p>
                <div className="text-2xl sm:text-3xl font-space font-bold text-white">
                  <span className="stat-number" data-target="+70">0</span>+
                </div>
                <p className="mt-1 text-xs sm:text-sm text-gray-400">
                  Join, we are waiting for you!
                </p>
              </div>

              <div>
                <p className="text-xs sm:text-sm tracking-[0.25em] uppercase text-gray-400 font-bebas mb-1">
                  Practice Tests Taken
                </p>
                <div className="text-2xl sm:text-3xl font-space font-bold text-white">
                  <span className="stat-number" data-target="15">0</span>+
                </div>
                <p className="mt-1 text-xs sm:text-sm text-gray-400">
                  We hope that practise tests are fine :)
                </p>
              </div>

              <div>
                <p className="text-xs sm:text-sm tracking-[0.25em] uppercase text-gray-400 font-bebas mb-1">
                  Certificates Issued
                </p>
                <div className="text-2xl sm:text-3xl font-space font-bold text-white">
                  <span className="stat-number" data-target="0">0</span>+
                </div>
                <p className="mt-1 text-xs sm:text-sm text-gray-400">
                  We are waiting your certificate!
                </p>
              </div>

              <div>
                <p className="text-xs sm:text-sm tracking-[0.25em] uppercase text-gray-400 font-bebas mb-1">
                  Average Score Improvement
                </p>
                <div className="text-2xl sm:text-3xl font-space font-bold text-white">
                  <span className="stat-number" data-target="20">0</span>%
                </div>
                <p className="mt-1 text-xs sm:text-sm text-gray-400">
                  Students improve their scores by an average of 20%.
                </p>
              </div>

              <div>
                <p className="text-xs sm:text-sm tracking-[0.25em] uppercase text-gray-400 font-bebas mb-1">
                  Global Reach
                </p>
                <div className="text-2xl sm:text-3xl font-space font-bold text-white">
                  <span className="stat-number" data-target="6">0</span>+
                </div>
                <p className="mt-1 text-xs sm:text-sm text-gray-400">
                  Share this platform with your international friends ;)
                </p>
              </div>

              <div>
                <p className="text-xs sm:text-sm tracking-[0.25em] uppercase text-gray-400 font-bebas mb-1">
                  Hours Spent
                </p>
                <div className="flex items-baseline gap-2 text-2xl sm:text-3xl font-space font-bold text-white">
                  <span className="stat-number" data-target="5">0</span>+
                </div>
                <p className="mt-1 text-xs sm:text-sm text-gray-400">
                  Learners already spent focused hours on Edufy.
                </p>
              </div>
            </div>

            <div className="relative mt-24 flex flex-col items-center gap-8">
              <div className="flex flex-col items-center gap-6">
                <p className="founders-title pointer-events-none select-none text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-space font-extrabold uppercase tracking-[0.7em] text-white text-center">
                  Founders
                </p>
                <div className="relative z-10 flex gap-6 sm:gap-10 justify-center flex-wrap">
                  <div className="relative founder-photo-left">
                    <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-[26rem] md:h-[26rem] rounded-2xl overflow-hidden border border-white/40 bg-white/5 backdrop-blur-md shadow-[0_0_35px_rgba(255,255,255,0.2)]">
                      <Image src={founderPhoto1} alt="Founder 1" fill className="object-cover" />
                    </div>
                    {/* Левое фото: линия из нижнего левого угла по диагонали вниз-влево, стрелка в конце; весь текстовый блок под окончанием линии */}
                    <div
                      className="absolute right-full bottom-0"
                      style={{ transform: 'rotate(-18deg)', transformOrigin: '100% 100%' }}
                    >
                      <div className="flex items-center flex-row-reverse">
                        {/* Линия от угла фото наружу */}
                        <div className="h-px w-24 sm:w-32 md:w-40 lg:w-56 bg-gray-500 shadow-[0_0_14px_rgba(255,255,255,0.20)]" />
                        {/* Обёртка для стрелки и текста */}
                        <div className="relative">
                          {/* Стрелка в самом конце линии, смотрит к левому краю (от фото) */}
                          <div className="w-0 h-0 border-r-[7px] border-r-gray-400 border-y-[4px] border-y-transparent" />
                          {/* Весь текст под окончанием линии: начинается у стрелки и уходит наружу (влево) */}
                          <div
                            className="absolute right-0 top-full mt-0 max-w-[90vw] w-[22rem] sm:w-[24rem] md:w-[26rem] text-left origin-top z-20"
                            style={{ transform: 'translateY(-30px) rotate(18deg)' }}
                          >
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-white">
                              Asilbek — CEO &amp; Co-Founder
                            </p>
                            <p className="mt-1 px-3 sm:px-4 text-xs sm:text-sm md:text-base text-gray-300">
                              Asilbek is responsible for managing the finances of Edufy and guiding the project's initiatives. He focuses on planning, organizing resources, and finding small improvements that make the platform better for students. Asilbek also explores new ideas and ways to make learning more accessible, keeping the team aligned and the project moving forward step by step.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative founder-photo-right">
                    <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-[26rem] md:h-[26rem] rounded-2xl overflow-hidden border border-white/40 bg-white/5 backdrop-blur-md shadow-[0_0_35px_rgba(255,255,255,0.2)]">
                      <Image src={founderPhoto2} alt="Founder 2" fill className="object-cover" />
                    </div>
                    {/* Правое фото: линия из нижнего правого угла по диагонали вниз-вправо, стрелка в конце; весь текстовый блок под окончанием линии */}
                    <div
                      className="absolute left-full bottom-0"
                      style={{ transform: 'rotate(18deg)', transformOrigin: '0% 100%' }}
                    >
                      <div className="flex items-center">
                        {/* Линия от угла фото наружу */}
                        <div className="h-px w-24 sm:w-32 md:w-40 lg:w-56 bg-gray-500 shadow-[0_0_14px_rgba(255,255,255,0.20)]" />
                        {/* Обёртка для стрелки и текста */}
                        <div className="relative">
                          {/* Стрелка в самом конце линии, смотрит к правому краю (от фото) */}
                          <div className="w-0 h-0 border-l-[7px] border-l-gray-400 border-y-[4px] border-y-transparent" />
                          {/* Весь текст под окончанием линии: начинается у стрелки и уходит наружу (вправо) */}
                          <div
                            className="absolute left-0 top-full mt-0 max-w-[90vw] w-[22rem] sm:w-[24rem] md:w-[26rem] text-left origin-top z-20"
                            style={{ transform: 'translateY(-30px) rotate(-18deg)' }}
                          >
                            <p className="text-sm sm:text-base md:text-lg font-semibold text-white">
                              Behruz — CTO &amp; Co-Founder
                            </p>
                            <p className="mt-1 px-3 sm:px-4 text-xs sm:text-sm md:text-base text-gray-300">
                              Behruz takes care of all technical aspects of Edufy, from building and maintaining the platform to implementing new features. He also helps with day-to-day operations to ensure everything runs smoothly. Behruz works behind the scenes to keep the platform stable, efficient, and reliable, making sure that students can focus on learning without interruptions.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-md text-center relative z-10">
                <p className="text-sm sm:text-base md:text-lg font-space font-semibold uppercase tracking-[0.25em] text-white">
                  Meet the Founders
                </p>
                <p className="mt-2 text-base sm:text-lg md:text-xl text-gray-300">
                  Uzbek roots, uncommon minds.
                </p>
                <p className="mt-4 text-base sm:text-lg md:text-xl text-gray-400 leading-relaxed">
                  Edufy was created by a team of young innovators driven by a simple mission — to make high-quality exam
                  preparation accessible to every student. We believe in transparent learning, real practice materials,
                  and technology that empowers, not overwhelms.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section
          id="testimonials"
          className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <p className="text-xs sm:text-sm tracking-[0.35em] uppercase text-white font-bebas mb-3 drop-shadow-[0_0_14px_rgba(255,255,255,0.7)]">
              Testimonials
            </p>
            <h2 className="text-3xl md:text-4xl font-space font-bold text-white">
              Students' experience
            </h2>
            <p className="mt-3 text-gray-300 text-sm md:text-base max-w-2xl mx-auto">
              Real learners using Edufy to prepare for international exams. Their journeys, in their own
              words.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 backdrop-blur-md p-12 flex flex-col gap-7">
              <p className="text-sm md:text-base text-gray-100">
                “With Edufy I finally understood where I was losing points in Reading and Listening. After
                2 months of practice my IELTS score went from 6.0 to 7.5.”
              </p>
              <div className="mt-auto pt-2 border-t border-white/10 flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[11px] sm:text-xs text-yellow-400">
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                </div>
                <span className="text-sm font-semibold text-white">Jamshid</span>
                <span className="text-xs text-gray-400">IELTS student</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 backdrop-blur-lg p-12 flex flex-col gap-7">
              <p className="text-sm md:text-base text-gray-100">
                “The mock tests feel like the real exam. I could track every attempt and see how my weak
                points changed over time.”
              </p>
              <div className="mt-auto pt-2 border-t border-white/10 flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[11px] sm:text-xs text-yellow-400">
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                </div>
                <span className="text-sm font-semibold text-white">Malika</span>
                <span className="text-xs text-gray-400">SAT &amp; IELTS candidate</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 backdrop-blur-md p-8 flex flex-col gap-5">
              <p className="text-sm md:text-base text-gray-100">
                “As a teacher I recommend Edufy to my students: they get structured practice, analytics and
                realistic tasks instead of random materials from the internet.”
              </p>
              <div className="mt-auto pt-2 border-t border-white/10 flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[11px] sm:text-xs text-yellow-400">
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                </div>
                <span className="text-sm font-semibold text-white">Aziza</span>
                <span className="text-xs text-gray-400">English teacher</span>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              className="px-8 py-2.5 rounded-full border border-white/25 bg-black/60 text-sm md:text-base text-white tracking-[0.15em] uppercase font-space hover:bg-white hover:text-gray-900 transition-colors duration-300"
            >
              View more
            </button>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="relative mt-[10rem] py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="pointer-events-none absolute inset-x-0 top-0 sm:top-2 md:top-4 flex justify-center select-none">
            <span className="text-7xl sm:text-8xl md:text-9xl font-space font-bold uppercase tracking-[0.4em] text-white drop-shadow-[0_0_55px_rgba(255,255,255,0.95)]">
              Pricing
            </span>
          </div>

          <div className="relative space-y-8">

            <div className="grid gap-6 md:grid-cols-3">
              <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 backdrop-blur-md transition-all duration-300 hover:scale-[1.01]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.22),transparent_65%)]" />
                <div className="relative p-6 flex flex-col gap-3">
                  <div className="text-sm font-medium text-gray-100">
                    <span className="font-bold">Free</span> Plan
                  </div>
                  <div className="text-3xl font-semibold text-white">Free</div>
                  <p className="text-xs text-gray-500">Try Edufy with limited access to materials and features.</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-gray-500">
                    <li>- Limited practice materials</li>
                    <li>- Basic progress tracking</li>
                    <li>- Community access</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = 'https://access.edufyuzbekistan.com/login';
                    }}
                    className="mt-4 w-full rounded-full border border-white/25 bg-black/70 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-white/10 transition-all duration-300 ease-out hover:bg-white hover:text-gray-900 hover:shadow-[0_0_18px_rgba(255,255,255,0.6)] hover:-translate-y-0.5"
                  >
                    Get started
                  </button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-white/25 bg-white/8 backdrop-blur-lg transition-all duration-300 hover:scale-[1.01]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.3),transparent_65%)]" />
                <div className="relative p-6 flex flex-col gap-3">
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-100">
                    Plus Plan
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-100 border border-white/30">
                      Recommended
                    </span>
                  </div>
                  <div className="text-3xl font-semibold text-white">{plusPrice}</div>
                  <p className="text-xs text-slate-500">
                    Full access to courses, smart analytics and personalized recommendations.
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-500">
                    <li>- Full access to basic materials</li>
                    <li>- Smart progress analytics</li>
                    <li>- Half access to special materials</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = 'https://access.edufyuzbekistan.com/login';
                    }}
                    className="mt-4 w-full rounded-full border border-white/25 bg-black/70 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-white/10 transition-all duration-300 ease-out hover:bg-white hover:text-gray-900 hover:shadow-[0_0_18px_rgba(255,255,255,0.6)] hover:-translate-y-0.5"
                  >
                    Get started
                  </button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 backdrop-blur-md transition-all duration-300 hover:scale-[1.01]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.22),transparent_65%)]" />
                <div className="relative p-6 flex flex-col gap-3">
                  <div className="text-sm font-medium text-gray-100">Premium Plan</div>
                  <div className="text-3xl font-semibold text-white">{premiumPrice}</div>
                  <p className="text-xs text-slate-500">
                    For students who want maximum support and intensive preparation.
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-500">
                    <li>- Everything in Plus</li>
                    <li>- Full access for all materials</li>
                    <li>- Special MOCKs</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = 'https://access.edufyuzbekistan.com/login';
                    }}
                    className="mt-4 w-full rounded-full border border-white/25 bg-black/70 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-white/10 transition-all duration-300 ease-out hover:bg-white hover:text-gray-900 hover:shadow-[0_0_18px_rgba(255,255,255,0.6)] hover:-translate-y-0.5"
                  >
                    Get started
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 backdrop-blur-md px-2 py-1 text-[11px] sm:text-xs text-gray-300 transition-colors duration-300 ease-out hover:border-white/30">
                <span className="mr-1 hidden sm:inline text-gray-400">Billing:</span>
                <div className="relative flex rounded-full bg-white/5 px-0.5 py-0.5">
                  <div
                    className={`absolute inset-y-0 left-0 w-1/3 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out ${
                      billingPeriod === 'monthly'
                        ? 'translate-x-0'
                        : billingPeriod === '6months'
                        ? 'translate-x-full'
                        : 'translate-x-[200%]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('monthly')}
                    className={`relative z-10 flex-1 px-3 py-1 rounded-full text-center transition-colors duration-300 ${
                      billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-200 hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('6months')}
                    className={`relative z-10 flex-1 px-3 py-1 rounded-full text-center transition-colors duration-300 ${
                      billingPeriod === '6months' ? 'text-gray-900' : 'text-gray-200 hover:text-white'
                    }`}
                  >
                    6 months
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('yearly')}
                    className={`relative z-10 flex-1 px-3 py-1 rounded-full text-center transition-colors duration-300 ${
                      billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-200 hover:text-white'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <section
          id="blog"
          className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-[90rem] mx-auto"
        >
          <div className="text-center mb-12">
            <p className="text-xs sm:text-sm tracking-[0.35em] uppercase text-gray-400 font-bebas mb-3">
              Blog
            </p>
            <h2 className="text-3xl md:text-4xl font-space font-bold text-white">
              From the Edufy team
            </h2>
            <p className="mt-3 text-gray-300 text-sm md:text-base max-w-2xl mx-auto">
              Short insights and stories about exam preparation, study habits and how we build Edufy.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <span className="px-3 py-1 rounded-full border border-white/15 bg-white/5 text-[11px] sm:text-xs text-gray-200 uppercase tracking-[0.18em]">
                Education
              </span>
              <span className="px-3 py-1 rounded-full border border-white/15 bg-white/5 text-[11px] sm:text-xs text-gray-200 uppercase tracking-[0.18em]">
                IELTS SAT TOEFL ACT AP
              </span>
              <span className="px-3 py-1 rounded-full border border-white/15 bg-white/5 text-[11px] sm:text-xs text-gray-200 uppercase tracking-[0.18em]">
                Skills
              </span>
              <span className="px-3 py-1 rounded-full border border-white/15 bg-white/5 text-[11px] sm:text-xs text-gray-200 uppercase tracking-[0.18em]">
                Updates
              </span>
              <span className="px-3 py-1 rounded-full border border-white/15 bg-white/5 text-[11px] sm:text-xs text-gray-200 uppercase tracking-[0.18em]">
                Life
              </span>
            </div>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            <article
              id="blog-card-sat"
              className="relative min-h-[22rem] md:min-h-[24rem] overflow-hidden rounded-3xl border border-white/15 bg-white/5 backdrop-blur-md p-10 flex flex-col gap-6"
            >
              <div className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">Education • SAT</div>
              <div
                className="relative w-full overflow-hidden rounded-2xl border border-white/15 bg-black/40"
                style={{ aspectRatio: '16 / 9' }}
              >
                <Image
                  src="/photos/photo_2025-11-21_12-56-50.jpg"
                  alt="Student skills practice"
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 33vw, 100vw"
                />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-white">
                Understand, Define, Deal.
              </h3>
              <p className="text-sm text-gray-300">
                Don’t focus on getting every question right on your first attempt. Instead, focus on understanding why the SAT asks certain types of questions and recognizing the patterns behind them.
              </p>
              <div className="mt-auto flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/10">
                <span>Nov 21, 2025</span>
                <button
                  type="button"
                  onClick={handleOpenSatUnderstand}
                  className="text-[11px] uppercase tracking-[0.2em] text-white/80 hover:text-white"
                >
                  Read
                </button>
              </div>
            </article>

            <article
              id="blog-card-shadow-yourself"
              className="relative min-h-[22rem] md:min-h-[24rem] overflow-hidden rounded-3xl border border-white/15 bg-white/5 backdrop-blur-md p-10 flex flex-col gap-6"
            >
              <div className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">Skills</div>
              <div
                className="relative w-full overflow-hidden rounded-2xl border border-white/15 bg-black/40"
                style={{ aspectRatio: '16 / 9' }}
              >
                <Image
                  src="/photos/photo_2025-11-29_13-20-30.jpg"
                  alt="Shadow yourself practice"
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 33vw, 100vw"
                />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-white">
                Shadow yourself
              </h3>
              <p className="text-sm text-gray-300">
                Record yourself speaking on any topic, then listen carefully and imitate your own pronunciation, intonation, and pacing
              </p>
              <div className="mt-auto flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/10">
                <span>Nov 21, 2025</span>
                <button
                  type="button"
                  onClick={handleOpenShadowYourself}
                  className="text-[11px] uppercase tracking-[0.2em] text-white/80 hover:text-white"
                >
                  Read
                </button>
              </div>
            </article>

            <article
              id="blog-card-short-frequent"
              className="relative min-h-[22rem] md:min-h-[24rem] overflow-hidden rounded-3xl border border-white/15 bg-white/5 backdrop-blur-md p-10 flex flex-col gap-6"
            >
              <div className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">Updates</div>
              <div
                className="relative w-full overflow-hidden rounded-2xl border border-white/15 bg-black/40"
                style={{ aspectRatio: '16 / 9' }}
              >
                <video
                  src="/videos/DNucOji5MCf_0.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-white">
                Launch of our Website!
              </h3>
              <p className="text-sm text-gray-300">
                This day has come...
              </p>
              <div className="mt-auto flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/10">
                <span>Nov 14, 2025</span>
                <button
                  type="button"
                  onClick={handleOpenShortFrequent}
                  className="text-[11px] uppercase tracking-[0.2em] text-white/80 hover:text-white"
                >
                  Read
                </button>
              </div>
            </article>
          </div>

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              className="px-8 py-2.5 rounded-full border border-white/25 bg-black/60 text-sm md:text-base text-white tracking-[0.15em] uppercase font-space hover:bg-white hover:text-gray-900 transition-colors duration-300"
            >
              View all posts
            </button>
          </div>
        </section>

        {openBlogPost && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md blog-modal-backdrop">
            <div
              ref={blogModalRef}
              className="blog-modal-expand-frame overflow-y-auto rounded-3xl border border-white/20 bg-black/95 p-6 sm:p-8 md:p-10 shadow-[0_0_40px_rgba(0,0,0,0.9)]"
              style={
                blogExpandRect
                  ? blogExpanded
                    ? {
                        top: '5vh',
                        left: '50%',
                        width: 'min(1100px, 100vw - 32px)',
                        height: '90vh',
                        borderRadius: '1.5rem',
                        transform: 'translateX(-50%)',
                      }
                    : {
                        top: blogExpandRect.top,
                        left: blogExpandRect.left,
                        width: blogExpandRect.width,
                        height: blogExpandRect.height,
                        borderRadius: '1.5rem',
                        transform: 'none',
                      }
                  : {
                      top: '5vh',
                      left: '50%',
                      width: 'min(1100px, 100vw - 32px)',
                      height: '90vh',
                      borderRadius: '1.5rem',
                      transform: 'translateX(-50%)',
                    }
              }
            >
              <button
                type="button"
                onClick={() => {
                  setBlogExpanded(false);
                  if (typeof window !== 'undefined') {
                    window.setTimeout(() => {
                      setOpenBlogPost(null);
                      setBlogExpandRect(null);
                    }, 450);
                  } else {
                    setOpenBlogPost(null);
                    setBlogExpandRect(null);
                  }
                }}
                className="absolute right-4 top-4 inline-flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full border border-white/30 bg-black/60 text-[11px] md:text-xs text-white/80 hover:bg-white hover:text-black transition-colors"
                aria-label="Close blog post"
              >
                Close
              </button>
              {openBlogPost === 'sat-understand' ? (
                <>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">Education • SAT</div>
                  <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">Understand, Define, Deal.</h3>

                  <div
                    className="relative w-full overflow-hidden rounded-2xl border border-white/15 bg-black/40 mb-6"
                    style={{ aspectRatio: '16 / 9' }}
                  >
                    <Image
                      src="/photos/photo_2025-11-21_12-56-50.jpg"
                      alt="Student skills practice"
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 50vw, 100vw"
                    />
                  </div>

                  <div className="space-y-3 text-sm md:text-base text-gray-200">
                    <p>
                      Don’t focus on getting every question right on your first attempt. Instead, focus on understanding
                      why the SAT asks certain types of questions and recognizing the patterns behind them. The SAT is
                      not about advanced difficulty — it’s about testing the same recurring structures in grammar,
                      reading logic, and math reasoning.
                    </p>
                    <p>
                      When you can identify a pattern, you can solve a question faster, more confidently, and with a
                      much higher accuracy rate. You’re no longer guessing — you’re responding to a familiar structure.
                    </p>
                    <p>Train yourself to:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Understand the logic behind each question type.</li>
                      <li>Define which rule or pattern it belongs to.</li>
                      <li>Deal with it using a clear, repeatable strategy.</li>
                    </ul>
                    <p>
                      At the same time, learn to quickly notice which questions are designed to be time traps. If a
                      question feels like it will take too long, skip it immediately and return later. This single habit
                      saves minutes, reduces stress, and keeps you in control of your pacing.
                    </p>
                    <p>
                      Over time, you stop seeing the SAT as a long, stressful exam — you see it as a predictable system.
                      And once you see the system, you can beat it consistently.
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      <span>SAT tip</span>
                      <button
                        type="button"
                        onClick={() => handleShareBlogPost('blog-card-sat')}
                        className="px-3 py-1 rounded-full border border-white/20 bg-black/40 text-[10px] uppercase tracking-[0.18em] text-white/80 hover:bg-white hover:text-gray-900 transition-colors"
                      >
                        Share
                      </button>
                    </div>
                    <span>Nov 21, 2025</span>
                  </div>
                </>
              ) : openBlogPost === 'shadow-yourself' ? (
                <>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">Education • IELTS</div>
                  <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">Shadow yourself</h3>

                  <div
                    className="relative w-full overflow-hidden rounded-2xl border border-white/15 bg-black/40 mb-6"
                    style={{ aspectRatio: '16 / 9' }}
                  >
                    <Image
                      src="/photos/photo_2025-11-29_13-20-30.jpg"
                      alt="Shadow yourself practice"
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 50vw, 100vw"
                    />
                  </div>

                  <div className="space-y-3 text-sm md:text-base text-gray-200">
                    <p>
                      Record yourself speaking on any topic — it can be a personal story, a description, or an opinion.
                      Then listen attentively to the recording and imitate your own voice: copy your pronunciation,
                      intonation, pauses, and emotional tone. Try doing it slightly faster or slightly slower to
                      challenge your rhythm and control.
                    </p>
                    <p>
                      After shadowing, immediately repeat the same topic again without looking at any notes. Your task
                      is to sound smoother, clearer, and more confident than in the first attempt. Focus on keeping a
                      natural flow, connecting ideas logically, and reducing unnecessary pauses or fillers.
                    </p>
                    <p>
                      This technique trains several skills at the same time:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        <span className="font-semibold">Fluency:</span> You learn to speak without stopping, because
                        your brain gets used to the rhythm and structure of your own speech.
                      </li>
                      <li>
                        <span className="font-semibold">Coherence:</span> Repeating the same idea helps you organize
                        your thoughts more logically each time.
                      </li>
                      <li>
                        <span className="font-semibold">Pronunciation &amp; Intonation:</span> By shadowing yourself,
                        you notice your weak spots and automatically adjust them.
                      </li>
                      <li>
                        <span className="font-semibold">Rhythm &amp; Confidence:</span> Mimicking your own voice helps
                        you develop a more stable speaking pattern and reduces nervousness.
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      <span>Practice tip</span>
                      <button
                        type="button"
                        onClick={() => handleShareBlogPost('blog-card-shadow-yourself')}
                        className="px-3 py-1 rounded-full border border-white/20 bg-black/40 text-[10px] uppercase tracking-[0.18em] text-white/80 hover:bg-white hover:text-gray-900 transition-colors"
                      >
                        Share
                      </button>
                    </div>
                    <span>Nov 21, 2025</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3">Updates</div>
                  <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                    Why short, frequent practice beats long weekend marathons
                  </h3>

                  <div
                    className="relative w-full overflow-hidden rounded-2xl border border-white/15 bg-black/40 mb-6"
                    style={blogExpanded ? { aspectRatio: '16 / 9', maxHeight: '40vh' } : { aspectRatio: '16 / 9' }}
                  >
                    <video
                      src="/videos/DNucOji5MCf_0.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-3 text-sm md:text-base text-gray-200">
                    <p>
                      What we see from thousands of attempts inside Edufy and how to build a routine that actually
                      sticks.
                    </p>
                    <p>
                      Long weekend marathons look productive from the outside, but your brain quickly burns through
                      focus and retention. Short, frequent sessions give your memory time to consolidate, while still
                      keeping the material fresh.
                    </p>
                    <p>
                      Inside Edufy, we design practice blocks so that you can combine 20–30 minute focused attempts
                      with clear feedback, instead of relying on one big weekly session that you instantly forget.
                    </p>
                    <p>
                      In this post, we break down how to structure your week, what to do on light days, and how to
                      recover when you inevitably miss a session so that your progress line keeps going up.
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      <span>WOW</span>
                      <button
                        type="button"
                        onClick={() => handleShareBlogPost('blog-card-short-frequent')}
                        className="px-3 py-1 rounded-full border border-white/20 bg-black/40 text-[10px] uppercase tracking-[0.18em] text-white/80 hover:bg-white hover:text-gray-900 transition-colors"
                      >
                        Share
                      </button>
                    </div>
                    <span>Nov 14, 2025</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800 bg-black">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-4 text-white">Legal</h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/privacy-policy"
                      target="_blank"
                      rel="noopener"
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/cookies-policy"
                      target="_blank"
                      rel="noopener"
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Cookies Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/terms-of-service"
                      target="_blank"
                      rel="noopener"
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4 text-white">Connect</h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/contact"
                      target="_blank"
                      rel="noopener"
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Contact us
                    </a>
                  </li>
                  <li>
                    <a
                      href="/faq"
                      target="_blank"
                      rel="noopener"
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://t.me/edufy_community"
                      target="_blank"
                      rel="noopener"
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Community
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4 text-white">About Edufy</h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#about"
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      About Us
                    </a>
                  </li>
                  <li>
                    <a
                      href="/team"
                      target="_blank"
                      rel="noopener"
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Our Team
                    </a>
                  </li>
                  <li>
                    <a
                      href="/careers"
                      target="_blank"
                      rel="noopener"
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Careers
                    </a>
                  </li>
                  <li>
                    <a
                      href="/blog"
                      target="_blank"
                      rel="noopener"
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Blog &amp; News
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4 text-white">Social</h3>
                <div className="flex flex-wrap items-center gap-4 text-gray-400">
                  <a
                    href="https://t.me/edufy_uzb"
                    target="_blank"
                    rel="noopener"
                    aria-label="Telegram"
                    className="hover:text-blue-400 transition-colors"
                  >
                    <i data-feather="send" />
                  </a>
                  <a
                    href="https://instagram.com/edufy_uzb"
                    target="_blank"
                    rel="noopener"
                    aria-label="Instagram"
                    className="hover:text-pink-500 transition-colors"
                  >
                    <i data-feather="instagram" />
                  </a>
                  <a
                    href="https://www.youtube.com/@EdufyUzb"
                    target="_blank"
                    rel="noopener"
                    aria-label="YouTube"
                    className="hover:text-red-500 transition-colors"
                  >
                    <i data-feather="youtube" />
                  </a>
                  <a
                    href="https://x.com/edufyuzbekistan"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X (Twitter)"
                    className="hover:text-gray-300 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      fill="currentColor"
                    >
                      <path d="M18.244 2H21.5l-7.5 8.59L23 22h-6.844l-5.35-6.613L4.3 22H1l8.06-9.225L1 2h6.844l5.03 6.22L18.244 2zm-2.401 18h2.1L8.35 4h-2.1l9.593 16z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/edufy-uzbekistan-820481392"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="hover:text-blue-500 transition-colors"
                  >
                    <i data-feather="linkedin" />
                  </a>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener"
                    aria-label="Reddit"
                    className="hover:text-orange-500 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      fill="currentColor"
                    >
                      <path d="M22 12.5c0-1.104-.896-2-2-2-.651 0-1.227.316-1.593.8-.973-.617-2.233-1.013-3.652-1.07l.738-3.474 2.429.516c.017.654.558 1.18 1.219 1.18.674 0 1.222-.548 1.222-1.222 0-.674-.548-1.222-1.222-1.222-.48 0-.894.283-1.092.688l-2.75-.585c-.119-.026-.238.052-.267.171l-.822 3.87c-1.473.04-2.8.445-3.816 1.086A1.997 1.997 0 0 0 4 10.5c-1.104 0-2 .896-2 2 0 .82.492 1.524 1.197 1.839-.03.189-.047.381-.047.576 0 2.556 2.805 4.63 6.25 4.63s6.25-2.074 6.25-4.63c0-.187-.015-.371-.043-.553A1.996 1.996 0 0 0 22 12.5Zm-13.25 1.25c0-.69.56-1.25 1.25-1.25s1.25.56 1.25 1.25-.56 1.25-1.25 1.25-1.25-.56-1.25-1.25Zm6.62 3.018c-.79.79-2.27 1.064-3.37 1.064-1.1 0-2.58-.274-3.37-1.064a.25.25 0 0 1 .354-.354c.548.548 1.676.918 3.016.918s2.468-.37 3.016-.918a.25.25 0 1 1 .354.354Zm-.12-1.768c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25Z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener"
                    aria-label="Facebook"
                    className="hover:text-blue-600 transition-colors"
                  >
                    <i data-feather="facebook" />
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col text-sm text-gray-400">
                  <span className="text-white font-semibold text-base">Edufy</span>
                  <span>© 2025 EDUFY UBZEKISTAN.</span>
                  <span>All rights reserved.</span>
                  <span>Made in Tashkent, Uzbekistan.</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
