"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { usePageTitle } from "../lib/usePageTitle";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

type Activity = {
  text: string;
  time: number;
};

function loadRecentActivities(): Activity[] {
  if (typeof window === "undefined") return [];
  try {
    const userKey =
      (window as any).__edufyUserKey ||
      window.sessionStorage.getItem("edufy.user.key") ||
      window.localStorage.getItem("edufy.user.key");
    if (!userKey) return [];
    const key = `edufyActivities_${userKey}`;
    const raw = window.localStorage.getItem(key) || "[]";
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, 3);
  } catch {
    return [];
  }
}

function formatRelativeTime(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function getWeeklyStudyHours(): number[] {
  if (typeof window === "undefined") return [0, 0, 0, 0, 0, 0, 0];
  try {
    const KEY_PREFIX = "edufy.study.weekly.";
    const now = new Date();
    const tmp = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = (tmp.getUTCDay() + 6) % 7; // Mon=0
    tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3);
    const firstThu = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4));
    const week =
      1 +
      Math.round(
        ((Number(tmp) - Number(firstThu)) / 86400000 -
          3 +
          ((firstThu.getUTCDay() + 6) % 7)) /
          7,
      );
    const year = tmp.getUTCFullYear();
    const key = `${KEY_PREFIX}${year}-${String(week).padStart(2, "0")}`;
    const raw = window.localStorage.getItem(key) || "null";
    const arr = JSON.parse(raw) || [0, 0, 0, 0, 0, 0, 0];
    if (!Array.isArray(arr) || arr.length !== 7) return [0, 0, 0, 0, 0, 0, 0];
    const mins = arr.map((x) => (typeof x === "number" ? x : 0));
    const hours = mins.map((m) => Math.round(((m / 60) * 10) / 10));
    return hours;
  } catch {
    return [0, 0, 0, 0, 0, 0, 0];
  }
}

