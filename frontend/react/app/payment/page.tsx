"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { usePageTitle } from "../lib/usePageTitle";

type SelectedPlan = {
  plan: "Free" | "Premium";
  period: "monthly" | "sixMonths" | "yearly";
};

function PaymentPageInner() {
  usePageTitle("Edufy – Payment");

  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [copiedCard, setCopiedCard] = useState<"VISA" | "UZCARD" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("edufy-selected-plan");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SelectedPlan>;
      if (!parsed.plan || !parsed.period) return;
      const rawPlan = String(parsed.plan);
      const normalizedPlan = rawPlan === "Free" ? "Free" : "Premium";
      if (parsed.period !== "monthly" && parsed.period !== "sixMonths" && parsed.period !== "yearly") return;
      setSelectedPlan({ plan: normalizedPlan, period: parsed.period });
    } catch {
      // ignore JSON/parse errors
    }
  }, []);

  const handleCopyCard = (cardNumber: string, key: "VISA" | "UZCARD") => {
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cardNumber).catch(() => {
        // ignore clipboard errors silently
      });
    }

    setCopiedCard(key);
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        setCopiedCard((current) => (current === key ? null : current));
      }, 3000);
    }
  };

  let selectedPlanLine: ReactNode = null;
  if (selectedPlan && selectedPlan.plan !== "Free") {
    const periodLabel =
      selectedPlan.period === "sixMonths"
        ? "6 months"
        : selectedPlan.period === "yearly"
        ? "Yearly"
        : "Monthly";
    selectedPlanLine = (
      <p className="text-xs sm:text-sm text-gray-300 max-w-md">
        Selected plan: <span className="text-gray-100 font-medium">Premium {periodLabel}</span>
      </p>
    );
  }

  return (
    <main className="min-h-screen text-white legal-page-main">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
        <header className="mb-8 legal-hero-block">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bebas tracking-[0.35em] uppercase text-left text-white">
            Payment
          </h1>
          <p className="mt-3 text-gray-300 max-w-2xl text-left">
            Review your plan details and follow the instructions below to pay manually by bank card. After payment,
            send the receipt to our support so we can activate your subscription.
          </p>
        </header>
        <section className="mt-10 legal-content-block grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="space-y-4">
            <h2 className="text-sm sm:text-base font-space font-semibold uppercase tracking-[0.25em] text-white">
              Payment details
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md">
              In accordance with the terms and conditions of the subscription agreement, the Subscriber shall complete payment for the selected subscription plan by transferring the corresponding amount to one of the designated bank cards listed below.

              The Subscriber is required to provide proof of payment (e.g., a screenshot or receipt) to the Support Team for verification purposes. Subscription activation shall occur only after receipt and confirmation of the payment evidence.

              All payments and related confirmations shall be retained as part of the official record for compliance and accounting purposes.
            </p>
            {selectedPlanLine}
          </div>
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5 text-xs sm:text-sm text-gray-300">
            <div className="space-y-3">
              <h3 className="text-sm font-space font-semibold uppercase tracking-[0.18em] text-white">
                Step 1. Pay by card
              </h3>
              <p>
                Please transfer the subscription amount for your selected plan to <span className="font-medium">one of the
                cards below</span>:
              </p>

              <div className="space-y-2">
                <div className="mt-2 border border-white/15 rounded-xl px-3 py-3 bg-black/40 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">VISA card</div>
                    <div className="text-sm font-medium text-white">4023 0601 0538 4175</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCard("4023 0601 0538 4175", "VISA")}
                    className="rounded-full border border-neutral-700 px-2.5 py-0.5 text-[11px] font-medium text-slate-100 hover:bg-neutral-900"
                  >
                    {copiedCard === "VISA" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Cardholder: <span className="text-gray-200 font-medium">Anvar Saparov</span>
                </p>
              </div>

              <div className="space-y-2">
                <div className="mt-1 border border-white/15 rounded-xl px-3 py-3 bg-black/40 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">UzCard</div>
                    <div className="text-sm font-medium text-white">8600 1402 8071 0535</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCard("8600 1402 8071 0535", "UZCARD")}
                    className="rounded-full border border-neutral-700 px-2.5 py-0.5 text-[11px] font-medium text-slate-100 hover:bg-neutral-900"
                  >
                    {copiedCard === "UZCARD" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Cardholder: <span className="text-gray-200 font-medium">Anvar Saparov</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-space font-semibold uppercase tracking-[0.18em] text-white">
                Step 2. Send confirmation
              </h3>
              <p>
                After payment, send a screenshot or receipt together with your Edufy username to our support team so we
                can activate your subscription:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>
                  Email: {" "}
                  <a href="mailto:support@edufyuzbekistan.com" className="text-gray-100 underline underline-offset-2">
                    support@edufyuzbekistan.com
                  </a>
                </li>
                <li>
                  Telegram: {" "}
                  <a
                    href="https://t.me/edufysupport"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-100 underline underline-offset-2"
                  >
                    @edufysupport
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-space font-semibold uppercase tracking-[0.18em] text-white">
                Step 3. Activation
              </h3>
              <p>
                Once we verify your payment, we will activate or extend your subscription for the paid
                period.
              </p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen text-white legal-page-main">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
            <p className="text-sm text-gray-300">Loading payment details...</p>
          </div>
        </main>
      }
    >
      <PaymentPageInner />
    </Suspense>
  );
}
