"use client";

import { useEffect, useMemo, useState } from "react";

export default function VerificationPage() {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success" | null>(null);

  useEffect(() => {
    try {
      const e = window.sessionStorage.getItem("pendingVerificationEmail") || "";
      if (e) setEmail(e);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (resendCooldownSeconds <= 0) return;
    const t = window.setInterval(() => {
      setResendCooldownSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [resendCooldownSeconds]);

  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);
  const isEmailValid = emailRegex.test(email.trim());
  const isCodeValid = verificationCode.length === 6;

  const resendLabel = useMemo(() => {
    if (resendCooldownSeconds <= 0) return "Resend code";
    const mm = String(Math.floor(resendCooldownSeconds / 60)).padStart(2, "0");
    const ss = String(resendCooldownSeconds % 60).padStart(2, "0");
    return `Resend in ${mm}:${ss}`;
  }, [resendCooldownSeconds]);

  const handleVerify = async (e: any) => {
    e.preventDefault();
    setMessage(null);
    setMessageType(null);

    if (!isEmailValid) {
      setMessage("Please enter a valid email address.");
      setMessageType("error");
      return;
    }
    if (!isCodeValid) {
      setMessage("Please enter the 6-digit verification code.");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/auth/verify-email-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: verificationCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.accessToken) {
        throw new Error(data.message || "Failed to verify email");
      }

      try {
        window.sessionStorage.removeItem("pendingVerificationEmail");
      } catch {
        // ignore
      }

      try {
        const meRes = await fetch("/auth/me", { credentials: "include" });
        if (meRes.ok) {
          const me = await meRes.json().catch(() => null as any);
          const rawId = me && (me.publicId ?? me.id ?? null);
          if (rawId != null) {
            const key = String(rawId).padStart(12, "0");
            try {
              window.sessionStorage.setItem("edufy.user.key", key);
              window.localStorage.setItem("edufy.user.key", key);
              (window as any).__edufyUserKey = key;
            } catch {
              // ignore
            }
            window.location.href = `https://dash.edufyuzbekistan.com/${key}/dashboard`;
            return;
          }
        }
      } catch {
        // ignore
      }

      window.location.href = "https://dash.edufyuzbekistan.com/";
    } catch (err: any) {
      setMessage(err?.message || "Failed to verify email");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setMessage(null);
    setMessageType(null);
    if (!isEmailValid) {
      setMessage("Please register again to verify your email.");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to resend verification code");
      }
      setResendCooldownSeconds(120);
      setMessage(null);
      setMessageType(null);
    } catch (err: any) {
      setMessage(err?.message || "Failed to resend verification code");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const messageClassName =
    messageType === "success" ? "text-green-400" : messageType === "error" ? "text-red-400" : "text-gray-400";

  return (
    <main className="relative min-h-screen bg-[#050509] text-white overflow-hidden flex items-center justify-center px-4">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-white opacity-30 blur-[140px]" />
      <div className="pointer-events-none absolute -left-40 -bottom-40 h-[28rem] w-[28rem] rounded-full bg-white opacity-30 blur-[140px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            <img
              src="https://resources.edufyuzbekistan.com/storage/images/favicon.png"
              alt="Edufy logo"
              width={80}
              height={80}
              className="rounded-2xl"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">Enter verification code</h1>
          <p className="mt-1 text-sm text-gray-400 text-center">Enter the 6-digit code we sent to your email.</p>
        </div>

        <form className="space-y-4" onSubmit={handleVerify}>
          <div className="space-y-1.5">
            <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-xl bg-black/50 border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 focus:ring-0 tracking-[0.35em] text-center"
            />
            <p className="text-[11px] text-gray-500 mt-1">6-digit code from your email.</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isEmailValid || !isCodeValid}
            className="mt-2 w-full rounded-full border border-white/25 bg-white text-gray-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] shadow-[0_0_20px_rgba(255,255,255,0.35)] hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Verifying..." : "Verify"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={isSubmitting || !isEmailValid || resendCooldownSeconds > 0}
            className="w-full rounded-full border border-white/25 bg-transparent text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {resendLabel}
          </button>

          {message && <p className={`mt-2 text-sm text-center ${messageClassName}`}>{message}</p>}
        </form>

        <p className="mt-5 text-xs text-gray-400 text-center">
          Already verified?{" "}
          <a href="/login" className="text-gray-100 underline underline-offset-2 hover:text-white transition-colors">
            Sign In
          </a>
        </p>
      </div>
    </main>
  );
}
