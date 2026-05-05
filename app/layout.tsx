import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers/providers";

export const metadata: Metadata = {
  title: "CatchFlow | Never miss a follow-up again",
  description:
    "CatchFlow turns missed calls, buried emails, and scattered texts into a calm, prioritized follow-up queue.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}