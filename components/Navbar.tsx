"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Menu } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "My App";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const homeLink = user ? "/dashboard" : "/";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link href={homeLink} className="text-xl font-bold px-2">
          {APP_NAME}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4">
          {!user && (
            <Link
              href="/#pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarFallback className="bg-muted text-foreground text-sm">
                    {user.email
                      ? user.email.substring(0, 2).toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email || ""}
                  </p>
                </div>
                <DropdownMenuItem className="h-px bg-muted p-0 my-1" />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                Log in
              </Link>
              <Link href="/signup" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
                Sign up
              </Link>
            </>
          )}
        </nav>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="flex flex-col gap-4 mt-8">
              {user ? (
                <>
                  <p className="text-sm text-muted-foreground truncate px-2">
                    {user.email}
                  </p>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="text-lg font-medium">
                    Dashboard
                  </Link>
                  <Link href="/settings" onClick={() => setOpen(false)} className="text-lg font-medium">
                    Settings
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setOpen(false); }}
                    className="text-lg font-medium text-destructive text-left"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/#pricing" onClick={() => setOpen(false)} className="text-lg font-medium">
                    Pricing
                  </Link>
                  <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                    Log in
                  </Link>
                  <Link href="/signup" className={cn(buttonVariants({ variant: "default" }), "w-full")}>
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
