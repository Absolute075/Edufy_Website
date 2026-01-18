"use client";

import Link from "next/link";
import { useState } from "react";
import { FooterPagesHeader } from "@/components/FooterPagesHeader";

const faqs = [
  {
    question: "What is Edufy?",
    answer:
      "Edufy is a learning platform that helps you prepare for international exams like IELTS, SAT and TOEFL with real practice tests, analytics and AI-guided progress.",
  },
  {
    question: "Which exams can I prepare for?",
    answer:
      "Right now we focus on IELTS, with more exams coming soon. The platform is designed so that new exams can be added as full learning paths.",
  },
  {
    question: "Do I need a tutor to use Edufy?",
    answer:
      "No. You can use Edufy fully on your own: practice tests, explanations and analytics are built for independent study. If you already work with a tutor, Edufy can support your lessons with extra practice.",
  },
  {
    question: "How does pricing work?",
    answer:
      "You choose a plan that matches your preparation horizon (monthly, 6 months or yearly). All active plans give you access to practice tests, analytics and future updates during the subscription period.",
  },
  {
    question: "Where is Edufy based?",
    answer:
      "Edufy is built in Tashkent, Uzbekistan, but designed for learners preparing for international exams from any country.",
  },
  {
    question: "How can I contact support?",
    answer: (
      <p className="text-sm md:text-base text-gray-300 leading-relaxed">
        You can contact us via email, phone or Telegram. Visit the{" "}
        <Link href="/contact" className="underline hover:text-white">
          Contact Us
        </Link>{" "}
        page to see all channels and send us a message directly.
      </p>
    ),
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <main className="min-h-screen text-white legal-page-main">
      <FooterPagesHeader />
      <div className="mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 max-w-5xl">
        <div className="mb-12 legal-hero-block">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bebas tracking-[0.35em] uppercase text-white mb-4 text-left">
            <span className="mr-3">Questions?</span>
            <span>We're glad you asked</span>
          </h1>
          <p className="text-gray-300 max-w-2xl text-left">
            Answers to the most common questions about Edufy, our platform and how to start learning.
          </p>
        </div>

        <div className="mt-12 space-y-6 legal-content-block">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="border-b border-white/15 pb-5 pt-4 md:pb-6 md:pt-5"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenIndex((prev) => (prev === index ? null : index))
                  }
                  className="flex w-full items-center justify-between gap-6 text-left"
                >
                  <span className="text-base md:text-xl font-medium text-white">
                    {faq.question}
                  </span>
                  <span className="text-2xl md:text-4xl text-gray-200">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    isOpen
                      ? "max-h-72 md:max-h-80 opacity-100 mt-3"
                      : "max-h-0 opacity-0 mt-0"
                  }`}
                >
                  {typeof faq.answer === "string" ? (
                    <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  ) : (
                    faq.answer
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-sm text-gray-400 text-center">
          <Link href="/">
            <span className="hover:text-white transition-colors cursor-pointer">&larr; Back to home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
