import { FooterPagesHeader } from "@/components/FooterPagesHeader";

export default function CookiesPage() {
  return (
    <main className="min-h-screen text-white legal-page-main">
      <FooterPagesHeader />
      <div className="mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 max-w-5xl">
        <div className="text-center mb-12 legal-hero-block">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bebas tracking-[0.35em] uppercase text-white mb-4">
            <span className="logo-glow mr-3">Edufy</span>
            <span>Cookies Policy</span>
          </h1>
          <p className="text-gray-300">Last Updated: October 2025</p>
        </div>

        <div className="prose prose-invert max-w-none legal-content-block">
          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">What Are Cookies</h2>
          <p className="text-gray-300 mb-6">
            As is common practice with almost all professional websites, this site uses cookies, which are tiny files
            that are downloaded to your computer, to improve your experience. This page describes what information they
            gather, how we use it and why we sometimes need to store these cookies.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">How We Use Cookies</h2>
          <p className="text-gray-300 mb-4">
            We use cookies for a variety of reasons detailed below. Unfortunately, in most cases there are no industry
            standard options for disabling cookies without completely disabling the functionality and features they add
            to this site.
          </p>

          <h3 className="text-xl font-bold mt-6 mb-3 text-white">Essential Cookies</h3>
          <p className="text-gray-300 mb-4">
            These cookies are essential to provide you with services available through our website and to enable you to
            use some of its features. Without these cookies, the services that you have asked for cannot be provided,
            and we only use these cookies to provide you with those services.
          </p>

          <h3 className="text-xl font-bold mt-6 mb-3 text-white">Functionality Cookies</h3>
          <p className="text-gray-300 mb-4">
            These cookies allow our website to remember choices you make when you use our website. The purpose of these
            cookies is to provide you with a more personal experience and to avoid you having to re-select your
            preferences every time you visit our website.
          </p>

          <h3 className="text-xl font-bold mt-6 mb-3 text-white">Analytics Cookies</h3>
          <p className="text-gray-300 mb-6">
            These cookies collect information that is used either in aggregate form to help us understand how our
            website is being used or how effective our marketing campaigns are, or to help us customize our website for
            you.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">Disabling Cookies</h2>
          <p className="text-gray-300 mb-6">
            You can prevent the setting of cookies by adjusting the settings on your browser (see your browser Help for
            how to do this). Be aware that disabling cookies will affect the functionality of this and many other
            websites that you visit.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">More Information</h2>
          <p className="text-gray-300">
            If you are looking for more information then you can contact us through one of our preferred contact
            methods:
          </p>
          <ul className="text-gray-300 mt-4 space-y-2">
            <li>
              Email:{' '}
              <a href="mailto:support@edufyuzbekistan.com" className="text-blue-400 hover:underline">
                support@edufyuzbekistan.com
              </a>
            </li>
            <li>
              Phone:{' '}
              <a href="tel:+998771102339" className="text-blue-400 hover:underline">
                +998 77 110 23 39
              </a>
            </li>
            <li>
              Telegram:{' '}
              <a
                href="https://t.me/edufysupport"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                @edufysupport
              </a>
            </li>
          </ul>

          <div className="mt-12 pt-8 border-t border-gray-800">
            <a
              href="https://edufyuzbekistan.com"
              className="inline-flex items-center text-blue-400 hover:text-blue-300"
            >
              <span className="mr-2">←</span>
              Back to Main Page
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
