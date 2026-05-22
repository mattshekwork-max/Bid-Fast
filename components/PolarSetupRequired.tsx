import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, ExternalLink } from "lucide-react";

export function PolarSetupRequired() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-yellow-900">
              Polar Setup Required
            </CardTitle>
          </div>
          <CardDescription className="text-yellow-700">
            Payment features are not yet configured for this application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-gray-700">
            To enable subscription and payment features, you need to configure
            Polar.
          </p>

          <div className="bg-white p-4 rounded-md border border-yellow-200">
            <h3 className="font-semibold mb-2 text-gray-900">Setup Steps:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                Create a free Polar account at{" "}
                <a
                  href="https://polar.sh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  polar.sh
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                Create an organization for your product
              </li>
              <li>
                Generate an Organization Access Token (Settings &rarr; Developers
                &rarr; Access Tokens)
              </li>
              <li>
                Create a product with your desired pricing
              </li>
              <li>
                Add your credentials to your{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded">.env</code>{" "}
                file:
              </li>
            </ol>

            <pre className="mt-3 bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto text-xs">
              {`POLAR_ACCESS_TOKEN=polar_oat_your_token_here
POLAR_WEBHOOK_SECRET=your_webhook_secret
POLAR_PRODUCT_ID=your_product_id
POLAR_ENVIRONMENT=sandbox`}
            </pre>
          </div>

          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h3 className="font-semibold mb-2 text-blue-900">
              Sandbox vs Production
            </h3>
            <p className="text-blue-700">
              Set <code className="bg-blue-100 px-1 py-0.5 rounded">POLAR_ENVIRONMENT=sandbox</code> for
              testing. Switch to{" "}
              <code className="bg-blue-100 px-1 py-0.5 rounded">production</code> when
              ready for real payments. Sandbox and production are fully isolated
              environments.
            </p>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            You can still use all other features of the app without Polar. Only
            subscription and payment features require configuration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
