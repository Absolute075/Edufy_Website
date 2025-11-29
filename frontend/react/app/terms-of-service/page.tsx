export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen text-white legal-page-main">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-20 max-w-5xl">
        <div className="text-center mb-12 legal-hero-block">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bebas tracking-[0.35em] uppercase text-white mb-4">
            <span className="logo-glow mr-3">Edufy</span>
            <span className="typing-title">Terms of Service</span>
          </h1>
          <p className="text-gray-300">Last Updated: October 2025</p>
          <p className="text-gray-400 max-w-2xl mx-auto mt-2">
            Please read these Terms of Service carefully before using our platform.
          </p>
          <div className="bg-gray-800 bg-opacity-50 p-6 rounded-xl my-8">
            <h2 className="text-xl font-bold mb-4 text-white">Acceptance of Terms</h2>
            <p className="text-gray-300">
              By accessing or using the Edufy platform, you agree to be bound by these Terms of Service and our Privacy
              Policy. If you do not agree to these terms, please do not use our services.
            </p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none legal-content-block">
          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">1. Account Registration</h2>
          <p className="text-gray-300 mb-6">
            To access certain features of Edufy, you must register for an account. You agree to provide accurate and
            complete information and to keep this information updated. You are responsible for maintaining the
            confidentiality of your account credentials and for all activities that occur under your account.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">2. User Responsibilities</h2>
          <p className="text-gray-300 mb-4">As a user of Edufy, you agree to:</p>
          <ul className="text-gray-300 mb-6 space-y-2 list-disc pl-5">
            <li>Use the platform only for lawful purposes</li>
            <li>Not engage in any activity that interferes with or disrupts the platform</li>
            <li>Not attempt to gain unauthorized access to any accounts, systems or networks</li>
            <li>Not use the platform to cheat on exams or misrepresent your identity</li>
            <li>Comply with all applicable laws and regulations</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">3. Intellectual Property</h2>
          <p className="text-gray-300 mb-6">
            All content on Edufy, including text, graphics, logos, and courses, is the property of Edufy or its content
            providers and protected by intellectual property laws. You may not copy, distribute, or create derivative
            works without explicit permission.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">4. Payment and Subscriptions</h2>
          <p className="text-gray-300 mb-4">Certain Edufy services require payment. By subscribing, you agree to:</p>
          <ul className="text-gray-300 mb-6 space-y-2 list-disc pl-5">
            <li>Pay all charges at the prices then in effect</li>
            <li>Authorize us to charge your chosen payment provider</li>
            <li>Understand that subscriptions automatically renew unless cancelled</li>
            <li>Provide current, complete and accurate billing information</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">5. Content and Conduct</h2>
          <p className="text-gray-300 mb-6">
            You are responsible for all content you submit to Edufy. You may not post content that is illegal,
            harassing, hateful, or otherwise objectionable. Edufy reserves the right to remove any content that
            violates these terms.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">6. Termination</h2>
          <p className="text-gray-300 mb-6">
            Edufy may suspend or terminate your access to the platform at any time for violations of these terms. You
            may terminate your account at any time by following the instructions on our website.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">7. Disclaimers</h2>
          <p className="text-gray-300 mb-6">
            Edufy is provided "as is" without warranties of any kind. We do not guarantee that the platform will be
            uninterrupted, secure, or error-free. We are not responsible for test scores or admissions decisions.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">8. Limitation of Liability</h2>
          <p className="text-gray-300 mb-6">
            To the maximum extent permitted by law, Edufy shall not be liable for any indirect, incidental, or
            consequential damages resulting from your use of the platform.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">9. Changes to Terms</h2>
          <p className="text-gray-300 mb-6">
            We may modify these terms at any time. We will notify you of significant changes. Continued use after
            changes constitutes acceptance of the new terms.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">10. Governing Law</h2>
          <p className="text-gray-300 mb-6">
            These terms shall be governed by the laws of Uzbekistan. Any disputes shall be resolved in the courts of
            Tashkent.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">Contact Us</h2>
          <p className="text-gray-300">For questions about these Terms of Use, please contact us at:</p>
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
