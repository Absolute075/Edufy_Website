"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api";

type Screenshot = {
  id: number;
  file: File;
  url: string;
};

export default function ReportPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("bug");
  const [description, setDescription] = useState("");
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const next: Screenshot[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      next.push({ id: Date.now() + Math.random(), file, url });
    });
    setScreenshots((prev) => [...prev, ...next]);
  };

  const removeScreenshot = (id: number) => {
    setScreenshots((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((s) => s.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      setError(null);

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("category", category);
      formData.append("description", description.trim());
      screenshots.forEach((shot) => {
        formData.append("screenshots", shot.file);
      });

      const res = await api("/support/report", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let message = "Failed to send report";
        try {
          const data = await res.json();
          if (data && typeof data.error === "string") {
            message = data.error;
          }
        } catch {
          // ignore JSON parse error
        }
        setError(message);
        return;
      }

      setTitle("");
      setCategory("bug");
      setDescription("");
      screenshots.forEach((s) => URL.revokeObjectURL(s.url));
      setScreenshots([]);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">Report a Bug</h1>
          <p className="text-sm text-slate-400">
            Found an issue or something that feels off? Share details and optional screenshots so we can fix it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short summary of the problem"
                  className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-slate-100 focus:border-white focus:outline-none"
                >
                  <option value="bug">Bug / Wrong behaviour</option>
                  <option value="ui">UI / Layout issue</option>
                  <option value="performance">Performance</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                Description
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Steps to reproduce, what you expected to happen, and what actually happened."
                className="mt-1 w-full resize-none rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                Screenshots (optional)
              </label>
              <div className="mt-2 flex flex-col gap-3">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 px-4 py-6 text-center text-xs text-slate-400 hover:border-cyan-500/70 hover:bg-neutral-900/70">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <span className="mb-1 text-sm font-medium text-slate-100">Upload screenshots</span>
                  <span>Drag & drop or click to select files</span>
                </label>

                {screenshots.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-3">
                    {screenshots.map((shot) => (
                      <div
                        key={shot.id}
                        className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60"
                      >
                        <button
                          type="button"
                          onClick={() => setViewerImage(shot.url)}
                          className="block h-32 w-full overflow-hidden"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={shot.url}
                            alt="Screenshot preview"
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeScreenshot(shot.id)}
                          className="absolute right-2 top-2 inline-flex items-center rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-slate-100 hover:bg-black"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              Thank you for helping us improve Edufy. We review every report.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-lg border border-cyan-500 bg-cyan-600 px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-cyan-500/30 hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Sending..." : "Submit report"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {submitted && (
          <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-xl border border-emerald-500/70 bg-neutral-950/95 px-4 py-2 text-xs text-emerald-200 shadow-xl">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <polyline
                points="20 6 9 17 4 12"
                className="fill-none stroke-current"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Thanks! Your report was submitted.</span>
          </div>
        )}

        {viewerImage && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70"
            onClick={() => setViewerImage(null)}
          >
            <div className="max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950/95">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={viewerImage} alt="Screenshot full" className="h-full w-full object-contain" />
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
