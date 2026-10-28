"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActive, navItems } from "./nav-items";

export function BottomNav({ username, unreadCount }: { username: string; unreadCount: number }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-around border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      {navItems(username).map(({ label, href, icon: Icon, badge }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn("relative flex size-12 items-center justify-center", active ? "text-foreground" : "text-muted-foreground")}
          >
            <Icon className="size-6" strokeWidth={active ? 2.5 : 2} />
            {badge && unreadCount > 0 && (
              <span className="absolute top-2 right-2 size-2 rounded-full bg-primary" aria-hidden="true" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
