"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePageTitle } from "../lib/usePageTitle";

export default function PaymentPage() {
  usePageTitle("Edufy – Payment");

  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const periodParam = searchParams.get("period");
  const autoRenewalParam = searchParams.get("autoRenewal");

  const plan = planParam || "Plus";
  const period = periodParam || "monthly";

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [autoRenewal, setAutoRenewal] = useState(autoRenewalParam === "1");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(form.email.trim());
  const isPhoneValid = form.phone.trim().length >= 7;
  const isFormValid = !!form.fullName.trim() && isEmailValid && isPhoneValid;

  const handleChange = (field: keyof typeof form) => (e: any) => {
    const value = (e.target.value as string) ?? "";
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const planLabel = plan === "Pro" ? "Premium" : plan;
  const periodLabel =
    period === "sixMonths" ? "6 months" : period === "yearly" ? "Yearly" : "Monthly";

  async function handleSubmit() {
    if (!isFormValid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/payments/oson/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: planLabel,
          period,
          autoRenewal,
          email: form.email.trim(),
          phone: form.phone.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || typeof data.payUrl !== "string" || !data.payUrl) {
        setError(
          typeof data.error === "string" && data.error.length > 0
            ? data.error
            : "Failed to initialize payment. Please try again.",
        );
        return;
      }

      if (typeof window !== "undefined") {
        window.location.href = data.payUrl as string;
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen text-white legal-page-main">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
        <header className="mb-8 legal-hero-block">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bebas tracking-[0.35em] uppercase text-left text-white">
            Payment
          </h1>
          <p className="mt-3 text-gray-300 max-w-2xl text-left">
            Review your plan details and enter your contact information. You will be redirected to a secure OSON
            payment page to complete the transaction.
          </p>
        </header>
        <section className="mt-10 legal-content-block grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="space-y-4">
            <h2 className="text-sm sm:text-base font-space font-semibold uppercase tracking-[0.25em] text-white">
              Payment details
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md">
              All payments on Edufy Uzbekistan are processed through reliable and certified payment systems that
              comply with international security standards. Edufy Uzbekistan does not store users’ full card data
              and does not have direct access to your payment information.
            </p>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md">
              Selected plan: <span className="text-gray-100 font-medium">{planLabel}</span> –{' '}
              <span className="text-gray-100 font-medium">{periodLabel}</span> billing.
            </p>
          </div>

          <form className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 focus:ring-0"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange("email")}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 focus:ring-0"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">
                  Phone number
                </label>
                <input
                  type="tel"
                  placeholder="998901234567"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 focus:ring-0"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">
                  Auto renewal
                </label>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400">
                    {autoRenewal ? "Enabled" : "Disabled"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAutoRenewal((v) => !v)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full border border-neutral-600 bg-neutral-900 transition-colors ${
                      autoRenewal ? "bg-neutral-100/10" : "bg-neutral-900"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-slate-100 shadow-sm transition-transform ${
                        autoRenewal ? "translate-x-4" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2 text-xs text-gray-500">
              <button
                type="button"
                disabled={!isFormValid || submitting}
                onClick={handleSubmit}
                className="w-full rounded-full border border-white/25 bg-white text-gray-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] shadow-[0_0_18px_rgba(255,255,255,0.4)] hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Redirecting to payment..." : "Pay with OSON"}
              </button>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <p>
                By using this website to make a payment, you confirm that you provide accurate and truthful payment card
                information, including card number, expiration date, and CVC/CVV code, and agree to the{' '}
                <a
                  href="/terms-of-service"
                  className="text-gray-300 underline underline-offset-2 hover:text-white transition-colors"
                >
                  terms of the selected payment service provider
                </a>
                .
              </p>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
