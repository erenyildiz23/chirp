import Link from "next/link";
import { redirect } from "next/navigation";
import { DemoButton } from "@/components/auth/demo-button";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/queries/profiles";

export default async function LandingPage() {
  if (await getCurrentProfile()) redirect("/home");

  return (
    <main className="mx-auto grid min-h-dvh max-w-5xl items-center gap-10 px-4 py-12 md:grid-cols-2">
      <div className="flex justify-center">
        <Logo className="size-32 md:size-64" />
      </div>
      <div className="flex flex-col gap-8">
        <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">Say it in 280.</h1>
        <p className="text-xl text-muted-foreground">
          Chirp is a small, fast social feed. Post, reply, like and repost, and follow the people you care about.
        </p>
        <div className="flex max-w-xs flex-col gap-3">
          <Button asChild size="lg" className="h-11 rounded-full text-base font-bold">
            <Link href="/signup">Create account</Link>
          </Button>
          <DemoButton className="h-11 rounded-full text-base font-bold" />
          <p className="mt-4 font-bold">Already have an account?</p>
          <Button asChild variant="outline" size="lg" className="h-11 rounded-full text-base font-bold text-primary">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
