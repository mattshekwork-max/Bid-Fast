import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-lg text-muted-foreground mb-8">
        This page doesn&apos;t exist.
      </p>
      <Link href="/">
        <Button>Go home</Button>
      </Link>
    </main>
  );
}
