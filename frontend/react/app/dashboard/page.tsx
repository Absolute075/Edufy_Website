"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { usePageTitle } from "../lib/usePageTitle";
import { useUserProfile } from "../UserProfileProvider";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getCompletedTestsState } from "@/lib/completedTests";
import { isPlanSufficient, resourcesRegistry } from "@/lib/resourcesRegistry";

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

function getIsoYearWeek(date: Date): { year: number; week: number } {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (tmp.getUTCDay() + 6) % 7; // Mon=0
  tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3);
  const firstThu = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((Number(tmp) - Number(firstThu)) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7,
    );
  return { year: tmp.getUTCFullYear(), week };
}

function getWeeklyStudyHoursForIsoWeek(year: number, week: number): number[] {
  if (typeof window === "undefined") return [0, 0, 0, 0, 0, 0, 0];
  try {
    const KEY_PREFIX = "edufy.study.weekly.";
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
  const { data: profileData } = useUserProfile();
  const studentName = profileData?.username || "Student";
  const [weeklyHours, setWeeklyHours] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [monthlyWeeks, setMonthlyWeeks] = useState<Array<{ label: string; hours: number }>>([]);
  const [progress, setProgress] = useState<number>(0);

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";
  const resourcesHref = `${userPrefix}/resources`;

  useEffect(() => {
    const syncStudy = () => {
      setWeeklyHours(getWeeklyStudyHours());

      const now = new Date();
      const weeks = [3, 2, 1, 0].map((back, idx) => {
        const d = new Date(now);
        d.setDate(d.getDate() - back * 7);
        const { year, week } = getIsoYearWeek(d);
        const hoursArr = getWeeklyStudyHoursForIsoWeek(year, week);
        const total = Math.round(hoursArr.reduce((a, b) => a + b, 0) * 10) / 10;
        return { label: `W${idx + 1}`, hours: total };
      });
      setMonthlyWeeks(weeks);
    };

    const syncProgress = () => {
      const userPlan = profileData?.plan ?? "free";
      const state = getCompletedTestsState();
      const completedIds = new Set<string>();
      (Object.values(state.reading ?? {}) as number[]).forEach(() => {});

      (Object.keys(state.reading ?? {}) as string[]).forEach((id) => completedIds.add(`reading:${id}`));
      (Object.keys(state.listening ?? {}) as string[]).forEach((id) => completedIds.add(`listening:${id}`));
      (Object.keys(state.writing ?? {}) as string[]).forEach((id) => completedIds.add(`writing:${id}`));
      (Object.keys(state.mock ?? {}) as string[]).forEach((id) => completedIds.add(`mock:${id}`));

      const available = new Set<string>();
      (Object.entries(resourcesRegistry.reading) as Array<[string, (typeof resourcesRegistry.reading)[string]]>).forEach(
        ([id, rule]) => {
          if (isPlanSufficient(userPlan, rule.requiredPlan)) available.add(`reading:${id}`);
        },
      );
      (Object.entries(resourcesRegistry.listening) as Array<[string, (typeof resourcesRegistry.listening)[string]]>).forEach(
        ([id, rule]) => {
          if (isPlanSufficient(userPlan, rule.requiredPlan)) available.add(`listening:${id}`);
        },
      );
      (Object.entries(resourcesRegistry.writing) as Array<[string, (typeof resourcesRegistry.writing)[string]]>).forEach(
        ([id, rule]) => {
          if (isPlanSufficient(userPlan, rule.requiredPlan)) available.add(`writing:${id}`);
        },
      );
      (Object.entries(resourcesRegistry.mock) as Array<[string, (typeof resourcesRegistry.mock)[string]]>).forEach(
        ([id, rule]) => {
          if (isPlanSufficient(userPlan, rule.requiredPlan)) available.add(`mock:${id}`);
        },
      );

      const total = available.size;
      let done = 0;
      available.forEach((k) => {
        if (completedIds.has(k)) done++;
      });

      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      setProgress(pct);
    };

    syncStudy();
    syncProgress();

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith("edufy.study.weekly.")) {
        syncStudy();
      }
      if (e.key === "edufy.completedTests.v1" || e.key.startsWith("edufy.completedTests.v1.")) {
        syncProgress();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", syncProgress);
    window.addEventListener("focus", syncStudy);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", syncProgress);
      window.removeEventListener("focus", syncStudy);
    };
  }, [profileData?.plan]);

  const maxHours = Math.max(...weeklyHours, 1);
  const totalWeeklyHours = Math.round(weeklyHours.reduce((a, b) => a + b, 0) * 10) / 10;
  const maxMonthHours = Math.max(...monthlyWeeks.map((w) => w.hours), 1);

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
                <p className="text-sm text-slate-400">Hours per day · Total: {totalWeeklyHours}h</p>
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

              {/* Study Methods */}
              <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
                <h2 className="text-lg font-semibold">Study Methods</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <article className="rounded-2xl border border-neutral-800 bg-black p-4">
                    <h3 className="font-medium">SQ3R</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Survey, Question, Read, Recite, Review to boost comprehension.
                    </p>
                    <Link
                      href={`${userPrefix}/methods/sq3r`}
                      className="mt-3 inline-block rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
                    >
                      Learn More
                    </Link>
                  </article>
                  <article className="rounded-2xl border border-neutral-800 bg-black p-4">
                    <h3 className="font-medium">Pomodoro</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      25-minute focus sprints with short breaks to maintain momentum.
                    </p>
                    <Link
                      href={`${userPrefix}/methods/pomodoro`}
                      className="mt-3 inline-block rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
                    >
                      Learn More
                    </Link>
                  </article>
                  <article className="rounded-2xl border border-neutral-800 bg-black p-4">
                    <h3 className="font-medium">Feynman Technique</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Explain complex ideas in simple words to expose gaps and learn deeply.
                    </p>
                    <Link
                      href={`${userPrefix}/methods/feynman`}
                      className="mt-3 inline-block rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
                    >
                      Learn More
                    </Link>
                  </article>
                  <article className="rounded-2xl border border-neutral-800 bg-black p-4">
                    <h3 className="font-medium">Active Recall</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Turn material into questions and test yourself without notes to strengthen memory.
                    </p>
                    <Link
                      href={`${userPrefix}/methods/active-recall`}
                      className="mt-3 inline-block rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
                    >
                      Learn More
                    </Link>
                  </article>
                  <article className="rounded-2xl border border-neutral-800 bg-black p-4">
                    <h3 className="font-medium">Mind Mapping</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Visual maps that connect ideas, reveal structure and make complex topics easier to remember.
                    </p>
                    <Link
                      href={`${userPrefix}/methods/mind-mapping`}
                      className="mt-3 inline-block rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
                    >
                      Learn More
                    </Link>
                  </article>
                  <article className="rounded-2xl border border-neutral-800 bg-black p-4">
                    <h3 className="font-medium">Leitner System</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Flashcards in spaced boxes: hard cards appear more often, easy ones less often.
                    </p>
                    <Link
                      href={`${userPrefix}/methods/leitner`}
                      className="mt-3 inline-block rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
                    >
                      Learn More
                    </Link>
                  </article>
                  <article className="rounded-2xl border border-neutral-800 bg-black p-4">
                    <h3 className="font-medium">Kaizen</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Small, continuous improvements every day that compound into big progress over time.
                    </p>
                    <Link
                      href={`${userPrefix}/methods/kaizen`}
                      className="mt-3 inline-block rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
                    >
                      Learn More
                    </Link>
                  </article>
                  <article className="rounded-2xl border border-neutral-800 bg-black p-4">
                    <h3 className="font-medium">Spaced Repetition</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Review information right before you forget it to move knowledge into long‑term memory.
                    </p>
                    <Link
                      href={`${userPrefix}/methods/spaced-repetition`}
                      className="mt-3 inline-block rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
                    >
                      Learn More
                    </Link>
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
                  {(monthlyWeeks.length ? monthlyWeeks : [
                    { label: "W1", hours: 0 },
                    { label: "W2", hours: 0 },
                    { label: "W3", hours: 0 },
                    { label: "W4", hours: 0 },
                  ]).map((w) => {
                    const height = Math.max(10, (w.hours / maxMonthHours) * 144);
                    return (
                      <div key={w.label} className="flex flex-col items-center gap-2">
                        <div className="w-10 rounded-md bg-white" style={{ height: `${height}px` }} />
                        <span>{w.label}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </section>
          </DashboardShell>
  );
}
