import { FeedSkeleton } from "@/components/post/feed-skeleton";

export default function Loading() {
  return (
    <>
      <div className="h-[61px] border-b" />
      <FeedSkeleton count={4} />
    </>
  );
}
