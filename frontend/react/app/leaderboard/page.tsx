"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { usePageTitle } from "../lib/usePageTitle";

const MOCK_LEADERBOARD = [
  { rank: 1, name: "Alex", country: "\uD83C\uDDF7\uD83C\uDDFA", score: 982, hours: 124 },
  { rank: 2, name: "Sara", country: "\uD83C\uDDEC\uD83C\uDDE7", score: 951, hours: 110 },
  { rank: 3, name: "Murod", country: "\uD83C\uDDFA\uD83C\uDDFF", score: 930, hours: 102 },
  { rank: 4, name: "Liam", country: "\uD83C\uDDF9\uD83C\uDDF7", score: 912, hours: 96 },
  { rank: 5, name: "Emily", country: "\uD83C\uDDE9\uD83C\uDDEA", score: 899, hours: 88 },
];

export default function LeaderboardPage() {
  usePageTitle("Edufy – Leaderboard");
  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">Leaderboard</h1>
          <p className="text-sm text-slate-400">See how students progress globally across Edufy.</p>
        </div>

        <section className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
          {/* Real leaderboard content under blur */}
          <div className="relative space-y-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
              <div className="flex flex-1 items-center gap-4">
                <span className="w-10 text-center">Rank</span>
                <span>Student</span>
              </div>
              <div className="flex flex-1 justify-end gap-8">
                <span>Score</span>
                <span>Study hours</span>
              </div>
            </div>

            <div className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-950/70">
              {MOCK_LEADERBOARD.map((row) => (
                <div
                  key={row.rank}
                  className="flex items-center justify-between px-4 py-3 text-sm text-slate-100"
                >
                  <div className="flex flex-1 items-center gap-4">
                    <div className="flex w-10 items-center justify-center text-base font-semibold text-slate-300">
                      #{row.rank}
                    </div>
                    <div>
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-slate-400">{row.country} Top learner</div>
                    </div>
                  </div>
                  <div className="flex flex-1 justify-end gap-8 text-sm">
                    <div className="font-semibold text-emerald-300">{row.score}</div>
                    <div className="text-slate-300">{row.hours}h</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trailer blur overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <p className="text-3xl font-bold tracking-wide text-white">Coming Soon</p>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
