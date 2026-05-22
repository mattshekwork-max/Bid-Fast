import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ExternalLink } from "lucide-react";

export function StripeSetupRequired() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-yellow-900">Stripe Setup Required</CardTitle>
          </div>
          <CardDescription className="text-yellow-700">
            Payment features are not yet configured for this application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-gray-700">
            To enable subscription and payment features, you need to configure Stripe.
          </p>

          <div className="bg-white p-4 rounded-md border border-yellow-200">
            <h3 className="font-semibold mb-2 text-gray-900">Setup Steps:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                Create a free Stripe account at{" "}
                <a
                  href="https://stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  stripe.com
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Get your API keys from the Stripe Dashboard (Developers → API keys)</li>
              <li>Add them to your <code className="bg-gray-100 px-1 py-0.5 rounded">.env</code> file:</li>
            </ol>

            <pre className="mt-3 bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto text-xs">
{`STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here`}
            </pre>
          </div>

          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h3 className="font-semibold mb-2 text-blue-900">📚 Need Help?</h3>
            <p className="text-blue-700">
              Check out <code className="bg-blue-100 px-1 py-0.5 rounded">STRIPE_SETUP.md</code> in your project root for detailed setup instructions.
            </p>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            ℹ️ You can still use all other features of the app without Stripe. Only subscription and payment features require configuration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
