import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Data Deletion Request - YourApp",
  description: "Request deletion of your account and all associated data.",
};

export default function DataDeletionPage() {
  const companyName = "YourApp";
  const contactEmail = "privacy@example.com";

  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Data Deletion Request</h1>
          <p className="text-gray-600">Request deletion of your account and all associated data</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Right to Data Deletion</h2>
            <p className="text-gray-700 leading-relaxed">
              You have the right to request deletion of your personal data at any time. When you delete your account,
              we will permanently remove all your personal information from our systems within 30 days.
            </p>
          </section>

          {/* What Gets Deleted */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Gets Deleted</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you request account deletion, the following data will be permanently removed:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Your account information (name, email, profile)</li>
              <li>All content you've created or uploaded</li>
              <li>Your usage data and preferences</li>
              <li>Payment history (subject to legal retention requirements)</li>
              <li>Any connected third-party service authorizations</li>
            </ul>
          </section>

          {/* What We Keep */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We May Retain</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For legal and business purposes, we may retain certain information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Transaction records required for tax and accounting purposes (typically 7 years)</li>
              <li>Logs necessary for security and fraud prevention</li>
              <li>Information required to comply with legal obligations</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              This retained information is anonymized where possible and stored securely.
            </p>
          </section>

          {/* How to Delete Your Account */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Delete Your Account</h2>

            <div className="space-y-6">
              {/* Option 1: Through Settings */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Option 1: Through Your Account Settings</h3>
                <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                  <li>Log in to your account</li>
                  <li>Navigate to Settings</li>
                  <li>Scroll to the "Danger Zone" section at the bottom</li>
                  <li>Click "Delete Account"</li>
                  <li>Confirm your decision</li>
                </ol>
                <p className="mt-4 text-sm text-gray-600">
                  This will immediately deactivate your account and schedule it for permanent deletion within 30 days.
                </p>
              </div>

              {/* Option 2: Email Request */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Option 2: Email Us</h3>
                <p className="text-gray-700 mb-3">
                  If you're unable to access your account, you can request deletion by email:
                </p>
                <div className="bg-white border border-gray-300 rounded p-4">
                  <p className="text-sm text-gray-700 mb-2"><strong>To:</strong> <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline">{contactEmail}</a></p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Subject:</strong> Account Deletion Request</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Include:</strong></p>
                  <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                    <li>Your full name</li>
                    <li>Email address associated with your account</li>
                    <li>Confirmation that you want to permanently delete your account</li>
                  </ul>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  We will verify your identity and process your request within 5-7 business days.
                </p>
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Important Notes</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>This action is permanent.</strong> Once deleted, your data cannot be recovered.</li>
                <li><strong>Active subscriptions:</strong> Cancel any active subscriptions before deleting your account to avoid future charges.</li>
                <li><strong>Grace period:</strong> You have 30 days to reactivate your account by logging in. After 30 days, deletion is permanent.</li>
                <li><strong>Connected services:</strong> You should also revoke access in any connected third-party services (e.g., Google, Stripe).</li>
              </ul>
            </div>
          </section>

          {/* Questions */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions?</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about our data deletion process or your privacy rights, please contact us at:{" "}
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
