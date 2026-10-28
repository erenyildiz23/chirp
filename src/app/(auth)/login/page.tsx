import type { Metadata } from "next";
import Link from "next/link";
import { GithubButton } from "@/components/auth/github-button";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

const ERRORS: Record<string, string> = {
  auth: "That sign-in link is invalid or has expired.",
  github: "GitHub sign-in isn't available right now.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Log in to Chirp</h1>
      {error && ERRORS[error] && (
        <p role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {ERRORS[error]}
        </p>
      )}
      <div className="grid gap-6">
        <GithubButton next={next} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <LoginForm next={next} />
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
