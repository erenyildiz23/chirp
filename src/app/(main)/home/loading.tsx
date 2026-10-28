import { PageHeader } from "@/components/layout/page-header";
import { FeedSkeleton } from "@/components/post/feed-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeader title="Home" />
      <FeedSkeleton />
    </>
  );
}
