import Link from "next/link";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "My App";

export function Footer() {
  return (
    <footer className="w-full py-8 bg-background border-t">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/data-deletion"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Data Deletion
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
