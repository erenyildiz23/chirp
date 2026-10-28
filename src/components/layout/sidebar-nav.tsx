"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Feather } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { isActive, navItems } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";

type SidebarNavProps = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  unreadCount: number;
};

export function SidebarNav({ username, displayName, avatarUrl, unreadCount }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 flex h-dvh flex-col items-center gap-2 py-3 xl:items-stretch xl:pr-4">
      <Link href="/home" className="mb-2 flex size-12 items-center justify-center rounded-full hover:bg-muted" aria-label="Chirp home">
        <Logo className="size-8" />
      </Link>

      <nav className="flex flex-col items-center gap-1 xl:items-stretch" aria-label="Main">
        {navItems(username).map(({ label, href, icon: Icon, badge }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-4 rounded-full p-3 text-xl transition-colors hover:bg-muted xl:pr-6",
                active && "font-bold",
              )}
            >
              <span className="relative">
                <Icon className="size-6" strokeWidth={active ? 2.5 : 2} />
                {badge && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 rounded-full bg-primary px-1 text-center text-[11px] leading-4 font-bold text-primary-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="hidden xl:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <Button asChild size="lg" className="mt-2 size-12 rounded-full p-0 xl:h-12 xl:w-full xl:text-base xl:font-bold">
        <Link href="/home#compose" aria-label="Post">
          <Feather className="size-5 xl:hidden" />
          <span className="hidden xl:inline">Post</span>
        </Link>
      </Button>

      <div className="mt-auto flex flex-col items-center gap-2 xl:items-stretch">
        <ThemeToggle />
        <div className="flex items-center gap-3 rounded-full p-2 xl:pr-3">
          <Avatar className="size-10">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
            <AvatarFallback>{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 flex-1 leading-tight xl:block">
            <p className="truncate font-bold">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">@{username}</p>
          </div>
          <form action={signOut} className="hidden xl:block">
            <Button type="submit" variant="ghost" size="icon" className="rounded-full" aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
        <form action={signOut} className="xl:hidden">
          <Button type="submit" variant="ghost" size="icon-lg" className="rounded-full" aria-label="Sign out">
            <LogOut className="size-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
