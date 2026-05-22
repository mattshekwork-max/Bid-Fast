import type { Metadata} from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - YourApp",
  description: "Terms of Service governing your use of our services.",
};

export default function TermsPage() {
  const lastUpdated = "January 2025";
  const companyName = "YourApp";
  const contactEmail = "legal@example.com";

  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-600">Last updated: {lastUpdated}</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using {companyName} ("we," "our," or "us"), you agree to be bound by these Terms of Service.
              If you disagree with any part of these terms, you may not access our service.
            </p>
          </section>

          {/* Account Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Account Terms</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>You must be at least 13 years old to use this service</li>
              <li>You must provide accurate and complete registration information</li>
              <li>You are responsible for maintaining the security of your account and password</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You may not use the service for any illegal or unauthorized purpose</li>
              <li>You must not transmit any worms, viruses, or malicious code</li>
            </ul>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the intellectual property rights of others</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Distribute spam or unsolicited messages</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the service</li>
            </ul>
          </section>

          {/* Subscriptions */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Subscriptions and Billing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Some features of our service are billed on a subscription basis:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Subscriptions are billed in advance on a monthly or annual basis</li>
              <li>You authorize us to charge your payment method on a recurring basis</li>
              <li>Subscriptions automatically renew unless canceled before the renewal date</li>
              <li>You can cancel your subscription at any time from your account settings</li>
              <li>Refunds are handled on a case-by-case basis</li>
              <li>Price changes will be communicated at least 30 days in advance</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              The service and its original content, features, and functionality are owned by {companyName} and are protected by
              international copyright, trademark, patent, trade secret, and other intellectual property laws.
              You may not copy, modify, distribute, sell, or lease any part of our service without our express written permission.
            </p>
          </section>

          {/* User Content */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User Content</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You retain all rights to the content you create using our service. By using our service, you grant us a limited license to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Store and display your content as necessary to provide the service</li>
              <li>Make backups of your content for data protection purposes</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We do not claim ownership of your content and will not use it for any purpose other than providing the service.
            </p>
          </section>

          {/* Service Availability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Service Availability</h2>
            <p className="text-gray-700 leading-relaxed">
              We strive to provide a reliable service, but we do not guarantee that the service will be uninterrupted or error-free.
              We reserve the right to modify or discontinue the service at any time, with or without notice.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              In no event shall {companyName}, its directors, employees, or agents be liable for any indirect, incidental, special,
              consequential, or punitive damages arising from your use of the service. Our total liability to you for all claims
              shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including
              if you breach these Terms of Service. Upon termination, your right to use the service will immediately cease.
              You may also delete your account at any time from your account settings.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify you of any material changes by email or
              through the service. Your continued use of the service after such modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction],
              without regard to its conflict of law provisions.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:{" "}
              <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline">
                {contactEmail}
              </a>
            </p>
          </section>

          {/* Back Link */}
          <div className="pt-8 mt-8 border-t">
            <Link href="/" className="text-blue-600 hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
