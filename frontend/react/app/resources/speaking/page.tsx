"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function SpeakingResourcesPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">Speaking</h1>
          <p className="text-sm text-slate-400">
            Find a speaking partner, schedule practice sessions, and build confidence.
          </p>
        </div>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
          <h2 className="text-lg font-semibold text-slate-100">Find a Speaking Partner</h2>
          <p className="mt-2 text-sm text-slate-400">
            Join our Telegram group to connect with other learners and practise IELTS Speaking together.
          </p>

          <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="text-sm font-medium text-slate-100">Telegram group</div>
            <div className="mt-1 break-all text-sm text-slate-300">https://t.me/englishchatting2025</div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href="https://t.me/englishchatting2025"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-slate-200"
              >
                Open in Telegram
              </a>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText("https://t.me/englishchatting2025");
                  } catch {}
                }}
                className="inline-flex items-center rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:border-slate-400 hover:bg-neutral-900"
              >
                Copy link
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <div className="text-sm font-semibold text-slate-100">Suggested workflow</div>
              <div className="mt-2 space-y-1 text-sm text-slate-400">
                <div>1) Introduce yourself + your target band.</div>
                <div>2) Choose one topic (Part 1/2/3) and time your answers.</div>
                <div>3) Give feedback politely and swap roles.</div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <div className="text-sm font-semibold text-slate-100">Tips</div>
              <div className="mt-2 space-y-1 text-sm text-slate-400">
                <div>Speak slowly, clearly, and don’t memorise full scripts.</div>
                <div>Record yourself to track progress.</div>
                <div>Focus on structure: answer, expand, example.</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
