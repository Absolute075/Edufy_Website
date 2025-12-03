"use client";

import { useEffect, useState } from "react";
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

function parseUsdAmount(raw: string): number | null {
  const firstPart = raw.split("/")[0];
  const usd = firstPart.trim().replace("$", "").replace(",", ".");
  const value = parseFloat(usd);
  return isNaN(value) ? null : value;
}

function getPriceForCurrency(raw: string, currency: Currency, usdToUzsRate: number | null): string {
  if (currency === "USD") {
    const [usd] = raw.split("/UZS");
    return (usd ?? raw).trim();
  }

  if (usdToUzsRate && usdToUzsRate > 0) {
    const usdValue = parseUsdAmount(raw);
    if (usdValue !== null) {
      const uzsValue = Math.round((usdValue * usdToUzsRate) / 100) * 100;
      return `UZS ${uzsValue.toLocaleString("uz-UZ")}`;
    }
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
  usdToUzsRate: number | null,
): string | null {
  if (plan === "Free") return null;

  let usdOld: string | null = null;

  if (plan === "Plus") {
    if (period === "sixMonths") {
      usdOld = "$23,90";
    } else if (period === "yearly") {
      usdOld = "$47,88";
    }
  } else if (plan === "Pro") {
    if (period === "sixMonths") {
      usdOld = "$47,90";
    } else if (period === "yearly") {
      usdOld = "$97,90";
    }
  }

  if (!usdOld) return null;

  if (currency === "USD") {
    return usdOld;
  }

  if (usdToUzsRate && usdToUzsRate > 0) {
    const usdValue = parseUsdAmount(usdOld);
    if (usdValue !== null) {
      const uzsValue = Math.round((usdValue * usdToUzsRate) / 100) * 100;
      return `UZS ${uzsValue.toLocaleString("uz-UZ")}`;
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
  const [isAbroadModalOpen, setIsAbroadModalOpen] = useState(false);
  const [hasCopiedCardNumber, setHasCopiedCardNumber] = useState(false);
  const [usdToUzsRate, setUsdToUzsRate] = useState<number | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
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
  const displayPlusPrice = getPriceForCurrency(periodConfig.plus, currency, usdToUzsRate);
  const displayProPrice = getPriceForCurrency(periodConfig.pro, currency, usdToUzsRate);
  const oldPlusPrice = getOldPrice("Plus", billingPeriod, currency, usdToUzsRate);
  const oldProPrice = getOldPrice("Pro", billingPeriod, currency, usdToUzsRate);
  const activePeriodIndex = Math.max(
    0,
    BILLING_PERIODS.findIndex((p) => p.id === billingPeriod),
  );

  const activePlanLabel = activePlan === "Pro" ? "Premium" : activePlan;

  function handleChoosePlan(plan: PlanId) {
    setActivePlan(plan);
    if (typeof window !== "undefined") {
      try {
        const payload = { plan, period: billingPeriod };
        window.localStorage.setItem("edufy-selected-plan", JSON.stringify(payload));
      } catch {
        // ignore storage errors
      }
    }
    router.push("/payment");
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchRate() {
      try {
        const res = await fetch("/pricing/rate");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.usdToUzs === "number") {
          setUsdToUzsRate(data.usdToUzs);
        }
      } catch {
        // silently fall back to static UZS values embedded in PRICING strings
      }
    }

    fetchRate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchPayments() {
      setLoadingPayments(true);
      try {
        const res = await fetch("/user/payments/history");
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) {
          setPayments(data);
        }
      } catch {
      } finally {
        if (!cancelled) {
          setLoadingPayments(false);
        }
      }
    }

    fetchPayments();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">Billing</h1>
          <p className="text-sm text-slate-400">
            Manage your subscription and billing history in one place.
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
                  You are on the <span className="font-semibold text-slate-100">{activePlanLabel}</span> plan.
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
                  disabled
                  className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-slate-300 bg-neutral-900/40 cursor-default"
                >
                  Current plan
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

            {/* Premium */}
            <div
              className={`flex flex-col justify-between rounded-2xl border px-6 py-6 text-left transition hover:border-neutral-500/70 hover:bg-neutral-900 ${
                activePlan === "Pro"
                  ? "border-neutral-500 shadow-[0_0_25px_rgba(0,0,0,0.45)] bg-neutral-900"
                  : "border-neutral-800 bg-neutral-950/60"
              }`}
            >
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Premium
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

          <div className="mt-3 flex items-start justify-between gap-3 text-[11px] text-slate-400">
            <p className="max-w-xl">
              For users making payments from abroad (outside the Republic of Uzbekistan), payment confirmation must be
              submitted manually to our support team. Please provide a receipt or proof of payment for verification and
              subsequent activation of your access.
            </p>
            <button
              type="button"
              onClick={() => setIsAbroadModalOpen(true)}
              className="shrink-0 rounded-full border border-neutral-800 px-4 py-1.5 text-xs font-medium text-slate-100 hover:bg-neutral-900"
            >
              Open
            </button>
          </div>

          {/* Summary under plans */}
          <div className="mt-5 grid gap-4 text-xs text-slate-400 sm:grid-cols-2">
            <div>
              <div className="uppercase tracking-wide text-[10px] text-slate-500">Active since</div>
              <div className="mt-1 text-sm font-medium text-slate-200">Aug 12, 2025</div>
            </div>
            <div>
              <div className="uppercase tracking-wide text-[10px] text-slate-500">Renews on</div>
              <div className="mt-1 text-sm font-medium text-slate-200">Sep 12, 2025</div>
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
              <tbody className="divide-y divide-neutral-800 text-sm text-slate-100">
                {loadingPayments && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-xs text-slate-400">
                      Loading payments...
                    </td>
                  </tr>
                )}
                {!loadingPayments && payments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-xs text-slate-500">
                      No payments yet.
                    </td>
                  </tr>
                )}
                {!loadingPayments &&
                  payments.map((p) => {
                    const createdAt = p.createdAt ? new Date(p.createdAt) : null;
                    const dateStr = createdAt
                      ? createdAt.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                        })
                      : "-";
                    const planLabel = (p.plan || "").toString();
                    const periodRaw = (p.period || "monthly").toString();
                    const periodLabel =
                      periodRaw === "sixMonths"
                        ? "6 months"
                        : periodRaw === "yearly"
                        ? "Yearly"
                        : "Monthly";
                    const providerRaw = (p.provider || "Manual").toString();
                    const provider = providerRaw.toUpperCase() === "OSON" ? "Manual" : providerRaw;
                    const desc = `${planLabel ? planLabel : "Subscription"} – ${periodLabel} · ${provider}`;
                    const amount = typeof p.amount === "number" ? p.amount.toFixed(2) : p.amount;
                    const currency = (p.currency || "UZS").toString();
                    const status = (p.status || "").toString();
                    const invoiceRef = p.transactionId || `#${p.id}`;

                    return (
                      <tr key={p.id ?? invoiceRef}>
                        <td className="px-4 py-3 align-middle text-xs text-slate-300">{dateStr}</td>
                        <td className="px-4 py-3 align-middle text-xs text-slate-200">{desc}</td>
                        <td className="px-4 py-3 align-middle text-xs text-slate-200">
                          {amount} <span className="text-slate-400">{currency}</span>
                        </td>
                        <td className="px-4 py-3 align-middle text-xs">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                              status === "PAID"
                                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
                                : status === "PENDING"
                                ? "bg-amber-500/10 text-amber-300 border border-amber-500/40"
                                : "bg-red-500/10 text-red-300 border border-red-500/40"
                            }`}
                          >
                            {status || "UNKNOWN"}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle text-xs text-slate-400">
                          <span className="font-mono text-[11px]">{invoiceRef}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
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
              <button
                type="button"
                onClick={() => router.push("/terms-of-service#payments-and-subscriptions")}
                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-neutral-900"
              >
                Read policy
              </button>
            </div>
          </div>
        </section>
      </div>

      {isAbroadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl shadow-black/60">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-100">Payments from abroad</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Use these details to complete your payment from abroad and then send the confirmation to our support
                  team.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAbroadModalOpen(false)}
                className="rounded-full border border-neutral-700 px-2 py-1 text-xs text-slate-300 hover:bg-neutral-900"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-200">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Card number</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-100">4916 9903 3725 0531</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText("4916 9903 3725 0531");
                      }
                      setHasCopiedCardNumber(true);
                      if (typeof window !== "undefined") {
                        window.setTimeout(() => {
                          setHasCopiedCardNumber(false);
                        }, 3000);
                      }
                    }}
                    className="rounded-full border border-neutral-700 px-2.5 py-0.5 text-[11px] font-medium text-slate-100 hover:bg-neutral-900"
                  >
                    {hasCopiedCardNumber ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Cardholder name</div>
                <div className="mt-1 text-sm font-medium text-slate-100">Tojiyev Asilbek</div>
              </div>

              <div className="mt-2 border-t border-neutral-800 pt-3 space-y-2">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Contact for confirmation</div>
                <div className="text-sm text-slate-200">
                  Email:{" "}
                  <a
                    href="mailto:support@edufyuzbekistan.com"
                    className="text-slate-100 underline underline-offset-2 hover:text-white"
                  >
                    support@edufyuzbekistan.com
                  </a>
                </div>
                <div className="text-sm text-slate-200">
                  Telegram:{" "}
                  <a
                    href="https://t.me/edufysupport"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-100 underline underline-offset-2 hover:text-white"
                  >
                    @edufysupport
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardShell>
  );
}
