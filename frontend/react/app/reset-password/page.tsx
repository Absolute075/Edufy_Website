'use client';

import { useState } from 'react';

type Step = 'email' | 'code' | 'password';

export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'success' | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email.trim());
  const isCodeValid = verificationCode.length === 6;
  const isPasswordValid = newPassword.length >= 8;
  const isPasswordMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setMessage(null);
    setMessageType(null);

    if (step === 'email') {
      if (!isEmailValid) {
        setMessage('Please enter a valid email address.');
        setMessageType('error');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch('/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || 'Failed to send reset code');
        }

        setStep('code');
        setMessage(
          data.message || 'If this email exists, we have sent a 6-digit verification code to it.'
        );
        setMessageType('success');
      } catch (err: any) {
        setMessage(err?.message || 'Failed to send reset code');
        setMessageType('error');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (step === 'code') {
      if (!isCodeValid) {
        setMessage('Please enter the 6-digit verification code.');
        setMessageType('error');
        return;
      }
      setStep('password');
      setMessage(null);
      setMessageType(null);
      return;
    }

    if (step === 'password') {
      if (!isPasswordValid) {
        setMessage('Password must be at least 8 characters long.');
        setMessageType('error');
        return;
      }
      if (!isPasswordMatch) {
        setMessage('Passwords do not match.');
        setMessageType('error');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch('/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            code: verificationCode,
            newPassword,
          }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || 'Failed to reset password');
        }

        setMessage(
          data.message || 'Password has been reset successfully. Redirecting to login...'
        );
        setMessageType('success');

        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } catch (err: any) {
        setMessage(err?.message || 'Failed to reset password');
        setMessageType('error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const messageClassName =
    messageType === 'success'
      ? 'text-green-400'
      : messageType === 'error'
      ? 'text-red-400'
      : 'text-gray-400';

  const renderTitle = () => {
    if (step === 'email') return 'Reset password';
    if (step === 'code') return 'Enter verification code';
    return 'Set new password';
  };

  const renderSubtitle = () => {
    if (step === 'email') return 'Enter your email to receive a reset code.';
    if (step === 'code') return 'Enter the 6-digit code we sent to your email.';
    return 'Create a new password for your account.';
  };

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
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">{renderTitle()}</h1>
          <p className="mt-1 text-sm text-gray-400 text-center">{renderSubtitle()}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {step === 'email' && (
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
          )}

          {step === 'code' && (
            <div className="space-y-1.5">
              <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                className="w-full rounded-xl bg-black/50 border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 focus:ring-0 tracking-[0.35em] text-center"
              />
              <p className="text-[11px] text-gray-500 mt-1">6-digit code from your email.</p>
            </div>
          )}

          {step === 'password' && (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">New password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl bg-black/50 border border-white/15 px-3 pr-10 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {showNewPassword ? (
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
                <p className="text-[11px] text-gray-500 mt-1">Minimum 8 characters.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">Confirm new password</label>
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
            </>
          )}

          <button
            type="submit"
            disabled={
              isSubmitting ||
              (step === 'email' && !isEmailValid) ||
              (step === 'code' && !isCodeValid) ||
              (step === 'password' && (!isPasswordValid || !isPasswordMatch))
            }
            className="mt-2 w-full rounded-full border border-white/25 bg-white text-gray-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] shadow-[0_0_20px_rgba(255,255,255,0.35)] hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step === 'email' && 'Send reset code'}
            {step === 'code' && 'Continue'}
            {step === 'password' && (isSubmitting ? 'Saving...' : 'Reset password')}
          </button>

          {message && (
            <p className={`mt-2 text-sm text-center ${messageClassName}`}>{message}</p>
          )}
        </form>

        <p className="mt-5 text-xs text-gray-400 text-center">
          Remember your password?{' '}
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
