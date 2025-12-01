"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { usePageTitle } from "../lib/usePageTitle";

type BillingPeriod = "monthly" | "sixMonths" | "yearly";
type PlanId = "Free" | "Plus" | "Pro";
type Currency = "USD" | "UZS";

const BILLING_PERIODS: { id: BillingPeriod; label: string }[] = [
  { id: "monthly", label: "Monthly" },
  { id: "sixMonths", label: "6 months" },
  { id: "yearly", label: "Yearly" },
];

const PRICING: Record<
  BillingPeriod,
  { label: string; plus: string; pro: string; helper: string }
> = {
  monthly: {
    label: "month",
    plus: "$3.99/UZS 44.000",
    pro: "$7.99/UZS 94.000",
    helper: "Best if you want to test Edufy month by month.",
  },
  sixMonths: {
    label: "6 months",
    plus: "$19.99/UZS 234.000",
    pro: "$39.99/UZS 474.000",
    helper: "Save more with a 6-month commitment.",
  },
  yearly: {
    label: "year",
    plus: "$29.99/UZS 354.000",
    pro: "$59.99/UZS 709.000",
    helper: "Maximum savings for long-term learners.",
  },
};

function getPriceForCurrency(raw: string, currency: Currency): string {
  if (currency === "USD") {
    const [usd] = raw.split("/UZS");
    return (usd ?? raw).trim();
  }
  const parts = raw.split("/UZS");
  if (parts.length < 2) return raw.trim();
  const uzsRaw = parts[1].trim();
  return uzsRaw.startsWith("UZS") ? uzsRaw : `UZS ${uzsRaw}`;
}

