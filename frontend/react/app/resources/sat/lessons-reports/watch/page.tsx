"use client";

import { notFound, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { isPlanSufficient } from "@/lib/resourcesRegistry";
import { satVideoResourcesRegistry } from "@/lib/satVideoResourcesRegistry";
import { useUserProfile } from "../../../../UserProfileProvider";
import { api } from "@/lib/api";
import Hls from "hls.js";
import { ProtectedPdfViewer } from "@/components/pdf/ProtectedPdfViewer";

type StoredComment = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  parentId?: string | null;
  canDelete?: boolean;
};

type InteractionsResponse = {
  id: string;
  likesCount: number;
  likedByMe: boolean;
  comments: StoredComment[];
};

function pluralEn(n: number, unit: string) {
  return n === 1 ? unit : `${unit}s`;
}

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return "less than a minute ago";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin} ${pluralEn(diffMin, "minute")} ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `${diffHours} ${pluralEn(diffHours, "hour")} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} ${pluralEn(diffDays, "day")} ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {
    return `${diffWeeks} ${pluralEn(diffWeeks, "week")} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} ${pluralEn(diffMonths, "month")} ago`;
  }

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} ${pluralEn(diffYears, "year")} ago`;
}

function formatTimeShort(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function CustomVideoPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const scrubRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const scrubbingRef = useRef(false);
  const hlsRef = useRef<Hls | null>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [volumeOpen, setVolumeOpen] = useState(false);

  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const bufferedProgress = duration > 0 ? Math.min(1, Math.max(0, buffered / duration)) : 0;

  function syncFromVideo() {
    const v = ref.current;
    if (!v) return;
    setPlaying(!v.paused);
    setDuration(Number.isFinite(v.duration) ? v.duration : 0);
    setCurrentTime(Number.isFinite(v.currentTime) ? v.currentTime : 0);
    setMuted(v.muted);
    setVolume(Number.isFinite(v.volume) ? v.volume : 1);

    try {
      const b = v.buffered;
      if (b && b.length > 0 && Number.isFinite(v.duration)) {
        const end = b.end(b.length - 1);
        setBuffered(Number.isFinite(end) ? end : 0);
      } else {
        setBuffered(0);
      }
    } catch {
      setBuffered(0);
    }
  }

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (!playing) return;
    if (scrubbingRef.current) return;
    if (volumeOpen) return;

    hideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 2200);
  }, [playing, volumeOpen]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    setReady(false);
    setBuffering(true);
    setPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    setBuffered(0);

    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {
        // ignore
      }
      hlsRef.current = null;
    }

    try {
      v.removeAttribute("src");
      v.load();
    } catch {
      // ignore
    }

    const isHls = /\.m3u8($|\?)/i.test(src);
    if (isHls) {
      const canNative = Boolean(v.canPlayType("application/vnd.apple.mpegurl"));
      if (canNative) {
        v.src = src;
      } else if (Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr: XMLHttpRequest) => {
            xhr.withCredentials = true;
          },
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(v);
      } else {
        v.src = src;
      }
    } else {
      v.src = src;
    }

    const onLoaded = () => {
      setReady(true);
      syncFromVideo();
    };
    const onTime = () => syncFromVideo();
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onLoadStart = () => setBuffering(true);
    const onSeeking = () => setBuffering(true);
    const onSeeked = () => setBuffering(false);
    const onStalled = () => setBuffering(true);
    const onVol = () => {
      const vv = ref.current;
      if (!vv) return;
      setMuted(vv.muted);
      setVolume(vv.volume);
    };
    const onProgress = () => syncFromVideo();
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onCanPlay = () => setBuffering(false);

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("loadstart", onLoadStart);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("seeking", onSeeking);
    v.addEventListener("seeked", onSeeked);
    v.addEventListener("stalled", onStalled);
    v.addEventListener("volumechange", onVol);
    v.addEventListener("progress", onProgress);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("canplay", onCanPlay);

    return () => {
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch {
          // ignore
        }
        hlsRef.current = null;
      }
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("loadstart", onLoadStart);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("seeking", onSeeking);
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("stalled", onStalled);
      v.removeEventListener("volumechange", onVol);
      v.removeEventListener("progress", onProgress);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("canplay", onCanPlay);
    };
  }, [src]);

  useEffect(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [playing, scheduleHide]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, []);

  function togglePlay() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
    } else {
      v.pause();
    }
  }

  function seekTo(p: number) {
    const v = ref.current;
    if (!v) return;
    const d = Number.isFinite(v.duration) ? v.duration : 0;
    if (d <= 0) return;
    v.currentTime = Math.max(0, Math.min(d, p * d));
  }

  function seekToClientX(clientX: number) {
    const bar = scrubRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const p = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
    seekTo(Math.max(0, Math.min(1, p)));
  }

  function setVol(next: number) {
    const v = ref.current;
    if (!v) return;
    const clamped = Math.max(0, Math.min(1, next));
    v.volume = clamped;
    if (clamped > 0 && v.muted) v.muted = false;
  }

  function toggleMute() {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
  }

  async function toggleFullscreen() {
    const v = ref.current;
    if (!v) return;
    const el = v.parentElement;
    if (!el) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // ignore
    }
  }

  return (
    <div
      ref={wrapperRef}
      className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-black"
      onMouseMove={() => showControls()}
      onMouseDown={() => showControls()}
      onTouchStart={() => showControls()}
      onMouseLeave={() => {
        if (playing) setControlsVisible(false);
      }}
    >
      <video
        ref={ref}
        className="block w-full"
        preload="metadata"
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => {
          showControls();
          togglePlay();
        }}
        onDoubleClick={() => {
          showControls();
          void toggleFullscreen();
        }}
      />

      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          playing ? "opacity-0" : "opacity-100"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            showControls();
            togglePlay();
          }}
          className="pointer-events-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white shadow-[0_12px_60px_rgba(0,0,0,0.55)] backdrop-blur-sm transition-transform duration-200 hover:scale-105"
          aria-label="Play"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
            <path d="M8 5v14l11-7z" className="fill-current" />
          </svg>
        </button>
      </div>

      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          buffering ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="pointer-events-none h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-white/90" />
      </div>

      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent px-4 pb-4 pt-10 transition-all duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="pointer-events-auto">
          <div
            ref={scrubRef}
            className="group/scrub relative mb-3 h-2 cursor-pointer rounded-full bg-white/15 transition-all duration-200 hover:h-3"
            onPointerDown={(e) => {
              (e.currentTarget as any).setPointerCapture?.(e.pointerId);
              scrubbingRef.current = true;
              setControlsVisible(true);
              seekToClientX(e.clientX);
            }}
            onPointerMove={(e) => {
              if (!scrubbingRef.current) return;
              seekToClientX(e.clientX);
            }}
            onPointerUp={() => {
              scrubbingRef.current = false;
              scheduleHide();
            }}
            onPointerCancel={() => {
              scrubbingRef.current = false;
              scheduleHide();
            }}
            aria-label="Seek"
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/25"
              style={{ width: `${bufferedProgress * 100}%` }}
            />
            <div className="absolute inset-y-0 left-0 rounded-full bg-red-500" style={{ width: `${progress * 100}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 rounded-full bg-red-500 opacity-0 shadow-[0_0_0_4px_rgba(239,68,68,0.25)] transition-opacity duration-150 group-hover/scrub:opacity-100"
              style={{ left: `${progress * 100}%`, width: "12px", height: "12px", marginLeft: "-6px" }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                showControls();
                togglePlay();
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/15"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" rx="1" className="fill-current" />
                  <rect x="14" y="5" width="4" height="14" rx="1" className="fill-current" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path d="M8 5v14l11-7z" className="fill-current" />
                </svg>
              )}
            </button>

            <div className="flex items-center gap-2 text-[11px] font-medium text-white/80">
              <span className="tabular-nums">{formatTimeShort(currentTime)}</span>
              <span className="text-white/45">/</span>
              <span className="tabular-nums">{ready ? formatTimeShort(duration) : "0:00"}</span>
            </div>

            <div className="flex-1" />

            <div
              className="relative hidden items-center md:flex"
              onMouseEnter={() => {
                setVolumeOpen(true);
                setControlsVisible(true);
              }}
              onMouseLeave={() => {
                setVolumeOpen(false);
                scheduleHide();
              }}
            >
              <button
                type="button"
                onClick={() => {
                  showControls();
                  toggleMute();
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/15"
                aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
              >
                {muted || volume === 0 ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path
                      d="M11 5L6 9H3v6h3l5 4V5z"
                      className="fill-none stroke-current"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path d="M16 9l5 6" className="fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M21 9l-5 6" className="fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path
                      d="M11 5L6 9H3v6h3l5 4V5z"
                      className="fill-none stroke-current"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 9.5a4.5 4.5 0 0 1 0 5"
                      className="fill-none stroke-current"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M17.5 7a8 8 0 0 1 0 10"
                      className="fill-none stroke-current"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>

              <div
                className={`absolute bottom-12 right-0 w-36 rounded-2xl border border-white/10 bg-black/70 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-md transition-all duration-200 ${
                  volumeOpen ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
                }`}
              >
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round((muted ? 0 : volume) * 100)}
                  onChange={(e) => setVol(Number(e.target.value) / 100)}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20"
                  style={{
                    background: `linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.18) ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.18) 100%)`,
                  }}
                  aria-label="Volume"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                showControls();
                void toggleFullscreen();
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/15"
              aria-label="Fullscreen"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"
                  className="fill-none stroke-current"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SatLessonsReportsWatchPage() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  const id = (searchParams.get("id") || "").trim();

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";

  const { data: profileData, loading: profileLoading } = useUserProfile();
  const accessCheckPending = profileLoading && !profileData;
  const userPlan = profileData?.plan ?? "free";

  const [likedByMe, setLikedByMe] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [comments, setComments] = useState<StoredComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToAuthor, setReplyToAuthor] = useState<string | null>(null);
  const [interactionsLoading, setInteractionsLoading] = useState<boolean>(false);
  const [interactionsError, setInteractionsError] = useState<string | null>(null);

  const item = useMemo(() => {
    if (!id) return null;
    const rule = satVideoResourcesRegistry[id];
    if (!rule) return null;
    return { id, ...rule };
  }, [id]);

  const locked = item ? (!accessCheckPending && !isPlanSufficient(userPlan, item.requiredPlan)) : false;

  const [streamSrc, setStreamSrc] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  const loadInteractions = useCallback(async () => {
    if (!item) return;
    if (locked) return;

    setInteractionsLoading(true);
    setInteractionsError(null);
    try {
      const res = await api(
        `/api/lessons-reports/interactions?catalog=sat&id=${encodeURIComponent(item.id)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

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

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!item) return;
      if (locked) return;
      const idToDelete = String(commentId || "").trim();
      if (!idToDelete) return;

      if (!window.confirm("Delete this comment?")) return;

      setInteractionsLoading(true);
      setInteractionsError(null);
      try {
        const res = await api("/api/lessons-reports/interactions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ catalog: "sat", id: item.id, action: "delete_comment", commentId: idToDelete }),
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
        setInteractionsError(String(err?.message ?? err ?? "Failed to delete comment").slice(0, 160));
      } finally {
        setInteractionsLoading(false);
      }
    },
    [item, locked]
  );

  useEffect(() => {
    setLikedByMe(false);
    setLikesCount(0);
    setComments([]);
    setNewComment("");
    setReplyToId(null);
    setReplyToAuthor(null);
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
    setStreamSrc(null);
    setStreamError(null);
    if (!item) return;
    if (accessCheckPending) return;
    if (locked) return;
    if (item.mediaType !== "video") return;
    if (!item.href) return;

    const ctrl = new AbortController();
    api("/api/video/token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ catalog: "sat", id: item.id }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `token_failed_${res.status}`);
        }
        const data: any = await res.json().catch(() => null);
        const token = String(data?.token || "").trim();
        if (!token) throw new Error("token_missing");
        const url = `/api/video/hls?catalog=sat&id=${encodeURIComponent(item.id)}&token=${encodeURIComponent(token)}`;
        setStreamSrc(url);
      })
      .catch((err: any) => {
        if (String(err?.name || "") === "AbortError") return;
        setStreamError(String(err?.message ?? err ?? "Failed to load video").slice(0, 160));
      });

    return () => {
      ctrl.abort();
    };
  }, [accessCheckPending, item, locked]);

  useEffect(() => {
    if (!id) return;
    if (!item) return;
    if (accessCheckPending) return;
    if (!locked) return;

    const redirectUrl = `${userPrefix}/resources/sat/lessons-reports/watch?id=${encodeURIComponent(id)}`;
    router.replace(`${userPrefix}/billing?redirect=${encodeURIComponent(redirectUrl)}`);
  }, [accessCheckPending, id, item, locked, router, userPrefix]);

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
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold">{item.title}</h1>
            {item.telegramHref ? (
              <a
                href={item.telegramHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950/60 text-slate-200 transition-colors hover:bg-neutral-900 hover:text-white"
                aria-label="Open Telegram"
                title="Telegram"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M21.7 4.3c.5-2-1.3-3.2-3.2-2.5L3.8 7.6c-2 .8-1.9 2.1-.4 2.6l3.8 1.2 1.5 4.8c.2.6.1.9.7.9.5 0 .7-.2 1-.5l2-1.9 4.2 3.1c.8.4 1.3.2 1.5-.7l3.6-16.1zM8.1 11l10.6-6.7c.5-.3.9-.1.6.2L10.4 12c-.3.3-.6.6-.6 1l-.2 2.2-.6-2c-.1-.4-.4-.7-.9-.8L5.3 10.7c-.5-.2-.5-.6.1-.8l13-5c.5-.2.9 0 .7.6L15.8 17c-.1.5-.4.6-.8.4l-4.7-3.5c-.3-.2-.3-.5 0-.7l8.6-8.2c.2-.2 0-.3-.2-.2l-10.6 6.2z"
                    className="fill-current"
                  />
                </svg>
              </a>
            ) : null}
          </div>
          <p className="text-sm text-slate-400">
            SAT · {item.section} · {item.mediaType}
            {item.teacher ? <> · {item.teacher}</> : null} · {item.requiredPlan}
          </p>
        </div>

        {accessCheckPending ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 px-5 py-6 text-sm text-slate-400">
            Loading...
          </div>
        ) : locked ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 px-5 py-6 text-sm text-slate-400">
            Redirecting to billing...
          </div>
        ) : item.mediaType === "video" ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4">
            {streamError ? (
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-4 text-sm text-red-200">
                {streamError}
              </div>
            ) : streamSrc ? (
              <CustomVideoPlayer src={streamSrc} />
            ) : (
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-4 text-sm text-slate-400">
                Loading video...
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
            {item.href ? (
              <ProtectedPdfViewer catalog="sat" id={item.id} />
            ) : (
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-4 text-sm text-slate-400">
                File URL is missing.
              </div>
            )}
          </div>
        )}

        {!accessCheckPending && !locked && (
          <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Comments</h2>
                  <p className="text-sm text-slate-400">Likes &amp; comments are shared across users.</p>
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
                      body: JSON.stringify({ catalog: "sat", id: item.id, action: "toggle_like" }),
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
                        setInteractionsError(String(err?.message ?? err ?? "Failed to update like").slice(0, 160));
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

                {replyToId && replyToAuthor && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-sm text-slate-200">
                    <div className="min-w-0">
                      Replying to <span className="font-semibold">{replyToAuthor}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyToId(null);
                        setReplyToAuthor(null);
                      }}
                      className="inline-flex items-center rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-neutral-800"
                    >
                      Cancel
                    </button>
                  </div>
                )}

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
                        body: JSON.stringify({
                          catalog: "sat",
                          id: item.id,
                          action: "add_comment",
                          text,
                          parentId: replyToId,
                        }),
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
                          setReplyToId(null);
                          setReplyToAuthor(null);
                        })
                        .catch((err: any) => {
                          setInteractionsError(String(err?.message ?? err ?? "Failed to post comment").slice(0, 160));
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
                  <div className="text-sm text-slate-400">No comments yet.</div>
                ) : (
                  (() => {
                    const list = Array.isArray(comments) ? comments : [];
                    const top = list
                      .filter((c) => !c.parentId)
                      .slice()
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                    function repliesFor(parentId: string) {
                      return list
                        .filter((c) => c.parentId === parentId)
                        .slice()
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    }

                    return top.map((c) => {
                      const whenText = formatRelativeTime(c.createdAt);
                      const replies = repliesFor(c.id);
                      const canDelete = Boolean(c.canDelete);
                      return (
                        <div key={c.id} className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-medium text-slate-100">{c.author}</div>
                            <div className="text-xs text-slate-500">{whenText}</div>
                          </div>
                          <div className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{c.text}</div>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyToId(c.id);
                                  setReplyToAuthor(c.author);
                                }}
                                className="inline-flex items-center rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-neutral-800"
                              >
                                Reply
                              </button>
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => void deleteComment(c.id)}
                                  className="inline-flex items-center rounded-lg border border-red-500/50 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-200 hover:bg-red-500/15"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                            {replies.length > 0 && <div className="text-xs text-slate-500">{replies.length} replies</div>}
                          </div>

                          {replies.length > 0 && (
                            <div className="mt-4 space-y-3 border-l border-neutral-800 pl-4">
                              {replies.map((r) => (
                                <div
                                  key={r.id}
                                  className="rounded-xl border border-neutral-800 bg-neutral-950/50 px-4 py-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm font-medium text-slate-100">{r.author}</div>
                                    <div className="text-xs text-slate-500">{formatRelativeTime(r.createdAt)}</div>
                                  </div>
                                  <div className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{r.text}</div>
                                  <div className="mt-3 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyToId(c.id);
                                        setReplyToAuthor(c.author);
                                      }}
                                      className="inline-flex items-center rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-neutral-800"
                                    >
                                      Reply
                                    </button>
                                    {Boolean(r.canDelete) && (
                                      <button
                                        type="button"
                                        onClick={() => void deleteComment(r.id)}
                                        className="inline-flex items-center rounded-lg border border-red-500/50 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-200 hover:bg-red-500/15"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
