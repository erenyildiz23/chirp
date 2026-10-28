"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export function ErrorState({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 px-8 py-16 text-center">
      <h2 className="text-2xl font-extrabold">Something went wrong</h2>
      <p className="text-muted-foreground">Please try again. If it keeps happening, reload the page.</p>
      <Button onClick={reset} className="rounded-full px-6 font-bold">
        Try again
      </Button>
    </div>
  );
}
