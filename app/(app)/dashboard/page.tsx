import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user from database
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full border-gray-200 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-8">
          <CardTitle className="text-4xl font-bold">
            Hello world{userData?.first_name ? `, ${userData.first_name}` : ''}! 👋
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-lg text-gray-600">
              Your starter code is ready! To build out your app's features:
            </p>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-3 text-lg">📋 Next Steps:</h3>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="font-bold text-blue-600 mr-3">1.</span>
                  <span>Open <code className="bg-white px-2 py-1 rounded text-sm font-mono">BUILD_INSTRUCTIONS.md</code> in your project root</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-blue-600 mr-3">2.</span>
                  <span>Copy the prompts and paste them into Claude Code in your terminal</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-blue-600 mr-3">3.</span>
                  <span>Watch Claude Code build your app's features step by step!</span>
                </li>
              </ol>
            </div>

            <p className="text-sm text-gray-500">
              This starter includes authentication, database setup, and a beautiful landing page.
              <br />
              Claude Code will add your custom app logic.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
