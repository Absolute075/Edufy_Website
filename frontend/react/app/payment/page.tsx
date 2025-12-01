'use client';

import { useState } from 'react';
import { usePageTitle } from '../lib/usePageTitle';

export default function PaymentPage() {
  usePageTitle('Edufy – Payment');
  const [form, setForm] = useState({
    cardName: '',
    email: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    country: '',
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isEmailValid = emailRegex.test(form.email.trim());
  const isCardNumberValid = /^\d{16}$/.test(form.cardNumber);
  const isExpiryValid = /^\d{4}$/.test(form.expiry);
  const isCvcValid = /^\d{3}$/.test(form.cvc);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    const parts = [] as string[];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  };

  const isFormValid =
    form.cardName.trim() &&
    isEmailValid &&
    isCardNumberValid &&
    isExpiryValid &&
    isCvcValid &&
    form.country.trim();

  const handleChange = (field: keyof typeof form) => (e: any) => {
    let value = e.target.value as string;

    if (field === 'cardNumber' || field === 'expiry' || field === 'cvc') {
      // Разрешаем только цифры и ограничиваем длину
      value = value.replace(/\D/g, '');
      if (field === 'cardNumber') value = value.slice(0, 16);
      if (field === 'expiry') value = value.slice(0, 4);
      if (field === 'cvc') value = value.slice(0, 3);
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <main className="min-h-screen text-white legal-page-main">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
        <header className="mb-8 legal-hero-block">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bebas tracking-[0.35em] uppercase text-left text-white">
            Payment
          </h1>
          <p className="mt-3 text-gray-300 max-w-2xl text-left">
            Choose your plan on the Pricing section and then fill in your payment details here. This page shows
            how your card information will be collected in a secure way.
          </p>
        </header>
        <section className="mt-10 legal-content-block grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="space-y-4">
            <h2 className="text-sm sm:text-base font-space font-semibold uppercase tracking-[0.25em] text-white">
              Payment details
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md">
              All payments on Edufy Uzbekistan are processed through reliable and certified payment systems that comply with international security standards (PCI DSS, 3D Secure, and others). Edufy Uzbekistan does not store users’ card data and does not have access to full payment details.


            </p>
          </div>

          <form className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">
                  Cardholder name
                </label>
                <input
                  type="text"
                  placeholder="Name on card"
                  value={form.cardName}
                  onChange={handleChange('cardName')}
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
                  onChange={handleChange('email')}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 focus:ring-0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">
                Card number
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                value={formatCardNumber(form.cardNumber)}
                onChange={handleChange('cardNumber')}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 focus:ring-0"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">
                  Expiry
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM / YY"
                  value={formatExpiry(form.expiry)}
                  onChange={handleChange('expiry')}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 focus:ring-0"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">
                  CVC
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="123"
                  value={form.cvc}
                  onChange={handleChange('cvc')}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 focus:ring-0"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs text-gray-400 uppercase tracking-[0.18em]">
                  Country
                </label>
                <select
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40 focus:ring-0"
                  value={form.country}
                  onChange={handleChange('country')}
                >
                  <option value="" className="bg-black">
                    Select country
                  </option>
                  <option value="uz" className="bg-black">
                    Uzbekistan
                  </option>
                  <option value="other" className="bg-black">
                    Other
                  </option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2 text-xs text-gray-500">
              <button
                type="button"
                disabled={!isFormValid}
                className="w-full rounded-full border border-white/25 bg-white text-gray-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] shadow-[0_0_18px_rgba(255,255,255,0.4)] hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Pay now
              </button>
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
