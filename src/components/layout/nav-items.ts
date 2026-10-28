import { Bell, Home, Search, Settings, User, type LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shows the unread notification count. */
  badge?: boolean;
};

export function navItems(username: string): NavItem[] {
  return [
    { label: "Home", href: "/home", icon: Home },
    { label: "Search", href: "/search", icon: Search },
    { label: "Notifications", href: "/notifications", icon: Bell, badge: true },
    { label: "Profile", href: `/${username}`, icon: User },
    { label: "Settings", href: "/settings/profile", icon: Settings },
  ];
}

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
