import { BottomNav } from "@/components/layout/bottom-nav";
import { RightRail } from "@/components/layout/right-rail";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getCurrentProfile } from "@/lib/queries/profiles";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  const unreadCount = profile ? await getUnreadCount() : 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1265px] justify-center">
      {profile && (
        <header className="hidden shrink-0 sm:block sm:w-[88px] xl:w-[275px]">
          <SidebarNav
            username={profile.username}
            displayName={profile.display_name}
            avatarUrl={profile.avatar_url}
            unreadCount={unreadCount}
          />
        </header>
      )}

      <main className="min-w-0 flex-1 border-x pb-16 sm:max-w-[600px] sm:pb-0">{children}</main>

      <aside className="hidden w-[350px] shrink-0 pl-8 lg:block">
        <RightRail />
      </aside>

      {profile && <BottomNav username={profile.username} unreadCount={unreadCount} />}
    </div>
  );
}
