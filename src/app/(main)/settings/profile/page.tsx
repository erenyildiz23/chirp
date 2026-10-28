import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { BackButton } from "@/components/layout/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { getCurrentProfile } from "@/lib/queries/profiles";

export const metadata: Metadata = { title: "Edit profile" };

export default async function SettingsProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/settings/profile");

  return (
    <>
      <PageHeader title="Edit profile">
        <BackButton />
      </PageHeader>
      <EditProfileForm profile={profile} />
      <div className="flex items-center justify-between border-t px-4 py-4">
        <div className="flex items-center gap-2 text-[15px]">
          <ThemeToggle />
          Theme
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline" className="rounded-full font-bold">
            <LogOut className="size-4" />
            Sign out
          </Button>
        </form>
      </div>
    </>
  );
}
