"use client";

import { usePageTitle } from "../lib/usePageTitle";

export default function TermsOfServicePage() {
  usePageTitle("Edufy – Terms of Service");
  return (
    <main className="min-h-screen text-white legal-page-main">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-20 max-w-5xl">
        <div className="text-center mb-12 legal-hero-block">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bebas tracking-[0.35em] uppercase text-white mb-4">
            <span className="logo-glow mr-3">Edufy</span>
            <span>Terms of Service</span>
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
          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">1. Account Registration and Security</h2>
          <p className="text-gray-300 mb-6">
            1.1. Eligibility – Users must be of legal age to form a binding contract in their jurisdiction. Minors must
            have parental or guardian consent.
          </p>
          <p className="text-gray-300 mb-6">
            1.2. Account Information – Users must provide accurate, complete, and current information during
            registration and must update this information as necessary. Inaccurate or incomplete data may lead to
            account suspension.
          </p>
          <p className="text-gray-300 mb-6">
            1.3. Credentials Confidentiality – Users are responsible for maintaining the confidentiality of their
            account credentials, including passwords and two-factor authentication methods.
          </p>
          <p className="text-gray-300 mb-6">
            1.4. Responsibility for Activity – All activity under a User account is the responsibility of the account
            holder, including unauthorized actions if the account is compromised.
          </p>
          <p className="text-gray-300 mb-6">
            1.5. Security Obligations – Users must notify Edufy immediately if they suspect unauthorized access or
            security breaches. Edufy reserves the right to suspend accounts for security reasons.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">2. User Responsibilities</h2>
          <p className="text-gray-300 mb-6">
            2.1. Lawful Use – Users agree to use Edufy only for lawful, educational, and ethical purposes.
          </p>
          <p className="text-gray-300 mb-6">
            2.2. Platform Integrity – Users must not attempt to disrupt, damage, or gain unauthorized access to the
            platform, its servers, networks, or systems.
          </p>
          <p className="text-gray-300 mb-6">
            2.3. Academic Integrity – Users may not cheat on tests, submit fraudulent materials, impersonate others, or
            misrepresent identity.
          </p>
          <p className="text-gray-300 mb-6">
            2.4. Compliance with Laws – Users must comply with all applicable local and international laws,
            regulations, and rules.
          </p>
          <p className="text-gray-300 mb-6">
            2.5. Prohibited Conduct – Users must not engage in any conduct that harms other users, the platform&apos;s
            reputation, or the operation of the platform.
          </p>
          <p className="text-gray-300 mb-6">
            2.6. Investigation and Enforcement – Edufy reserves the right to investigate violations and take action,
            including warnings, suspension, or termination of accounts.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">3. Intellectual Property</h2>
          <p className="text-gray-300 mb-6">
            3.1. Ownership – All content, software, graphics, logos, course materials, and designs on Edufy are the
            property of Edufy or its licensors.
          </p>
          <p className="text-gray-300 mb-6">
            3.2. Protection – Content is protected by copyright, trademark, and other intellectual property laws
            internationally.
          </p>
          <p className="text-gray-300 mb-6">
            3.3. Restrictions – Users may not reproduce, distribute, publicly display, or create derivative works
            without express written permission.
          </p>
          <p className="text-gray-300 mb-6">
            3.4. License Grant – By using the platform, Users grant Edufy a non-exclusive license to store, process, and
            display submitted content for platform operation.
          </p>
          <p className="text-gray-300 mb-6">
            3.5. Enforcement – Edufy may take legal action against unauthorized use or infringement of intellectual
            property rights.
          </p>

          <h2 id="payments-and-subscriptions" className="text-2xl font-bold mt-8 mb-4 text-white">4. Payments and Subscriptions</h2>
          <p className="text-gray-300 mb-6">
            4.1. Pricing – Fees for subscriptions and services are published on the platform and may be updated at any
            time. Changes do not affect already-paid periods.
          </p>
          <p className="text-gray-300 mb-6">
            4.2. Payment Methods – Edufy accepts payments via integrated payment processors (e.g., Payme, Click, Oson,
            Payze, Stripe, PayPal).
          </p>
          <p className="text-gray-300 mb-6">
            4.3. Billing Information – Users must provide accurate, complete, and current payment details.
          </p>
          <p className="text-gray-300 mb-6">
            4.4. Subscription Renewal – Paid subscriptions may automatically renew at the end of each billing cycle
            unless cancelled in advance.
          </p>
          <p className="text-gray-300 mb-6">
            4.5. Failed Payments – If a payment fails, Edufy may suspend access until payment is successfully
            processed.
          </p>
          <p className="text-gray-300 mb-6">
            4.6. Taxes and Fees – Users are responsible for any applicable taxes or payment processing fees.
          </p>
          <p className="text-gray-300 mb-6">
            4.7. Payment Security – All payments are processed securely through third-party providers. Edufy does not
            store full payment card data.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">5. Refund Policy</h2>
          <p className="text-gray-300 mb-6">
            5.1. General Rule – Payments are generally non-refundable due to the digital nature of the services.
          </p>
          <p className="text-gray-300 mb-6">
            5.2. Eligible Refunds – Refunds are issued only in cases of: technical errors or double charges; platform
            malfunctions preventing access; verified mistakes by payment processors.
          </p>
          <p className="text-gray-300 mb-6">
            5.3. Refund Procedure – Users must submit a request including account details, transaction ID, payment
            date, amount, and issue description.
          </p>
          <p className="text-gray-300 mb-6">
            5.4. Processing Time – Refunds are processed through the original payment method within 3–10 business days.
          </p>
          <p className="text-gray-300 mb-6">
            5.5. Subscription Cancellation – Canceling a subscription does not entitle the User to a refund for the
            current billing cycle. Access continues until the end of the paid period.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">6. User Content</h2>
          <p className="text-gray-300 mb-6">
            6.1. Responsibility – Users are responsible for all content submitted or uploaded.
          </p>
          <p className="text-gray-300 mb-6">
            6.2. Prohibited Content – Content that is illegal, abusive, harassing, hateful, infringing, misleading,
            fraudulent, or otherwise objectionable is prohibited.
          </p>
          <p className="text-gray-300 mb-6">
            6.3. Moderation – Edufy may remove or restrict content that violates Terms at its sole discretion.
          </p>
          <p className="text-gray-300 mb-6">
            6.4. License – Users grant Edufy a limited, non-exclusive license to use submitted content for operational
            purposes, analytics, and platform improvement.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">7. Security and Technical Obligations</h2>
          <p className="text-gray-300 mb-6">
            7.1. Platform Security – Edufy implements industry-standard security measures but cannot guarantee absolute
            security.
          </p>
          <p className="text-gray-300 mb-6">
            7.2. User Obligations – Users must not attempt to bypass or compromise security features.
          </p>
          <p className="text-gray-300 mb-6">
            7.3. Technical Failures – Edufy is not liable for service interruptions, outages, or data loss caused by
            technical issues outside its control.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">8. Disclaimers</h2>
          <p className="text-gray-300 mb-6">
            8.1. Edufy is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind.
          </p>
          <p className="text-gray-300 mb-6">
            8.2. Edufy does not guarantee uninterrupted, error-free, or secure access.
          </p>
          <p className="text-gray-300 mb-6">
            8.3. Edufy is not responsible for outcomes of academic tests, admissions, or decisions made based on
            platform usage.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">9. Limitation of Liability</h2>
          <p className="text-gray-300 mb-6">
            9.1. To the fullest extent permitted by law, Edufy shall not be liable for indirect, incidental,
            consequential, punitive, or special damages.
          </p>
          <p className="text-gray-300 mb-6">
            9.2. Liability for damages arising from platform use is limited to the amount paid by the User in the 12
            months preceding the claim.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">10. Modifications to Terms</h2>
          <p className="text-gray-300 mb-6">
            10.1. Edufy may update these Terms at any time.
          </p>
          <p className="text-gray-300 mb-6">
            10.2. Significant changes will be communicated via email or platform notifications.
          </p>
          <p className="text-gray-300 mb-6">
            10.3. Continued use after changes constitutes acceptance of the updated Terms.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">11. Governing Law and Dispute Resolution</h2>
          <p className="text-gray-300 mb-6">
            11.1. These Terms are governed by the laws of the Republic of Uzbekistan.
          </p>
          <p className="text-gray-300 mb-6">
            11.2. Any disputes arising hereunder will be resolved exclusively in the courts located in Tashkent,
            Uzbekistan.
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
