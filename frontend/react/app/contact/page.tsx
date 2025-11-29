import Link from 'next/link';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black text-white contact-page-wrapper">
      <div className="pt-28 pb-10">
        <div className="font-bebas tracking-[0.35em] text-sm sm:text-lg md:text-2xl uppercase text-white text-center mb-4">
          Edufy
        </div>
        <h1 className="w-screen text-[26vw] sm:text-[20vw] md:text-[14vw] lg:text-[10vw] font-bebas tracking-[0.35em] uppercase text-white mb-10 leading-none text-center">
          Contact Us
        </h1>
      </div>

      <div className="px-4 sm:px-8 lg:px-12 pb-20 max-w-6xl mx-auto">
        <p className="text-gray-300 text-sm md:text-base max-w-2xl">
          Reach out to us if you have questions about Edufy, need help with your account, or want to
          collaborate. We respond to all messages as quickly as possible.
        </p>

        <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start">
          <div className="flex flex-col gap-6 max-w-md contact-left-column">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold text-white">Email</h2>
              <p className="mt-2 text-sm text-gray-300">support@edufyuzbekistan.com</p>
              <p className="mt-3 text-xs text-gray-400">
                Mon–Sat - 13:00–22:00, Sunday - 9:00–22:00 (GMT +5)
              </p>
              <a
                href="mailto:support@edufyuzbekistan.com"
                className="mt-4 inline-flex text-sm text-black px-4 py-2 rounded-full bg-white hover:bg-gray-100 transition-colors"
              >
                Write an email
              </a>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold text-white">Phone</h2>
              <p className="mt-2 text-sm text-gray-300">+998 77 110 23 39</p> 
              <p className="mt-3 text-xs text-gray-400">
                Mon–Sat - 13:00–22:00, Sunday - 9:00–22:00 (GMT +5)
              </p>
              <a
                href="tel:+998771102339"
                className="mt-4 inline-flex text-sm text-black px-4 py-2 rounded-full bg-white hover:bg-gray-100 transition-colors"
              >
                Call
              </a>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold text-white">Telegram</h2>
              <p className="mt-2 text-sm text-gray-300">@edufysupport</p>
              <p className="mt-3 text-xs text-gray-400">
                Mon–Sat - 13:00–22:00, Sunday - 9:00–22:00 (GMT +5)
              </p>
              <a
                href="https://t.me/edufysupport"
                target="_blank"
                rel="noopener"
                className="mt-4 inline-flex text-sm text-black px-4 py-2 rounded-full bg-white hover:bg-gray-100 transition-colors"
              >
                Open in Telegram
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 contact-right-form">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">Send a message</h2>
            <p className="mt-3 text-sm md:text-base text-gray-300">
              Share your question, idea or feedback with us — we will reply as soon as possible.
            </p>
            <form className="mt-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/40"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    className="w-full rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/40"
                    placeholder="Your last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Email or Telegram Username</label>
                <input
                  type="email"
                  className="w-full rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/40"
                  placeholder="you@example.com or @username"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Message</label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/40 resize-none"
                  placeholder="Write your message here"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex justify-center text-sm font-medium text-black px-4 py-2.5 rounded-full bg-white hover:bg-gray-100 transition-colors"
              >
                Submit
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 text-sm text-gray-400">
          <Link href="/">
            <span className="hover:text-white transition-colors cursor-pointer">
              &larr; Back to home
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
