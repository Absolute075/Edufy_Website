

'use client';

import { useState, useEffect } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email.trim());
  const isPasswordValid = password.length >= 8;
  const isFormValid = isEmailValid && isPasswordValid;

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const res = await fetch('/auth/me', { credentials: 'include' });
        if (!res.ok || cancelled) return;

        const go = sessionStorage.getItem('postLoginRedirect');
        if (go) {
          sessionStorage.removeItem('postLoginRedirect');
          window.location.href = go;
          return;
        }
        window.location.href = 'https://dash.edufyuzbekistan.com/';
      } catch {
        // ignore
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        email: email.trim(),
        password,
        rememberMe: !!rememberMe,
      };

      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const go = sessionStorage.getItem('postLoginRedirect');
      if (go) {
        sessionStorage.removeItem('postLoginRedirect');
        window.location.href = go;
        return;
      }

      window.location.href = 'https://dash.edufyuzbekistan.com/';
    } catch (err: any) {
      alert(err?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#050509] text-white overflow-hidden flex items-center justify-center px-4">
      {/* Glowing circles background */}
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
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">Yooo, welcome back!</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-black/50 border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 focus:ring-0"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-black/50 border border-white/15 px-3 pr-10 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 focus:ring-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.59A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.59" />
                    <path d="M9.88 5.51A9.77 9.77 0 0 1 12 5c4.55 0 8.44 2.94 10 7-0.34.96-.86 1.84-1.51 2.62" />
                    <path d="M6.61 6.61C4.27 7.76 2.56 9.61 2 12c.56 2.39 2.27 4.24 4.61 5.39A10.52 10.52 0 0 0 12 19c1.07 0 2.11-.14 3.11-.39" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s2.5-7 10-7 10 7 10 7-2.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3 w-3 rounded border border-white/30 bg-black/40 text-white focus:ring-0 focus:outline-none"
              />
              <span>Remember me</span>
            </label>
            <a
              href="/reset_password"
              className="text-[11px] text-gray-300 hover:text-white transition-colors"
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="mt-2 w-full rounded-full border border-white/25 bg-white text-gray-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] shadow-[0_0_20px_rgba(255,255,255,0.35)] hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sign In
          </button>

          <p className="mt-3 text-[11px] text-gray-500 text-center leading-relaxed">
            You acknowledge that you read, and agree, to our{' '}
            <a
              href="/terms-of-service"
              className="text-gray-300 underline underline-offset-2 hover:text-white transition-colors"
            >
              Terms of Service
            </a>
            ,{' '}
            <a
              href="/privacy-policy"
              className="text-gray-300 underline underline-offset-2 hover:text-white transition-colors"
            >
              Privacy Policy
            </a>{' '}
            and{' '}
            <a
              href="/cookies-policy"
              className="text-gray-300 underline underline-offset-2 hover:text-white transition-colors"
            >
              Cookies Policy
            </a>
          </p>
        </form>

        <p className="mt-5 text-xs text-gray-400 text-center">
          Don&apos;t have an account?{' '}
          <a
            href="/register"
            className="text-gray-100 underline underline-offset-2 hover:text-white transition-colors"
          >
            Sign Up
          </a>
        </p>
      </div>
    </main>
  );
}
