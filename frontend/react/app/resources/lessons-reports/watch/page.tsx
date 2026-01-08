"use client";

import { notFound, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { isPlanSufficient } from "@/lib/resourcesRegistry";
import { videoResourcesRegistry } from "@/lib/videoResourcesRegistry";
import { useUserProfile } from "../../../UserProfileProvider";

type LocalComment = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
};

function storageKeyLikes(materialId: string) {
  return `edufy:lessons-reports:likes:${materialId}`;
}

function storageKeyComments(materialId: string) {
  return `edufy:lessons-reports:comments:${materialId}`;
}

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

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
  const displayName = profileData?.username?.trim() || "User";

  const [likedByMe, setLikedByMe] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [newComment, setNewComment] = useState("");

  const item = useMemo(() => {
    if (!id) return null;
    const rule = videoResourcesRegistry[id];
    if (!rule) return null;
    return { id, ...rule };
  }, [id]);

  const locked = item ? !isPlanSufficient(userPlan, item.requiredPlan) : false;

  useEffect(() => {
    if (!item) return;

    const likesState = safeParseJson<{ likedByMe: boolean; likesCount: number }>(
      window.localStorage.getItem(storageKeyLikes(item.id)),
      { likedByMe: false, likesCount: 0 }
    );
    setLikedByMe(!!likesState.likedByMe);
    setLikesCount(Number.isFinite(likesState.likesCount) ? likesState.likesCount : 0);

    const storedComments = safeParseJson<LocalComment[]>(
      window.localStorage.getItem(storageKeyComments(item.id)),
      []
    );
    setComments(Array.isArray(storedComments) ? storedComments : []);
    setNewComment("");
  }, [item?.id]);

  useEffect(() => {
    if (!item) return;
    window.localStorage.setItem(
      storageKeyLikes(item.id),
      JSON.stringify({ likedByMe, likesCount })
    );
  }, [item?.id, likedByMe, likesCount]);

  useEffect(() => {
    if (!item) return;
    window.localStorage.setItem(storageKeyComments(item.id), JSON.stringify(comments));
  }, [comments, item?.id]);

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
                    Likes &amp; comments are saved on this device.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLikedByMe((prev) => {
                      const next = !prev;
                      setLikesCount((c) => {
                        const safe = Number.isFinite(c) ? c : 0;
                        return Math.max(0, safe + (next ? 1 : -1));
                      });
                      return next;
                    });
                  }}
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                    likedByMe
                      ? "border-white/70 bg-white text-slate-900"
                      : "border-neutral-700 bg-neutral-950 text-slate-100 hover:border-white/60 hover:bg-neutral-900"
                  }`}
                >
                  Like ({likesCount})
                </button>
              </div>

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
                      const next: LocalComment = {
                        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                        text,
                        author: displayName,
                        createdAt: new Date().toISOString(),
                      };
                      setComments((prev) => [next, ...prev]);
                      setNewComment("");
                    }}
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
