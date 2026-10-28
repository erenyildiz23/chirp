import { Skeleton } from "@/components/ui/skeleton";
import { FeedSkeleton } from "@/components/post/feed-skeleton";

export default function Loading() {
  return (
    <>
      <div className="h-[53px] border-b" />
      <Skeleton className="h-32 rounded-none sm:h-48" />
      <div className="space-y-3 border-b px-4 pb-4">
        <Skeleton className="-mt-12 size-24 rounded-full border-4 border-background sm:-mt-16 sm:size-32" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <FeedSkeleton count={3} />
    </>
  );
}
