import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

export default function NotFound() {
  return (
    <>
      <PageHeader title="Not found" />
      <div className="px-8 py-16 text-center">
        <h2 className="text-2xl font-extrabold">This page doesn&apos;t exist</h2>
        <p className="mt-2 text-muted-foreground">The account or post may have been deleted, or the link is wrong.</p>
        <Link href="/search" className="mt-6 inline-block font-bold text-primary hover:underline">
          Search for something else
        </Link>
      </div>
    </>
  );
}