function getOldPrice(
  plan: PlanId,
  period: BillingPeriod,
  currency: Currency,
): string | null {
  if (plan === "Free") return null;

  if (plan === "Plus") {
    if (period === "sixMonths") {
      return currency === "USD" ? "$23,90" : "UZS 283.499";
    }
    if (period === "yearly") {
      return currency === "USD" ? "$47,88" : "UZS 567.948";
    }
    return null;
  }

  if (plan === "Pro") {
    if (period === "sixMonths") {
      return currency === "USD" ? "$47,90" : "UZS 569.253";
    }
    if (period === "yearly") {
      return currency === "USD" ? "$97,90" : "UZS 1.161.281";
    }
  }

  return null;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BillingPage() {
  usePageTitle("Edufy – Billing");
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [activePlan, setActivePlan] = useState<PlanId>("Plus");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [autoRenewal, setAutoRenewal] = useState(true);
  const [form, setForm] = useState({
    cardName: "",
    email: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
    country: "",
  });

  const isEmailValid = emailRegex.test(form.email.trim());
  const isCardNumberValid = /^\d{16}$/.test(form.cardNumber);
  const isExpiryValid = /^\d{4}$/.test(form.expiry);
  const isCvcValid = /^\d{3}$/.test(form.cvc);

  const isFormValid =
    !!form.cardName.trim() &&
    isEmailValid &&
    isCardNumberValid &&
    isExpiryValid &&
    isCvcValid &&
    !!form.country.trim();

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    const parts: string[] = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    return parts.join(" ");
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  };

  const handleChange = (field: keyof typeof form) => (e: any) => {
    let value = e.target.value as string;

    if (field === "cardNumber" || field === "expiry" || field === "cvc") {
      value = value.replace(/\D/g, "");
      if (field === "cardNumber") value = value.slice(0, 16);
      if (field === "expiry") value = value.slice(0, 4);
      if (field === "cvc") value = value.slice(0, 3);
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const periodConfig = PRICING[billingPeriod];
  const displayFreePrice = currency === "USD" ? "$0" : "UZS 0";
  const displayPlusPrice = getPriceForCurrency(periodConfig.plus, currency);
  const displayProPrice = getPriceForCurrency(periodConfig.pro, currency);
  const oldPlusPrice = getOldPrice("Plus", billingPeriod, currency);
  const oldProPrice = getOldPrice("Pro", billingPeriod, currency);
  const activePeriodIndex = Math.max(
    0,
    BILLING_PERIODS.findIndex((p) => p.id === billingPeriod),
  );

  function handleChoosePlan(plan: PlanId) {
    setActivePlan(plan);
    router.push("/payment");
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">Billing</h1>
          <p className="text-sm text-slate-400">
            Manage your subscription, invoices, and payment methods in one place.
          </p>
        </div>

        {/* Current plan & plans */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 shadow-lg shadow-black/30">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900 text-slate-100">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2"
                    className="fill-none stroke-current"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M7 10h4M7 14h2"
                    className="stroke-current"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-100">Current plan</h2>
                <p className="text-xs text-slate-400">
                  You are on the <span className="font-semibold text-slate-100">{activePlan}</span> plan.
                </p>
              </div>
            </div>

            <div className="relative inline-flex rounded-xl border border-neutral-800 bg-neutral-950 text-xs font-medium text-slate-300">
              <div
                className="pointer-events-none absolute inset-y-[2px] w-1/3 rounded-xl bg-neutral-900 transition-transform duration-200 ease-out"
                style={{ transform: `translateX(${activePeriodIndex * 100}%)` }}
              />
              {BILLING_PERIODS.map((p) => {
                const active = billingPeriod === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setBillingPeriod(p.id)}
                    className={`relative z-10 flex-1 px-3 py-1.5 transition-colors duration-150 ${
                      active ? "text-slate-100" : "text-slate-400"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4 text-xs text-slate-400">
            {periodConfig.helper}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Free */}
            <div
              className={`flex flex-col justify-between rounded-2xl border px-6 py-6 text-left transition hover:border-neutral-500/80 hover:bg-neutral-900 ${
                activePlan === "Free" ? "border-neutral-500" : "border-neutral-800 bg-neutral-950/60"
              }`}
            >
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Free
                </div>
                <div className="text-2xl font-bold text-slate-100">
                  {displayFreePrice}
                  <span className="text-xs font-normal text-slate-400"> / month</span>
                </div>
                <ul className="space-y-1 text-sm text-slate-400">
                  <li>- Basic progress tracking</li>
                  <li>- Community access</li>
                </ul>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleChoosePlan("Free")}
                  className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-slate-200 hover:bg-neutral-900"
                >
                  Choose plan
                </button>
              </div>
            </div>

            {/* Plus */}
            <div
              className={`flex flex-col justify-between rounded-2xl border px-6 py-6 text-left transition hover:border-neutral-500/70 hover:bg-neutral-900 ${
                activePlan === "Plus"
                  ? "border-neutral-500 shadow-[0_0_25px_rgba(0,0,0,0.45)] bg-neutral-900"
                  : "border-neutral-800 bg-neutral-950/60"
              }`}
            >
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Plus
                </div>
                <div className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-900 px-2.5 py-0.5 text-[11px] font-semibold text-slate-100">
                  Most popular
                </div>
                {oldPlusPrice && (
                  <div className="text-[16px] font-medium text-slate-500 line-through">
                    {oldPlusPrice}
                  </div>
                )}
                <div className="text-2xl font-bold text-slate-100">
                  {displayPlusPrice}
                  <span className="text-xs font-normal text-slate-400"> / {periodConfig.label}</span>
                </div>
                <ul className="space-y-1 text-sm text-slate-400">
                  <li>- Full access to basic materials</li>
                  <li>- Smart progress analytics</li>
                  <li>- Half access to special materials</li>
                </ul>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleChoosePlan("Plus")}
                  className="rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-900 shadow-lg shadow-black/40 hover:bg-neutral-200"
                >
                  Choose plan
                </button>
              </div>
            </div>

            {/* Pro */}
            <div
              className={`flex flex-col justify-between rounded-2xl border px-6 py-6 text-left transition hover:border-neutral-500/70 hover:bg-neutral-900 ${
                activePlan === "Pro"
                  ? "border-neutral-500 shadow-[0_0_25px_rgba(0,0,0,0.45)] bg-neutral-900"
                  : "border-neutral-800 bg-neutral-950/60"
              }`}
            >
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Pro
                </div>
                <div className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-900 px-2.5 py-0.5 text-[11px] font-semibold text-slate-100">
                  For schools & teams
                </div>
                {oldProPrice && (
                  <div className="text-[16px] font-medium text-slate-500 line-through">
                    {oldProPrice}
                  </div>
                )}
                <div className="text-2xl font-bold text-slate-100">
                  {displayProPrice}
                  <span className="text-xs font-normal text-slate-400"> / {periodConfig.label}</span>
                </div>
                <ul className="space-y-1 text-sm text-slate-400">
                  <li>- Everything in Plus</li>
                  <li>- Full access for all materials</li>
                  <li>- Special MOCKs</li>
                </ul>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleChoosePlan("Pro")}
                  className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-slate-100 hover:bg-neutral-800"
                >
                  Choose plan
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-start text-xs text-slate-400">
            <span className="mr-2 uppercase tracking-wide text-[10px] text-slate-500">Currency</span>
            <div className="inline-flex rounded-full border border-neutral-800 bg-neutral-950 text-[11px] font-medium text-slate-300">
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1 rounded-l-full transition-colors ${
                  currency === "USD" ? "bg-neutral-900 text-slate-100" : "text-slate-400"
                }`}
              >
                USD
              </button>
              <button
                type="button"
                onClick={() => setCurrency("UZS")}
                className={`px-3 py-1 rounded-r-full transition-colors ${
                  currency === "UZS" ? "bg-neutral-900 text-slate-100" : "text-slate-400"
                }`}
              >
                UZS
              </button>
            </div>
          </div>

          {/* Summary under plans */}
          <div className="mt-5 grid gap-4 text-xs text-slate-400 sm:grid-cols-3">
            <div>
              <div className="uppercase tracking-wide text-[10px] text-slate-500">Active since</div>
              <div className="mt-1 text-sm font-medium text-slate-200">Aug 12, 2025</div>
            </div>
            <div>
              <div className="uppercase tracking-wide text-[10px] text-slate-500">Renews on</div>
              <div className="mt-1 text-sm font-medium text-slate-200">Sep 12, 2025</div>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-start">
              <div>
                <div className="uppercase tracking-wide text-[10px] text-slate-500">Auto renewal</div>
                <div className="mt-1 text-sm font-medium text-slate-200">{autoRenewal ? "On" : "Off"}</div>
              </div>
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
        </section>

        {/* Billing history */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Billing history</h2>
              <p className="text-xs text-slate-400">Invoices and payments for your subscription.</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/70">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-800 bg-neutral-950/80 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-sm text-slate-100" />
            </table>
          </div>
        </section>

        {/* Payment methods */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Payment methods</h2>
              <p className="text-xs text-slate-400">Manage the cards used for your subscription.</p>
            </div>
            <button className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-neutral-900">
              Add card
            </button>
          </div>

          <div className="space-y-3" />

          <p className="mt-4 text-xs text-slate-500">
            Edufy does not store your full card details. Payments are processed via secure providers that comply with
            international security standards.
          </p>
        </section>

        {/* Refund & policy */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Refund & policy</h2>
              <p className="text-xs text-slate-400">
                Learn how cancellations and refunds work for Edufy subscriptions.
              </p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-slate-100">Refund window</div>
                <div className="text-xs text-slate-400">
                  You can request a refund within 14 days of a new billing cycle, according to our refund policy.
                </div>
              </div>
              <button className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-neutral-900">
                Read policy
              </button>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
