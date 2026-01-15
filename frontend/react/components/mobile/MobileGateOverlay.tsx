"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  videoSrc?: string;
};

export function MobileGateOverlay({ videoSrc }: Props) {
  const src = useMemo(() => String(videoSrc || "").trim(), [videoSrc]);
  const sourceType = useMemo(() => {
    const s = src.toLowerCase();
    if (s.endsWith(".mp4")) return "video/mp4";
    if (s.endsWith(".webm")) return "video/webm";
    if (s.endsWith(".ogv") || s.endsWith(".ogg")) return "video/ogg";
    return undefined;
  }, [src]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [phase, setPhase] = useState<"video" | "message">(src ? "video" : "message");
  const [soundBlocked, setSoundBlocked] = useState<boolean>(false);
  const [playFailed, setPlayFailed] = useState<boolean>(false);

  const enableSound = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;

    try {
      v.muted = false;
      v.volume = 1;
    } catch {
      // ignore
    }

    try {
      const p = v.play();
      if (p && typeof (p as any).then === "function") {
        p.then(() => {
          setSoundBlocked(false);
        }).catch(() => {
          setSoundBlocked(true);
        });
        return;
      }

      // Some browsers return void; assume success if we managed to call play()
      setSoundBlocked(false);
    } catch {
      setSoundBlocked(true);
    }
  }, []);

  useEffect(() => {
    if (!src) {
      setPhase("message");
      return;
    }

    setPhase("video");
    setPlayFailed(false);
    setSoundBlocked(true);

    const v = videoRef.current;
    if (!v) return;

    let cancelled = false;

    const tryPlay = async () => {
      try {
        v.muted = true;
        v.defaultMuted = true;
        v.volume = 0;

        try {
          v.load();
        } catch {
          // ignore
        }

        const p = v.play();
        if (p && typeof (p as any).then === "function") {
          await p;
        }
      } catch {
        if (!cancelled) setPlayFailed(true);
      }
    };

    tryPlay();

    const onEnded = () => {
      if (!cancelled) setPhase("message");
    };
    const onError = () => {
      if (!cancelled) setPlayFailed(true);
    };

    v.addEventListener("ended", onEnded);
    v.addEventListener("error", onError);

    return () => {
      cancelled = true;
      try {
        v.pause();
      } catch {
        // ignore
      }
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("error", onError);
    };
  }, [src]);

  useEffect(() => {
    if (phase !== "video") return;
    if (!soundBlocked) return;

    let done = false;
    const onFirstGesture = () => {
      if (done) return;
      done = true;
      enableSound();
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
      window.removeEventListener("click", onFirstGesture);
    };

    window.addEventListener("pointerdown", onFirstGesture, { passive: true });
    window.addEventListener("touchstart", onFirstGesture, { passive: true });
    window.addEventListener("click", onFirstGesture);

    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
      window.removeEventListener("click", onFirstGesture);
    };
  }, [enableSound, phase, soundBlocked]);

  return (
    <div className="mobile-gate-root">
      {phase === "video" ? (
        <video
          ref={videoRef}
          className="mobile-gate-video"
          muted
          autoPlay
          playsInline
          preload="auto"
          controls={playFailed}
        >
          <source src={src} type={sourceType} />
        </video>
      ) : null}

      {phase === "video" && soundBlocked ? (
        <button
          type="button"
          className="mobile-gate-sound"
          onPointerDown={enableSound}
          onTouchStart={enableSound}
          onClick={enableSound}
        >
          Enable sound
        </button>
      ) : null}

      <div className={`mobile-gate-message${phase === "message" ? " is-visible" : ""}`}>
        <div className="mobile-gate-message-inner">
          <div className="mobile-gate-line mobile-gate-line-1">Exactly...</div>
          <div className="mobile-gate-line mobile-gate-line-2">Try use the PC to win</div>
        </div>
      </div>

      <style jsx>{`
        .mobile-gate-root {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        video.mobile-gate-video {
          position: relative;
          z-index: 1;
          width: min(92vw, 520px);
          height: auto;
          max-height: 72vh;
          aspect-ratio: 16 / 9;
          object-fit: contain;
          background: #000;
          border-radius: 14px;
          display: block;
        }

        .mobile-gate-sound {
          position: absolute;
          z-index: 5;
          left: 50%;
          bottom: 22px;
          transform: translateX(-50%);
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: rgba(0, 0, 0, 0.65);
          color: rgba(255, 255, 255, 0.92);
          padding: 10px 14px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }

        .mobile-gate-message {
          position: absolute;
          inset: 0;
          z-index: 4;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          opacity: 0;
          transform: translateY(10px);
          filter: blur(10px);
          pointer-events: none;
          transition: opacity 2200ms cubic-bezier(0.12, 0.8, 0.2, 1),
            transform 2200ms cubic-bezier(0.12, 0.8, 0.2, 1),
            filter 2400ms cubic-bezier(0.12, 0.8, 0.2, 1);
        }

        .mobile-gate-message.is-visible {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
          pointer-events: auto;
        }

        .mobile-gate-message-inner {
          width: min(92vw, 540px);
          padding: 28px 18px;
          text-align: center;
        }

        .mobile-gate-line {
          color: rgba(255, 255, 255, 0.92);
          letter-spacing: -0.02em;
        }

        .mobile-gate-line-1 {
          font-size: 28px;
          font-weight: 700;
          line-height: 1.15;
        }

        .mobile-gate-line-2 {
          margin-top: 10px;
          font-size: 16px;
          font-weight: 500;
          color: rgba(226, 232, 240, 0.85);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
