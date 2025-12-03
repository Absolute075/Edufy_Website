"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { usePageTitle } from "../lib/usePageTitle";

function PaymentPageInner() {
  usePageTitle("Edufy – Payment");

  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const periodParam = searchParams.get("period");
  const autoRenewalParam = searchParams.get("autoRenewal");

  const plan = planParam || "Plus";
  const period = periodParam || "monthly";
  const autoRenewal = autoRenewalParam === "1";

  const planLabel = plan === "Pro" ? "Premium" : plan;
  const periodLabel =
    period === "sixMonths" ? "6 months" : period === "yearly" ? "Yearly" : "Monthly";

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
              Selected plan: <span className="text-gray-100 font-medium">{planLabel}</span> –{" "}
              <span className="text-gray-100 font-medium">{periodLabel}</span> billing.
            </p>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md">
              To activate your subscription, please pay the corresponding amount to the card below and send a payment
              confirmation (screenshot or receipt) to our support team.
            </p>
          </div>
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5 text-xs sm:text-sm text-gray-300">
            <div className="space-y-2">
              <h3 className="text-sm font-space font-semibold uppercase tracking-[0.18em] text-white">
                Step 1. Pay by card
              </h3>
              <p>
                Please transfer the subscription amount for your selected plan to the following card:
              </p>
              <div className="mt-2 border border-white/15 rounded-xl px-3 py-3 bg-black/40 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Card number</div>
                  <div className="text-sm font-medium text-white">4916 9903 3725 0531</div>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Cardholder name: <span className="text-gray-200 font-medium">Tojiyev Asilbek</span>
              </p>
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
                Once we verify your payment, we will manually activate or extend your <span className="font-medium text-gray-100">{planLabel}</span>{" "}
                subscription for the selected <span className="font-medium text-gray-100">{periodLabel}</span> period. If auto
                renewal is enabled in your account, we will remind you before the end of the paid period.
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
