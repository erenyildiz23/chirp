import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo className="size-14" />
      <h1 className="text-3xl font-extrabold">This page doesn&apos;t exist</h1>
      <p className="text-muted-foreground">The link may be broken, or the page may have been removed.</p>
      <Link href="/" className="font-bold text-primary hover:underline">
        Go home
      </Link>
    </main>
  );
}
