import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full py-8 bg-background border-t border-border">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[4px] bg-secondary flex items-center justify-center">
              <span className="text-secondary-foreground text-xs font-black font-mono">BF</span>
            </div>
            <span className="font-bold text-sm text-foreground">Bid.Fast</span>
          </div>
          <nav className="flex gap-6">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
            <Link href="/data-deletion" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Data Deletion</Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Bid.Fast &mdash; Built with{" "}
            <a href="https://heilotech.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors underline">
              HeiloTech
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
