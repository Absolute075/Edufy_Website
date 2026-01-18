"use client";

import Link from "next/link";

export function FooterPagesHeader() {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors">
            <span className="uppercase tracking-[0.2em]">Edufy</span>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-[11px] uppercase tracking-[0.18em] text-gray-400">
            <Link href="/changelog" className="hover:text-white transition-colors">
              Changelog
            </Link>
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
            <Link href="/reviews" className="hover:text-white transition-colors">
              Reviews
            </Link>
            <Link href="/team" className="hover:text-white transition-colors">
              Team
            </Link>
            <Link href="/careers" className="hover:text-white transition-colors">
              Careers
            </Link>
            <Link href="/faq" className="hover:text-white transition-colors">
              FAQ
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/cookies-policy" className="hover:text-white transition-colors">
              Cookies
            </Link>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">
              Terms
            </Link>
          </nav>

          <div className="md:hidden">
            <Link href="/" className="text-xs uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors">
              Back
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
