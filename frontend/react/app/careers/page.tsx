export default function CareersPage() {
  return (
    <main className="min-h-screen text-white legal-page-main flex items-center careers-page-wrapper">
      <div className="w-full">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center legal-hero-block">
          <div className="pl-12 sm:pl-16 lg:pl-24">
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-bebas tracking-[0.3em] uppercase leading-tight">
              Let's
              <br />
              Work
              <br />
              Togethe
              <span className="relative inline-block align-baseline">
                r
                <svg
                  className="pointer-events-none absolute left-10 bottom--1 translate-y-1 w-10 h-12 text-white rotate-[340deg]"
                  viewBox="0 0 20 60"
                  aria-hidden="true"
                >
                  <path
                    d="M10 0 L10 40"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <polygon points="10,40 5,30 15,30" fill="currentColor" />
                </svg>
              </span>
            </h1>

            <div className="mt-16 text-sm md:text-base text-gray-300 space-y-1 pl-[35rem] md:pl-[42rem]">
              <p>
                <a
                  href="mailto:support@edufyuzbekistan.com"
                  className="hover:text-white transition-colors underline-offset-4 hover:underline"
                >
                  support@edufyuzbekistan.com
                </a>
              </p>
              <p>
                <a
                  href="tel:+998771102339"
                  className="hover:text-white transition-colors underline-offset-4 hover:underline"
                >
                  +998 77 110 23 39
                </a>
              </p>
              <p>
                <a
                  href="https://t.me/edufysupport"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors underline-offset-4 hover:underline"
                >
                  @edufysupport
                </a>
              </p>
            </div>
          </div>
          <div className="space-y-3 text-sm md:text-base text-gray-300 leading-normal max-w-xl px-4 sm:px-6 lg:px-16">
            <p>
              We are fully open to new partnerships and ready to collaborate with teams, organizations, and individuals who share our vision. Our schedule is flexible, and we are available to start working together anytime.
            </p>
            <p>
              If you have ideas, proposals, or potential projects, we will be happy to discuss them and explore how we can create value together.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
