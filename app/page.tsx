import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { LandingPageClient } from "@/components/LandingPageClient";

export const metadata: Metadata = {
  title: 'Bid.Fast — Voice-to-Estimate for Trade Contractors',
  description: 'Record a job walkthrough on your phone and get a complete labor + materials estimate in seconds — then send it to your client with one tap. Built for trade contractors.',
  openGraph: {
    title: 'Bid.Fast — Voice-to-Estimate for Trade Contractors',
    description: 'Record a job walkthrough on your phone and get a complete labor + materials estimate in seconds — then send it to your client with one tap.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://bid-fast-xi.vercel.app',
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
