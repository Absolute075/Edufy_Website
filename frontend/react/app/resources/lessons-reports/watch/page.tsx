"use client";

import { notFound, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { isPlanSufficient } from "@/lib/resourcesRegistry";
import { videoResourcesRegistry } from "@/lib/videoResourcesRegistry";
import { useUserProfile } from "../../../UserProfileProvider";
import { api } from "@/lib/api";

type StoredComment = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
};

type InteractionsResponse = {
  id: string;
  likesCount: number;
  likedByMe: boolean;
  comments: StoredComment[];
};

export default function LessonsReportsWatchPage() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  const id = (searchParams.get("id") || "").trim();

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";

  const { data: profileData } = useUserProfile();
  const userPlan = profileData?.plan ?? "free";

  const [likedByMe, setLikedByMe] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [comments, setComments] = useState<StoredComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [interactionsLoading, setInteractionsLoading] = useState<boolean>(false);
  const [interactionsError, setInteractionsError] = useState<string | null>(null);

  const item = useMemo(() => {
    if (!id) return null;
    const rule = videoResourcesRegistry[id];
    if (!rule) return null;
    return { id, ...rule };
  }, [id]);

  const locked = item ? !isPlanSufficient(userPlan, item.requiredPlan) : false;

  const loadInteractions = useCallback(async () => {
    if (!item) return;
    if (locked) return;

    setInteractionsLoading(true);
    setInteractionsError(null);
    try {
      const res = await api(`/api/lessons-reports/interactions?id=${encodeURIComponent(item.id)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `request_failed_${res.status}`);
      }

      const data = (await res.json()) as InteractionsResponse;
      setLikedByMe(!!data.likedByMe);
      setLikesCount(Number.isFinite(data.likesCount) ? data.likesCount : 0);
      setComments(Array.isArray(data.comments) ? data.comments : []);
    } catch (err: any) {
      setInteractionsError(String(err?.message ?? err ?? "Failed to load interactions").slice(0, 160));
    } finally {
      setInteractionsLoading(false);
    }
  }, [item, locked]);

  useEffect(() => {
    setLikedByMe(false);
    setLikesCount(0);
    setComments([]);
    setNewComment("");
    setInteractionsError(null);
    void loadInteractions();
  }, [item?.id, loadInteractions]);

  useEffect(() => {
    if (!item) return;
    if (locked) return;

    const intervalId = window.setInterval(() => {
      void loadInteractions();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [item, locked, loadInteractions]);

  useEffect(() => {
    if (!id) return;
    if (!item) return;
    if (!locked) return;

    const redirectUrl = `${userPrefix}/resources/lessons-reports/watch?id=${encodeURIComponent(id)}`;
    router.replace(`${userPrefix}/billing?redirect=${encodeURIComponent(redirectUrl)}`);
  }, [id, item, locked, router, userPrefix]);

  if (!id) {
    notFound();
  }

  if (!item) {
    notFound();
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">{item.title}</h1>
          <p className="text-sm text-slate-400">
            {item.section} · {item.mediaType} · {item.requiredPlan}
          </p>
        </div>

        {locked ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 px-5 py-6 text-sm text-slate-400">
            Redirecting to billing...
          </div>
        ) : item.mediaType === "video" ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4">
            <video
              className="w-full rounded-xl"
              controls
              preload="metadata"
              src={item.href}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-neutral-700 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 transition-colors hover:bg-white/90"
            >
              Download
            </a>
          </div>
        )}

        {!locked && (
          <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Comments</h2>
                  <p className="text-sm text-slate-400">
                    Likes &amp; comments are shared across users.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!item) return;
                    if (locked) return;

                    setInteractionsLoading(true);
                    setInteractionsError(null);
                    api("/api/lessons-reports/interactions", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ id: item.id, action: "toggle_like" }),
                    })
                      .then(async (res) => {
                        if (!res.ok) {
                          const t = await res.text().catch(() => "");
                          throw new Error(t || `request_failed_${res.status}`);
                        }
                        const data = (await res.json()) as InteractionsResponse;
                        setLikedByMe(!!data.likedByMe);
                        setLikesCount(Number.isFinite(data.likesCount) ? data.likesCount : 0);
                        setComments(Array.isArray(data.comments) ? data.comments : []);
                      })
                      .catch((err: any) => {
                        setInteractionsError(
                          String(err?.message ?? err ?? "Failed to update like").slice(0, 160)
                        );
                      })
                      .finally(() => {
                        setInteractionsLoading(false);
                      });
                  }}
                  disabled={interactionsLoading}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                    likedByMe
                      ? "border-red-500/70 bg-red-500/10 text-red-200"
                      : "border-neutral-700 bg-neutral-950 text-slate-100 hover:border-white/60 hover:bg-neutral-900"
                  } ${interactionsLoading ? "opacity-60" : ""}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 ${likedByMe ? "text-red-400" : "text-slate-300"}`}
                    fill={likedByMe ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {likesCount}
                </button>
              </div>

              {interactionsError && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-sm text-red-200">
                  {interactionsError}
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-400">Add a comment</label>
                <textarea
                  className="w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-200 ease-out hover:border-white/60 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40"
                  rows={3}
                  placeholder="Write your comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const text = newComment.trim();
                      if (!text) return;
                      if (!item) return;
                      if (locked) return;

                      setInteractionsLoading(true);
                      setInteractionsError(null);
                      api("/api/lessons-reports/interactions", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ id: item.id, action: "add_comment", text }),
                      })
                        .then(async (res) => {
                          if (!res.ok) {
                            const t = await res.text().catch(() => "");
                            throw new Error(t || `request_failed_${res.status}`);
                          }
                          const data = (await res.json()) as InteractionsResponse;
                          setLikedByMe(!!data.likedByMe);
                          setLikesCount(Number.isFinite(data.likesCount) ? data.likesCount : 0);
                          setComments(Array.isArray(data.comments) ? data.comments : []);
                          setNewComment("");
                        })
                        .catch((err: any) => {
                          setInteractionsError(
                            String(err?.message ?? err ?? "Failed to post comment").slice(0, 160)
                          );
                        })
                        .finally(() => {
                          setInteractionsLoading(false);
                        });
                    }}
                    disabled={interactionsLoading}
                    className="inline-flex items-center rounded-full border border-neutral-700 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 transition-colors hover:bg-white/90"
                  >
                    Post
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {comments.length === 0 ? (
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-4 text-sm text-slate-400">
                    No comments yet.
                  </div>
                ) : (
                  comments.map((c) => {
                    const when = new Date(c.createdAt);
                    const whenText = Number.isNaN(when.getTime())
                      ? c.createdAt
                      : when.toLocaleString();
                    return (
                      <div
                        key={c.id}
                        className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium text-slate-100">{c.author}</div>
                          <div className="text-xs text-slate-500">{whenText}</div>
                        </div>
                        <div className="mt-2 whitespace-pre-wrap text-sm text-slate-200">
                          {c.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
