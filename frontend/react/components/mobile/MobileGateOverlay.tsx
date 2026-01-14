"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  videoSrc?: string;
};

export function MobileGateOverlay({ videoSrc }: Props) {
  const src = useMemo(() => String(videoSrc || "").trim(), [videoSrc]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [phase, setPhase] = useState<"video" | "message">(src ? "video" : "message");

  useEffect(() => {
    if (!src) {
      setPhase("message");
      return;
    }

    setPhase("video");

    const v = videoRef.current;
    if (!v) return;

    let cancelled = false;

    const tryPlay = async () => {
      try {
        const p = v.play();
        if (p && typeof (p as any).then === "function") {
          await p;
        }
      } catch {
        if (!cancelled) setPhase("message");
      }
    };

    tryPlay();

    const onEnded = () => {
      if (!cancelled) setPhase("message");
    };
    const onError = () => {
      if (!cancelled) setPhase("message");
    };

    v.addEventListener("ended", onEnded);
    v.addEventListener("error", onError);

    return () => {
      cancelled = true;
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("error", onError);
    };
  }, [src]);

  return (
    <div className="mobile-gate-root">
      {phase === "video" ? (
        <video
          ref={videoRef}
          className="mobile-gate-video"
          src={src}
          autoPlay
          muted
          playsInline
          preload="auto"
          controls={false}
        />
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
        }

        .mobile-gate-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: #000;
        }

        .mobile-gate-message {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          opacity: 0;
          transform: translateY(10px);
          filter: blur(10px);
          transition: opacity 2200ms cubic-bezier(0.12, 0.8, 0.2, 1),
            transform 2200ms cubic-bezier(0.12, 0.8, 0.2, 1),
            filter 2400ms cubic-bezier(0.12, 0.8, 0.2, 1);
        }

        .mobile-gate-message.is-visible {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
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