export default function DashboardPage() {
  usePageTitle("Edufy – Dashboard");
  const pathname = usePathname() || "/";
  const [studentName, setStudentName] = useState<string>("Student");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [progress, setProgress] = useState<number>(0);

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";
  const resourcesHref = `${userPrefix}/resources`;

  useEffect(() => {
    setActivities(loadRecentActivities());
    setWeeklyHours(getWeeklyStudyHours());

    const intervalId = window.setInterval(() => {
      setActivities(loadRecentActivities());
      setWeeklyHours(getWeeklyStudyHours());
    }, 5000);

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith("edufyActivities_")) {
        setActivities(loadRecentActivities());
      }
      if (e.key.startsWith("edufy.study.weekly.")) {
        setWeeklyHours(getWeeklyStudyHours());
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    // Placeholder: later we can hydrate from /auth/me
    setStudentName("Student");
    setProgress(0);
  }, []);

  const maxHours = Math.max(...weeklyHours, 1);

  return (
    <DashboardShell studentName={studentName}>
      <section className="space-y-6">
              {/* Greeting */}
              <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 shadow-lg shadow-black/40">
                <h1 className="text-2xl font-semibold">
                  Welcome back, <span className="text-white">{studentName}</span>
                  <span className="ml-1">👋🏻</span>
                </h1>
                <p className="mt-1 text-slate-300">Keep going on your path to great accomplishments!</p>
              </div>

              {/* IELTS Progress */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">IELTS Progress</h2>
                    <p className="text-sm text-slate-400">Materials completed</p>
                  </div>
                  <Link
                    href={resourcesHref}
                    className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-neutral-900"
                  >
                    Open course
                  </Link>
                </div>
                <div className="mt-4">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-2 text-sm text-slate-300">
                    <span>{progress}</span>% completed
                  </div>
                </div>
              </div>

              {/* Daily Quote */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
                <blockquote className="text-slate-100 italic">
                  <span>
                    A man who makes a mistake and does not correct it is making another mistake.
                  </span>
                </blockquote>
                <div className="mt-2 text-sm italic text-slate-400">-Platon</div>
              </div>

              {/* Weekly Study Time */}
              <section
                aria-labelledby="weekly-time"
                className="rounded-2xl border border-neutral-800 bg-black p-6"
              >
                <h2 id="weekly-time" className="text-lg font-semibold">
                  Weekly Study Time
                </h2>
                <p className="text-sm text-slate-400">Hours per day</p>
                <div
                  className="mt-4 grid h-40 grid-cols-7 items-end gap-3 text-xs text-slate-400"
                  role="img"
                  aria-label="Bar chart of study hours Mon through Sun"
                >
                  {[
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                    "Sun",
                  ].map((day, idx) => {
                    const h = weeklyHours[idx] ?? 0;
                    const height = Math.max(10, (h / maxHours) * 144);
                    return (
                      <div key={day} className="flex flex-col items-center gap-2">
                        <div
                          className="w-6 rounded-md bg-white"
                          style={{ height: `${height}px` }}
                        />
                        <span>{day}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
              {/* Recent Activities */}
              <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
                <h2 className="text-lg font-semibold">Recent Activities</h2>
                <div className="mt-4 space-y-3" aria-live="polite">
                  {activities.length === 0 ? (
                    <div className="text-sm text-neutral-500">No recent activity yet</div>
                  ) : (
                    activities.map((a, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-3 text-sm hover:bg-neutral-900"
                      >
                        <div>
                          <div className="font-medium text-neutral-100">{a.text}</div>
                          <div className="text-xs text-neutral-500">{formatRelativeTime(a.time)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Study Methods */}
              <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
                <h2 className="text-lg font-semibold">Study Methods</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <article className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                    <h3 className="font-medium">SQ3R</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Survey, Question, Read, Recite, Review to boost comprehension.
                    </p>
                    <Link
                      href="/methods/sq3r"
                      className="mt-3 inline-block rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
                    >
                      Learn More
                    </Link>
                  </article>
                  <article className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <h3 className="font-medium">Pomodoro</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      25-minute focus sprints with short breaks to maintain momentum.
                    </p>
                    <Link
                      href="/methods/pomodoro"
                      className="mt-3 inline-block rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
                    >
                      Learn More
                    </Link>
                  </article>
                  <article className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <h3 className="font-medium">Feynman Technique</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Explain complex ideas in simple words to expose gaps and learn deeply.
                    </p>
                    <Link
                      href="/methods/feynman"
                      className="mt-3 inline-block rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
                    >
                      Learn More
                    </Link>
                  </article>
                  <article className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <h3 className="font-medium">Active Recall</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Turn material into questions and test yourself without notes to strengthen memory.
                    </p>
                  </article>
                  <article className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <h3 className="font-medium">Mind Mapping</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Visual maps that connect ideas, reveal structure and make complex topics easier to remember.
                    </p>
                  </article>
                  <article className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <h3 className="font-medium">Leitner System</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Flashcards in spaced boxes: hard cards appear more often, easy ones less often.
                    </p>
                  </article>
                  <article className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <h3 className="font-medium">Kaizen</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Small, continuous improvements every day that compound into big progress over time.
                    </p>
                  </article>
                  <article className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <h3 className="font-medium">Spaced Repetition</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Review information right before you forget it to move knowledge into long‑term memory.
                    </p>
                  </article>
                </div>
              </section>

              {/* Monthly Progress by Weeks */}
              <section className="rounded-2xl border border-neutral-800 bg-black p-6">
                <h2 className="text-lg font-semibold">Monthly Progress by Weeks</h2>
                <div
                  className="mt-4 grid h-40 grid-cols-4 items-end gap-4 text-xs text-slate-400"
                  role="img"
                  aria-label="Column chart of weekly performance for 4 weeks"
                >
                  {[1, 2, 3, 4].map((week) => (
                    <div key={week} className="flex flex-col items-center gap-2">
                      <div className="w-10 rounded-md bg-white" style={{ height: "24px" }} />
                      <span>{`Week ${week}`}</span>
                    </div>
                  ))}
                </div>
              </section>

              <footer className="border-t border-neutral-800 py-6 text-center text-sm text-slate-500">
                ©2025 Edufy. Keep Learning.
              </footer>
            </section>
          </DashboardShell>
  );
}
