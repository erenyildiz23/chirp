"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setFollow } from "@/lib/actions/social";
import { cn } from "@/lib/utils";

export function FollowButton({ userId, following, className }: { userId: string; following: boolean; className?: string }) {
  const [confirmed, setConfirmed] = useState(following);
  const [optimistic, setOptimistic] = useOptimistic(confirmed);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      const result = await setFollow(userId, next);
      if (result.ok) setConfirmed(next);
      else toast.error(result.error);
    });
  }

  return (
    <Button
      type="button"
      onClick={toggle}
      variant={optimistic ? "outline" : "default"}
      aria-pressed={optimistic}
      className={cn(
        "group h-9 min-w-24 rounded-full px-4 font-bold",
        !optimistic && "bg-foreground text-background hover:bg-foreground/85",
        optimistic && "hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive",
        className,
      )}
    >
      {optimistic ? (
        <>
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:inline">Unfollow</span>
        </>
      ) : (
        "Follow"
      )}
    </Button>
  );
}
