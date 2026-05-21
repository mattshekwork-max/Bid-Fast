import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LandingPageClient } from "@/components/LandingPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bid.Fast | Voice-to-estimate for trades",
  description: "Talk through the job. Get a professional estimate in 60 seconds. Built for electricians, plumbers, HVAC techs, and every trade.",
};

export default function Home() {
  return (
    <>
      <Navbar />
      <LandingPageClient />
      <Footer />
    </>
  );
}
