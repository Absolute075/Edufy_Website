'use client';

import { useState } from 'react';
import { usePageTitle } from '../lib/usePageTitle';

export default function RegisterPage() {
  usePageTitle('Edufy – Register');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'success' | 'warning' | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email.trim());
  const isUsernameValid = username.trim().length > 0;
  const isPasswordValid = password.length >= 8;
  const isPasswordMatch = password === confirmPassword && confirmPassword.length > 0;
  const isRoleValid = !!role;

  const isFormValid =
    isUsernameValid &&
    isEmailValid &&
    isPasswordValid &&
    isPasswordMatch &&
    isRoleValid;

  const getPasswordStrength = (value: string) => {
    if (!value) {
      return { score: 0, label: 'Enter password', level: '' as const };
    }

    let score = 0;
    const hasMinLength = value.length >= 8;
    const hasLower = /[a-z]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);

    if (hasMinLength) score++;
    if (hasLower) score++;
    if (hasUpper) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    if (score <= 1) {
      return { score, label: 'Very weak', level: 'very-weak' as const };
    }
    if (score === 2) {
      return { score, label: 'Weak', level: 'weak' as const };
    }
    if (score === 3) {
      return { score, label: 'Medium', level: 'medium' as const };
    }
    return { score, label: 'Strong', level: 'strong' as const };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setMessage(null);
    setMessageType(null);

    try {
      const payload = {
        username: username.trim(),
        email: email.trim(),
        password,
        role,
      };

      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setMessage(data.message || 'Registration successful! Logging you in...');
      setMessageType('success');

      try {
        const loginRes = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const loginData = await loginRes.json().catch(() => ({}));

        if (!loginRes.ok || !loginData.accessToken) {
          throw new Error(loginData.message || 'Auto-login failed');
        }

        try {
          localStorage.setItem('accessToken', loginData.accessToken);
          if (loginData.refreshToken) localStorage.setItem('refreshToken', loginData.refreshToken);
          localStorage.setItem('email', email.trim());
          if (role) localStorage.setItem('role', role);
        } catch {
          // ignore storage errors
        }

        try {
          const meRes = await fetch('/auth/me', { credentials: 'include' });
          if (meRes.ok) {
            const me = await meRes.json().catch(() => null as any);
            const rawId = me && (me.publicId ?? me.id ?? null);
            try {
              if (typeof window !== 'undefined' && rawId != null) {
                const key = String(rawId).padStart(12, '0');
                window.sessionStorage.setItem('edufy.user.key', key);
                window.localStorage.setItem('edufy.user.key', key);
                (window as any).__edufyUserKey = key;
              }
            } catch {
              // ignore storage errors
            }
            if (rawId != null) {
              const key = String(rawId).padStart(12, '0');
              window.location.href = `https://dash.edufyuzbekistan.com/${key}/dashboard`;
              return;
            }
          }
        } catch {
          // ignore and fallback below
        }

        window.location.href = 'https://dash.edufyuzbekistan.com/';
      } catch (autoErr: any) {
        setMessage('Registered. Please log in to continue.');
        setMessageType('warning');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1200);
      }
    } catch (err: any) {
      setMessage(err?.message || 'Registration failed');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const messageClassName =
    messageType === 'success'
      ? 'text-green-400'
      : messageType === 'warning'
      ? 'text-yellow-400'
      : messageType === 'error'
      ? 'text-red-400'
      : 'text-gray-400';

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
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">Join Edufy</h1>
          <p className="mt-1 text-sm text-gray-400 text-center">Create your account to start practising.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">Username</label>
            <input
              type="text"
              placeholder="Your name or nickname"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl bg-black/50 border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 focus:ring-0"
            />
          </div>

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
            <div className="mt-1 space-y-1">
              <div className="flex gap-1 h-1.5">
                {Array.from({ length: 4 }).map((_, index) => {
                  const active = passwordStrength.score > index;
                  let color = 'bg-gray-700';
                  if (active) {
                    if (passwordStrength.level === 'very-weak') color = 'bg-red-500';
                    else if (passwordStrength.level === 'weak') color = 'bg-yellow-500';
                    else if (passwordStrength.level === 'medium') color = 'bg-blue-500';
                    else if (passwordStrength.level === 'strong') color = 'bg-emerald-500';
                  }
                  return (
                    <div
                      key={index}
                      className={`flex-1 rounded-full transition-all ${color} ${active ? 'opacity-100' : 'opacity-40'}`}
                    />
                  );
                })}
              </div>
              <p
                className={`text-[11px] ${
                  passwordStrength.level === 'very-weak'
                    ? 'text-red-400'
                    : passwordStrength.level === 'weak'
                    ? 'text-yellow-400'
                    : passwordStrength.level === 'medium'
                    ? 'text-blue-400'
                    : passwordStrength.level === 'strong'
                    ? 'text-emerald-400'
                    : 'text-gray-500'
                }`}
              >
                {password ? passwordStrength.label : 'Minimum 8 characters.'}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl bg-black/50 border border-white/15 px-3 pr-10 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 focus:ring-0"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showConfirmPassword ? (
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
            {!isPasswordMatch && confirmPassword.length > 0 && (
              <p className="text-[11px] text-red-400 mt-1">Passwords do not match.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl bg-black/50 border border-white/15 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 focus:ring-0"
            >
              <option value="" className="bg-black">
                Select role
              </option>
              <option value="STUDENT" className="bg-black">
                Student
              </option>
              <option value="TEACHER" className="bg-black">
                Teacher
              </option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="mt-2 w-full rounded-full border border-white/25 bg-white text-gray-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] shadow-[0_0_20px_rgba(255,255,255,0.35)] hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Signing up...' : 'Sign Up'}
          </button>

          {message && (
            <p className={`mt-2 text-sm text-center ${messageClassName}`}>{message}</p>
          )}

          <p className="mt-3 text-[11px] text-gray-500 text-center leading-relaxed">
            By continuing, you agree to our{' '}
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
          Already have an account?{' '}
          <a
            href="/login"
            className="text-gray-100 underline underline-offset-2 hover:text-white transition-colors"
          >
            Sign In
          </a>
        </p>
      </div>
    </main>
  );
}
