"use client";

import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/lib/providers/query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
      </ThemeProvider>
    </QueryProvider>
  );
}