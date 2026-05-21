import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "Bid.Fast | Voice-to-estimate for trades",
    template: "%s | Bid.Fast",
  },
  description: "Talk through the job. Get a professional estimate in 60 seconds. Built for electricians, plumbers, HVAC techs, tile setters, and every trade in between.",
  metadataBase: new URL(appUrl),
  openGraph: {
    title: "Bid.Fast | Voice-to-estimate for trades",
    description: "Talk through the job. Get a bid in 60 seconds.",
    url: appUrl,
    siteName: "Bid.Fast",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bid.Fast",
    description: "Talk through the job. Get a bid in 60 seconds.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
