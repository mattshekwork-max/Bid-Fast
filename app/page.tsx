import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { LandingPageClient } from "@/components/LandingPageClient";

export const metadata: Metadata = {
  title: 'JobCedar',
  description: 'Describe any job by voice. Foreman gives you material lists, cost estimates, crew schedules, and permit info instantly. Built for tradespeople who\'d rather be on the jobsite than behind a desk.',
  openGraph: {
    title: 'JobCedar',
    description: 'Describe any job by voice. Foreman gives you material lists, cost estimates, crew schedules, and permit info instantly. Built for tradespeople who\'d rather be on the jobsite than behind a desk.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://example.com',
    type: 'website',
  },
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LandingPageClient />;
}
